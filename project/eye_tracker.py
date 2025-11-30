import tkinter as tk
from tkinter import messagebox
import threading
import time
import math


class ImageProcessing:
    @staticmethod
    def rgb_to_gray(frame):
        height, width = len(frame), len(frame[0])
        gray = [[0] * width for _ in range(height)]
        for i in range(height):
            for j in range(width):
                r, g, b = frame[i][j]
                gray[i][j] = int(0.299 * r + 0.587 * g + 0.114 * b)
        return gray

    @staticmethod
    def manual_threshold(gray, threshold=50):
        height, width = len(gray), len(gray[0])
        binary = [[0] * width for _ in range(height)]
        for i in range(height):
            for j in range(width):
                binary[i][j] = 255 if gray[i][j] < threshold else 0
        return binary

    @staticmethod
    def compute_histogram(gray):
        hist = [0] * 256
        for row in gray:
            for val in row:
                hist[val] += 1
        return hist

    @staticmethod
    def otsu_threshold(gray):
        hist = ImageProcessing.compute_histogram(gray)
        total_pixels = sum(hist)

        sum_total = sum(i * hist[i] for i in range(256))
        sum_background = 0
        weight_background = 0
        max_variance = 0
        threshold = 0

        for t in range(256):
            weight_background += hist[t]
            if weight_background == 0:
                continue

            weight_foreground = total_pixels - weight_background
            if weight_foreground == 0:
                break

            sum_background += t * hist[t]
            mean_background = sum_background / weight_background
            mean_foreground = (sum_total - sum_background) / weight_foreground

            variance = weight_background * weight_foreground * (mean_background - mean_foreground) ** 2

            if variance > max_variance:
                max_variance = variance
                threshold = t

        return ImageProcessing.manual_threshold(gray, threshold)

    @staticmethod
    def adaptive_threshold(gray, block_size=15, c=2):
        height, width = len(gray), len(gray[0])
        binary = [[0] * width for _ in range(height)]
        half_block = block_size // 2

        for i in range(height):
            for j in range(width):
                i_start = max(0, i - half_block)
                i_end = min(height, i + half_block + 1)
                j_start = max(0, j - half_block)
                j_end = min(width, j + half_block + 1)

                local_sum = 0
                count = 0
                for ii in range(i_start, i_end):
                    for jj in range(j_start, j_end):
                        local_sum += gray[ii][jj]
                        count += 1

                local_mean = local_sum / count
                binary[i][j] = 255 if gray[i][j] < (local_mean - c) else 0

        return binary

    @staticmethod
    def clahe(gray, clip_limit=2.0, tile_size=8):
        height, width = len(gray), len(gray[0])
        tiles_y = height // tile_size
        tiles_x = width // tile_size

        enhanced = [[gray[i][j] for j in range(width)] for i in range(height)]

        for ty in range(tiles_y):
            for tx in range(tiles_x):
                y_start = ty * tile_size
                y_end = min((ty + 1) * tile_size, height)
                x_start = tx * tile_size
                x_end = min((tx + 1) * tile_size, width)

                hist = [0] * 256
                for i in range(y_start, y_end):
                    for j in range(x_start, x_end):
                        hist[gray[i][j]] += 1

                total_pixels = (y_end - y_start) * (x_end - x_start)
                clip_threshold = int(clip_limit * total_pixels / 256)

                excess = 0
                for i in range(256):
                    if hist[i] > clip_threshold:
                        excess += hist[i] - clip_threshold
                        hist[i] = clip_threshold

                redistribute = excess // 256
                for i in range(256):
                    hist[i] += redistribute

                cdf = [0] * 256
                cdf[0] = hist[0]
                for i in range(1, 256):
                    cdf[i] = cdf[i-1] + hist[i]

                if cdf[255] > 0:
                    for i in range(y_start, y_end):
                        for j in range(x_start, x_end):
                            enhanced[i][j] = int((cdf[gray[i][j]] / cdf[255]) * 255)

        return enhanced

    @staticmethod
    def erode(binary, kernel_size=3):
        height, width = len(binary), len(binary[0])
        result = [[0] * width for _ in range(height)]
        half_k = kernel_size // 2

        for i in range(half_k, height - half_k):
            for j in range(half_k, width - half_k):
                min_val = 255
                for ki in range(-half_k, half_k + 1):
                    for kj in range(-half_k, half_k + 1):
                        min_val = min(min_val, binary[i + ki][j + kj])
                result[i][j] = min_val

        return result

    @staticmethod
    def dilate(binary, kernel_size=3):
        height, width = len(binary), len(binary[0])
        result = [[0] * width for _ in range(height)]
        half_k = kernel_size // 2

        for i in range(half_k, height - half_k):
            for j in range(half_k, width - half_k):
                max_val = 0
                for ki in range(-half_k, half_k + 1):
                    for kj in range(-half_k, half_k + 1):
                        max_val = max(max_val, binary[i + ki][j + kj])
                result[i][j] = max_val

        return result

    @staticmethod
    def sobel_edges(gray):
        height, width = len(gray), len(gray[0])
        edges = [[0] * width for _ in range(height)]

        sobel_x = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
        sobel_y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]

        for i in range(1, height - 1):
            for j in range(1, width - 1):
                gx = 0
                gy = 0
                for ki in range(-1, 2):
                    for kj in range(-1, 2):
                        pixel = gray[i + ki][j + kj]
                        gx += pixel * sobel_x[ki + 1][kj + 1]
                        gy += pixel * sobel_y[ki + 1][kj + 1]

                magnitude = math.sqrt(gx * gx + gy * gy)
                edges[i][j] = min(255, int(magnitude))

        return edges

    @staticmethod
    def find_contours(binary):
        height, width = len(binary), len(binary[0])
        visited = [[False] * width for _ in range(height)]
        contours = []

        def flood_fill(start_i, start_j):
            stack = [(start_i, start_j)]
            points = []

            while stack:
                i, j = stack.pop()
                if i < 0 or i >= height or j < 0 or j >= width:
                    continue
                if visited[i][j] or binary[i][j] == 0:
                    continue

                visited[i][j] = True
                points.append((i, j))

                for di, dj in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    stack.append((i + di, j + dj))

            return points

        for i in range(height):
            for j in range(width):
                if binary[i][j] == 255 and not visited[i][j]:
                    contour = flood_fill(i, j)
                    if len(contour) > 50:
                        contours.append(contour)

        return contours

    @staticmethod
    def fit_ellipse(points):
        if len(points) < 5:
            return None

        n = len(points)
        sum_x = sum(p[1] for p in points)
        sum_y = sum(p[0] for p in points)
        cx = sum_x / n
        cy = sum_y / n

        return (cx, cy)

    @staticmethod
    def crop_eye_region(gray, x, y, w, h):
        height, width = len(gray), len(gray[0])
        x1 = max(0, int(x))
        y1 = max(0, int(y))
        x2 = min(width, int(x + w))
        y2 = min(height, int(y + h))

        cropped = []
        for i in range(y1, y2):
            row = []
            for j in range(x1, x2):
                row.append(gray[i][j])
            cropped.append(row)

        return cropped if cropped and cropped[0] else [[128]]


class PupilDetector:
    @staticmethod
    def detect_pupil(frame):
        if not frame or not frame[0]:
            return None, None

        gray = ImageProcessing.rgb_to_gray(frame)

        height, width = len(gray), len(gray[0])
        eye_y = height // 3
        eye_h = height // 2
        eye_region = ImageProcessing.crop_eye_region(gray, 0, eye_y, width, eye_h)

        if not eye_region or not eye_region[0]:
            return None, None

        enhanced = ImageProcessing.clahe(eye_region)
        binary = ImageProcessing.adaptive_threshold(enhanced, block_size=11, c=5)
        binary = ImageProcessing.erode(binary, 3)
        binary = ImageProcessing.dilate(binary, 3)

        contours = ImageProcessing.find_contours(binary)

        if not contours:
            return None, None

        largest_contour = max(contours, key=len)
        pupil_center = ImageProcessing.fit_ellipse(largest_contour)

        if pupil_center:
            px, py = pupil_center
            py += eye_y

            edges = ImageProcessing.sobel_edges(gray)
            left_corner, right_corner = PupilDetector.find_eye_corners(edges, px, py)

            return (px, py), (left_corner, right_corner)

        return None, None

    @staticmethod
    def find_eye_corners(edges, pupil_x, pupil_y):
        height, width = len(edges), len(edges[0])

        py = int(pupil_y)
        py = max(0, min(height - 1, py))

        left_x = pupil_x
        left_max = 0
        for x in range(int(pupil_x), max(0, int(pupil_x) - 100), -1):
            if x < width and edges[py][x] > left_max:
                left_max = edges[py][x]
                left_x = x

        right_x = pupil_x
        right_max = 0
        for x in range(int(pupil_x), min(width, int(pupil_x) + 100)):
            if x < width and edges[py][x] > right_max:
                right_max = edges[py][x]
                right_x = x

        return (left_x, pupil_y), (right_x, pupil_y)


class CalibrationSystem:
    def __init__(self):
        self.calibration_points = []
        self.gaze_samples = []
        self.mapping_matrix = None

    def generate_calibration_points(self, screen_width, screen_height):
        points = []
        margin = 100

        for row in range(4):
            y = margin + row * (screen_height - 2 * margin) // 3
            for col in range(4):
                x = margin + col * (screen_width - 2 * margin) // 3
                points.append((x, y))

        sequence_points = [
            (margin, screen_height // 2),
            (screen_width - margin, screen_height // 2),
            (screen_width // 2, margin),
            (screen_width // 2, screen_height - margin),
            (margin, margin),
            (screen_width - margin, screen_height - margin),
            (margin, screen_height - margin),
            (screen_width - margin, margin),
        ]

        points.extend(sequence_points)

        return points

    def add_calibration_sample(self, screen_point, pupil_data):
        if pupil_data[0] is None:
            return

        pupil_center, eye_corners = pupil_data

        if eye_corners[0] and eye_corners[1]:
            left_corner, right_corner = eye_corners

            gaze_vector = [
                pupil_center[0] - (left_corner[0] + right_corner[0]) / 2,
                pupil_center[1] - (left_corner[1] + right_corner[1]) / 2,
                right_corner[0] - left_corner[0]
            ]

            self.gaze_samples.append({
                'screen': screen_point,
                'gaze_vector': gaze_vector,
                'pupil': pupil_center
            })

    def compute_mapping(self):
        if len(self.gaze_samples) < 10:
            return False

        X = []
        Y_x = []
        Y_y = []

        for sample in self.gaze_samples:
            gv = sample['gaze_vector']
            X.append([gv[0], gv[1], gv[2], gv[0]*gv[1], 1])
            Y_x.append(sample['screen'][0])
            Y_y.append(sample['screen'][1])

        try:
            coeffs_x = self.least_squares(X, Y_x)
            coeffs_y = self.least_squares(X, Y_y)

            self.mapping_matrix = {
                'x_coeffs': coeffs_x,
                'y_coeffs': coeffs_y
            }
            return True
        except:
            return False

    @staticmethod
    def least_squares(X, Y):
        n = len(X)
        m = len(X[0])

        XTX = [[0] * m for _ in range(m)]
        for i in range(m):
            for j in range(m):
                for k in range(n):
                    XTX[i][j] += X[k][i] * X[k][j]

        XTY = [0] * m
        for i in range(m):
            for k in range(n):
                XTY[i] += X[k][i] * Y[k]

        coeffs = CalibrationSystem.gauss_elimination(XTX, XTY)
        return coeffs

    @staticmethod
    def gauss_elimination(A, b):
        n = len(A)
        M = [A[i][:] + [b[i]] for i in range(n)]

        for i in range(n):
            max_row = i
            for k in range(i + 1, n):
                if abs(M[k][i]) > abs(M[max_row][i]):
                    max_row = k
            M[i], M[max_row] = M[max_row], M[i]

            if abs(M[i][i]) < 1e-10:
                continue

            for k in range(i + 1, n):
                factor = M[k][i] / M[i][i]
                for j in range(i, n + 1):
                    M[k][j] -= factor * M[i][j]

        x = [0] * n
        for i in range(n - 1, -1, -1):
            if abs(M[i][i]) < 1e-10:
                x[i] = 0
            else:
                x[i] = M[i][n]
                for j in range(i + 1, n):
                    x[i] -= M[i][j] * x[j]
                x[i] /= M[i][i]

        return x

    def map_gaze_to_screen(self, pupil_data):
        if self.mapping_matrix is None or pupil_data[0] is None:
            return None

        pupil_center, eye_corners = pupil_data

        if not eye_corners[0] or not eye_corners[1]:
            return None

        left_corner, right_corner = eye_corners

        gaze_vector = [
            pupil_center[0] - (left_corner[0] + right_corner[0]) / 2,
            pupil_center[1] - (left_corner[1] + right_corner[1]) / 2,
            right_corner[0] - left_corner[0]
        ]

        features = [
            gaze_vector[0],
            gaze_vector[1],
            gaze_vector[2],
            gaze_vector[0] * gaze_vector[1],
            1
        ]

        screen_x = sum(features[i] * self.mapping_matrix['x_coeffs'][i] for i in range(5))
        screen_y = sum(features[i] * self.mapping_matrix['y_coeffs'][i] for i in range(5))

        return (screen_x, screen_y)


class MockCamera:
    def __init__(self):
        self.frame_width = 640
        self.frame_height = 480
        self.running = False
        self.current_frame = None
        self.frame_lock = threading.Lock()

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def _capture_loop(self):
        while self.running:
            frame = self._generate_mock_frame()
            with self.frame_lock:
                self.current_frame = frame
            time.sleep(0.033)

    def _generate_mock_frame(self):
        frame = [[[128, 128, 128] for _ in range(self.frame_width)]
                 for _ in range(self.frame_height)]

        pupil_x = self.frame_width // 2 + int(20 * math.sin(time.time() * 2))
        pupil_y = self.frame_height // 2 + int(10 * math.cos(time.time() * 3))
        pupil_radius = 15

        for i in range(max(0, pupil_y - pupil_radius), min(self.frame_height, pupil_y + pupil_radius)):
            for j in range(max(0, pupil_x - pupil_radius), min(self.frame_width, pupil_x + pupil_radius)):
                dist = math.sqrt((i - pupil_y)**2 + (j - pupil_x)**2)
                if dist < pupil_radius:
                    intensity = int(30 * (1 - dist / pupil_radius))
                    frame[i][j] = [intensity, intensity, intensity]

        return frame

    def read_frame(self):
        with self.frame_lock:
            return self.current_frame.copy() if self.current_frame else None

    def stop(self):
        self.running = False


class EyeTrackingGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Eye Tracking System")

        self.screen_width = self.root.winfo_screenwidth()
        self.screen_height = self.root.winfo_screenheight()

        self.camera = MockCamera()
        self.calibration = CalibrationSystem()

        self.calibration_mode = False
        self.tracking_mode = False

        self.gaze_x = self.screen_width // 2
        self.gaze_y = self.screen_height // 2
        self.smoothed_x = self.gaze_x
        self.smoothed_y = self.gaze_y

        self.setup_ui()

    def setup_ui(self):
        self.main_frame = tk.Frame(self.root, bg='#2c3e50')
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        title = tk.Label(self.main_frame, text="Eye Tracking System",
                        font=('Arial', 24, 'bold'), bg='#2c3e50', fg='white')
        title.pack(pady=30)

        btn_frame = tk.Frame(self.main_frame, bg='#2c3e50')
        btn_frame.pack(pady=20)

        self.calibrate_btn = tk.Button(btn_frame, text="Kalibrasyonu Başlat",
                                       command=self.start_calibration,
                                       font=('Arial', 14), bg='#3498db', fg='white',
                                       padx=30, pady=15, cursor='hand2')
        self.calibrate_btn.pack(pady=10)

        self.track_btn = tk.Button(btn_frame, text="Takibi Başlat",
                                   command=self.start_tracking,
                                   font=('Arial', 14), bg='#2ecc71', fg='white',
                                   padx=30, pady=15, cursor='hand2', state=tk.DISABLED)
        self.track_btn.pack(pady=10)

        quit_btn = tk.Button(btn_frame, text="Çıkış",
                            command=self.quit_app,
                            font=('Arial', 14), bg='#e74c3c', fg='white',
                            padx=30, pady=15, cursor='hand2')
        quit_btn.pack(pady=10)

        self.status_label = tk.Label(self.main_frame, text="Hazır",
                                     font=('Arial', 12), bg='#2c3e50', fg='#ecf0f1')
        self.status_label.pack(pady=20)

    def start_calibration(self):
        self.calibration_mode = True
        self.calibrate_btn.config(state=tk.DISABLED)

        self.camera.start()

        self.calib_window = tk.Toplevel(self.root)
        self.calib_window.attributes('-fullscreen', True)
        self.calib_window.configure(bg='#7f8c8d')

        self.calib_canvas = tk.Canvas(self.calib_window, bg='#7f8c8d',
                                      highlightthickness=0)
        self.calib_canvas.pack(fill=tk.BOTH, expand=True)

        self.calib_points = self.calibration.generate_calibration_points(
            self.screen_width, self.screen_height
        )
        self.current_point_idx = 0

        self.show_calibration_point()

    def show_calibration_point(self):
        if self.current_point_idx >= len(self.calib_points):
            self.finish_calibration()
            return

        self.calib_canvas.delete('all')

        x, y = self.calib_points[self.current_point_idx]

        self.calib_canvas.create_oval(x-30, y-30, x+30, y+30,
                                      fill='#e74c3c', outline='white', width=3)
        self.calib_canvas.create_oval(x-10, y-10, x+10, y+10,
                                      fill='white', outline='')

        self.root.after(1500, self.capture_calibration_sample)

    def capture_calibration_sample(self):
        frame = self.camera.read_frame()
        if frame:
            pupil_data = PupilDetector.detect_pupil(frame)
            screen_point = self.calib_points[self.current_point_idx]
            self.calibration.add_calibration_sample(screen_point, pupil_data)

        self.current_point_idx += 1
        self.show_calibration_point()

    def finish_calibration(self):
        self.calib_canvas.delete('all')

        processing_label = tk.Label(self.calib_canvas,
                                    text="Lütfen bekleyiniz, kalibrasyon işleniyor...",
                                    font=('Arial', 20, 'bold'),
                                    bg='#7f8c8d', fg='white')
        processing_label.place(relx=0.5, rely=0.5, anchor='center')

        self.root.update()

        def compute():
            time.sleep(2)
            success = self.calibration.compute_mapping()

            self.root.after(0, lambda: self.calibration_complete(success))

        threading.Thread(target=compute, daemon=True).start()

    def calibration_complete(self, success):
        self.calib_window.destroy()
        self.calibration_mode = False

        if success:
            self.status_label.config(text="Kalibrasyon tamamlandı!")
            self.track_btn.config(state=tk.NORMAL)
            messagebox.showinfo("Başarılı", "Kalibrasyon başarıyla tamamlandı!")
        else:
            self.status_label.config(text="Kalibrasyon başarısız. Tekrar deneyin.")
            self.calibrate_btn.config(state=tk.NORMAL)
            messagebox.showerror("Hata", "Kalibrasyon başarısız. Lütfen tekrar deneyin.")

    def start_tracking(self):
        self.tracking_mode = True
        self.track_btn.config(state=tk.DISABLED)

        self.track_window = tk.Toplevel(self.root)
        self.track_window.attributes('-fullscreen', True)
        self.track_window.configure(bg='#ecf0f1')

        self.track_canvas = tk.Canvas(self.track_window, bg='#ecf0f1',
                                      highlightthickness=0)
        self.track_canvas.pack(fill=tk.BOTH, expand=True)

        self.gaze_indicator = self.track_canvas.create_oval(0, 0, 20, 20,
                                                            fill='#e74c3c',
                                                            outline='white', width=2)

        exit_btn = tk.Button(self.track_window, text="Takibi Durdur",
                            command=self.stop_tracking,
                            font=('Arial', 12), bg='#e74c3c', fg='white')
        exit_btn.place(x=20, y=20)

        self.update_tracking()

    def update_tracking(self):
        if not self.tracking_mode:
            return

        frame = self.camera.read_frame()
        if frame:
            pupil_data = PupilDetector.detect_pupil(frame)
            screen_pos = self.calibration.map_gaze_to_screen(pupil_data)

            if screen_pos:
                self.gaze_x, self.gaze_y = screen_pos

                alpha = 0.3
                self.smoothed_x = alpha * self.gaze_x + (1 - alpha) * self.smoothed_x
                self.smoothed_y = alpha * self.gaze_y + (1 - alpha) * self.smoothed_y

                self.smoothed_x = max(10, min(self.screen_width - 10, self.smoothed_x))
                self.smoothed_y = max(10, min(self.screen_height - 10, self.smoothed_y))

                self.track_canvas.coords(self.gaze_indicator,
                                        self.smoothed_x - 10,
                                        self.smoothed_y - 10,
                                        self.smoothed_x + 10,
                                        self.smoothed_y + 10)

        self.root.after(33, self.update_tracking)

    def stop_tracking(self):
        self.tracking_mode = False
        self.track_window.destroy()
        self.track_btn.config(state=tk.NORMAL)

    def quit_app(self):
        self.camera.stop()
        self.root.quit()

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    app = EyeTrackingGUI()
    app.run()
