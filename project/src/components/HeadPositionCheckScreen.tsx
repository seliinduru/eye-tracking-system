import { useEffect, useState } from 'react';
import { HeadPositionChecker } from '../utils/headPositionChecker';

interface HeadPositionCheckScreenProps {
  captureFrame: () => ImageData | null;
  onAlignmentComplete: () => void;
}

export const HeadPositionCheckScreen = ({
  captureFrame,
  onAlignmentComplete,
}: HeadPositionCheckScreenProps) => {
  const [isAligned, setIsAligned] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const frame = captureFrame();
      if (!frame) return;

      const result = HeadPositionChecker.checkHeadPosition(
        frame,
        window.innerWidth,
        window.innerHeight,
        0.18
      );

      setIsAligned(result.isAligned);
      setOffsetX(result.offsetX);
      setOffsetY(result.offsetY);
    }, 100);

    return () => clearInterval(checkInterval);
  }, [captureFrame]);

  useEffect(() => {
    if (!isAligned) {
      setCountdown(3);
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      onAlignmentComplete();
    }
  }, [isAligned, countdown, onAlignmentComplete]);

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;

  const targetSize = 200;

  const directionX = offsetX > 0.05 ? (offsetX > 0 ? 'SOL' : 'SAĞ') : '';
  const directionY = offsetY > 0.05 ? (offsetY > 0 ? 'YUKARI' : 'AŞAĞI') : '';

  return (
    <div className="fixed inset-0 bg-red-900 bg-opacity-80 z-50 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width={screenWidth} height={screenHeight}>
          <circle
            cx={centerX}
            cy={centerY}
            r={targetSize / 2}
            fill="none"
            stroke={isAligned ? '#10b981' : '#ef4444'}
            strokeWidth="4"
            strokeDasharray="10 5"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={targetSize / 2 - 20}
            fill="none"
            stroke={isAligned ? '#10b981' : '#f59e0b'}
            strokeWidth="2"
            opacity="0.5"
          />
          <line
            x1={centerX - targetSize / 2}
            y1={centerY}
            x2={centerX + targetSize / 2}
            y2={centerY}
            stroke={isAligned ? '#10b981' : '#f59e0b'}
            strokeWidth="2"
          />
          <line
            x1={centerX}
            y1={centerY - targetSize / 2}
            x2={centerX}
            y2={centerY + targetSize / 2}
            stroke={isAligned ? '#10b981' : '#f59e0b'}
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="relative z-10 text-center">
        <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl p-8 max-w-md">
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isAligned ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {isAligned ? (
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isAligned ? 'Mükemmel!' : 'Başınızı Hizalayın'}
          </h2>

          {isAligned ? (
            <div>
              <p className="text-gray-600 mb-4">Pozisyon başarıyla hizalandı</p>
              <div className="text-5xl font-bold text-green-600 animate-pulse">
                {countdown}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Kalibrasyon başlıyor...
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Yüzünüzü ekranın ortasındaki hedef ile hizalayın
              </p>
              {(directionX || directionY) && (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 font-medium">
                    Yön: {directionY} {directionX}
                  </p>
                </div>
              )}
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Ekrana doğrudan bakın</p>
                <p>• Başınızı hareket ettirmeyin</p>
                <p>• Yeterli ışık olduğundan emin olun</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
