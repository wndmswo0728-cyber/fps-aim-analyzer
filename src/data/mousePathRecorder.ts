import { MouseSample, MousePathSegment } from '../types';

export interface MousePathRecorder {
  startSegment(targetIndex: number): void;
  addSample(x: number, y: number, timestamp: number): void;
  endSegment(): MousePathSegment;
  getCurrentSegment(): MouseSample[];
}

export function createMousePathRecorder(): MousePathRecorder {
  let currentSamples: MouseSample[] = [];
  let currentTargetIndex = 0;

  return {
    startSegment(targetIndex: number) {
      currentSamples = [];
      currentTargetIndex = targetIndex;
    },

    addSample(x: number, y: number, timestamp: number) {
      currentSamples.push({ x, y, timestamp });
    },

    endSegment(): MousePathSegment {
      const segment: MousePathSegment = {
        samples: [...currentSamples],
        targetIndex: currentTargetIndex,
      };
      currentSamples = [];
      return segment;
    },

    getCurrentSegment(): MouseSample[] {
      return [...currentSamples];
    },
  };
}
