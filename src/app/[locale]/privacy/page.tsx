import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { Shield, Calendar, Lock, Eye, Database, UserCheck, Cookie, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrivacyContent locale={locale} />;
}

function PrivacyContent({ locale }: { locale: string }) {
  const t = useTranslations('privacy');

  const sections = [
    { key: 'intro', icon: Eye },
    { key: 'collection', icon: Database },
    { key: 'usage', icon: Lock },
    { key: 'storage', icon: Shield },
    { key: 'rights', icon: UserCheck },
    { key: 'cookies', icon: Cookie },
    { key: 'contact', icon: Mail },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-snij-primary/10 rounded-2xl mb-6">
          <Shield className="h-12 w-12 text-snij-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{t('lastUpdate')}: 9 décembre 2025</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {sections.map(({ key, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-snij-primary/10 rounded-lg shrink-0">
                  <Icon className="h-5 w-5 text-snij-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-3 text-snij-primary">
                    {t(`sections.${key}.title`)}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`sections.${key}.content`)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust badges */}
      <div className="mt-12 p-6 bg-gradient-to-br from-snij-primary/5 to-snij-accent/5 rounded-2xl">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="text-center">
            <Shield className="h-10 w-10 mx-auto text-snij-primary mb-2" />
            <p className="text-sm font-medium">
              {locale === 'ar' ? 'بيانات آمنة' : locale === 'en' ? 'Secure Data' : 'Données sécurisées'}
            </p>
          </div>
          <div className="text-center">
            <Lock className="h-10 w-10 mx-auto text-snij-primary mb-2" />
            <p className="text-sm font-medium">
              {locale === 'ar' ? 'تشفير SSL' : locale === 'en' ? 'SSL Encryption' : 'Chiffrement SSL'}
            </p>
          </div>
          <div className="text-center">
            <UserCheck className="h-10 w-10 mx-auto text-snij-primary mb-2" />
            <p className="text-sm font-medium">
              {locale === 'ar' ? 'متوافق مع RGPD' : locale === 'en' ? 'GDPR Compliant' : 'Conforme RGPD'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
