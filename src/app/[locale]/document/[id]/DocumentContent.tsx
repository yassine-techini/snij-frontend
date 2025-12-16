'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Loader2,
  FileText,
  Scale,
  Gavel,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Share2,
  Check,
  Heart,
  HeartOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { studioClient, type Document } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { generateDocumentPDF } from '@/lib/pdf-export';
import { useFavorites } from '@/hooks/useFavorites';

const typeIcons = {
  loi: FileText,
  decret: Scale,
  jurisprudence: Gavel,
};

const statusIcons = {
  en_vigueur: CheckCircle,
  abroge: XCircle,
  modifie: AlertCircle,
};

const statusColors = {
  en_vigueur: 'text-green-600',
  abroge: 'text-red-600',
  modifie: 'text-yellow-600',
};

interface DocumentContentProps {
  documentId: string;
}

export function DocumentContent({ documentId }: DocumentContentProps) {
  const locale = useLocale();
  const t = useTranslations('document');
  const tSearch = useTranslations('search');
  const { isFavorite, toggleFavorite, isLoaded: favoritesLoaded } = useFavorites();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'content'>('summary');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [favoriteAnimating, setFavoriteAnimating] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studioClient.getDocument(documentId);
      if (response.success && response.data) {
        setDocument(response.data);
      } else {
        setError(response.error || 'Document not found');
      }
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!document) return;
    setDownloading(true);

    try {
      // Helper to extract localized value
      const getValue = (
        field: string | { ar: string; fr: string; en?: string } | undefined,
        fallbackAr?: string,
        fallbackFr?: string
      ): string => {
        if (!field) return fallbackAr || fallbackFr || '';
        if (typeof field === 'string') return field;
        const key = locale as 'ar' | 'fr' | 'en';
        return field[key] || field.ar || field.fr || '';
      };

      const docTitle = typeof document.title === 'string'
        ? (locale === 'ar' && document.titleAr ? document.titleAr :
           locale === 'fr' && document.titleFr ? document.titleFr :
           document.title)
        : getValue(document.title);
      const docContent = getValue(document.content);
      const docSummary = getValue(document.aiSummary);
      const docDomaine = typeof document.domaine === 'string'
        ? document.domaine
        : document.domaine?.id || '';

      // Generate professional PDF
      generateDocumentPDF(
        {
          id: document.id,
          type: document.type,
          numero: document.numero,
          title: docTitle,
          content: docContent,
          summary: docSummary,
          date: document.date,
          domaine: docDomaine,
          statut: document.statut,
          jortRef: document.jortRef,
        },
        {
          locale,
          includeHeader: true,
          includeSummary: true,
          includeContent: true,
        }
      );
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  }, [document, locale]);

  const handleToggleFavorite = useCallback(() => {
    if (!document) return;

    // Helper to extract localized value
    const getValue = (
      field: string | { ar: string; fr: string; en?: string } | undefined
    ): string => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      const key = locale as 'ar' | 'fr' | 'en';
      return field[key] || field.ar || field.fr || '';
    };

    const docTitle = typeof document.title === 'string'
      ? (locale === 'ar' && document.titleAr ? document.titleAr :
         locale === 'fr' && document.titleFr ? document.titleFr :
         document.title)
      : getValue(document.title);

    setFavoriteAnimating(true);
    toggleFavorite({
      id: document.id,
      type: document.type,
      numero: document.numero,
      title: docTitle,
      date: document.date,
    });
    setTimeout(() => setFavoriteAnimating(false), 300);
  }, [document, locale, toggleFavorite]);

  const handleShare = useCallback(async () => {
    if (!document) return;

    // Helper to extract localized value
    const getValue = (
      field: string | { ar: string; fr: string; en?: string } | undefined
    ): string => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      const key = locale as 'ar' | 'fr' | 'en';
      return field[key] || field.ar || field.fr || '';
    };

    const docTitle = typeof document.title === 'string'
      ? (locale === 'ar' && document.titleAr ? document.titleAr :
         locale === 'fr' && document.titleFr ? document.titleFr :
         document.title)
      : getValue(document.title);
    const url = window.location.href;

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: docTitle,
          text: `${document.type} ${document.numero} - ${docTitle}`,
          url: url,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to copy
      }
    }

    // Fallback to copy URL
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [document, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">{error}</h1>
        <Button variant="outline" onClick={loadDocument}>
          Retry
        </Button>
      </div>
    );
  }

  const TypeIcon = typeIcons[document.type as keyof typeof typeIcons] || FileText;
  const statut = document.statut || 'en_vigueur';
  const StatusIcon = statusIcons[statut as keyof typeof statusIcons] || CheckCircle;
  const statusColor = statusColors[statut as keyof typeof statusColors] || 'text-gray-600';

  // Helper to extract value from multilingual field or string
  const getLocalizedValue = (
    field: string | { ar: string; fr: string; en?: string } | undefined,
    fallbackAr?: string,
    fallbackFr?: string
  ): string => {
    if (!field) return fallbackAr || fallbackFr || '';
    if (typeof field === 'string') return field;
    const localeKey = locale as 'ar' | 'fr' | 'en';
    return field[localeKey] || field.ar || field.fr || '';
  };

  // Extract title - handle both formats
  const title = typeof document.title === 'string'
    ? (locale === 'ar' && document.titleAr ? document.titleAr :
       locale === 'fr' && document.titleFr ? document.titleFr :
       document.title)
    : getLocalizedValue(document.title);

  // Extract content
  const content = getLocalizedValue(document.content);

  // Extract summary
  const summary = getLocalizedValue(document.aiSummary);

  // Extract domaine
  const domaineId = typeof document.domaine === 'string'
    ? document.domaine
    : document.domaine?.id || '';

  // Safe status key for translation
  const statusKey = statut.replace('_', '') || 'envigueur';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <TypeIcon className="h-4 w-4" />
          <span>{tSearch(`types.${document.type}`)}</span>
          <span>•</span>
          <span>{document.numero}</span>
        </div>

        <h1 className="text-3xl font-bold mb-4">{title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(document.date, locale)}</span>
          </div>

          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            <span>{tSearch(`domains.${domaineId}`)}</span>
          </div>

          <div className={`flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="h-4 w-4" />
            <span>{t(`status.${statusKey}`)}</span>
          </div>

          {document.jortRef && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{document.jortRef}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 me-2" />
            )}
            {t('download')} PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            {copied ? (
              <Check className="h-4 w-4 me-2 text-green-600" />
            ) : (
              <Share2 className="h-4 w-4 me-2" />
            )}
            {copied ? t('copied') || 'Copié!' : t('share')}
          </Button>
          {favoritesLoaded && (
            <Button
              variant={isFavorite(document.id) ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleFavorite}
              className={`transition-transform ${favoriteAnimating ? 'scale-110' : ''} ${
                isFavorite(document.id)
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : ''
              }`}
            >
              {isFavorite(document.id) ? (
                <Heart className="h-4 w-4 me-2 fill-current" />
              ) : (
                <HeartOff className="h-4 w-4 me-2" />
              )}
              {isFavorite(document.id) ? t('favorited') || 'Favori' : t('addFavorite') || 'Ajouter aux favoris'}
            </Button>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'border-b-2 border-snij-primary text-snij-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('summary')}
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${
              activeTab === 'content'
                ? 'border-b-2 border-snij-primary text-snij-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('content')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === 'summary' ? (
            summary ? (
              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed">{summary}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('summary')} ...</p>
            )
          ) : (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap">{content}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
