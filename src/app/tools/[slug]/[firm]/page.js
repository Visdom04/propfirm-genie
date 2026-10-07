import { notFound } from 'next/navigation';
import ToolPageView from '@/components/tools/ToolPageView';
import { toolBySlug, TOOL_SLUGS } from '@/lib/toolsCatalog';
import { getRuntimeFirms } from '@/lib/firmPlansSheet';
import { compactToolsFirms } from '@/lib/toolsFirms';
import { BRAND_NAME } from '@/lib/brand';
import { slugify } from '@/lib/firmsApi';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug, firm } = await params;
  const tool = toolBySlug(slug);
  if (!tool) return { title: `Tools | ${BRAND_NAME}` };
  const name = firm.replace(/-/g, ' ');
  return {
    title: `${tool.title} — ${name} | ${BRAND_NAME}`,
    description: `${tool.job} Preset for ${name}.`,
  };
}

export default async function ToolFirmPage({ params }) {
  const { slug, firm: firmSlug } = await params;
  const tool = toolBySlug(slug);
  if (!tool || !TOOL_SLUGS.includes(slug)) notFound();
  const { firms: runtime } = await getRuntimeFirms();
  const firms = compactToolsFirms(runtime);
  const match = firms.find(f => f.slug === firmSlug || slugify(f.name) === firmSlug);
  if (!match) notFound();
  return <ToolPageView tool={tool} firms={firms} initialFirm={match.slug} />;
}
