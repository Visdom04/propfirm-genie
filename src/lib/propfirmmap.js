const API_BASE = 'https://propfirmmap.com/api/v1';

export async function getFirms({ perPage = 25 } = {}) {
  const res = await fetch(`${API_BASE}/firms?per_page=${perPage}&sort=score`, {
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`PropFirmMap API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data ?? [];
}

export async function getFirmDetail(slug) {
  const res = await fetch(`${API_BASE}/firms/${slug}`, {
    next: { revalidate: 600 },
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json.data ?? null;
}
