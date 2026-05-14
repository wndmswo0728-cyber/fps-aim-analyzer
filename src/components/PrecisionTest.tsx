import { useRef, useCallback, useEffect, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { PrecisionTestResult, TargetPosition } from '../types';
import { createPrecisionDataCollector } from '../data/precisionDataCollector';
import { createMousePathRecorder } from '../data/mousePathRecorder';
import { PRECISION_TEST_CONFIG, CANVAS_CONFIG } from '../constants';

interface PrecisionTestProps {
  onComplete: (data: PrecisionTestResult) => void;
}

interface HitEffect {
  x: number;
  y: number;
  startTime: number;
  isHit: boolean;
}

function generatePrecisionTarget(canvasWidth: number, canvasHeight: number): TargetPosition {
  const margin = PRECISION_TEST_CONFIG.EDGE_MARGIN;
  const minR = PRECISION_TEST_CONFIG.MIN_RADIUS;
  const maxR = PRECISION_TEST_CONFIG.MAX_RADIUS;
  const radius = minR + Math.random() * (maxR - minR);

  const x = margin + radius + Math.random() * (canvasWidth - 2 * (margin + radius));
  const y = margin + radius + Math.random() * (canvasHeight - 2 * (margin + radius));

  return { center: { x, y }, radius };
}

export function PrecisionTest({ onComplete }: PrecisionTestProps) {
  const [targetNum, setTargetNum] = useState(1);
  const [hitCount, setHitCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const targetRef = useRef<TargetPosition | null>(null);
  const targetIndexRef = useRef(0);
  const targetSpawnTimeRef = useRef(0);
  const canvasSizeRef = useRef({ width: 800, height: 600 });
  const collectorRef = useRef(createPrecisionDataCollector());
  const pathRecorderRef = useRef(createMousePathRecorder());
  const hitEffectsRef = useRef<HitEffect[]>([]);
  const completedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      spawnTarget();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const spawnTarget = useCallback(() => {
    const target = generatePrecisionTarget(
      canvasSizeRef.current.width,
      canvasSizeRef.current.height
    );
    targetRef.current = target;
    targetSpawnTimeRef.current = performance.now();

    const idx = targetIndexRef.current;
    collectorRef.current.recordTargetSpawn(target, idx);
    pathRecorderRef.current.startSegment(idx);
  }, []);

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

    // End path segment
    const segment = pathRecorderRef.current.endSegment();

    collectorRef.current.recordClick(
      {
        position: { x, y },
        timestamp: relativeTime,
        absoluteTime: timestamp,
        isHit,
        targetIndex: targetIndexRef.current,
      },
      segment
    );

    // Hit effect
    hitEffectsRef.current.push({
      x: isHit ? target.center.x : x,
      y: isHit ? target.center.y : y,
      startTime: timestamp,
      isHit,
    });

    if (isHit) {
      setHitCount(prev => prev + 1);
    }

    targetIndexRef.current++;
    const nextNum = targetIndexRef.current + 1;
    setTargetNum(nextNum);

    if (targetIndexRef.current >= PRECISION_TEST_CONFIG.TOTAL_TARGETS) {
      completedRef.current = true;
      // Small delay for last hit effect
      setTimeout(() => {
        const result = collectorRef.current.finalize();
        onComplete(result);
      }, 300);
    } else {
      spawnTarget();
    }
  }, [isReady, spawnTarget, onComplete]);

  const renderFrame = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
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
        target.center.x, target.center.y, target.radius * 0.3,
        target.center.x, target.center.y, target.radius * 1.5
      );
      gradient.addColorStop(0, 'rgba(255, 165, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(target.center.x, target.center.y, target.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Main circle
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.arc(target.center.x, target.center.y, target.radius, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(target.center.x, target.center.y, target.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = CANVAS_CONFIG.TARGET_CENTER_COLOR;
      ctx.beginPath();
      ctx.arc(target.center.x, target.center.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw hit effects
    hitEffectsRef.current = hitEffectsRef.current.filter(effect => {
      const elapsed = timestamp - effect.startTime;
      if (elapsed > 200) return false;

      const progress = elapsed / 200;
      const alpha = 1 - progress;
      const size = 15 + progress * 15;

      ctx.strokeStyle = effect.isHit
        ? `rgba(0, 255, 136, ${alpha})`
        : `rgba(255, 107, 107, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
      ctx.stroke();

      return true;
    });

    // HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`타겟: ${Math.min(targetNum, 20)}/20`, 20, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`명중: ${hitCount}`, ctx.canvas.width - 20, 30);

    // Test label
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px monospace';
    ctx.fillText('정밀 테스트', ctx.canvas.width / 2, 25);
  }, [targetNum, hitCount]);

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
