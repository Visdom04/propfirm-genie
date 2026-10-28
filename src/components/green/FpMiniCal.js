'use client';

import { useEffect, useRef, useState } from 'react';

function utcMonth(date = new Date()) {
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() };
}

function shiftMonth(cursor, dir) {
  const next = new Date(Date.UTC(cursor.y, cursor.m + dir, 1));
  return utcMonth(next);
}

function cells(cursor) {
  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const pad = (first.getUTCDay() + 6) % 7;
  const last = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const out = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= last; day += 1) {
    out.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (out.length % 7) out.push(null);
  return out;
}

export default function FpMiniCal({ value, onPick, onClear, variant = 'chip' }) {
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    if (value) return { y: Number(value.slice(0, 4)), m: Number(value.slice(5, 7)) - 1 };
    return utcMonth();
  });

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    function onPtr(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPtr);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPtr);
    };
  }, [open]);

  const label = value || (variant === 'field' ? 'Pick date' : 'Custom');
  const triggerClass = variant === 'field' ? 'fp-mini-field btn-bare' : 'fp-chip btn-bare';
  const panel = (
    <CalPanel
      compact={variant === 'embed'}
      cursor={cursor}
      setCursor={setCursor}
      value={value}
      onPick={key => {
        onPick(key);
        setOpen(false);
      }}
      onClear={() => {
        onClear?.();
        setOpen(false);
      }}
    />
  );

  if (variant === 'embed') {
    return <div className="fp-mini-embed">{panel}</div>;
  }

  return (
    <div className={`fp-mini${variant === 'field' ? ' is-field' : ''}`} ref={root}>
      <button
        type="button"
        className={triggerClass}
        aria-pressed={Boolean(value)}
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        {label}
      </button>
      {open ? (
        <div className="fp-mini-pop" role="dialog" aria-label="Pick date">
          {panel}
        </div>
      ) : null}
    </div>
  );
}

function CalPanel({ cursor, setCursor, value, onPick, onClear, compact }) {
  const month = new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return (
    <>
      <div className="fp-mini-nav">
        <button type="button" className="fp-icon-btn btn-bare" aria-label="Previous month" onClick={() => setCursor(c => shiftMonth(c, -1))}>
          ‹
        </button>
        <p>{month}</p>
        <button type="button" className="fp-icon-btn btn-bare" aria-label="Next month" onClick={() => setCursor(c => shiftMonth(c, 1))}>
          ›
        </button>
      </div>
      <div className="fp-mini-week" aria-hidden>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="fp-mini-grid">
        {cells(cursor).map((key, index) =>
          key ? (
            <button
              key={key}
              type="button"
              className={`fp-mini-day btn-bare${value === key ? ' is-on' : ''}`}
              onClick={() => onPick(key)}
            >
              {Number(key.slice(8))}
            </button>
          ) : (
            <span key={`e-${index}`} />
          ),
        )}
      </div>
      <div className="fp-mini-foot">
        <button type="button" className="fp-reset btn-bare" onClick={() => onClear?.()}>
          Clear
        </button>
        {compact ? null : (
          <button
            type="button"
            className="fp-reset btn-bare"
            onClick={() => onPick(new Date().toISOString().slice(0, 10))}
          >
            Today
          </button>
        )}
      </div>
    </>
  );
}
