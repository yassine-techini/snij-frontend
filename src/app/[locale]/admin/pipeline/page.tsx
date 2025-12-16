import { setRequestLocale } from 'next-intl/server';
import { PipelineDashboard } from './PipelineDashboard';

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PipelineDashboard />;
}
