import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { FileText, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TermsContent locale={locale} />;
}

function TermsContent({ locale }: { locale: string }) {
  const t = useTranslations('terms');

  const sections = [
    'acceptance',
    'service',
    'usage',
    'disclaimer',
    'intellectual',
    'liability',
    'modifications',
  ] as const;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-snij-primary/10 rounded-2xl mb-6">
          <FileText className="h-12 w-12 text-snij-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{t('lastUpdate')}: 9 décembre 2025</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section}>
            <CardContent className="py-6">
              <h2 className="text-xl font-bold mb-3 text-snij-primary">
                {t(`sections.${section}.title`)}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t(`sections.${section}.content`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          {locale === 'ar'
            ? 'للاستفسارات حول شروط الاستخدام، يرجى الاتصال بنا على: legal@snij.tn'
            : locale === 'en'
            ? 'For questions about these terms, please contact us at: legal@snij.tn'
            : 'Pour toute question concernant ces conditions, contactez-nous : legal@snij.tn'}
        </p>
      </div>
    </div>
  );
}
