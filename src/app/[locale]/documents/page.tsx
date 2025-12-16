'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { DocumentCard } from '@/components/DocumentCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { studioClient, type SearchResult } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function DocumentsPage() {
  const locale = useLocale();
  const t = useTranslations('search');
  const tCommon = useTranslations('common');

  const [documents, setDocuments] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const types = ['loi', 'decret', 'jurisprudence'];
  const LIMIT = 20;

  useEffect(() => {
    loadDocuments(true);
  }, [typeFilter]);

  const loadDocuments = async (reset: boolean = false) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const type = typeFilter === 'all' ? undefined : typeFilter;

      const response = await studioClient.getDocuments(type, LIMIT, currentOffset);

      if (response.success && response.data) {
        const newDocs: SearchResult[] = response.data.results.map((doc) => {
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

          // Handle multilingual content for excerpt
          let excerpt = '';
          if (typeof doc.content === 'string') {
            excerpt = doc.content.substring(0, 200);
          } else if (doc.content) {
            const key = locale as 'ar' | 'fr' | 'en';
            excerpt = (doc.content[key] || doc.content.ar || doc.content.fr || '').substring(0, 200);
          }

          // Handle domaine
          const domaineId = typeof doc.domaine === 'string'
            ? doc.domaine
            : doc.domaine?.id || '';

          return {
            id: doc.id,
            type: doc.type,
            title,
            excerpt,
            date: doc.date,
            numero: doc.numero,
            domaine: domaineId ? { id: domaineId, name: domaineId } : undefined,
            score: 1,
          };
        });

        if (reset) {
          setDocuments(newDocs);
          setOffset(LIMIT);
        } else {
          setDocuments((prev) => [...prev, ...newDocs]);
          setOffset((prev) => prev + LIMIT);
        }

        setHasMore(newDocs.length === LIMIT);
      }
    } catch (error) {
      console.error('Load documents error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">{tCommon('documents')}</h1>

        {/* Filter */}
        <div className="w-48">
          <label className="text-sm font-medium mb-1 block">{t('filters.type')}</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents Grid */}
      {loading && documents.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
        </div>
      ) : documents.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => loadDocuments(false)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : null}
                {tCommon('viewMore')}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          {t('results.noResults')}
        </div>
      )}
    </div>
  );
}
