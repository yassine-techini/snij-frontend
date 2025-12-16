import { setRequestLocale } from 'next-intl/server';
import { StudioDashboard } from './StudioDashboard';

export default async function StudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StudioDashboard />;
}
