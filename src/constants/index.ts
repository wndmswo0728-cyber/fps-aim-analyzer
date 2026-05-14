import { GameConfig, GameType } from '../types';

export const ANALYSIS_CONSTANTS = {
  OVER_AIM_THRESHOLD: 0.5,
  OVER_AIM_MIN_OVERSHOOT_PX: 5,
  UNDER_AIM_CORRECTION_THRESHOLD: 3,
  JITTER_DISTANCE_THRESHOLD: 15,
  JITTER_WINDOW_MS: 200,
  ACCURACY_HIT_WEIGHT: 0.7,
  ACCURACY_SPEED_WEIGHT: 30,
  MAX_REACTION_TIME_MS: 3000,
  DIRECTION_CHANGE_ANGLE_DEG: 45,
} as const;

export const FLICK_TEST_CONFIG = {
  TARGET_RADIUS: 30,
  EDGE_MARGIN: 30,
  MIN_DISTANCE_FROM_PREVIOUS: 100,
  MAX_TARGETS: 20,
  TIME_LIMIT_MS: 30000,
} as const;

export const PRECISION_TEST_CONFIG = {
  MIN_RADIUS: 8,
  MAX_RADIUS: 15,
  EDGE_MARGIN: 20,
  TOTAL_TARGETS: 20,
} as const;

export const CANVAS_CONFIG = {
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
  BACKGROUND_COLOR: '#1a1a2e',
  TARGET_COLOR: '#ff4757',
  TARGET_CENTER_COLOR: '#ffffff',
  CROSSHAIR_COLOR: '#00ff88',
  HIT_EFFECT_COLOR: '#00ff88',
  MISS_EFFECT_COLOR: '#ff6b6b',
} as const;

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  valorant: { name: 'valorant', label: 'Valorant' },
  cs2: { name: 'cs2', label: 'CS2' },
  overwatch: { name: 'overwatch', label: 'Overwatch' },
} as const;

export const SENSITIVITY_ADJUSTMENTS = {
  OVER_AIM_DECREASE: [10, 20] as [number, number],
  UNDER_AIM_INCREASE: [10, 20] as [number, number],
  CURSOR_JITTER_DECREASE: [5, 15] as [number, number],
  MAX_TOTAL_ADJUSTMENT: 30,
} as const;
