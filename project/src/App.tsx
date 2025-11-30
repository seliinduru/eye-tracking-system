import { useState, useRef } from 'react';
import { MainScreen } from './components/MainScreen';
import { CalibrationScreen } from './components/CalibrationScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { useWebcam } from './hooks/useWebcam';
import { CalibrationSystem } from './utils/calibrationSystem';

type AppState = 'main' | 'calibrating' | 'tracking';

function App() {
  const [appState, setAppState] = useState<AppState>('main');
  const [isCalibrated, setIsCalibrated] = useState(false);
  const { videoRef, isReady, error, captureFrame } = useWebcam();
  const calibrationSystemRef = useRef(new CalibrationSystem());

  const handleStartCalibration = () => {
    setAppState('calibrating');
  };

  const handleCalibrationComplete = (success: boolean) => {
    setAppState('main');
    setIsCalibrated(success);

    if (!success) {
      alert('Kalibrasyon başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  const handleStartTracking = () => {
    setAppState('tracking');
  };

  const handleStopTracking = () => {
    setAppState('main');
  };

  return (
    <>
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
      />

      {appState === 'main' && (
        <MainScreen
          onStartCalibration={handleStartCalibration}
          onStartTracking={handleStartTracking}
          isCalibrated={isCalibrated}
          webcamError={error}
          webcamReady={isReady}
        />
      )}

      {appState === 'calibrating' && (
        <CalibrationScreen
          calibrationSystem={calibrationSystemRef.current}
          captureFrame={captureFrame}
          onComplete={handleCalibrationComplete}
        />
      )}

      {appState === 'tracking' && (
        <TrackingScreen
          calibrationSystem={calibrationSystemRef.current}
          captureFrame={captureFrame}
          onStop={handleStopTracking}
        />
      )}
    </>
  );
}

export default App;
