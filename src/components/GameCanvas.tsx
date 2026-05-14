import { useRef, useEffect, useCallback } from 'react';
import { CANVAS_CONFIG } from '../constants';

interface GameCanvasProps {
  onMouseMove: (x: number, y: number, timestamp: number) => void;
  onClick: (x: number, y: number, timestamp: number) => void;
  renderFrame: (ctx: CanvasRenderingContext2D, timestamp: number) => void;
}

export function GameCanvas({ onMouseMove, onClick, renderFrame }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    mousePos.current = coords;
    onMouseMove(coords.x, coords.y, performance.now());
  }, [getCanvasCoords, onMouseMove]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    onClick(coords.x, coords.y, performance.now());
  }, [getCanvasCoords, onClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = Math.max(CANVAS_CONFIG.MIN_WIDTH, container.clientWidth);
        canvas.height = Math.max(CANVAS_CONFIG.MIN_HEIGHT, container.clientHeight);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Animation loop
    const loop = (timestamp: number) => {
      ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render game frame
      renderFrame(ctx, timestamp);

      // Draw crosshair
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      ctx.strokeStyle = CANVAS_CONFIG.CROSSHAIR_COLOR;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx - 12, my);
      ctx.lineTo(mx - 4, my);
      ctx.moveTo(mx + 4, my);
      ctx.lineTo(mx + 12, my);
      ctx.moveTo(mx, my - 12);
      ctx.lineTo(mx, my - 4);
      ctx.moveTo(mx, my + 4);
      ctx.lineTo(mx, my + 12);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = CANVAS_CONFIG.CROSSHAIR_COLOR;
      ctx.beginPath();
      ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', updateSize);
    };
  }, [renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'none',
      }}
    />
  );
}
