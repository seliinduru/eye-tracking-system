import { Eye } from 'lucide-react';

interface MainScreenProps {
  onStartCalibration: () => void;
  onStartTracking: () => void;
  isCalibrated: boolean;
  webcamError: string | null;
  webcamReady: boolean;
}

export const MainScreen = ({
  onStartCalibration,
  onStartTracking,
  isCalibrated,
  webcamError,
  webcamReady,
}: MainScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <Eye className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Eye Tracking System
          </h1>
          <p className="text-slate-300 text-lg">
            Sıfırdan yazılmış webcam-tabanlı göz takip sistemi
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          {webcamError ? (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-center font-medium">
                {webcamError}
              </p>
            </div>
          ) : !webcamReady ? (
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-center font-medium">
                Webcam başlatılıyor...
              </p>
            </div>
          ) : (
            <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4 mb-6">
              <p className="text-green-300 text-center font-medium">
                Webcam hazır
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={onStartCalibration}
              disabled={!webcamReady || !!webcamError}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Kalibrasyonu Başlat
            </button>

            <button
              onClick={onStartTracking}
              disabled={!isCalibrated || !webcamReady || !!webcamError}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Takibi Başlat
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700">
            <h3 className="text-white font-semibold mb-3">Özellikler</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Head Position Check (Kalibrasyon öncesi hizalama)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>24 noktalı kalibrasyon + Outlier Removal</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Manuel CV (CLAHE, Sobel, HSV maskeleme)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>6 parametreli polinom regresyon (x², y², xy)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Exponential smoothing (α=0.2) + Pulse animasyon</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Hiçbir ML/AI modeli kullanılmadı</span>
              </li>
            </ul>
          </div>

          {isCalibrated && (
            <div className="mt-6 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
              <p className="text-green-300 text-center font-medium">
                Kalibrasyon tamamlandı! Takibi başlatabilirsiniz.
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            Klasik görüntü işleme + matematiksel fonksiyonlar
          </p>
        </div>
      </div>
    </div>
  );
};
