import { ClickData, FlickTargetAttempt, FlickTestResult, MousePathSegment, TargetPosition } from '../types';
import { ANALYSIS_CONSTANTS } from '../constants';

export interface FlickDataCollector {
  recordTargetSpawn(target: TargetPosition, targetIndex: number): void;
  recordClick(click: ClickData): void;
  setMousePath(targetIndex: number, path: MousePathSegment): void;
  finalize(totalTimeMs: number, terminationReason: 'time' | 'targets'): FlickTestResult;
}

function detectOverAim(
  path: MousePathSegment,
  target: TargetPosition,
  initialPosition: { x: number; y: number } | null
): boolean {
  const samples = path.samples;
  if (samples.length < 3 || !initialPosition) return false;

  const start = initialPosition;
  const targetCenter = target.center;

  // Vector from start to target
  const dx = targetCenter.x - start.x;
  const dy = targetCenter.y - start.y;
  const targetDist = Math.sqrt(dx * dx + dy * dy);
  if (targetDist < 1) return false;

  // Unit vector toward target
  const ux = dx / targetDist;
  const uy = dy / targetDist;

  // Project each sample onto the start-to-target vector
  let maxProjection = 0;
  let maxProjectionIndex = 0;

  for (let i = 0; i < samples.length; i++) {
    const sx = samples[i].x - start.x;
    const sy = samples[i].y - start.y;
    const projection = sx * ux + sy * uy;
    if (projection > maxProjection) {
      maxProjection = projection;
      maxProjectionIndex = i;
    }
  }

  // Check if cursor went past target and came back
  if (maxProjection > targetDist) {
    // Check if it decreased by at least OVER_AIM_MIN_OVERSHOOT_PX after the peak
    for (let i = maxProjectionIndex + 1; i < samples.length; i++) {
      const sx = samples[i].x - start.x;
      const sy = samples[i].y - start.y;
      const projection = sx * ux + sy * uy;
      if (maxProjection - projection >= ANALYSIS_CONSTANTS.OVER_AIM_MIN_OVERSHOOT_PX) {
        return true;
      }
    }
  }

  return false;
}

export function createFlickDataCollector(): FlickDataCollector {
  const attempts: Map<number, { target: TargetPosition; clicks: ClickData[]; path: MousePathSegment | null }> = new Map();
  let initialPositions: Map<number, { x: number; y: number }> = new Map();

  return {
    recordTargetSpawn(target: TargetPosition, targetIndex: number) {
      attempts.set(targetIndex, { target, clicks: [], path: null });
    },

    recordClick(click: ClickData) {
      const attempt = attempts.get(click.targetIndex);
      if (attempt) {
        attempt.clicks.push(click);
        // Store initial position from first sample if not set
        if (!initialPositions.has(click.targetIndex) && attempt.path && attempt.path.samples.length > 0) {
          initialPositions.set(click.targetIndex, {
            x: attempt.path.samples[0].x,
            y: attempt.path.samples[0].y,
          });
        }
      }
    },

    setMousePath(targetIndex: number, path: MousePathSegment) {
      const attempt = attempts.get(targetIndex);
      if (attempt) {
        attempt.path = path;
        if (path.samples.length > 0) {
          initialPositions.set(targetIndex, { x: path.samples[0].x, y: path.samples[0].y });
        }
      }
    },

    finalize(totalTimeMs: number, terminationReason: 'time' | 'targets'): FlickTestResult {
      const flickAttempts: FlickTargetAttempt[] = [];

      attempts.forEach((attempt, targetIndex) => {
        const path = attempt.path || { samples: [], targetIndex };
        const initialPos = initialPositions.get(targetIndex) || null;
        const overAimDetected = detectOverAim(path, attempt.target, initialPos);

        // Reaction time: time to first hit, or last click time if no hit
        let reactionTimeMs = 0;
        const hitClick = attempt.clicks.find(c => c.isHit);
        if (hitClick) {
          reactionTimeMs = hitClick.timestamp;
        } else if (attempt.clicks.length > 0) {
          reactionTimeMs = attempt.clicks[attempt.clicks.length - 1].timestamp;
        }

        flickAttempts.push({
          target: attempt.target,
          clicks: attempt.clicks,
          mousePath: path,
          overAimDetected,
          reactionTimeMs,
        });
      });

      return {
        attempts: flickAttempts,
        totalTimeMs,
        terminationReason,
      };
    },
  };
}
