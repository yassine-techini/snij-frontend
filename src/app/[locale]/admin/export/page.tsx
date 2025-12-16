import { setRequestLocale } from 'next-intl/server';
import { ExportDashboard } from './ExportDashboard';

export default async function ExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ExportDashboard />;
}
