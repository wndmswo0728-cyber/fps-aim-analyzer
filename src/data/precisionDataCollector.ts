import { ClickData, MousePathSegment, PrecisionTargetAttempt, PrecisionTestResult, TargetPosition } from '../types';
import { ANALYSIS_CONSTANTS } from '../constants';

export interface PrecisionDataCollector {
  recordTargetSpawn(target: TargetPosition, targetIndex: number): void;
  recordClick(click: ClickData, path: MousePathSegment): void;
  finalize(): PrecisionTestResult;
}

function calculateCursorJitter(path: MousePathSegment, clickTimestamp: number): number {
  const windowMs = ANALYSIS_CONSTANTS.JITTER_WINDOW_MS;
  const samples = path.samples;
  if (samples.length < 2) return 0;

  // Get samples within 200ms before click
  const windowStart = clickTimestamp - windowMs;
  const windowSamples = samples.filter(s => s.timestamp >= windowStart && s.timestamp <= clickTimestamp);

  if (windowSamples.length < 2) return 0;

  let totalDisplacement = 0;
  for (let i = 1; i < windowSamples.length; i++) {
    const dx = windowSamples[i].x - windowSamples[i - 1].x;
    const dy = windowSamples[i].y - windowSamples[i - 1].y;
    totalDisplacement += Math.sqrt(dx * dx + dy * dy);
  }

  return totalDisplacement;
}

function countCorrectionMovements(path: MousePathSegment): number {
  const samples = path.samples;
  if (samples.length < 3) return 0;

  const thresholdRad = (ANALYSIS_CONSTANTS.DIRECTION_CHANGE_ANGLE_DEG * Math.PI) / 180;
  let corrections = 0;

  for (let i = 1; i < samples.length - 1; i++) {
    // Direction vector from i-1 to i
    const dx1 = samples[i].x - samples[i - 1].x;
    const dy1 = samples[i].y - samples[i - 1].y;
    // Direction vector from i to i+1
    const dx2 = samples[i + 1].x - samples[i].x;
    const dy2 = samples[i + 1].y - samples[i].y;

    const mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (mag1 < 0.5 || mag2 < 0.5) continue; // Skip negligible movements

    // Angle between vectors using dot product
    const dot = dx1 * dx2 + dy1 * dy2;
    const cosAngle = dot / (mag1 * mag2);
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    const angle = Math.acos(clampedCos);

    if (angle > thresholdRad) {
      corrections++;
    }
  }

  return corrections;
}

export function createPrecisionDataCollector(): PrecisionDataCollector {
  const attempts: PrecisionTargetAttempt[] = [];
  const targets: Map<number, TargetPosition> = new Map();

  return {
    recordTargetSpawn(target: TargetPosition, targetIndex: number) {
      targets.set(targetIndex, target);
    },

    recordClick(click: ClickData, path: MousePathSegment) {
      const target = targets.get(click.targetIndex);
      if (!target) return;

      const cursorJitter = calculateCursorJitter(path, click.timestamp);
      const correctionMovements = countCorrectionMovements(path);

      attempts.push({
        target,
        click,
        mousePath: path,
        cursorJitter,
        correctionMovements,
      });
    },

    finalize(): PrecisionTestResult {
      const hitCount = attempts.filter(a => a.click.isHit).length;
      return {
        attempts,
        hitCount,
        hitRate: attempts.length > 0 ? hitCount / attempts.length : 0,
      };
    },
  };
}
