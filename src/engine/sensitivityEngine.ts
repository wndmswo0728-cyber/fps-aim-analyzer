import {
  AnalysisInput,
  AnalysisResult,
  FlickTestResult,
  PrecisionTestResult,
  Recommendation,
  TendencyClassification,
  TendencyType,
} from '../types';
import { ANALYSIS_CONSTANTS, SENSITIVITY_ADJUSTMENTS } from '../constants';

export function detectOverAimPercentage(flickData: FlickTestResult): number {
  if (flickData.attempts.length === 0) return 0;
  const overAimCount = flickData.attempts.filter(a => a.overAimDetected).length;
  return (overAimCount / flickData.attempts.length) * 100;
}

export function detectUnderAimSeverity(precisionData: PrecisionTestResult): number {
  if (precisionData.attempts.length === 0) return 0;
  const totalCorrections = precisionData.attempts.reduce((sum, a) => sum + a.correctionMovements, 0);
  return totalCorrections / precisionData.attempts.length;
}

export function detectCursorJitterAvg(precisionData: PrecisionTestResult): number {
  if (precisionData.attempts.length === 0) return 0;
  const totalJitter = precisionData.attempts.reduce((sum, a) => sum + a.cursorJitter, 0);
  return totalJitter / precisionData.attempts.length;
}

export function calculateAccuracyScore(hitRate: number, avgReactionTimeMs: number): number {
  const maxReaction = ANALYSIS_CONSTANTS.MAX_REACTION_TIME_MS;
  const score = hitRate * 100 * ANALYSIS_CONSTANTS.ACCURACY_HIT_WEIGHT +
    (1 - avgReactionTimeMs / maxReaction) * ANALYSIS_CONSTANTS.ACCURACY_SPEED_WEIGHT;
  return Math.max(0, Math.min(100, score));
}

export function classifyTendencies(
  overAimPct: number,
  avgCorrections: number,
  avgJitter: number
): TendencyClassification[] {
  const tendencies: TendencyClassification[] = [];

  if (overAimPct / 100 > ANALYSIS_CONSTANTS.OVER_AIM_THRESHOLD) {
    tendencies.push({
      type: 'over_aim',
      severity: Math.min(1, (overAimPct / 100 - ANALYSIS_CONSTANTS.OVER_AIM_THRESHOLD) / 0.5),
      details: `플릭 타겟의 ${overAimPct.toFixed(1)}%에서 오버에임이 감지되었습니다.`,
    });
  }

  if (avgCorrections > ANALYSIS_CONSTANTS.UNDER_AIM_CORRECTION_THRESHOLD) {
    tendencies.push({
      type: 'under_aim',
      severity: Math.min(1, (avgCorrections - ANALYSIS_CONSTANTS.UNDER_AIM_CORRECTION_THRESHOLD) / 5),
      details: `타겟당 평균 ${avgCorrections.toFixed(1)}회 수정 움직임 (기준: ${ANALYSIS_CONSTANTS.UNDER_AIM_CORRECTION_THRESHOLD}회).`,
    });
  }

  if (avgJitter > ANALYSIS_CONSTANTS.JITTER_DISTANCE_THRESHOLD) {
    tendencies.push({
      type: 'cursor_jitter',
      severity: Math.min(1, (avgJitter - ANALYSIS_CONSTANTS.JITTER_DISTANCE_THRESHOLD) / 20),
      details: `클릭 전 평균 커서 흔들림 ${avgJitter.toFixed(1)}px (기준: ${ANALYSIS_CONSTANTS.JITTER_DISTANCE_THRESHOLD}px).`,
    });
  }

  if (tendencies.length === 0) {
    tendencies.push({
      type: 'balanced',
      severity: 0,
      details: '에임 패턴이 균형 잡혀 있습니다. 특별한 문제가 감지되지 않았습니다.',
    });
  }

  // Sort by severity descending
  tendencies.sort((a, b) => b.severity - a.severity);
  return tendencies;
}

export function generateRecommendations(
  tendencies: TendencyClassification[],
  userSensitivity: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const tendency of tendencies) {
    if (tendency.type === 'balanced') {
      recommendations.push({
        tendency: 'balanced',
        direction: 'maintain',
        percentageRange: [0, 0],
        reason: '현재 감도가 에임 스타일에 잘 맞습니다. 조정이 필요하지 않습니다.',
      });
    } else if (tendency.type === 'over_aim') {
      const range = SENSITIVITY_ADJUSTMENTS.OVER_AIM_DECREASE;
      const adjustedRange: [number, number] = [
        Math.round(range[0] * (0.5 + tendency.severity * 0.5)),
        Math.round(range[1] * (0.5 + tendency.severity * 0.5)),
      ];
      recommendations.push({
        tendency: 'over_aim',
        direction: 'decrease',
        percentageRange: adjustedRange,
        reason: '타겟을 지속적으로 지나치고 있습니다. 감도를 낮추면 오버에임이 줄어듭니다.',
      });
    } else if (tendency.type === 'under_aim') {
      const range = SENSITIVITY_ADJUSTMENTS.UNDER_AIM_INCREASE;
      const adjustedRange: [number, number] = [
        Math.round(range[0] * (0.5 + tendency.severity * 0.5)),
        Math.round(range[1] * (0.5 + tendency.severity * 0.5)),
      ];
      recommendations.push({
        tendency: 'under_aim',
        direction: 'increase',
        percentageRange: adjustedRange,
        reason: '타겟에 도달하지 못하고 여러 번 수정하고 있습니다. 감도를 올리면 더 빠르게 타겟에 도달할 수 있습니다.',
      });
    } else if (tendency.type === 'cursor_jitter') {
      const range = SENSITIVITY_ADJUSTMENTS.CURSOR_JITTER_DECREASE;
      const adjustedRange: [number, number] = [
        Math.round(range[0] * (0.5 + tendency.severity * 0.5)),
        Math.round(range[1] * (0.5 + tendency.severity * 0.5)),
      ];
      recommendations.push({
        tendency: 'cursor_jitter',
        direction: 'decrease',
        percentageRange: adjustedRange,
        reason: '클릭 직전 커서가 불안정합니다. 감도를 낮추면 정밀도가 향상됩니다.',
      });
    }
  }

  return recommendations;
}

export function calculateRecommendedSensitivity(
  recommendations: Recommendation[],
  userSensitivity: number
): { min: number; max: number } | null {
  if (recommendations.length === 0) return null;
  if (recommendations.every(r => r.direction === 'maintain')) return null;

  let totalAdjustMin = 0;
  let totalAdjustMax = 0;

  for (const rec of recommendations) {
    if (rec.direction === 'decrease') {
      totalAdjustMin -= rec.percentageRange[1];
      totalAdjustMax -= rec.percentageRange[0];
    } else if (rec.direction === 'increase') {
      totalAdjustMin += rec.percentageRange[0];
      totalAdjustMax += rec.percentageRange[1];
    }
  }

  // Cap at ±30%
  const maxAdj = SENSITIVITY_ADJUSTMENTS.MAX_TOTAL_ADJUSTMENT;
  totalAdjustMin = Math.max(-maxAdj, Math.min(maxAdj, totalAdjustMin));
  totalAdjustMax = Math.max(-maxAdj, Math.min(maxAdj, totalAdjustMax));

  // Ensure min <= max
  const adjMin = Math.min(totalAdjustMin, totalAdjustMax);
  const adjMax = Math.max(totalAdjustMin, totalAdjustMax);

  const sensMin = userSensitivity * (1 + adjMin / 100);
  const sensMax = userSensitivity * (1 + adjMax / 100);

  return {
    min: Math.round(sensMin * 100) / 100,
    max: Math.round(sensMax * 100) / 100,
  };
}

export function analyzeSensitivity(input: AnalysisInput): AnalysisResult {
  const { flickData, precisionData, userSensitivity } = input;

  // Calculate metrics
  const overAimPct = detectOverAimPercentage(flickData);
  const avgCorrections = detectUnderAimSeverity(precisionData);
  const avgJitter = detectCursorJitterAvg(precisionData);

  // Calculate hit rate across both tests
  const flickHits = flickData.attempts.filter(a => a.clicks.some(c => c.isHit)).length;
  const flickTotal = flickData.attempts.length;
  const precisionHits = precisionData.hitCount;
  const precisionTotal = precisionData.attempts.length;
  const totalHits = flickHits + precisionHits;
  const totalAttempts = flickTotal + precisionTotal;
  const hitRate = totalAttempts > 0 ? totalHits / totalAttempts : 0;

  // Average reaction time from flick test
  const reactionTimes = flickData.attempts
    .filter(a => a.reactionTimeMs > 0)
    .map(a => a.reactionTimeMs);
  const avgReactionTimeMs = reactionTimes.length > 0
    ? reactionTimes.reduce((sum, t) => sum + t, 0) / reactionTimes.length
    : 0;

  // Calculate accuracy score
  const accuracyScore = calculateAccuracyScore(hitRate, avgReactionTimeMs);

  // Classify tendencies
  const tendencies = classifyTendencies(overAimPct, avgCorrections, avgJitter);

  // Generate recommendations
  const recommendations = generateRecommendations(tendencies, userSensitivity);

  // Calculate recommended sensitivity
  const recommendedSensitivity = calculateRecommendedSensitivity(recommendations, userSensitivity);

  return {
    tendencies,
    accuracyScore,
    averageReactionTimeMs: Math.round(avgReactionTimeMs),
    overAimPercentage: Math.round(overAimPct * 10) / 10,
    recommendations,
    recommendedSensitivity,
  };
}
