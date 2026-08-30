import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import {
  FIRMS_SHEET_TAG,
  isSheetSyncConfigured,
  loadFirmsFromGoogleSheet,
} from '@/lib/firmPlansSheet';

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}

function checkSecret(request) {
  const expected = process.env.SYNC_SECRET;
  if (!expected) return false;
  const header = request.headers.get('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const query = new URL(request.url).searchParams.get('secret') || '';
  return bearer === expected || query === expected;
}

/**
 * POST /api/sync-firms
 * Called by Google Apps Script after sheet edits.
 * Fetches Plans (+ Firms) from Google Sheet, validates, then busts cache.
 */
export async function POST(request) {
  if (!checkSecret(request)) return unauthorized();

  if (!process.env.GOOGLE_SHEET_ID) {
    return NextResponse.json(
      { ok: false, error: 'GOOGLE_SHEET_ID env var is not set on Vercel' },
      { status: 500 }
    );
  }

  try {
    const result = await loadFirmsFromGoogleSheet();

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          validation: result.validation,
          message: 'Sync rejected — last good data kept live.',
        },
        { status: 422 }
      );
    }

    revalidateTag(FIRMS_SHEET_TAG, 'max');

    return NextResponse.json({
      ok: true,
      message: 'Sheet synced. Cache revalidated.',
      stats: result.stats,
      warnings: result.validation?.warnings || [],
      syncedAt: result.syncedAt,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

/** GET — health / config check (still requires secret) */
export async function GET(request) {
  if (!checkSecret(request)) return unauthorized();
  return NextResponse.json({
    ok: true,
    configured: isSheetSyncConfigured(),
    sheetId: process.env.GOOGLE_SHEET_ID || null,
    plansGid: process.env.GOOGLE_SHEET_PLANS_GID || '0',
    firmsGid: process.env.GOOGLE_SHEET_FIRMS_GID || '812133584',
  });
}
