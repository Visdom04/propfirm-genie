import { unstable_cache } from 'next/cache';
import { firms as staticFirms } from '@/data/firms';
import {
  parseTsv,
  validateFirmPlans,
  rowToPlan,
  FIRM_NAME_MAP,
} from '../../scripts/lib/firm-plans-parser.mjs';

export const FIRMS_SHEET_TAG = 'firms-sheet';

function sheetConfig() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return null;
  return {
    sheetId,
    plansGid: process.env.GOOGLE_SHEET_PLANS_GID || '0',
    firmsGid: process.env.GOOGLE_SHEET_FIRMS_GID || '812133584',
  };
}

export function isSheetSyncConfigured() {
  return Boolean(process.env.GOOGLE_SHEET_ID && process.env.SYNC_SECRET);
}

function exportUrl(sheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=tsv&gid=${gid}`;
}

async function fetchTsv(url, label) {
  const res = await fetch(url, {
    // Cache forever until sync endpoint calls revalidateTag(FIRMS_SHEET_TAG)
    next: { tags: [FIRMS_SHEET_TAG], revalidate: false },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`${label}: Google Sheet export failed (${res.status}). Share sheet as Anyone with link → Viewer.`);
  }
  const text = await res.text();
  if (text.includes('<!DOCTYPE html') || text.includes('<html')) {
    throw new Error(`${label}: got HTML instead of TSV — sheet is not publicly viewable via link.`);
  }
  return text;
}

function parseFirmsMetaTsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const map = new Map();
  if (lines.length < 2) return map;
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split('\t');
    const firm = cols[0]?.trim();
    if (!firm) continue;
    const name = FIRM_NAME_MAP[firm] || firm;
    map.set(name, {
      affiliateLink: cols[1]?.trim() || undefined,
      lastVerified: cols[2]?.trim() || undefined,
      verifiedBy: cols[3]?.trim() || undefined,
      isPopular: /^true$/i.test(cols[4]?.trim() || ''),
    });
  }
  return map;
}

function mergeSheetIntoFirms(parsedPlans, metaMap) {
  const byFirm = new Map();
  for (const { firmName, plan } of parsedPlans) {
    if (!byFirm.has(firmName)) byFirm.set(firmName, []);
    byFirm.get(firmName).push(plan);
  }

  const staticByName = new Map(staticFirms.map(f => [f.name, f]));
  const result = [];

  for (const [name, plans] of byFirm) {
    const base = staticByName.get(name);
    const meta = metaMap.get(name) || {};
    const sizes = [...new Set(plans.map(p => p.accountSize))].sort(
      (a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, ''))
    );
    const steps = [...new Set(plans.map(p => p.steps))];
    const priceTypes = [...new Set(plans.map(p => p.priceType))];

    if (base) {
      const pop = base.likes || 1000;
      for (const p of plans) p.popularity = pop;
      result.push({
        ...base,
        ...(meta.affiliateLink ? { affiliateLink: meta.affiliateLink } : {}),
        ...(meta.lastVerified ? { lastVerified: meta.lastVerified } : {}),
        ...(meta.verifiedBy ? { verifiedBy: meta.verifiedBy } : {}),
        ...(typeof meta.isPopular === 'boolean' ? { isPopular: meta.isPopular } : {}),
        accountSizes: sizes,
        steps,
        priceType: priceTypes,
        plans,
      });
    } else {
      for (const p of plans) p.popularity = 1000;
      result.push({
        name,
        logo: '/firm/placeholder.png',
        rating: 0,
        reviews: 0,
        description: `${name} plans synced from Google Sheet.`,
        platforms: [],
        maxAccounts: '—',
        maxAlloc: sizes[sizes.length - 1] || '—',
        promoCode: plans[0]?.promoCode || 'KAGE',
        discount: 'KAGE',
        website: '',
        ...(meta.affiliateLink ? { affiliateLink: meta.affiliateLink } : {}),
        ...(meta.lastVerified ? { lastVerified: meta.lastVerified } : {}),
        type: 'Challenge',
        countryCode: 'US',
        likes: 1000,
        years: 1,
        yearsLabel: '1',
        assets: ['Futures'],
        accountSizes: sizes,
        steps,
        priceType: priceTypes,
        allocPct: 0.5,
        isNew: true,
        isPopular: Boolean(meta.isPopular),
        plans,
      });
    }
  }

  // Keep static firms that aren't in the sheet (marketing-only)
  for (const f of staticFirms) {
    if (!byFirm.has(f.name)) result.push(f);
  }

  return result;
}

/**
 * Fetch + validate + build firm catalog from Google Sheet.
 * Does not use Next cache — call via getCachedSheetFirms().
 */
export async function loadFirmsFromGoogleSheet() {
  const cfg = sheetConfig();
  if (!cfg) {
    return { ok: false, error: 'GOOGLE_SHEET_ID not set', firms: staticFirms };
  }

  const plansText = await fetchTsv(exportUrl(cfg.sheetId, cfg.plansGid), 'Plans');
  let firmsMetaText = '';
  try {
    firmsMetaText = await fetchTsv(exportUrl(cfg.sheetId, cfg.firmsGid), 'Firms');
  } catch {
    // Firms tab optional
  }

  const parsed = parseTsv(plansText, { fileLabel: 'Google Sheet / Plans' });
  const validation = validateFirmPlans(parsed);
  if (validation.errors.length) {
    return {
      ok: false,
      error: 'Sheet validation failed',
      validation,
      firms: staticFirms,
    };
  }

  const parsedPlans = parsed.rows.map(rowToPlan);
  const metaMap = parseFirmsMetaTsv(firmsMetaText);
  const firms = mergeSheetIntoFirms(parsedPlans, metaMap);

  return {
    ok: true,
    validation,
    firms,
    stats: validation.stats,
    syncedAt: new Date().toISOString(),
  };
}

export const getCachedSheetFirms = unstable_cache(
  async () => {
    const result = await loadFirmsFromGoogleSheet();
    if (!result.ok) {
      // Keep serving static catalog if sheet is temporarily broken
      return {
        firms: staticFirms,
        source: 'static',
        error: result.error,
        validation: result.validation,
        syncedAt: null,
      };
    }
    return {
      firms: result.firms,
      source: 'google-sheet',
      error: null,
      validation: result.validation,
      syncedAt: result.syncedAt,
    };
  },
  ['firms-from-google-sheet'],
  { tags: [FIRMS_SHEET_TAG] }
);

export async function getRuntimeFirms() {
  if (!process.env.GOOGLE_SHEET_ID) {
    return { firms: staticFirms, source: 'static', syncedAt: null, error: null };
  }
  return getCachedSheetFirms();
}
