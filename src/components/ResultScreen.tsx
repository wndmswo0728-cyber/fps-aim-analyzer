import { useMemo } from 'react';
import { AnalysisInput, AnalysisResult, FlickTestResult, GameType, PrecisionTestResult } from '../types';
import { analyzeSensitivity } from '../engine/sensitivityEngine';

interface ResultScreenProps {
  flickData: FlickTestResult;
  precisionData: PrecisionTestResult;
  userSensitivity: number;
  userDPI: number;
  game: GameType;
  onRestart: () => void;
}

function getTendencyLabel(type: string): string {
  switch (type) {
    case 'over_aim': return '오버에임';
    case 'under_aim': return '언더에임';
    case 'cursor_jitter': return '커서 흔들림';
    case 'balanced': return '균형';
    default: return type;
  }
}

function getTendencyColor(type: string): string {
  switch (type) {
    case 'over_aim': return '#ff4757';
    case 'under_aim': return '#ffa502';
    case 'cursor_jitter': return '#ff6b81';
    case 'balanced': return '#00ff88';
    default: return '#ffffff';
  }
}

function getDirectionIcon(direction: string): string {
  switch (direction) {
    case 'increase': return '↑';
    case 'decrease': return '↓';
    case 'maintain': return '✓';
    default: return '';
  }
}

function getDirectionLabel(direction: string): string {
  switch (direction) {
    case 'increase': return '감도 올리기';
    case 'decrease': return '감도 내리기';
    case 'maintain': return '현재 유지';
    default: return '';
  }
}

export function ResultScreen({ flickData, precisionData, userSensitivity, userDPI, game, onRestart }: ResultScreenProps) {
  const analysis: AnalysisResult = useMemo(() => {
    const input: AnalysisInput = {
      flickData,
      precisionData,
      userSensitivity,
      userDPI,
      game,
    };
    return analyzeSensitivity(input);
  }, [flickData, precisionData, userSensitivity, userDPI, game]);

  const flickHits = flickData.attempts.filter(a => a.clicks.some(c => c.isHit)).length;
  const flickTotal = flickData.attempts.length;

  return (
    <div className="result-screen">
      <div className="result-content">
        <h1 className="result-title">분석 결과</h1>

        {/* Score Overview */}
        <div className="score-section">
          <div className="score-card main-score">
            <div className="score-value">{analysis.accuracyScore.toFixed(1)}</div>
            <div className="score-label">정확도 점수</div>
          </div>
          <div className="score-row">
            <div className="score-card">
              <div className="score-value small">{analysis.averageReactionTimeMs}ms</div>
              <div className="score-label">평균 반응시간</div>
            </div>
            <div className="score-card">
              <div className="score-value small">{analysis.overAimPercentage.toFixed(1)}%</div>
              <div className="score-label">오버에임 비율</div>
            </div>
            <div className="score-card">
              <div className="score-value small">{flickHits}/{flickTotal}</div>
              <div className="score-label">플릭 명중</div>
            </div>
            <div className="score-card">
              <div className="score-value small">{precisionData.hitCount}/20</div>
              <div className="score-label">정밀 명중</div>
            </div>
          </div>
        </div>

        {/* Tendency Classification */}
        <div className="tendency-section">
          <h2>성향 분석</h2>
          <div className="tendency-list">
            {analysis.tendencies.map((tendency, i) => (
              <div key={i} className="tendency-card" style={{ borderLeftColor: getTendencyColor(tendency.type) }}>
                <div className="tendency-header">
                  <span className="tendency-name" style={{ color: getTendencyColor(tendency.type) }}>
                    {getTendencyLabel(tendency.type)}
                  </span>
                  {tendency.type !== 'balanced' && (
                    <span className="tendency-severity">
                      심각도: {(tendency.severity * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="tendency-details">{tendency.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendation-section">
          <h2>추천 사항</h2>
          <div className="recommendation-list">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="recommendation-card">
                <div className="rec-header">
                  <span className="rec-icon">{getDirectionIcon(rec.direction)}</span>
                  <span className="rec-direction">
                    {getDirectionLabel(rec.direction)}
                  </span>
                  {rec.percentageRange[0] > 0 && (
                    <span className="rec-range">
                      ({rec.percentageRange[0]}-{rec.percentageRange[1]}%)
                    </span>
                  )}
                </div>
                <p className="rec-reason">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Sensitivity */}
        {analysis.recommendedSensitivity && (
          <div className="sensitivity-section">
            <h2>추천 감도</h2>
            <div className="sensitivity-card">
              <div className="sens-current">
                <span className="sens-label">현재:</span>
                <span className="sens-value">{userSensitivity}</span>
              </div>
              <div className="sens-arrow">→</div>
              <div className="sens-recommended">
                <span className="sens-label">추천:</span>
                <span className="sens-value highlight">
                  {analysis.recommendedSensitivity.min} - {analysis.recommendedSensitivity.max}
                </span>
              </div>
            </div>
            <p className="sens-note">
              {game.toUpperCase()} 기준, DPI {userDPI} 설정 기반
            </p>
          </div>
        )}

        <button className="restart-btn" onClick={onRestart}>
          다시 테스트
        </button>
      </div>
    </div>
  );
}
