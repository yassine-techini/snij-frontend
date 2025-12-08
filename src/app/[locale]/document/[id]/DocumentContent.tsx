'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { studioClient, type Document } from '@/lib/api';
import { formatDate } from '@/lib/utils';

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

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'content'>('summary');

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

  const TypeIcon = typeIcons[document.type] || FileText;
  const StatusIcon = statusIcons[document.statut] || CheckCircle;
  const statusColor = statusColors[document.statut] || 'text-gray-600';

  const title = document.title[locale as 'ar' | 'fr' | 'en'] || document.title.ar;
  const content = document.content[locale as 'ar' | 'fr' | 'en'] || document.content.ar;
  const summary = document.aiSummary?.[locale as 'ar' | 'fr' | 'en'] || document.aiSummary?.ar;

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
            <span>{tSearch(`domains.${document.domaine}`)}</span>
          </div>

          <div className={`flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="h-4 w-4" />
            <span>{t(`status.${document.statut.replace('_', '')}`)}</span>
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-2" />
            {t('download')}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 me-2" />
            {t('share')}
          </Button>
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
