import { useEffect, useMemo, useRef } from 'react';
import type { WeatherCondition } from '../types/weather';

type Modifiers = {
  isWindy: boolean;
  isCold: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  drift?: number;
};

function chooseType(condition: WeatherCondition): 'none' | 'rain' | 'snow' {
  if (condition === 'snow' || condition === 'cold') return 'snow';
  if (condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm') return 'rain';
  return 'none';
}

function initParticle(
  p: Particle,
  w: number,
  h: number,
  type: 'rain' | 'snow',
  windAngle: number,
  randomY = false,
) {
  p.x = Math.random() * w;
  p.y = randomY ? Math.random() * h : -10 - Math.random() * h * 0.2;

  if (type === 'snow') {
    const base = 0.25 + Math.random() * 0.5;
    p.size = 1.3 + Math.random() * 2.2;
    p.vx = Math.cos(windAngle) * base * 0.9;
    p.vy = 0.35 + Math.random() * 0.8;
    p.opacity = 0.35 + Math.random() * 0.5;
    p.drift = (Math.random() - 0.5) * 0.8;
  } else {
    const base = 2.0 + Math.random() * 3.5;
    p.size = 1.1 + Math.random() * 1.0;
    p.vx = Math.cos(windAngle) * base;
    p.vy = Math.sin(windAngle) * base + 7 + Math.random() * 6;
    p.opacity = 0.25 + Math.random() * 0.35;
    p.drift = 0;
  }
}

export function WeatherScene({ condition, windKmh }: { condition: WeatherCondition; windKmh: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  const type = useMemo(() => chooseType(condition), [condition]);
  const modifiers = useMemo<Modifiers>(
    () => ({ isWindy: windKmh >= 40 || condition === 'wind', isCold: condition === 'cold' }),
    [windKmh, condition],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (type === 'none') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    ro.observe(canvas);

    const windAngle = modifiers.isWindy ? (type === 'rain' ? Math.PI * 0.63 : Math.PI * 0.55) : Math.PI * 0.5;
    const count = type === 'snow' ? 120 : 170;

    const particles: Particle[] = Array.from({ length: count }, () => {
      const p = {} as Particle;
      initParticle(p, canvas.clientWidth, canvas.clientHeight, type, windAngle, true);
      return p;
    });

    const draw = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        if (type === 'snow') {
          // gentle sway
          p.x += p.vx + (p.drift ?? 0) * Math.sin(t / 800 + p.y / 120);
          p.y += p.vy;
        } else {
          p.x += p.vx;
          p.y += p.vy;
        }

        if (p.y > h + 12 || p.x < -20 || p.x > w + 20) {
          initParticle(p, w, h, type, windAngle);
        }

        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = type === 'snow' ? '#ffffff' : '#7fb7ff';

        if (type === 'snow') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(p.x, p.y, p.size, p.size * 7);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [type, modifiers.isWindy]);

  if (type === 'none') return null;

  return <canvas ref={canvasRef} className="scene" aria-hidden="true" />;
}
