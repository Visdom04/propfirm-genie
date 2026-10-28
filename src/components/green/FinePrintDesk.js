'use client';

import { useEffect, useMemo, useState } from 'react';
import { KIND_LABEL } from '@/lib/fineprint/catalog';
import {
  coverPages,
  defaultShown,
  emptyCover,
  loadCoverage,
  saveCoverage,
  subscribeCoverage,
} from '@/lib/fineprint/coverage';
import { deskToChange, emptyDeskItem, loadDesk, saveDesk, subscribeDesk } from '@/lib/fineprint/desk';
import FpMiniCal from './FpMiniCal';
import FpSelect from './FpSelect';
import './fineprint.css';

const KINDS = [
  { id: 'rules', label: 'Rules' },
  { id: 'pricing', label: 'Price' },
  { id: 'payouts', label: 'Payouts' },
];

const MARKETS = [
  { id: 'futures', label: 'Futures' },
  { id: 'crypto', label: 'Perp' },
];

const VERDICTS = [
  { id: '', label: 'None' },
  { id: 'good', label: 'Good for traders' },
  { id: 'worse', label: 'Worse for traders' },
];

const TABS = [
  { id: 'desk', label: 'Updates' },
  { id: 'cover', label: 'Coverage' },
];

export default function FinePrintDesk({ firms, logos = {} }) {
  const [tab, setTab] = useState('desk');
  const [items, setItems] = useState([]);
  const [cover, setCover] = useState(emptyCover);
  const [edit, setEdit] = useState(() => emptyDeskItem(firms));
  const [kill, setKill] = useState(null);
  const [fresh, setFresh] = useState({ firm: '', market: 'futures', logo: '' });

  useEffect(() => {
    document.documentElement.classList.add('fp-thin-root');
    return () => document.documentElement.classList.remove('fp-thin-root');
  }, []);

  useEffect(() => {
    setItems(loadDesk());
    return subscribeDesk(setItems);
  }, []);

  useEffect(() => {
    setCover(loadCoverage());
    return subscribeCoverage(setCover);
  }, []);

  const extraLogos = useMemo(
    () => Object.fromEntries((cover.extra || []).filter(item => item.logo).map(item => [item.firm, item.logo])),
    [cover.extra],
  );
  const marks = { ...logos, ...extraLogos };
  const roster = [...new Set([...firms, ...coverPages(cover).map(item => item.firm)])];
  const shown = cover.shown?.length ? cover.shown : defaultShown();
  const published = items.filter(item => item.status === 'published').length;

  function persist(next) {
    saveDesk(next);
    setItems(next);
  }

  function persistCover(next) {
    saveCoverage(next);
    setCover(next);
  }

  function submit(status) {
    if (!edit.firm || !edit.label.trim()) return;
    const row = { ...edit, status };
    const exists = items.some(item => item.id === row.id);
    persist(exists ? items.map(item => (item.id === row.id ? row : item)) : [row, ...items]);
    setEdit(emptyDeskItem(roster));
  }

  function loadRow(item) {
    setEdit({ ...emptyDeskItem(roster), ...item });
  }

  function remove(id) {
    persist(items.filter(row => row.id !== id));
    if (edit.id === id) setEdit(emptyDeskItem(roster));
    setKill(null);
  }

  function toggleFirm(name) {
    const on = shown.includes(name);
    persistCover({
      ...cover,
      shown: on ? shown.filter(item => item !== name) : [...shown, name],
    });
  }

  function addFirm(event) {
    event.preventDefault();
    const name = fresh.firm.trim();
    if (!name) return;
    if (roster.includes(name)) {
      persistCover({ ...cover, shown: shown.includes(name) ? shown : [...shown, name] });
      setFresh({ firm: '', market: 'futures', logo: '' });
      return;
    }
    persistCover({
      extra: [...cover.extra, { id: `cover-${Date.now()}`, firm: name, market: fresh.market, logo: fresh.logo }],
      shown: [...shown, name],
    });
    setFresh({ firm: '', market: 'futures', logo: '' });
  }

  function dropExtra(firm) {
    persistCover({
      extra: cover.extra.filter(item => item.firm !== firm),
      shown: shown.filter(item => item !== firm),
    });
  }

  function readLogo(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFresh(current => ({ ...current, logo: String(reader.result || '') }));
    reader.readAsDataURL(file);
  }

  const preview = useMemo(() => (edit.label ? deskToChange(edit) : null), [edit]);

  return (
    <div className="fp fp-desk">
      <header className="fp-desk-head">
        <div>
          <p className="fp-inspect-kicker">News desk</p>
          <h1 className="fp-h2">Manual updates</h1>
        </div>
        <p className="fp-desk-count">
          {published} live · {items.length - published} draft
        </p>
      </header>

      <div className="fp-lanes" role="tablist" aria-label="Desk sections">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className="fp-lane-tab btn-bare"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'cover' ? (
        <section className="fp-cover-admin" aria-label="Coverage">
          <ul className="fp-cover-list">
            {coverPages(cover).map(item => (
              <li key={item.firm}>
                <label className="fp-cover-row">
                  <input type="checkbox" checked={shown.includes(item.firm)} onChange={() => toggleFirm(item.firm)} />
                  {marks[item.firm] ? (
                    <img src={marks[item.firm]} alt="" width={36} height={36} className="fp-logo" />
                  ) : (
                    <span className="fp-logo is-fallback grid place-items-center font-bold">
                      {String(item.firm).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span>
                    <b>{item.firm}</b>
                    <small>{item.market}</small>
                  </span>
                </label>
                {cover.extra.some(row => row.firm === item.firm) ? (
                  <button type="button" className="fp-desk-del btn-bare" onClick={() => dropExtra(item.firm)}>
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <form className="fp-desk-form" onSubmit={addFirm}>
            <label>
              New firm
              <input
                value={fresh.firm}
                onChange={event => setFresh(current => ({ ...current, firm: event.target.value }))}
                placeholder="Firm name"
                required
              />
            </label>
            <label>
              Market
              <FpSelect
                ariaLabel="Market"
                value={fresh.market}
                options={MARKETS}
                onChange={value => setFresh(current => ({ ...current, market: value }))}
              />
            </label>
            <label className="fp-desk-wide">
              Logo URL
              <input
                value={fresh.logo.startsWith('data:') ? '' : fresh.logo}
                onChange={event => setFresh(current => ({ ...current, logo: event.target.value }))}
                placeholder="https://"
              />
            </label>
            <label className="fp-desk-wide">
              Logo file
              <span className="fp-file">
                <span className="fp-file-btn">{fresh.logo.startsWith('data:') ? 'Image chosen' : 'Choose image'}</span>
                <input className="sr-only" type="file" accept="image/*" onChange={event => readLogo(event.target.files?.[0])} />
              </span>
            </label>
            {fresh.logo ? <img src={fresh.logo} alt="" width={36} height={36} className="fp-logo" /> : null}
            <div className="fp-desk-actions">
              <button type="submit" className="fp-page btn-bare" aria-current="page">
                Add firm
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <form
            className="fp-desk-form"
            onSubmit={event => {
              event.preventDefault();
              submit('draft');
            }}
          >
            <label>
              Firm
              <FpSelect
                ariaLabel="Firm"
                logo
                value={edit.firm}
                options={roster.map(name => ({ id: name, label: name, logo: marks[name] }))}
                onChange={value => setEdit(current => ({ ...current, firm: value }))}
              />
            </label>
            <label>
              Product
              <input
                value={edit.product}
                onChange={event => setEdit(current => ({ ...current, product: event.target.value }))}
                placeholder="LucidPro"
              />
            </label>
            <label>
              Market
              <FpSelect
                ariaLabel="Market"
                value={edit.market}
                options={MARKETS}
                onChange={value => setEdit(current => ({ ...current, market: value }))}
              />
            </label>
            <label>
              Kind
              <FpSelect
                ariaLabel="Kind"
                value={edit.kind}
                options={KINDS}
                onChange={value => setEdit(current => ({ ...current, kind: value }))}
              />
            </label>
            <label>
              Date
              <FpMiniCal
                variant="field"
                value={edit.date}
                onPick={value => setEdit(current => ({ ...current, date: value }))}
                onClear={() => setEdit(current => ({ ...current, date: new Date().toISOString().slice(0, 10) }))}
              />
            </label>
            <label>
              For traders
              <FpSelect
                ariaLabel="For traders"
                value={edit.verdict}
                options={VERDICTS}
                onChange={value => setEdit(current => ({ ...current, verdict: value }))}
              />
            </label>
            <label className="fp-desk-wide">
              Headline
              <input
                value={edit.title}
                onChange={event => setEdit(current => ({ ...current, title: event.target.value }))}
                placeholder="Optional card title"
              />
            </label>
            <label className="fp-desk-wide">
              What changed
              <input
                value={edit.label}
                onChange={event => setEdit(current => ({ ...current, label: event.target.value }))}
                placeholder="Daily loss limit"
                required
              />
            </label>
            <label>
              Previous
              <input
                value={edit.before}
                onChange={event => setEdit(current => ({ ...current, before: event.target.value }))}
                placeholder="$1,200"
              />
            </label>
            <label>
              Current
              <input
                value={edit.after}
                onChange={event => setEdit(current => ({ ...current, after: event.target.value }))}
                placeholder="$1,000"
              />
            </label>
            <label className="fp-desk-wide">
              Notes
              <input
                value={edit.notes}
                onChange={event => setEdit(current => ({ ...current, notes: event.target.value }))}
                placeholder="Internal note"
              />
            </label>
            <label className="fp-desk-wide">
              Source URL
              <input
                value={edit.sourceUrl}
                onChange={event => setEdit(current => ({ ...current, sourceUrl: event.target.value }))}
                placeholder="https://"
              />
            </label>
            <label className="fp-desk-check">
              <input
                type="checkbox"
                checked={Boolean(edit.demo)}
                onChange={event => setEdit(current => ({ ...current, demo: event.target.checked }))}
              />
              Mark as demo
            </label>
            <div className="fp-desk-actions">
              <button type="button" className="fp-reset btn-bare" onClick={() => setEdit(emptyDeskItem(roster))}>
                New
              </button>
              <button type="submit" className="fp-reset btn-bare">
                Save draft
              </button>
              <button type="button" className="fp-page btn-bare" aria-current="page" onClick={() => submit('published')}>
                Publish
              </button>
            </div>
          </form>

          {preview ? (
            <p className="fp-sub">
              {preview.firm} · {KIND_LABEL[preview.kind] || preview.kind} · {preview.facts[0].before || '—'} →{' '}
              {preview.facts[0].after || '—'}
            </p>
          ) : null}

          <ul className="fp-desk-list">
            {items.length === 0 ? <li className="fp-empty">No desk items yet.</li> : null}
            {items.map(item => (
              <li key={item.id}>
                <button type="button" className="fp-watch-item btn-bare" onClick={() => loadRow(item)}>
                  {marks[item.firm] ? (
                    <img src={marks[item.firm]} alt="" width={36} height={36} className="fp-logo" />
                  ) : (
                    <span className="fp-logo is-fallback grid place-items-center font-bold">
                      {String(item.firm || '?').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span>
                    <b>
                      {item.firm} · {item.label || 'Untitled'}
                    </b>
                    <small>
                      {item.date} · {item.status}
                      {item.demo ? ' · demo' : ''}
                    </small>
                  </span>
                </button>
                <div className="fp-desk-row-ops">
                  <button
                    type="button"
                    className="fp-reset btn-bare"
                    onClick={() =>
                      persist(
                        items.map(row =>
                          row.id === item.id ? { ...row, status: row.status === 'published' ? 'draft' : 'published' } : row,
                        ),
                      )
                    }
                  >
                    {item.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  {kill === item.id ? (
                    <>
                      <button type="button" className="fp-desk-del btn-bare" onClick={() => remove(item.id)}>
                        Confirm
                      </button>
                      <button type="button" className="fp-reset btn-bare" onClick={() => setKill(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" className="fp-desk-del btn-bare" onClick={() => setKill(item.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
