import { useRef, useCallback, useEffect, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { FlickTestResult, Point, TargetPosition } from '../types';
import { createFlickDataCollector } from '../data/flickDataCollector';
import { createMousePathRecorder } from '../data/mousePathRecorder';
import { FLICK_TEST_CONFIG, CANVAS_CONFIG } from '../constants';

interface FlickTestProps {
  onComplete: (data: FlickTestResult) => void;
}

interface HitEffect {
  x: number;
  y: number;
  startTime: number;
  isHit: boolean;
}

function generateTarget(canvasWidth: number, canvasHeight: number, previousCenter: Point | null): TargetPosition {
  const margin = FLICK_TEST_CONFIG.EDGE_MARGIN;
  const radius = FLICK_TEST_CONFIG.TARGET_RADIUS;
  const minDist = FLICK_TEST_CONFIG.MIN_DISTANCE_FROM_PREVIOUS;

  let attempts = 0;
  while (attempts < 100) {
    const x = margin + radius + Math.random() * (canvasWidth - 2 * (margin + radius));
    const y = margin + radius + Math.random() * (canvasHeight - 2 * (margin + radius));

    if (previousCenter) {
      const dx = x - previousCenter.x;
      const dy = y - previousCenter.y;
      if (Math.sqrt(dx * dx + dy * dy) < minDist) {
        attempts++;
        continue;
      }
    }

    return { center: { x, y }, radius };
  }

  // Fallback: place at opposite side
  const x = previousCenter
    ? (canvasWidth - previousCenter.x)
    : canvasWidth / 2;
  const y = previousCenter
    ? (canvasHeight - previousCenter.y)
    : canvasHeight / 2;
  return { center: { x, y }, radius };
}

export function FlickTest({ onComplete }: FlickTestProps) {
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [targetsRemaining, setTargetsRemaining] = useState<number>(FLICK_TEST_CONFIG.MAX_TARGETS);
  const [isReady, setIsReady] = useState(false);

  const targetRef = useRef<TargetPosition | null>(null);
  const targetIndexRef = useRef(0);
  const targetsPresented = useRef(0);
  const startTimeRef = useRef(0);
  const targetSpawnTimeRef = useRef(0);
  const previousCenterRef = useRef<Point | null>(null);
  const canvasSizeRef = useRef({ width: 800, height: 600 });
  const collectorRef = useRef(createFlickDataCollector());
  const pathRecorderRef = useRef(createMousePathRecorder());
  const hitEffectsRef = useRef<HitEffect[]>([]);
  const completedRef = useRef(false);

  // Initialize first target after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      startTimeRef.current = performance.now();
      spawnTarget();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);

      if (elapsed >= FLICK_TEST_CONFIG.TIME_LIMIT_MS && !completedRef.current) {
        completeTest('time');
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isReady]);

  const spawnTarget = useCallback(() => {
    const target = generateTarget(
      canvasSizeRef.current.width,
      canvasSizeRef.current.height,
      previousCenterRef.current
    );
    targetRef.current = target;
    targetSpawnTimeRef.current = performance.now();
    targetsPresented.current++;

    const idx = targetIndexRef.current;
    collectorRef.current.recordTargetSpawn(target, idx);
    pathRecorderRef.current.startSegment(idx);

    previousCenterRef.current = target.center;
    setTargetsRemaining(FLICK_TEST_CONFIG.MAX_TARGETS - targetsPresented.current + 1);
  }, []);

  const completeTest = useCallback((reason: 'time' | 'targets') => {
    if (completedRef.current) return;
    completedRef.current = true;

    // End current path segment
    const segment = pathRecorderRef.current.endSegment();
    collectorRef.current.setMousePath(targetIndexRef.current, segment);

    const totalTime = performance.now() - startTimeRef.current;
    const result = collectorRef.current.finalize(totalTime, reason);
    onComplete(result);
  }, [onComplete]);

  const handleMouseMove = useCallback((x: number, y: number, timestamp: number) => {
    if (!isReady || completedRef.current) return;
    const relativeTime = timestamp - targetSpawnTimeRef.current;
    pathRecorderRef.current.addSample(x, y, relativeTime);
  }, [isReady]);

  const handleClick = useCallback((x: number, y: number, timestamp: number) => {
    if (!isReady || completedRef.current || !targetRef.current) return;

    const target = targetRef.current;
    const dx = x - target.center.x;
    const dy = y - target.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const isHit = distance <= target.radius;

    const relativeTime = timestamp - targetSpawnTimeRef.current;
    const absoluteTime = timestamp - startTimeRef.current;

    collectorRef.current.recordClick({
      position: { x, y },
      timestamp: relativeTime,
      absoluteTime,
      isHit,
      targetIndex: targetIndexRef.current,
    });

    // Add hit effect
    hitEffectsRef.current.push({
      x: isHit ? target.center.x : x,
      y: isHit ? target.center.y : y,
      startTime: timestamp,
      isHit,
    });

    if (isHit) {
      // End path segment and store
      const segment = pathRecorderRef.current.endSegment();
      collectorRef.current.setMousePath(targetIndexRef.current, segment);

      targetIndexRef.current++;

      if (targetsPresented.current >= FLICK_TEST_CONFIG.MAX_TARGETS) {
        completeTest('targets');
      } else {
        spawnTarget();
      }
    }
  }, [isReady, spawnTarget, completeTest]);

  const renderFrame = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    // Update canvas size reference
    canvasSizeRef.current = { width: ctx.canvas.width, height: ctx.canvas.height };

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < ctx.canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < ctx.canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }

    // Draw target
    const target = targetRef.current;
    if (target && !completedRef.current) {
      // Outer glow
      const gradient = ctx.createRadialGradient(
        target.center.x, target.center.y, target.radius * 0.5,
        target.center.x, target.center.y, target.radius * 1.3
      );
      gradient.addColorStop(0, 'rgba(255, 71, 87, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 71, 87, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(target.center.x, target.center.y, target.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Main circle
      ctx.fillStyle = CANVAS_CONFIG.TARGET_COLOR;
      ctx.beginPath();
      ctx.arc(target.center.x, target.center.y, target.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(target.center.x, target.center.y, target.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = CANVAS_CONFIG.TARGET_CENTER_COLOR;
      ctx.beginPath();
      ctx.arc(target.center.x, target.center.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw hit effects
    hitEffectsRef.current = hitEffectsRef.current.filter(effect => {
      const elapsed = timestamp - effect.startTime;
      if (elapsed > 200) return false;

      const progress = elapsed / 200;
      const alpha = 1 - progress;
      const size = 30 + progress * 20;

      ctx.strokeStyle = effect.isHit
        ? `rgba(0, 255, 136, ${alpha})`
        : `rgba(255, 107, 107, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
      ctx.stroke();

      if (effect.isHit) {
        ctx.strokeStyle = `rgba(0, 255, 136, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      return true;
    });

    // HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`시간: ${timeLeft}초`, 20, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`남은 타겟: ${targetsRemaining}`, ctx.canvas.width - 20, 30);

    // Test label
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px monospace';
    ctx.fillText('플릭 테스트', ctx.canvas.width / 2, 25);
  }, [timeLeft, targetsRemaining]);

  return (
    <div className="test-screen">
      <GameCanvas
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        renderFrame={renderFrame}
      />
    </div>
  );
}
