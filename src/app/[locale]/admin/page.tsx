import { setRequestLocale } from 'next-intl/server';
import { AdminDashboard } from './AdminDashboard';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminDashboard />;
}
