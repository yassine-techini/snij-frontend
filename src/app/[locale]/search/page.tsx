import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { SearchContent } from './SearchContent';
import { Loader2 } from 'lucide-react';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function SearchLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
    </div>
  );
}

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}
