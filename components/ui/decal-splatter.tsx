import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DecalSplatterProps {
  color?: string;
  size?: number;
  count?: number;
  className?: string;
  spread?: number;
  rotation?: number;
}

export const DecalSplatter: React.FC<DecalSplatterProps> = ({
  color = '#ff0000',
  size = 100,
  count = 5,
  className,
  spread = 20,
  rotation = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous splatters
    containerRef.current.innerHTML = '';

    // Create new splatters
    for (let i = 0; i < count; i++) {
      const splatter = document.createElement('div');
      const randomSize = size * (0.5 + Math.random() * 0.5);
      const randomX = (Math.random() - 0.5) * spread;
      const randomY = (Math.random() - 0.5) * spread;
      const randomRotation = rotation + (Math.random() - 0.5) * 45;

      splatter.style.cssText = `
        position: absolute;
        width: ${randomSize}px;
        height: ${randomSize}px;
        background: ${color};
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        transform: translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg);
        opacity: 0.8;
        filter: blur(1px);
        mix-blend-mode: multiply;
      `;

      containerRef.current.appendChild(splatter);
    }
  }, [color, size, count, spread, rotation]);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    />
  );
}; 