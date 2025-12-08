import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales, localeDirections, type Locale } from '@/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const titles: Record<string, string> = {
    ar: 'البوابة الوطنية للمعلومات القانونية - تونس',
    fr: 'Portail National d\'Information Juridique - Tunisie',
    en: 'National Legal Information Portal - Tunisia',
  };

  const descriptions: Record<string, string> = {
    ar: 'نظام متكامل للوصول إلى النصوص القانونية التونسية',
    fr: 'Système intégré d\'accès aux textes juridiques tunisiens',
    en: 'Integrated system for accessing Tunisian legal texts',
  };

  return {
    title: titles[locale] || titles.ar,
    description: descriptions[locale] || descriptions.ar,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = localeDirections[locale as Locale];

  return (
    <html lang={locale} dir={dir}>
      <body className={`${inter.variable} min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
