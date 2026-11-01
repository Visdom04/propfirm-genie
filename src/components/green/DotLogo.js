'use client';

import { useEffect, useRef, useState } from 'react';

const GRID = 34;
const SIZE = 240;
const HI = 192;

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle(list, seed) {
  const out = list.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function loadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const lumOf = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// Turn a logo into halftone cells: find the tile background from an inset ring
// (rounded corners are transparent, so pixel 0,0 lies), keep what differs from
// it, crop to the mark, and size each dot by how much of its cell is mark.
function sampleCells(img, initials) {
  const c = document.createElement('canvas');
  c.width = HI;
  c.height = HI;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  let rect = { x: 0, y: 0, w: HI, h: HI };
  if (img) {
    const k = Math.min(HI / img.width, HI / img.height);
    rect = { w: img.width * k, h: img.height * k };
    rect.x = (HI - rect.w) / 2;
    rect.y = (HI - rect.h) / 2;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${HI * 0.5}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, HI / 2, HI / 2 + 2);
  }
  let px;
  try {
    px = ctx.getImageData(0, 0, HI, HI).data;
  } catch {
    return null;
  }

  // Background: the dominant opaque colour on a ring 10% inside the drawn logo.
  const inset = Math.round(Math.min(rect.w, rect.h) * 0.1);
  const x0 = Math.round(rect.x) + inset;
  const y0 = Math.round(rect.y) + inset;
  const x1 = Math.round(rect.x + rect.w) - inset - 1;
  const y1 = Math.round(rect.y + rect.h) - inset - 1;
  const buckets = new Map();
  let ring = 0;
  const vote = (x, y) => {
    ring++;
    const i = (y * HI + x) * 4;
    if (px[i + 3] < 200) return;
    const key = ((px[i] >> 5) << 6) | ((px[i + 1] >> 5) << 3) | (px[i + 2] >> 5);
    const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++;
    b.r += px[i];
    b.g += px[i + 1];
    b.b += px[i + 2];
    buckets.set(key, b);
  };
  for (let x = x0; x <= x1; x++) {
    vote(x, y0);
    vote(x, y1);
  }
  for (let y = y0 + 1; y < y1; y++) {
    vote(x0, y);
    vote(x1, y);
  }
  let top = null;
  for (const b of buckets.values()) if (!top || b.n > top.n) top = b;
  const bg = top && top.n > ring * 0.5 ? [top.r / top.n, top.g / top.n, top.b / top.n] : null;

  // Ink per pixel, 0..1.
  const ink = new Float32Array(HI * HI);
  let minX = HI;
  let minY = HI;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < HI; y++) {
    for (let x = 0; x < HI; x++) {
      const i = (y * HI + x) * 4;
      let v = px[i + 3] / 255;
      if (bg && v > 0) {
        const d = Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]);
        v *= Math.min(1, Math.max(0, (d - 48) / 96));
      }
      ink[y * HI + x] = v;
      if (v > 0.5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  // Dark marks on a coloured tile take the tile's colour, so the brand survives.
  const bgSat = bg ? Math.max(...bg) - Math.min(...bg) : 0;
  const darkInk = bg && lumOf(...bg) > 0.2 && bgSat > 60 ? `rgb(${bg.map(Math.round).join(' ')})` : '#eef6f2';

  // Crop to the mark and lay a square grid over it, one cell of padding.
  const spanX = maxX - minX + 1;
  const spanY = maxY - minY + 1;
  const step = Math.max(spanX, spanY) / (GRID - 2);
  const cols = Math.ceil(spanX / step) + 2;
  const rows = Math.ceil(spanY / step) + 2;
  const cx = (minX + maxX + 1) / 2;
  const cy = (minY + maxY + 1) / 2;
  const cells = [];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const sx = cx + (gx - cols / 2) * step;
      const sy = cy + (gy - rows / 2) * step;
      let sum = 0;
      let n = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let y = Math.floor(sy); y < Math.ceil(sy + step); y++) {
        for (let x = Math.floor(sx); x < Math.ceil(sx + step); x++) {
          n++;
          if (x < 0 || y < 0 || x >= HI || y >= HI) continue;
          const v = ink[y * HI + x];
          if (!v) continue;
          const i = (y * HI + x) * 4;
          sum += v;
          r += px[i] * v;
          g += px[i + 1] * v;
          b += px[i + 2] * v;
        }
      }
      const cov = n ? sum / n : 0;
      if (cov < 0.14) continue;
      const [cr, cg, cb] = [r / sum, g / sum, b / sum];
      const color = lumOf(cr, cg, cb) < 0.28 ? darkInk : `rgb(${Math.round(cr)} ${Math.round(cg)} ${Math.round(cb)})`;
      cells.push({ x: gx, y: gy, cov: Math.min(1, cov), color });
    }
  }
  return cells.length > 12 ? { cells, cols, rows } : null;
}

/**
 * The firm's logo drawn as a field of dots. Each lit dot stands for one
 * payout (or `per` payouts when there are more payouts than dots).
 */
export default function DotLogo({ src, initials, seed, count, when }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ dots: null, lit: 0, run: null });
  const [cells, setCells] = useState(0);

  useEffect(() => {
    let alive = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = SIZE;
    let H = SIZE;
    let radius = 0;
    const st = stateRef.current;
    const pointer = { x: -1e4, y: -1e4, in: false };
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const d of st.dots) {
        if (d.a < 0.01) continue;
        ctx.globalAlpha = d.a;
        ctx.fillStyle = d.on ? d.color : 'rgb(160 240 205)';
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius * d.r * (d.on ? 1 : 0.8), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const step = () => {
      let moving = false;
      for (const d of st.dots) {
        let fx = (d.hx - d.x) * 0.06;
        let fy = (d.hy - d.y) * 0.06;
        if (pointer.in) {
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 44 && dist > 0.01) {
            const push = ((44 - dist) / 44) * 2.4;
            fx += (dx / dist) * push;
            fy += (dy / dist) * push;
          }
        }
        d.vx = (d.vx + fx) * 0.8;
        d.vy = (d.vy + fy) * 0.8;
        d.x += d.vx;
        d.y += d.vy;
        const target = d.on ? 1 : 0.14;
        d.a += (target - d.a) * 0.12;
        if (Math.abs(d.vx) + Math.abs(d.vy) > 0.02 || Math.abs(target - d.a) > 0.01 || Math.hypot(d.hx - d.x, d.hy - d.y) > 0.3) moving = true;
      }
      draw();
      raf = moving || pointer.in ? requestAnimationFrame(step) : 0;
    };

    const wake = () => {
      if (still) {
        for (const d of st.dots) {
          d.x = d.hx;
          d.y = d.hy;
          d.a = d.on ? 1 : 0.14;
        }
        draw();
      } else if (!raf) {
        raf = requestAnimationFrame(step);
      }
    };

    // Light `n` dots. Newly lit dots fly in from outside the logo.
    st.run = n => {
      if (!st.dots) return;
      const total = st.dots.length;
      const target = Math.min(total, n);
      st.dots.forEach((d, i) => {
        const on = i < target;
        if (on && !d.on) {
          const ang = (hash(`${seed}${i}`) % 628) / 100;
          const far = SIZE * (0.7 + (i % 7) * 0.05);
          d.x = W / 2 + Math.cos(ang) * far;
          d.y = H / 2 + Math.sin(ang) * far;
          d.vx = 0;
          d.vy = 0;
          d.a = 0.6;
        }
        d.on = on;
      });
      st.lit = target;
      wake();
    };

    const move = e => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * W;
      pointer.y = ((e.clientY - r.top) / r.height) * H;
      pointer.in = true;
      if (!still && !raf) raf = requestAnimationFrame(step);
    };
    const leave = () => {
      pointer.in = false;
    };

    Promise.all([loadImage(src)]).then(([img]) => {
      if (!alive) return;
      const grid = sampleCells(img, initials) || sampleCells(null, initials) || { cells: [], cols: GRID, rows: GRID };
      const cell = SIZE / Math.max(grid.cols, grid.rows);
      W = grid.cols * cell;
      H = grid.rows * cell;
      radius = cell * 0.5;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.dots = shuffle(grid.cells, hash(String(seed))).map(c => {
        const hx = (c.x + 0.5) * cell;
        const hy = (c.y + 0.5) * cell;
        return { hx, hy, x: hx, y: hy, vx: 0, vy: 0, a: 0, on: false, color: c.color, r: 0.35 + 0.65 * Math.sqrt(c.cov) };
      });
      setCells(st.dots.length);
    });

    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      st.run = null;
    };
  }, [src, initials, seed]);

  // Light one dot per payout, scaled down when payouts outnumber dots.
  const per = cells && count > cells ? Math.ceil(count / cells) : 1;
  const lit = Math.ceil(count / per);
  useEffect(() => {
    if (cells) stateRef.current.run?.(lit);
  }, [cells, lit]);

  return (
    <figure className="po-dots">
      <canvas ref={canvasRef} className="po-dots-canvas" role="img" aria-label={`Logo drawn from ${count} payouts`} />
      <figcaption>
        {per === 1 ? 'Each dot is one payout' : `Each dot is ${per.toLocaleString('en-US')} payouts`} {when}
      </figcaption>
    </figure>
  );
}
