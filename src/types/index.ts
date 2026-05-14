// Core types
export interface Point {
  x: number;
  y: number;
}

export interface MouseSample {
  x: number;
  y: number;
  timestamp: number;
}

export interface MousePathSegment {
  samples: MouseSample[];
  targetIndex: number;
}

export interface TargetPosition {
  center: Point;
  radius: number;
}

export interface ClickData {
  position: Point;
  timestamp: number;
  absoluteTime: number;
  isHit: boolean;
  targetIndex: number;
}

// Flick Test types
export interface FlickTargetAttempt {
  target: TargetPosition;
  clicks: ClickData[];
  mousePath: MousePathSegment;
  overAimDetected: boolean;
  reactionTimeMs: number;
}

export interface FlickTestResult {
  attempts: FlickTargetAttempt[];
  totalTimeMs: number;
  terminationReason: 'time' | 'targets';
}

// Precision Test types
export interface PrecisionTargetAttempt {
  target: TargetPosition;
  click: ClickData;
  mousePath: MousePathSegment;
  cursorJitter: number;
  correctionMovements: number;
}

export interface PrecisionTestResult {
  attempts: PrecisionTargetAttempt[];
  hitCount: number;
  hitRate: number;
}

// Analysis types
export type TendencyType = 'over_aim' | 'under_aim' | 'cursor_jitter' | 'balanced';

export interface TendencyClassification {
  type: TendencyType;
  severity: number;
  details: string;
}

export interface Recommendation {
  tendency: TendencyType;
  direction: 'increase' | 'decrease' | 'maintain';
  percentageRange: [number, number];
  reason: string;
}

export interface AnalysisInput {
  flickData: FlickTestResult;
  precisionData: PrecisionTestResult;
  userSensitivity: number;
  userDPI: number;
  game: GameType;
}

export interface AnalysisResult {
  tendencies: TendencyClassification[];
  accuracyScore: number;
  averageReactionTimeMs: number;
  overAimPercentage: number;
  recommendations: Recommendation[];
  recommendedSensitivity: { min: number; max: number } | null;
}

// Game types
export type GameType = 'valorant' | 'cs2' | 'overwatch';

export type AppScreen = 'start' | 'flick' | 'precision' | 'result';

export interface GameConfig {
  name: string;
  label: string;
}
