import { setRequestLocale } from 'next-intl/server';
import { SecuritySettings } from './SecuritySettings';

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SecuritySettings />;
}
