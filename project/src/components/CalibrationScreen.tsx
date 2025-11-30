import { useEffect, useState, useRef } from 'react';
import { CalibrationSystem } from '../utils/calibrationSystem';
import { PupilDetector } from '../utils/pupilDetector';

interface CalibrationScreenProps {
  calibrationSystem: CalibrationSystem;
  captureFrame: () => ImageData | null;
  onComplete: (success: boolean) => void;
}

export const CalibrationScreen = ({
  calibrationSystem,
  captureFrame,
  onComplete,
}: CalibrationScreenProps) => {
  const [currentPointIdx, setCurrentPointIdx] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const calibrationPoints = useRef<[number, number][]>([]);

  useEffect(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    calibrationPoints.current =
      calibrationSystem.generateCalibrationPoints(screenWidth, screenHeight);
  }, [calibrationSystem]);

  useEffect(() => {
    if (isProcessing) return;

    if (currentPointIdx >= calibrationPoints.current.length) {
      processCalibration();
      return;
    }

    const timer = setTimeout(() => {
      captureSample();
      setCurrentPointIdx((prev) => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentPointIdx, isProcessing]);

  const captureSample = () => {
    const frame = captureFrame();
    if (!frame) return;

    const pupilData = PupilDetector.detectPupil(frame);
    const screenPoint = calibrationPoints.current[currentPointIdx];
    calibrationSystem.addCalibrationSample(screenPoint, pupilData);
  };

  const processCalibration = async () => {
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = calibrationSystem.computeMapping();
    onComplete(success);
  };

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-gray-500 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">
            Lütfen bekleyiniz, kalibrasyon işleniyor...
          </p>
          <p className="text-white text-sm mt-2">
            {calibrationSystem.getSampleCount()} örnek alındı
          </p>
        </div>
      </div>
    );
  }

  if (currentPointIdx >= calibrationPoints.current.length) {
    return null;
  }

  const [x, y] = calibrationPoints.current[currentPointIdx];

  return (
    <div className="fixed inset-0 bg-gray-500 z-50">
      <svg className="w-full h-full">
        <circle
          cx={x}
          cy={y}
          r="30"
          fill="#ef4444"
          stroke="white"
          strokeWidth="3"
        />
        <circle cx={x} cy={y} r="10" fill="white" />
        <circle
          cx={x}
          cy={y}
          r="25"
          fill="none"
          stroke="white"
          strokeWidth="2"
          opacity="0.5"
        >
          <animate
            attributeName="r"
            from="25"
            to="35"
            dur="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.5"
            to="0"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 px-6 py-3 rounded-lg shadow-lg">
        <p className="text-gray-800 font-medium">
          Kalibrasyon: {currentPointIdx + 1} / {calibrationPoints.current.length}
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Kırmızı noktaya bakın
        </p>
      </div>
    </div>
  );
};
