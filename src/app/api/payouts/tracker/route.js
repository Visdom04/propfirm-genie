import { NextResponse } from 'next/server';
import { loadSnapshot } from '@/lib/payouts/live';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await loadSnapshot());
}
