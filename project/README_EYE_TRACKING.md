# Eye Tracking Sistemi

## Kurulum ve Çalıştırma

```bash
python3 eye_tracker.py
```

## Sistem Özellikleri

### 1. Kalibrasyon
- 4x4 grid (16 nokta) + 8 ek hareket noktası (toplam 24 kalibrasyon noktası)
- Her nokta 1.5 saniye gösterilir
- Otomatik pupil tespiti ve kayıt

### 2. Pupil Tespit Algoritmaları
- RGB → Grayscale dönüşümü
- CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Adaptive Thresholding
- Morfolojik işlemler (Erosion, Dilation)
- Kontur tespiti ve ellipse fitting
- Sobel edge detection ile göz köşesi tespiti

### 3. Gaze Mapping
- 5 parametreli polinom regresyon
- Least squares optimization
- Gauss elimination çözümü

### 4. Gerçek Zamanlı Takip
- 30 FPS işleme hızı
- Exponential smoothing (α=0.3)
- Kırmızı nokta ile gaze gösterimi

## Teknik Detaylar

### Manuel Görüntü İşleme Fonksiyonları
- `rgb_to_gray()`: RGB → Grayscale
- `manual_threshold()`: Eşik değer uygulama
- `otsu_threshold()`: Otsu otomatik eşikleme
- `adaptive_threshold()`: Lokal adaptif eşikleme
- `clahe()`: Kontrast iyileştirme
- `erode()` / `dilate()`: Morfolojik işlemler
- `sobel_edges()`: Kenar tespiti
- `find_contours()`: Kontur bulma
- `fit_ellipse()`: Ellipse uydurma

### Kalibrasyon Matrisi
```
screen_x = c0·gv_x + c1·gv_y + c2·gv_z + c3·gv_x·gv_y + c4
screen_y = c5·gv_x + c6·gv_y + c7·gv_z + c8·gv_x·gv_y + c9
```

gv_x, gv_y: Pupil-göz merkezi vektörü
gv_z: Göz genişliği (sağ köşe - sol köşe)

## Notlar

- Mock kamera kullanılıyor (test amaçlı)
- Gerçek webcam için OpenCV entegrasyonu eklenebilir
- Tüm algoritmalar sıfırdan yazılmıştır
- Hiçbir ML/AI modeli kullanılmamıştır
