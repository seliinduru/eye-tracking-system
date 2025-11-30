import { ImageProcessing } from './imageProcessing';

export interface PupilData {
  pupilCenter: [number, number] | null;
  eyeCorners: [[number, number] | null, [number, number] | null];
}

export class PupilDetector {
  static detectPupil(imageData: ImageData): PupilData {
    const gray = ImageProcessing.rgbToGray(imageData);
    const height = gray.length;
    const width = gray[0].length;

    const eyeY = Math.floor(height / 3);
    const eyeH = Math.floor(height / 2);
    const eyeRegion = ImageProcessing.cropEyeRegion(gray, 0, eyeY, width, eyeH);

    if (eyeRegion.length === 0 || eyeRegion[0].length === 0) {
      return {
        pupilCenter: null,
        eyeCorners: [null, null],
      };
    }

    const enhanced = ImageProcessing.clahe(eyeRegion);
    let binary = ImageProcessing.adaptiveThreshold(enhanced, 11, 5);
    binary = ImageProcessing.erode(binary, 3);
    binary = ImageProcessing.dilate(binary, 3);

    const contours = ImageProcessing.findContours(binary);

    if (contours.length === 0) {
      return {
        pupilCenter: null,
        eyeCorners: [null, null],
      };
    }

    const largestContour = contours.reduce((max, contour) =>
      contour.length > max.length ? contour : max
    );
    const pupilCenter = ImageProcessing.fitEllipse(largestContour);

    if (pupilCenter) {
      const [px, py] = pupilCenter;
      const adjustedPy = py + eyeY;

      const edges = ImageProcessing.sobelEdges(gray);
      const [leftCorner, rightCorner] = this.findEyeCorners(
        edges,
        px,
        adjustedPy
      );

      return {
        pupilCenter: [px, adjustedPy],
        eyeCorners: [leftCorner, rightCorner],
      };
    }

    return {
      pupilCenter: null,
      eyeCorners: [null, null],
    };
  }

  static findEyeCorners(
    edges: number[][],
    pupilX: number,
    pupilY: number
  ): [[number, number] | null, [number, number] | null] {
    const height = edges.length;
    const width = edges[0].length;

    const py = Math.max(0, Math.min(height - 1, Math.floor(pupilY)));

    let leftX = pupilX;
    let leftMax = 0;
    for (let x = Math.floor(pupilX); x >= Math.max(0, pupilX - 100); x--) {
      if (x < width && edges[py][x] > leftMax) {
        leftMax = edges[py][x];
        leftX = x;
      }
    }

    let rightX = pupilX;
    let rightMax = 0;
    for (let x = Math.floor(pupilX); x < Math.min(width, pupilX + 100); x++) {
      if (x < width && edges[py][x] > rightMax) {
        rightMax = edges[py][x];
        rightX = x;
      }
    }

    return [
      [leftX, pupilY],
      [rightX, pupilY],
    ];
  }
}
