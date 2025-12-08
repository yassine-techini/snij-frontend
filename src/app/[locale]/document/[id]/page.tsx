import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { DocumentContent } from './DocumentContent';

export function generateStaticParams() {
  return locales.flatMap((locale) => [{ locale, id: 'placeholder' }]);
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <DocumentContent documentId={id} />;
}
