import { NextResponse } from 'next/server';
import { listFirmsAsync } from '@/lib/firmsApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || undefined;
  const asset = searchParams.get('asset') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '50', 10) || 50));

  const result = await listFirmsAsync({ search, asset, page, perPage });

  return NextResponse.json(result);
}
