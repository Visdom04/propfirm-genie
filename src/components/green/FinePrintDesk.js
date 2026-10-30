'use client';

import { useEffect, useMemo, useState } from 'react';
import { KIND_LABEL } from '@/lib/fineprint/catalog';
import { coverPages, defaultShown } from '@/lib/fineprint/coverage';
import { changeToDeskItem, emptyDeskItem } from '@/lib/fineprint/desk';
import { suggestVerdict, verdictOf } from '@/lib/fineprint/terms';
import FpMiniCal from './FpMiniCal';
import './fineprint.css';
import './ops-admin.css';

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
  { id: 'better', label: 'Better for traders' },
  { id: 'worse', label: 'Worse for traders' },
  { id: 'unscored', label: 'Changed (not scored)' },
];

const TABS = [
  { id: 'published', label: 'Published' },
  { id: 'manual', label: 'Manual entry' },
  { id: 'health', label: 'Watch health' },
  { id: 'coverage', label: 'Coverage' },
];

const SHOWN = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Live' },
  { id: 'hidden', label: 'Hidden' },
];

// States from scripts/fineprint-starter.mjs, grouped for the health tab.
const HEALTH = {
  baseline: ['ok', 'First copy saved'],
  unchanged: ['ok', 'Unchanged'],
  noise: ['ok', 'Changed, nothing to publish'],
  posted: ['ok', 'Published a change'],
  pending: ['wait', 'Waiting for 2nd check'],
  blocked: ['bad', 'Blocked'],
  incomplete: ['bad', 'Cut short'],
  maintenance: ['bad', 'Maintenance page'],
  robots_disallowed: ['bad', 'Site asks bots not to read it'],
  waiting_for_rules_url: ['wait', 'No URL yet'],
};

const VERDICT_TONE = { better: 'is-ok', worse: 'is-bad', unscored: '' };

function withUnit(value, unit) {
  if (!value) return '—';
  return unit === 'days' || unit === 'contracts' ? `${value} ${unit}` : value;
}

function day(iso) {
  return iso ? String(iso).slice(0, 10) : '—';
}

export default function FinePrintDesk({ firms, logos = {}, queue = [], cover: initialCover, watch, unwatchable = [], mode, admin }) {
  const [tab, setTab] = useState('published');
  const [log, setLog] = useState(queue);
  const [cover, setCover] = useState(initialCover);
  const [shownFilter, setShownFilter] = useState('all');
  const [edit, setEdit] = useState(null);
  const [draft, setDraft] = useState(() => ({ ...emptyDeskItem(firms), verdict: 'unscored' }));
  const [fresh, setFresh] = useState({ firm: '', market: 'futures', logo: '' });
  const [kill, setKill] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    document.documentElement.classList.add('ops-root');
    return () => document.documentElement.classList.remove('ops-root');
  }, []);

  const roster = useMemo(() => [...new Set([...firms, ...coverPages(cover).map(item => item.firm)])], [firms, cover]);
  const shown = cover.shown?.length ? cover.shown : defaultShown();
  const marks = { ...logos, ...Object.fromEntries((cover.extra || []).filter(item => item.logo).map(item => [item.firm, item.logo])) };
  const live = log.filter(item => !item.demo && item.status === 'published').length;
  const hidden = log.filter(item => item.status === 'hidden').length;
  const trending = log.filter(item => item.trending && item.status === 'published').length;

  async function call(method, url, body) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `Request failed (${res.status}).`);
      if (json.changes) setLog(json.changes);
      if (json.cover) setCover(json.cover);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    const base = log.find(item => item.id === edit.id);
    const fact = { ...(base.facts?.[0] || {}), label: edit.label, before: edit.before, after: edit.after, verdict: edit.verdict };
    const ok = await call('PATCH', '/api/fineprint/changes', {
      id: edit.id,
      facts: [fact, ...(base.facts || []).slice(1)],
      summary: edit.notes,
      sourceUrl: edit.sourceUrl,
      trending: Boolean(edit.trending),
    });
    if (ok) setEdit(null);
  }

  async function addManual(event) {
    event.preventDefault();
    const ok = await call('POST', '/api/fineprint/changes', draft);
    if (ok) {
      setDraft({ ...emptyDeskItem(roster), verdict: 'unscored' });
      setTab('published');
    }
  }

  function setDraftField(key, value) {
    setDraft(current => {
      const next = { ...current, [key]: value };
      if (['label', 'before', 'after'].includes(key) && !current.verdictTouched) {
        next.verdict = suggestVerdict(next.label, next.before, next.after);
      }
      return next;
    });
  }

  async function addFirm(event) {
    event.preventDefault();
    const name = fresh.firm.trim();
    if (!name) return;
    const ok = await call('PATCH', '/api/fineprint/coverage', { firm: name, market: fresh.market, logo: fresh.logo, shown: true });
    if (ok) setFresh({ firm: '', market: 'futures', logo: '' });
  }

  const needle = q.trim().toLowerCase();
  const rows = log.filter(item => {
    if (shownFilter !== 'all' && item.status !== shownFilter) return false;
    return !needle || [item.firm, item.title, item.facts?.[0]?.label].join(' ').toLowerCase().includes(needle);
  });
  const manualRows = log.filter(item => item.origin === 'manual');
  const pages = (watch?.pages || []).filter(page => !needle || [page.firm, page.id].join(' ').toLowerCase().includes(needle));
  const health = (watch?.pages || []).reduce((acc, page) => {
    const tone = HEALTH[page.state]?.[0] || 'bad';
    acc[tone] = (acc[tone] || 0) + 1;
    if ((page.failStreak || 0) >= 3) acc.stuck = (acc.stuck || 0) + 1;
    return acc;
  }, {});
  const coverRows = coverPages(cover).filter(item => !needle || item.firm.toLowerCase().includes(needle));
  const current = TABS.find(item => item.id === tab);

  return (
    <div className="ops">
      <aside className="ops-side">
        <div className="ops-brand">
          <span className="ops-brand-mark">PFG</span>
          <span>
            <b>Prop Firm Genie</b>
            <small>Admin</small>
          </span>
        </div>
        <p className="ops-kicker">Platform</p>
        <nav className="ops-nav" aria-label="Dashboard">
          {['Dashboard', 'Notifications', 'Firms', 'Platforms', 'Tags', 'Videos', 'Blog'].map(label => (
            <button key={label} type="button" disabled title="Wires when this ships into the live dashboard">
              {label}
            </button>
          ))}
          <div className="ops-group">
            <button type="button" className="ops-group-head" aria-expanded="true">
              Market intelligence
            </button>
            <div className="ops-sub">
              {TABS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={tab === item.id ? 'page' : undefined}
                  onClick={() => {
                    setTab(item.id);
                    setError('');
                  }}
                >
                  {item.label}
                  {item.id === 'health' && health.bad ? <span className="ops-count is-bad">{health.bad}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </nav>
        <div className="ops-side-foot">
          <div className="ops-user">
            <span className="ops-avatar">{(admin || 'A').slice(0, 1).toUpperCase()}</span>
            <span>
              <b>Admin</b>
              <small>{admin}</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-top">
          <p className="ops-crumb">
            Admin <span aria-hidden>›</span> Market intelligence <span aria-hidden>›</span> <b>{current.label}</b>
          </p>
          <a className="ops-ghost" href="/updates" target="_blank" rel="noreferrer">
            View live page ↗
          </a>
        </header>

        <div className="ops-page">
          <div className="ops-title-row">
            <div>
              <h1>{current.label}</h1>
              <p>
                {live} live · {hidden} hidden · {trending} trending
                {watch?.checkedAt ? ` · last check ${day(watch.checkedAt)}` : ''}
              </p>
            </div>
            {tab !== 'manual' ? (
              <button type="button" className="ops-add" onClick={() => setTab('manual')}>
                + Manual entry
              </button>
            ) : null}
          </div>

          {mode === 'files' ? (
            <p className="ops-warn">
              Database not connected. Edits save to local JSON files and will not persist on Vercel. Run the Supabase
              migration and set SUPABASE_SERVICE_ROLE_KEY.
            </p>
          ) : null}
          {error ? <p className="ops-error">{error}</p> : null}

          <div className="ops-toolbar">
            <label className="ops-search">
              <span className="sr-only">Search</span>
              <input value={q} onChange={event => setQ(event.target.value)} placeholder="Search firms or rules" />
            </label>
            {tab === 'published' ? (
              <div className="ops-seg" role="group" aria-label="Status">
                {SHOWN.map(item => (
                  <button key={item.id} type="button" aria-pressed={shownFilter === item.id} onClick={() => setShownFilter(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {tab === 'published' ? (
            <>
              {edit ? (
                <form className="ops-panel ops-form" onSubmit={saveEdit}>
                  <h2 className="ops-span">Edit {edit.firm}</h2>
                  <label>
                    What changed
                    <input value={edit.label} onChange={event => setEdit({ ...edit, label: event.target.value })} required />
                  </label>
                  <label>
                    Impact
                    <select value={edit.verdict} onChange={event => setEdit({ ...edit, verdict: event.target.value })}>
                      {VERDICTS.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Before
                    <input value={edit.before} onChange={event => setEdit({ ...edit, before: event.target.value })} />
                  </label>
                  <label>
                    After
                    <input value={edit.after} onChange={event => setEdit({ ...edit, after: event.target.value })} />
                  </label>
                  <label className="ops-span">
                    Summary
                    <input value={edit.notes} onChange={event => setEdit({ ...edit, notes: event.target.value })} />
                  </label>
                  <label className="ops-span">
                    Source URL
                    <input value={edit.sourceUrl} onChange={event => setEdit({ ...edit, sourceUrl: event.target.value })} />
                  </label>
                  <label className="ops-check">
                    <input type="checkbox" checked={Boolean(edit.trending)} onChange={event => setEdit({ ...edit, trending: event.target.checked })} />
                    Trending
                  </label>
                  <div className="ops-actions">
                    <button type="button" className="ops-btn" onClick={() => setEdit(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="ops-btn is-primary" disabled={busy}>
                      Save
                    </button>
                  </div>
                </form>
              ) : null}
              <div className="ops-card">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Actions</th>
                      <th>Firm</th>
                      <th>Changed</th>
                      <th>Before → After</th>
                      <th>Impact</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="ops-empty">
                          Nothing here.
                        </td>
                      </tr>
                    ) : (
                      rows.map(item => {
                        const fact = item.facts?.[0] || {};
                        const verdict = verdictOf(fact.verdict);
                        return (
                          <tr key={item.id} className={item.status === 'hidden' ? 'is-hidden' : undefined}>
                            <td className="ops-row-actions">
                              {item.demo ? (
                                <span className="ops-mute">Sample</span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="ops-ico"
                                    aria-label="Edit"
                                    onClick={() => setEdit({ ...changeToDeskItem(item), verdict })}
                                  >
                                    <IconPencil />
                                  </button>
                                  <button
                                    type="button"
                                    className="ops-pill"
                                    disabled={busy}
                                    onClick={() =>
                                      call('PATCH', '/api/fineprint/changes', {
                                        id: item.id,
                                        status: item.status === 'hidden' ? 'published' : 'hidden',
                                      })
                                    }
                                  >
                                    {item.status === 'hidden' ? 'Restore' : 'Hide'}
                                  </button>
                                  <button
                                    type="button"
                                    className={`ops-pill${item.trending ? ' is-on' : ''}`}
                                    disabled={busy || item.status === 'hidden'}
                                    onClick={() => call('PATCH', '/api/fineprint/changes', { id: item.id, trending: !item.trending })}
                                  >
                                    {item.trending ? 'Trending' : 'Pin'}
                                  </button>
                                  {item.origin === 'manual' ? (
                                    kill === item.id ? (
                                      <button
                                        type="button"
                                        className="ops-ico is-danger"
                                        disabled={busy}
                                        onClick={async () => {
                                          await call('DELETE', '/api/fineprint/changes', { id: item.id });
                                          setKill(null);
                                        }}
                                      >
                                        Confirm
                                      </button>
                                    ) : (
                                      <button type="button" className="ops-ico is-danger" aria-label="Delete" onClick={() => setKill(item.id)}>
                                        <IconTrash />
                                      </button>
                                    )
                                  ) : null}
                                </>
                              )}
                            </td>
                            <td>
                              <span className="ops-firm">
                                {marks[item.firm] ? <img src={marks[item.firm]} alt="" width={28} height={28} /> : null}
                                {item.firm}
                              </span>
                            </td>
                            <td>{fact.label || item.title}</td>
                            <td className="ops-clip">
                              <span className="ops-mute">{withUnit(fact.before, fact.unit)}</span> → {withUnit(fact.after, fact.unit)}
                            </td>
                            <td>
                              <span className={`ops-state ${VERDICT_TONE[verdict]}`}>{VERDICTS.find(v => v.id === verdict).label}</span>
                            </td>
                            <td className="ops-mute">{item.demo ? 'Sample' : item.origin === 'manual' ? 'Manual' : 'Watcher'}</td>
                            <td>
                              <span className={`ops-state ${item.status === 'hidden' ? 'is-bad' : 'is-ok'}`}>
                                {item.status === 'hidden' ? 'Hidden' : 'Live'}
                              </span>
                            </td>
                            <td className="ops-mute">{day(item.detectedAt)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div className="ops-foot">
                  Showing {rows.length} of {log.length}. Hiding a watcher card keeps it stored, so the daily check cannot
                  publish it again.
                </div>
              </div>
            </>
          ) : tab === 'manual' ? (
            <>
              <form className="ops-panel ops-form" onSubmit={addManual}>
                <h2 className="ops-span">Add a change the watcher missed</h2>
                <label>
                  Firm
                  <select value={draft.firm} onChange={event => setDraftField('firm', event.target.value)}>
                    {roster.map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Plan
                  <input value={draft.product} onChange={event => setDraftField('product', event.target.value)} />
                </label>
                <label>
                  Market
                  <select value={draft.market} onChange={event => setDraftField('market', event.target.value)}>
                    {MARKETS.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Kind
                  <select value={draft.kind} onChange={event => setDraftField('kind', event.target.value)}>
                    {KINDS.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ops-span">
                  What changed
                  <input value={draft.label} onChange={event => setDraftField('label', event.target.value)} placeholder="Daily loss limit" required />
                </label>
                <label>
                  Before
                  <input value={draft.before} onChange={event => setDraftField('before', event.target.value)} placeholder="$1,200" />
                </label>
                <label>
                  After
                  <input value={draft.after} onChange={event => setDraftField('after', event.target.value)} placeholder="$1,000" />
                </label>
                <label>
                  Impact
                  <select
                    value={draft.verdict}
                    onChange={event => setDraft(current => ({ ...current, verdict: event.target.value, verdictTouched: true }))}
                  >
                    {VERDICTS.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <FpMiniCal
                    variant="field"
                    value={draft.date}
                    onPick={value => setDraftField('date', value)}
                    onClear={() => setDraftField('date', new Date().toISOString().slice(0, 10))}
                  />
                </label>
                <label className="ops-span">
                  Source URL
                  <input value={draft.sourceUrl} onChange={event => setDraftField('sourceUrl', event.target.value)} required />
                </label>
                <label className="ops-span">
                  Summary
                  <input value={draft.notes} onChange={event => setDraftField('notes', event.target.value)} />
                </label>
                <label className="ops-check">
                  <input type="checkbox" checked={Boolean(draft.trending)} onChange={event => setDraftField('trending', event.target.checked)} />
                  Trending
                </label>
                <div className="ops-actions">
                  <button type="submit" className="ops-btn is-primary" disabled={busy}>
                    Publish
                  </button>
                </div>
                {draft.label ? (
                  <p className="ops-mute ops-span">
                    {draft.firm} · {KIND_LABEL[draft.kind] || draft.kind} · {draft.before || '—'} → {draft.after || '—'} ·{' '}
                    {VERDICTS.find(item => item.id === draft.verdict)?.label}
                  </p>
                ) : null}
              </form>
              <div className="ops-foot">{manualRows.length} manual entries so far. Edit or delete them under Published.</div>
            </>
          ) : tab === 'health' ? (
            <>
              <div className="ops-stats">
                <div>
                  <b>{watch?.pages?.length || 0}</b>
                  <span>Pages watched</span>
                </div>
                <div className="is-ok">
                  <b>{health.ok || 0}</b>
                  <span>Working</span>
                </div>
                <div className="is-wait">
                  <b>{health.wait || 0}</b>
                  <span>Waiting</span>
                </div>
                <div className="is-bad">
                  <b>{health.bad || 0}</b>
                  <span>Failing</span>
                </div>
                <div className="is-bad">
                  <b>{health.stuck || 0}</b>
                  <span>Failing 3+ days</span>
                </div>
              </div>
              <div className="ops-card">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Firm</th>
                      <th>Page</th>
                      <th>Last result</th>
                      <th>Failing for</th>
                      <th>Last worked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="ops-empty">
                          No check has run yet.
                        </td>
                      </tr>
                    ) : (
                      pages.map(page => {
                        const [tone, label] = HEALTH[page.state] || ['bad', page.state];
                        return (
                          <tr key={page.id}>
                            <td>{page.firm}</td>
                            <td className="ops-clip">
                              {page.url ? (
                                <a href={page.url} target="_blank" rel="noreferrer">
                                  {page.id}
                                </a>
                              ) : (
                                page.id
                              )}
                            </td>
                            <td>
                              <span className={`ops-state is-${tone}`}>{label}</span>
                            </td>
                            <td className={(page.failStreak || 0) >= 3 ? 'ops-bad' : 'ops-mute'}>
                              {page.failStreak ? `${page.failStreak} ${page.failStreak === 1 ? 'check' : 'checks'}` : '—'}
                            </td>
                            <td className="ops-mute">{day(page.lastOkAt)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {unwatchable.length ? (
                  <div className="ops-foot ops-unwatchable">
                    <b>Not watched:</b>
                    {unwatchable.map(item => (
                      <span key={item.firm}>
                        {item.firm}: {item.reason}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="ops-foot">
                  Blocked pages are invisible to the watcher. Fix those first: a change on a blocked page never reaches
                  traders.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="ops-card">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Firm</th>
                      <th>Market</th>
                      <th>On board</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverRows.map(item => (
                      <tr key={item.firm}>
                        <td>
                          <span className="ops-firm">
                            {marks[item.firm] ? <img src={marks[item.firm]} alt="" width={28} height={28} /> : null}
                            {item.firm}
                          </span>
                        </td>
                        <td className="ops-mute">{item.market}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={shown.includes(item.firm)}
                            disabled={busy}
                            onChange={() =>
                              call('PATCH', '/api/fineprint/coverage', {
                                firm: item.firm,
                                market: item.market,
                                logo: item.logo,
                                shown: !shown.includes(item.firm),
                              })
                            }
                          />
                        </td>
                        <td>
                          {cover.extra?.some(row => row.firm === item.firm) ? (
                            <button
                              type="button"
                              className="ops-ico is-danger"
                              aria-label="Remove"
                              disabled={busy}
                              onClick={() => call('DELETE', '/api/fineprint/coverage', { firm: item.firm })}
                            >
                              <IconTrash />
                            </button>
                          ) : (
                            <span className="ops-mute">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="ops-foot">Showing {coverRows.length} firms</div>
              </div>
              <form className="ops-panel ops-form" onSubmit={addFirm}>
                <h2 className="ops-span">Add firm</h2>
                <label>
                  Firm
                  <input value={fresh.firm} onChange={event => setFresh({ ...fresh, firm: event.target.value })} required />
                </label>
                <label>
                  Market
                  <select value={fresh.market} onChange={event => setFresh({ ...fresh, market: event.target.value })}>
                    {MARKETS.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ops-span">
                  Logo URL
                  <input value={fresh.logo} onChange={event => setFresh({ ...fresh, logo: event.target.value })} />
                </label>
                <div className="ops-actions">
                  <button type="submit" className="ops-btn is-primary" disabled={busy}>
                    Add firm
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IconPencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20l3.2-.6L19 7.6 16.4 5 4.6 16.8 4 20z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 7h14M10 11v6M14 11v6M9 7l1-2h4l1 2m-8 0l1 12h8l1-12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
