import { useEffect, useRef, useState } from 'react';
import { CalibrationSystem } from '../utils/calibrationSystem';
import { PupilDetector } from '../utils/pupilDetector';

interface TrackingScreenProps {
  calibrationSystem: CalibrationSystem;
  captureFrame: () => ImageData | null;
  onStop: () => void;
}

export const TrackingScreen = ({
  calibrationSystem,
  captureFrame,
  onStop,
}: TrackingScreenProps) => {
  const [gazePos, setGazePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const smoothedPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const updateTracking = () => {
      const frame = captureFrame();
      if (frame) {
        const pupilData = PupilDetector.detectPupil(frame);
        const screenPos = calibrationSystem.mapGazeToScreen(pupilData);

        if (screenPos) {
          const [x, y] = screenPos;

          const alpha = 0.3;
          smoothedPos.current.x = alpha * x + (1 - alpha) * smoothedPos.current.x;
          smoothedPos.current.y = alpha * y + (1 - alpha) * smoothedPos.current.y;

          smoothedPos.current.x = Math.max(
            10,
            Math.min(window.innerWidth - 10, smoothedPos.current.x)
          );
          smoothedPos.current.y = Math.max(
            10,
            Math.min(window.innerHeight - 10, smoothedPos.current.y)
          );

          setGazePos({
            x: smoothedPos.current.x,
            y: smoothedPos.current.y,
          });
        }
      }

      animationRef.current = requestAnimationFrame(updateTracking);
    };

    updateTracking();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [calibrationSystem, captureFrame]);

  return (
    <div className="fixed inset-0 bg-gray-100 z-50">
      <svg className="w-full h-full pointer-events-none">
        <defs>
          <radialGradient id="gazeGradient">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7" />
          </radialGradient>
        </defs>

        <circle
          cx={gazePos.x}
          cy={gazePos.y}
          r="10"
          fill="url(#gazeGradient)"
          stroke="white"
          strokeWidth="2"
        />

        <circle
          cx={gazePos.x}
          cy={gazePos.y}
          r="15"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1"
          opacity="0.5"
        >
          <animate
            attributeName="r"
            from="15"
            to="25"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.5"
            to="0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      <div className="absolute top-4 left-4 pointer-events-auto">
        <button
          onClick={onStop}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-colors"
        >
          Takibi Durdur
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 px-6 py-3 rounded-lg shadow-lg pointer-events-none">
        <p className="text-gray-800 font-medium text-center">
          Gaze Tracking Aktif
        </p>
        <p className="text-gray-600 text-sm text-center">
          Gözünüzü hareket ettirin
        </p>
      </div>
    </div>
  );
};
