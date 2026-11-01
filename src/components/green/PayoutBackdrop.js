'use client';

import { useEffect, useRef } from 'react';

/** Dot-grid backdrop. A soft light follows the cursor and lights the dots under it. */
export default function PayoutBackdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let x = innerWidth / 2;
    let y = innerHeight / 3;
    let tx = x;
    let ty = y;
    let raf = 0;

    const paint = () => {
      el.style.setProperty('--mx', `${x.toFixed(1)}px`);
      el.style.setProperty('--my', `${y.toFixed(1)}px`);
    };
    const tick = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      paint();
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(tick) : 0;
    };
    const move = e => {
      tx = e.clientX;
      ty = e.clientY;
      el.dataset.on = '';
      if (still) {
        x = tx;
        y = ty;
        paint();
      } else if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };
    const leave = () => {
      delete el.dataset.on;
    };

    paint();
    addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div ref={ref} className="po-bg" aria-hidden>
      <i className="po-bg-dots" />
      <i className="po-bg-glow" />
      <i className="po-bg-lit" />
    </div>
  );
}
