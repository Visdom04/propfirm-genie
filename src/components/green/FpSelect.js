'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import FpMiniCal from './FpMiniCal';

function useMenuBox(open, btn, minBelow = 280) {
  const [box, setBox] = useState(null);

  useLayoutEffect(() => {
    if (!open || !btn.current) return undefined;
    function place() {
      const r = btn.current.getBoundingClientRect();
      const pad = 8;
      const width = Math.min(Math.max(r.width, 220), window.innerWidth - pad * 2);
      let left = Math.min(Math.max(pad, r.left), window.innerWidth - width - pad);
      const below = window.innerHeight - r.bottom;
      const openUp = below < minBelow && r.top > below + 40;
      setBox({
        width,
        left,
        top: openUp ? undefined : r.bottom + 6,
        bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
        maxHeight: Math.max(160, openUp ? r.top - pad : below - pad),
      });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, btn, minBelow]);

  return box;
}

export default function FpSelect({ value, options, onChange, ariaLabel, logo, footer, menuClass }) {
  const root = useRef(null);
  const menu = useRef(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const current = options.find(item => item.id === value) || options[0];
  const box = useMenuBox(open, root);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    function onPtr(event) {
      if (root.current?.contains(event.target) || menu.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPtr);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPtr);
    };
  }, [open]);

  const panel =
    open && ready && box
      ? createPortal(
          <div
            ref={menu}
            className={`fp-select-menu${menuClass ? ` ${menuClass}` : ''}`}
            style={{
              top: box.top,
              bottom: box.bottom,
              left: box.left,
              width: menuClass === 'is-cal' ? Math.max(box.width, 292) : box.width,
              maxHeight: box.maxHeight,
            }}
          >
            <ul role="listbox" aria-label={ariaLabel}>
              {options.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    className="fp-select-opt btn-bare"
                    aria-selected={item.id === value}
                    onClick={() => {
                      onChange(item.id);
                      if (!item.stay) setOpen(false);
                    }}
                  >
                    {logo && item.logo ? <img src={item.logo} alt="" width={28} height={28} className="fp-logo" /> : null}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            {typeof footer === 'function' ? footer(() => setOpen(false)) : footer}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="fp-select" ref={root}>
      <button
        type="button"
        className="fp-select-btn btn-bare"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${ariaLabel}: ${current?.label || 'Select'}`}
        onClick={() => setOpen(current => !current)}
      >
        {logo && current?.logo ? <img src={current.logo} alt="" width={20} height={20} className="fp-logo" /> : null}
        <span>{current?.label || 'Select'}</span>
        <b aria-hidden>▾</b>
      </button>
      {panel}
    </div>
  );
}

export function FpDateSelect({ range, day, ranges, onRange, onPick, onClear }) {
  const root = useRef(null);
  const menu = useRef(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const box = useMenuBox(open, root, 420);
  const label = day || ranges.find(item => item.id === range)?.label || 'Dates';

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    function onPtr(event) {
      if (root.current?.contains(event.target) || menu.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPtr);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPtr);
    };
  }, [open]);

  const panel =
    open && ready && box
      ? createPortal(
          <div
            ref={menu}
            className="fp-select-menu is-cal"
            role="dialog"
            aria-label="Dates"
            style={{
              top: box.top,
              bottom: box.bottom,
              left: Math.min(box.left, window.innerWidth - 300),
              width: 292,
              maxHeight: box.maxHeight,
            }}
          >
            <div className="fp-date-chips" role="group" aria-label="Time range">
              {ranges.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="fp-chip btn-bare"
                  aria-pressed={range === item.id && !day}
                  onClick={() => {
                    onRange(item.id);
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <FpMiniCal
              variant="embed"
              value={day}
              onPick={key => {
                onPick(key);
                setOpen(false);
              }}
              onClear={() => {
                onClear();
                setOpen(false);
              }}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="fp-select" ref={root}>
      <button
        type="button"
        className="fp-select-btn btn-bare"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Dates: ${label}`}
        onClick={() => setOpen(current => !current)}
      >
        <span>{label}</span>
        <b aria-hidden>▾</b>
      </button>
      {panel}
    </div>
  );
}
