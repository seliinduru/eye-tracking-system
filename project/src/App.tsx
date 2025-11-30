import { useState, useRef } from 'react';
import { MainScreen } from './components/MainScreen';
import { HeadPositionCheckScreen } from './components/HeadPositionCheckScreen';
import { CalibrationScreen } from './components/CalibrationScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { useWebcam } from './hooks/useWebcam';
import { CalibrationSystem } from './utils/calibrationSystem';

type AppState = 'main' | 'headCheck' | 'calibrating' | 'tracking';

function App() {
  const [appState, setAppState] = useState<AppState>('main');
  const [isCalibrated, setIsCalibrated] = useState(false);
  const { videoRef, isReady, error, captureFrame } = useWebcam();
  const calibrationSystemRef = useRef(new CalibrationSystem());

  const handleStartCalibration = () => {
    setAppState('headCheck');
  };

  const handleHeadAlignmentComplete = () => {
    setAppState('calibrating');
  };

  const handleCalibrationComplete = (success: boolean) => {
    setAppState('main');

    if (success && calibrationSystemRef.current.isCalibrated()) {
      setIsCalibrated(true);
    } else {
      setIsCalibrated(false);
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

      {appState === 'headCheck' && (
        <HeadPositionCheckScreen
          captureFrame={captureFrame}
          onAlignmentComplete={handleHeadAlignmentComplete}
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
