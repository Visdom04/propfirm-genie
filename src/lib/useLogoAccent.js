'use client';

import { useEffect, useState } from 'react';

const FALLBACK = '#16a34a';

function rgbToHex(r, g, b) {
  const h = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function parseHex(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function mixHex(hex, toward, t) {
  const a = parseHex(hex);
  const b = toward === 'white' ? { r: 255, g: 255, b: 255 } : { r: 8, g: 18, b: 14 };
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

/** Soften a logo color for card chrome so it never reads as neon. */
export function chromeAccent(hex) {
  const { r, g, b } = parseHex(hex);
  const avg = (r + g + b) / 3;
  const t = 0.42;
  return mixHex(rgbToHex(r + (avg - r) * t, g + (avg - g) * t, b + (avg - b) * t), 'black', 0.12);
}

export function luminance(hex) {
  const { r, g, b } = parseHex(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function ctaStyle(accent) {
  const dark = mixHex(accent, 'black', 0.28);
  const light = mixHex(accent, 'white', 0.14);
  const ink = luminance(accent) > 0.62 ? '#052e16' : '#f8fafc';
  return {
    background: `linear-gradient(135deg, ${dark} 0%, ${accent} 52%, ${light} 100%)`,
    color: ink,
  };
}

/** Average saturated pixels from a same-origin firm logo. */
export function useLogoAccent(src) {
  const [accent, setAccent] = useState(FALLBACK);

  useEffect(() => {
    if (!src) {
      setAccent(FALLBACK);
      return undefined;
    }
    let dead = false;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 24, 24);
        const { data } = ctx.getImageData(0, 0, 24, 24);
        let r = 0;
        let g = 0;
        let b = 0;
        let w = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 80) continue;
          const rr = data[i];
          const gg = data[i + 1];
          const bb = data[i + 2];
          const max = Math.max(rr, gg, bb);
          const min = Math.min(rr, gg, bb);
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = (rr + gg + bb) / 3;
          // Skip logo chrome (near-white marks, near-black pads) so the brand midtone remains.
          if (lum > 228 || lum < 42) continue;
          const wt = 0.25 + sat * 2.4 + (lum > 70 && lum < 190 ? 0.55 : 0);
          r += rr * wt;
          g += gg * wt;
          b += bb * wt;
          w += wt;
        }
        if (!dead && w) setAccent(rgbToHex(r / w, g / w, b / w));
      } catch {
        if (!dead) setAccent(FALLBACK);
      }
    };
    img.onerror = () => {
      if (!dead) setAccent(FALLBACK);
    };
    img.src = src;
    return () => {
      dead = true;
    };
  }, [src]);

  return accent;
}
