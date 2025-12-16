import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import {
  Scale,
  Search,
  MessageSquare,
  Bell,
  FileText,
  Building2,
  Users,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AboutContent locale={locale} />;
}

function AboutContent({ locale }: { locale: string }) {
  const t = useTranslations('about');

  const services = [
    { icon: Search, text: t('features.search'), color: 'bg-blue-100 text-blue-600' },
    { icon: MessageSquare, text: t('features.assistant'), color: 'bg-purple-100 text-purple-600' },
    { icon: Bell, text: t('features.alerts'), color: 'bg-amber-100 text-amber-600' },
    { icon: FileText, text: t('features.documents'), color: 'bg-emerald-100 text-emerald-600' },
  ];

  const partners = [
    { icon: Building2, name: t('partners.ministry') },
    { icon: BookOpen, name: t('partners.imprimerie') },
    { icon: Users, name: t('partners.cnudst') },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-snij-primary/10 rounded-2xl mb-6">
          <Scale className="h-12 w-12 text-snij-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      {/* Mission */}
      <Card className="mb-12">
        <CardContent className="py-8">
          <h2 className="text-2xl font-bold mb-4 text-snij-primary">{t('mission.title')}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t('mission.description')}
          </p>
        </CardContent>
      </Card>

      {/* Services */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('features.title')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {services.map(({ icon: Icon, text, color }, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="py-6 flex items-start gap-4">
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-muted-foreground flex-1">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team */}
      <Card className="mb-12 bg-gradient-to-br from-snij-primary/5 to-snij-accent/5">
        <CardContent className="py-8">
          <h2 className="text-2xl font-bold mb-4">{t('team.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('team.description')}</p>
        </CardContent>
      </Card>

      {/* Partners */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">{t('partners.title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {partners.map(({ icon: Icon, name }, idx) => (
            <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="py-8">
                <div className="inline-flex items-center justify-center p-4 bg-gray-100 rounded-full mb-4">
                  <Icon className="h-8 w-8 text-gray-600" />
                </div>
                <p className="font-medium">{name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
