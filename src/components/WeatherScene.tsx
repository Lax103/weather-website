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
};

function choosePrecipType(condition: WeatherCondition): 'none' | 'rain' | 'snow' {
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
  } else {
    const base = 2.0 + Math.random() * 3.5;
    p.size = 1.1 + Math.random() * 1.0;
    p.vx = Math.cos(windAngle) * base;
    p.vy = Math.sin(windAngle) * base + 7 + Math.random() * 6;
    p.opacity = 0.2 + Math.random() * 0.35;
  }
}

export function WeatherScene({ condition, windKmh }: { condition: WeatherCondition; windKmh: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  const precipType = useMemo(() => choosePrecipType(condition), [condition]);
  const modifiers = useMemo<Modifiers>(
    () => ({ isWindy: windKmh >= 40 || condition === 'wind', isCold: condition === 'cold' }),
    [windKmh, condition],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    const windAngle = modifiers.isWindy ? Math.PI * 0.58 : Math.PI * 0.5; // tilt if windy
    const precipCount = precipType === 'snow' ? 120 : 170;

    const particles: Particle[] = precipType === 'none'
      ? []
      : Array.from({ length: precipCount }, () => {
          const p = {} as Particle;
          initParticle(p, canvas.clientWidth, canvas.clientHeight, precipType, windAngle, true);
          return p;
        });

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Cloud layer (CSS-like, but drawn for subtle motion)
      if (condition === 'cloudy' || condition === 'partly-cloudy' || condition === 'fog') {
        const t = Date.now() * 0.00002;
        ctx.globalAlpha = condition === 'fog' ? 0.18 : 0.12;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 6; i++) {
          const x = ((t * 600 + i * 220) % (w + 260)) - 260;
          const y = 60 + i * 50;
          const r = 80 + (i % 3) * 20;
          ctx.beginPath();
          ctx.ellipse(x, y, r * 1.2, r * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Sun shimmer on clear/hot
      if (condition === 'clear' || condition === 'hot') {
        const t = Date.now() * 0.001;
        const pulse = 0.12 + 0.06 * Math.sin(t * 1.2);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.22, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Precip particles
      if (precipType !== 'none') {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.y > h + 12 || p.x < -20 || p.x > w + 20) {
            initParticle(p, w, h, precipType, windAngle);
          }

          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = precipType === 'snow' ? '#ffffff' : '#7fb7ff';

          if (precipType === 'snow') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(p.x, p.y, p.size, p.size * 7);
          }
        }
        ctx.globalAlpha = 1;
      }

      // Wind streaks
      if (condition === 'wind') {
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const t = Date.now() * 0.002;
        for (let i = 0; i < 8; i++) {
          const y = 80 + i * 55;
          const x = ((t * 260 + i * 120) % (w + 180)) - 180;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 60, y - 10, x + 140, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [precipType, modifiers.isWindy, condition]);

  // Render canvas always, since we draw clouds/sun/wind too.
  return <canvas ref={canvasRef} className="scene" aria-hidden="true" />;
}
