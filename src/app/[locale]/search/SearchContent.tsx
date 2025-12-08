'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { DocumentCard } from '@/components/DocumentCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { studioClient, type SearchResult, type SearchFilters } from '@/lib/api';

export function SearchContent() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('search');

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const query = searchParams.get('q') || '';

  const types = ['loi', 'decret', 'jurisprudence'];
  const domains = [
    'constitutionnel',
    'administratif',
    'fiscal',
    'travail',
    'commercial',
    'penal',
    'civil',
    'famille',
    'environnement',
    'affaires',
    'social',
  ];

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, typeFilter, domainFilter]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const filters: SearchFilters = {};
      if (typeFilter !== 'all') {
        filters.type = [typeFilter];
      }
      if (domainFilter !== 'all') {
        filters.domaine = [domainFilter];
      }

      const response = await studioClient.search(query, filters, 1, 20, locale);

      if (response.success && response.data) {
        setResults(response.data.results);
        setTotal(response.data.total);
        setExecutionTime(response.meta?.executionTime || 0);
      } else {
        setResults([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <SearchBar className="max-w-2xl" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
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

        <div className="w-48">
          <label className="text-sm font-medium mb-1 block">{t('filters.domain')}</label>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {t(`domains.${domain}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
        </div>
      ) : query ? (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {total} {t('results.found')}
              {executionTime > 0 && ` (${(executionTime / 1000).toFixed(2)}s)`}
            </p>
          </div>

          {results.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl font-medium mb-2">{t('results.noResults')}</p>
              <p className="text-muted-foreground">{t('results.searchFor')}</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          {t('placeholder')}
        </div>
      )}
    </div>
  );
}
