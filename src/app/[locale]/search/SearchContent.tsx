'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Filter, X, Search, FileText, Scale, Gavel, SlidersHorizontal } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { DocumentCard } from '@/components/DocumentCard';
import { Button } from '@/components/ui/button';
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
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const query = searchParams.get('q') || '';

  const types = [
    { value: 'loi', icon: FileText, color: 'text-blue-600' },
    { value: 'decret', icon: Scale, color: 'text-emerald-600' },
    { value: 'jurisprudence', icon: Gavel, color: 'text-purple-600' },
  ];

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

  const clearFilters = () => {
    setTypeFilter('all');
    setDomainFilter('all');
  };

  const hasActiveFilters = typeFilter !== 'all' || domainFilter !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-snij-secondary text-white py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">{t('title')}</h1>
          <div className="max-w-3xl mx-auto">
            <SearchBar className="shadow-2xl" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* Filter Toggle Button (Mobile) */}
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 me-2" />
              {t('filters.type')}
              {hasActiveFilters && (
                <span className="ms-2 h-5 w-5 rounded-full bg-snij-primary text-white text-xs flex items-center justify-center">
                  {(typeFilter !== 'all' ? 1 : 0) + (domainFilter !== 'all' ? 1 : 0)}
                </span>
              )}
            </Button>

            {/* Desktop Filters */}
            <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-wrap gap-4 w-full md:w-auto`}>
              {/* Type Filter */}
              <div className="w-full md:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-white border-gray-200 h-11">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t('filters.type')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filters.all')}</SelectItem>
                    {types.map(({ value, icon: Icon, color }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span>{t(`types.${value}`)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Domain Filter */}
              <div className="w-full md:w-52">
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className="bg-white border-gray-200 h-11">
                    <SelectValue placeholder={t('filters.domain')} />
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

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 me-1" />
                  {locale === 'ar' ? 'مسح' : locale === 'fr' ? 'Effacer' : 'Clear'}
                </Button>
              )}
            </div>

            {/* Results count */}
            {query && !loading && (
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{total}</span> {t('results.found')}
                {executionTime > 0 && (
                  <span className="text-muted-foreground">
                    {' '}({(executionTime / 1000).toFixed(2)}s)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-snij-primary/10 text-snij-primary text-sm">
                  {t(`types.${typeFilter}`)}
                  <button onClick={() => setTypeFilter('all')} className="hover:bg-snij-primary/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {domainFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-snij-secondary/10 text-snij-secondary text-sm">
                  {t(`domains.${domainFilter}`)}
                  <button onClick={() => setDomainFilter('all')} className="hover:bg-snij-secondary/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
              <Loader2 className="h-16 w-16 animate-spin text-snij-primary absolute top-0 left-0" />
            </div>
            <p className="mt-4 text-muted-foreground">
              {locale === 'ar' ? 'جاري البحث...' : locale === 'fr' ? 'Recherche en cours...' : 'Searching...'}
            </p>
          </div>
        ) : query ? (
          <>
            {results.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                {results.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <DocumentCard document={doc} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('results.noResults')}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t('results.searchFor')}
                </p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-4 text-snij-primary">
                    {locale === 'ar' ? 'مسح الفلاتر وإعادة المحاولة' : locale === 'fr' ? 'Effacer les filtres et réessayer' : 'Clear filters and try again'}
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-snij-primary/10 to-snij-secondary/10 mb-6">
              <Search className="h-12 w-12 text-snij-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {locale === 'ar' ? 'ابدأ البحث' : locale === 'fr' ? 'Commencez votre recherche' : 'Start your search'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('placeholder')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
