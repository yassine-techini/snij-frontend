'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { FileText, Scale, Gavel, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { studioClient, type Document } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const typeIcons = {
  loi: FileText,
  decret: Scale,
  jurisprudence: Gavel,
};

const typeColors = {
  loi: 'bg-blue-100 text-blue-700',
  decret: 'bg-emerald-100 text-emerald-700',
  jurisprudence: 'bg-purple-100 text-purple-700',
};

export function RecentDocuments() {
  const locale = useLocale();
  const t = useTranslations('home');
  const tSearch = useTranslations('search');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await studioClient.getDocuments(undefined, 6, 0);
      if (response.success && response.data) {
        setDocuments(response.data.results);
      }
    } catch (err) {
      console.error('Failed to load recent documents:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-snij-secondary mb-2">
              {locale === 'ar'
                ? 'أحدث النصوص القانونية'
                : locale === 'fr'
                ? 'Documents récents'
                : 'Recent Documents'}
            </h2>
            <p className="text-muted-foreground">
              {locale === 'ar'
                ? 'آخر النصوص المضافة إلى قاعدة البيانات'
                : locale === 'fr'
                ? 'Les derniers textes ajoutés à la base de données'
                : 'Latest texts added to the database'}
            </p>
          </div>
          <Link href={`/${locale}/documents`}>
            <Button variant="outline" className="hidden md:flex items-center gap-2">
              {locale === 'ar' ? 'عرض الكل' : locale === 'fr' ? 'Voir tout' : 'View all'}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => {
            const TypeIcon = typeIcons[doc.type] || FileText;
            const typeColor = typeColors[doc.type] || 'bg-gray-100 text-gray-700';

            // Handle multilingual title
            let title = '';
            if (typeof doc.title === 'string') {
              title = locale === 'ar' && doc.titleAr ? doc.titleAr :
                      locale === 'fr' && doc.titleFr ? doc.titleFr :
                      doc.title;
            } else if (doc.title) {
              const key = locale as 'ar' | 'fr' | 'en';
              title = doc.title[key] || doc.title.ar || doc.title.fr || '';
            }

            // Handle multilingual summary
            let summary = '';
            if (typeof doc.aiSummary === 'string') {
              summary = doc.aiSummary;
            } else if (doc.aiSummary) {
              const key = locale as 'ar' | 'fr' | 'en';
              summary = doc.aiSummary[key] || doc.aiSummary.ar || doc.aiSummary.fr || '';
            }

            return (
              <Link key={doc.id} href={`/${locale}/document/${doc.id}`}>
                <Card className="h-full border border-gray-100 shadow-sm hover:shadow-lg hover:border-snij-primary/30 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                        <TypeIcon className="h-3.5 w-3.5" />
                        {tSearch(`types.${doc.type}`)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(doc.date, locale)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-snij-secondary group-hover:text-snij-primary transition-colors line-clamp-2 mb-2">
                      {title}
                    </h3>

                    {summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {summary}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{doc.numero}</span>
                      <span className="text-xs text-snij-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        {locale === 'ar' ? 'عرض' : locale === 'fr' ? 'Voir' : 'View'}
                        <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href={`/${locale}/documents`}>
            <Button variant="outline" className="w-full">
              {locale === 'ar' ? 'عرض الكل' : locale === 'fr' ? 'Voir tout' : 'View all'}
              <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
