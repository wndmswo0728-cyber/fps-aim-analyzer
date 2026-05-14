import { useState, useCallback } from 'react';
import { StartScreen } from './components/StartScreen';
import { FlickTest } from './components/FlickTest';
import { PrecisionTest } from './components/PrecisionTest';
import { ResultScreen } from './components/ResultScreen';
import { AppScreen, FlickTestResult, GameType, PrecisionTestResult } from './types';
import './App.css';

function App() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [game, setGame] = useState<GameType>('valorant');
  const [sensitivity, setSensitivity] = useState(0.5);
  const [dpi, setDpi] = useState(800);
  const [flickData, setFlickData] = useState<FlickTestResult | null>(null);
  const [precisionData, setPrecisionData] = useState<PrecisionTestResult | null>(null);

  const handleStart = useCallback((selectedGame: GameType, sens: number, selectedDpi: number) => {
    setGame(selectedGame);
    setSensitivity(sens);
    setDpi(selectedDpi);
    setFlickData(null);
    setPrecisionData(null);
    setScreen('flick');
  }, []);

  const handleFlickComplete = useCallback((data: FlickTestResult) => {
    setFlickData(data);
    setScreen('precision');
  }, []);

  const handlePrecisionComplete = useCallback((data: PrecisionTestResult) => {
    setPrecisionData(data);
    setScreen('result');
  }, []);

  const handleRestart = useCallback(() => {
    setScreen('start');
    setFlickData(null);
    setPrecisionData(null);
  }, []);

  return (
    <div className="app">
      {screen === 'start' && (
        <StartScreen onStart={handleStart} />
      )}
      {screen === 'flick' && (
        <FlickTest onComplete={handleFlickComplete} />
      )}
      {screen === 'precision' && (
        <PrecisionTest onComplete={handlePrecisionComplete} />
      )}
      {screen === 'result' && flickData && precisionData && (
        <ResultScreen
          flickData={flickData}
          precisionData={precisionData}
          userSensitivity={sensitivity}
          userDPI={dpi}
          game={game}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
