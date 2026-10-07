import { notFound } from 'next/navigation';
import ToolPageView from '@/components/tools/ToolPageView';
import { toolBySlug } from '@/lib/toolsCatalog';
import { getRuntimeFirms } from '@/lib/firmPlansSheet';
import { compactToolsFirms } from '@/lib/toolsFirms';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) return { title: `Tools | ${BRAND_NAME}` };
  return {
    title: `${tool.title} | ${BRAND_NAME}`,
    description: tool.job,
  };
}

export default async function ToolSlugPage({ params }) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();
  const { firms: runtime } = await getRuntimeFirms();
  const firms = compactToolsFirms(runtime);
  return <ToolPageView tool={tool} firms={firms} />;
}
