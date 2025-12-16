'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Heart,
  Trash2,
  FileText,
  Scale,
  Gavel,
  Calendar,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFavorites, type FavoriteDocument } from '@/hooks/useFavorites';
import { generateDocumentPDF } from '@/lib/pdf-export';
import { studioClient } from '@/lib/api';

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

export function FavoritesContent() {
  const locale = useLocale();
  const t = useTranslations('favorites');
  const tSearch = useTranslations('search');
  const { favorites, removeFavorite, clearFavorites, isLoaded, count } = useFavorites();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportPDF = async (fav: FavoriteDocument) => {
    setExporting(fav.id);
    try {
      // Fetch full document data
      const response = await studioClient.getDocument(fav.id);
      if (response.success && response.data) {
        const doc = response.data;

        // Extract localized values
        const getValue = (
          field: string | { ar: string; fr: string; en?: string } | undefined
        ): string => {
          if (!field) return '';
          if (typeof field === 'string') return field;
          const key = locale as 'ar' | 'fr' | 'en';
          return field[key] || field.ar || field.fr || '';
        };

        const docTitle = typeof doc.title === 'string' ? doc.title : getValue(doc.title);
        const docContent = getValue(doc.content);
        const docSummary = getValue(doc.aiSummary);
        const docDomaine = typeof doc.domaine === 'string' ? doc.domaine : doc.domaine?.id || '';

        generateDocumentPDF(
          {
            id: doc.id,
            type: doc.type,
            numero: doc.numero,
            title: docTitle,
            content: docContent,
            summary: docSummary,
            date: doc.date,
            domaine: docDomaine,
            statut: doc.statut,
            jortRef: doc.jortRef,
          },
          { locale, includeHeader: true, includeSummary: true, includeContent: true }
        );
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(
        locale === 'ar' ? 'ar-TN' : locale === 'en' ? 'en-US' : 'fr-FR',
        { year: 'numeric', month: 'short', day: 'numeric' }
      );
    } catch {
      return dateStr;
    }
  };

  const formatAddedDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(
      locale === 'ar' ? 'ar-TN' : locale === 'en' ? 'en-US' : 'fr-FR',
      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            {t('loading') || 'Chargement...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-xl">
            <Heart className="h-6 w-6 text-red-600 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('title') || 'Mes Favoris'}</h1>
            <p className="text-muted-foreground">
              {count} {count === 1 ? t('document') || 'document' : t('documents') || 'documents'}
            </p>
          </div>
        </div>

        {count > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm(t('confirmClearAll') || 'Supprimer tous les favoris ?')) {
                clearFavorites();
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('clearAll') || 'Tout supprimer'}
          </Button>
        )}
      </div>

      {/* Empty state */}
      {count === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t('emptyTitle') || 'Aucun favori'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('emptyDescription') ||
                'Ajoutez des documents à vos favoris pour les retrouver facilement ici.'}
            </p>
            <Link href={`/${locale}/documents`}>
              <Button>{t('browseDocuments') || 'Parcourir les documents'}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav) => {
            const TypeIcon = typeIcons[fav.type] || FileText;
            const colorClass = typeColors[fav.type] || 'bg-gray-100 text-gray-700';

            return (
              <Card key={fav.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/${locale}/document/${fav.id}`}
                      className="flex items-center gap-4 flex-1 group"
                    >
                      <div className={`p-3 rounded-xl ${colorClass}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium group-hover:text-snij-primary transition-colors line-clamp-1">
                          {fav.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="uppercase text-xs font-semibold">
                            {tSearch(`types.${fav.type}`)}
                          </span>
                          <span>•</span>
                          <span>{fav.numero}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(fav.date)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {t('addedOn') || 'Ajouté le'} {formatAddedDate(fav.addedAt)}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportPDF(fav)}
                        disabled={exporting === fav.id}
                      >
                        <Download
                          className={`h-4 w-4 ${exporting === fav.id ? 'animate-pulse' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFavorite(fav.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info box */}
      {count > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">{t('storageInfo') || 'Stockage local'}</p>
            <p className="text-blue-600">
              {t('storageDescription') ||
                'Vos favoris sont stockés localement dans votre navigateur. Ils ne seront pas synchronisés avec d\'autres appareils.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
