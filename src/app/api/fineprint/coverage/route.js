import { NextResponse } from 'next/server';
import { currentAdmin } from '@/lib/fineprint/admin';
import { dropCoverage, readCoverage, saveCoverage } from '@/lib/fineprint/store';

export const runtime = 'nodejs';

function deny() {
  return NextResponse.json({ ok: false, error: 'Admins only.' }, { status: 401 });
}

export async function PATCH(request) {
  if (!(await currentAdmin())) return deny();
  const body = await request.json().catch(() => null);
  const firm = String(body?.firm || '').trim();
  if (!firm) return NextResponse.json({ ok: false, error: 'Missing firm.' }, { status: 400 });
  try {
    await saveCoverage({ firm, market: body.market || 'futures', shown: body.shown !== false, logo: body.logo || null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }
  return NextResponse.json({ ok: true, cover: await readCoverage() });
}

export async function DELETE(request) {
  if (!(await currentAdmin())) return deny();
  const body = await request.json().catch(() => null);
  const firm = String(body?.firm || '').trim();
  if (!firm) return NextResponse.json({ ok: false, error: 'Missing firm.' }, { status: 400 });
  try {
    await dropCoverage(firm);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }
  return NextResponse.json({ ok: true, cover: await readCoverage() });
}
