import { useState } from 'react';
import { GameType } from '../types';
import { GAME_CONFIGS } from '../constants';

interface StartScreenProps {
  onStart: (game: GameType, sensitivity: number, dpi: number) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [game, setGame] = useState<GameType>('valorant');
  const [sensitivity, setSensitivity] = useState<string>('0.5');
  const [dpi, setDpi] = useState<string>('800');

  const sensValue = parseFloat(sensitivity);
  const dpiValue = parseInt(dpi, 10);
  const isValid =
    !isNaN(sensValue) && sensValue >= 0.01 && sensValue <= 100 &&
    !isNaN(dpiValue) && dpiValue >= 100 && dpiValue <= 16000;

  const handleStart = () => {
    if (isValid) {
      onStart(game, sensValue, dpiValue);
    }
  };

  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="title">
          <span className="title-icon">⊕</span>
          에임 감도 분석기
        </h1>
        <p className="subtitle">
          플릭 에임과 정밀 에임을 테스트하여 현재 감도 설정을 분석합니다.
          맞춤형 감도 추천으로 FPS 실력을 향상시키세요.
        </p>

        <div className="form-section">
          <label className="form-label">게임 선택</label>
          <div className="game-select">
            {Object.values(GAME_CONFIGS).map((config) => (
              <button
                key={config.name}
                className={`game-btn ${game === config.name ? 'active' : ''}`}
                onClick={() => setGame(config.name as GameType)}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">인게임 감도</label>
          <input
            type="number"
            className="form-input"
            value={sensitivity}
            onChange={(e) => setSensitivity(e.target.value)}
            min="0.01"
            max="100"
            step="0.01"
            placeholder="예: 0.5"
          />
          <span className="form-hint">범위: 0.01 - 100</span>
        </div>

        <div className="form-section">
          <label className="form-label">마우스 DPI</label>
          <input
            type="number"
            className="form-input"
            value={dpi}
            onChange={(e) => setDpi(e.target.value)}
            min="100"
            max="16000"
            step="50"
            placeholder="예: 800"
          />
          <span className="form-hint">범위: 100 - 16000</span>
        </div>

        <button
          className="start-btn"
          onClick={handleStart}
          disabled={!isValid}
        >
          테스트 시작
        </button>

        <div className="test-info">
          <div className="info-card">
            <h3>플릭 테스트</h3>
            <p>30초 또는 20개 타겟. 랜덤 타겟을 최대한 빠르게 클릭하세요.</p>
          </div>
          <div className="info-card">
            <h3>정밀 테스트</h3>
            <p>20개의 작은 타겟. 미세 조준 정확도를 측정합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
