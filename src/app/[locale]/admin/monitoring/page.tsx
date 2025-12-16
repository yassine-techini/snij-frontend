import { setRequestLocale } from 'next-intl/server';
import { MonitoringDashboard } from './MonitoringDashboard';

export default async function MonitoringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MonitoringDashboard />;
}
