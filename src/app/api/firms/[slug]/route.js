import { NextResponse } from 'next/server';
import { getFirmBySlugAsync } from '@/lib/firmsApi';

export async function GET(request, { params }) {
  const { slug } = await params;
  const firm = await getFirmBySlugAsync(slug);

  if (!firm) {
    return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
  }

  return NextResponse.json({ data: firm });
}
