import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Search, MessageSquare, FileText, Scale, Gavel, BookOpen } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { locales } from '@/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePageContent />;
}

function HomePageContent() {
  const t = useTranslations('home');

  const features = [
    {
      icon: Search,
      title: t('features.search.title'),
      description: t('features.search.description'),
    },
    {
      icon: MessageSquare,
      title: t('features.assistant.title'),
      description: t('features.assistant.description'),
    },
    {
      icon: FileText,
      title: t('features.documents.title'),
      description: t('features.documents.description'),
    },
  ];

  const stats = [
    { icon: BookOpen, value: '500+', label: t('stats.laws') },
    { icon: Scale, value: '1000+', label: t('stats.decrees') },
    { icon: Gavel, value: '2000+', label: t('stats.jurisprudence') },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-snij-secondary to-snij-secondary/90 text-white py-20 px-4">
        <div className="container mx-auto text-center">
          {/* Tunisian Emblem */}
          <div className="mb-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white text-snij-primary text-3xl font-bold">
              ب
            </div>
          </div>

          <p className="text-sm uppercase tracking-wider mb-2 opacity-80">{t('subtitle')}</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">{t('description')}</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar size="large" />
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 100V50C240 83.3333 480 100 720 100C960 100 1200 83.3333 1440 50V100H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <Icon className="h-8 w-8 mx-auto mb-2 text-snij-primary" />
                <div className="text-3xl font-bold text-snij-secondary">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-snij-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-snij-primary" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
