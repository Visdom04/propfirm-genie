import { NextResponse } from 'next/server';
import { currentAdmin } from '@/lib/fineprint/admin';
import { deskToChange } from '@/lib/fineprint/desk';
import { readChangeLog, readOneChange, removeChange, saveChange, setChangeStatus } from '@/lib/fineprint/store';
import { verdictOf } from '@/lib/fineprint/terms';

export const runtime = 'nodejs';

const EDITABLE = ['title', 'summary', 'product', 'kind', 'sourceUrl', 'trending', 'facts'];

function deny() {
  return NextResponse.json({ ok: false, error: 'Admins only.' }, { status: 401 });
}

function bad(error) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

async function everything() {
  return readChangeLog({ includeHidden: true });
}

export async function GET() {
  if (!(await currentAdmin())) return deny();
  return NextResponse.json({ ok: true, changes: await everything() });
}

/** Manual entry: a change the watcher missed, written by an admin. */
export async function POST(request) {
  const admin = await currentAdmin();
  if (!admin) return deny();
  const item = await request.json().catch(() => null);
  if (!item?.firm || !String(item.label || '').trim()) return bad('Firm and what changed are required.');
  const draft = deskToChange({ ...item, id: item.id || `manual-${Date.now()}`, status: 'published' });
  const fact = { ...draft.facts[0], verdict: verdictOf(item.verdict) };
  await saveChange(
    {
      ...draft,
      facts: [fact],
      origin: 'manual',
      status: item.status === 'hidden' ? 'hidden' : 'published',
      publishedAt: draft.detectedAt,
    },
    admin.email,
  );
  return NextResponse.json({ ok: true, changes: await everything() });
}

/** Edit fields, pin trending, or hide / restore. */
export async function PATCH(request) {
  const admin = await currentAdmin();
  if (!admin) return deny();
  const body = await request.json().catch(() => null);
  if (!body?.id) return bad('Missing id.');
  const current = await readOneChange(body.id);
  if (!current) return bad('No such change.');
  if (current.demo) return bad('Sample cards are read-only.');
  if (body.status === 'hidden' || body.status === 'published') {
    await setChangeStatus(body.id, body.status, admin.email);
  }
  const patch = Object.fromEntries(EDITABLE.filter(key => key in body).map(key => [key, body[key]]));
  if (patch.facts) patch.facts = patch.facts.map(fact => ({ ...fact, verdict: verdictOf(fact.verdict) }));
  if (Object.keys(patch).length) {
    const fresh = await readOneChange(body.id);
    await saveChange({ ...fresh, ...patch }, admin.email);
  }
  return NextResponse.json({ ok: true, changes: await everything() });
}

/** Manual entries are deleted outright. Watcher cards are hidden so the next run cannot bring them back. */
export async function DELETE(request) {
  const admin = await currentAdmin();
  if (!admin) return deny();
  const body = await request.json().catch(() => null);
  const id = body?.id || new URL(request.url).searchParams.get('id');
  if (!id) return bad('Missing id.');
  const current = await readOneChange(id);
  if (!current) return bad('No such change.');
  if (current.demo) return bad('Sample cards are read-only.');
  if (current.origin === 'manual') await removeChange(id);
  else await setChangeStatus(id, 'hidden', admin.email);
  return NextResponse.json({ ok: true, changes: await everything() });
}
