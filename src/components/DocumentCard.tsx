'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FileText, Scale, Gavel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, truncate } from '@/lib/utils';
import type { SearchResult } from '@/lib/api';

interface DocumentCardProps {
  document: SearchResult;
}

const typeIcons = {
  loi: FileText,
  decret: Scale,
  jurisprudence: Gavel,
};

const typeColors = {
  loi: 'text-blue-600 bg-blue-50',
  decret: 'text-green-600 bg-green-50',
  jurisprudence: 'text-purple-600 bg-purple-50',
};

export function DocumentCard({ document }: DocumentCardProps) {
  const locale = useLocale();
  const t = useTranslations('search');

  const Icon = typeIcons[document.type] || FileText;
  const colorClass = typeColors[document.type] || 'text-gray-600 bg-gray-50';

  return (
    <Link href={`/${locale}/document/${document.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
              <Icon className="h-3.5 w-3.5" />
              <span>{t(`types.${document.type}`)}</span>
            </div>
            {document.score && (
              <span className="text-xs text-muted-foreground">
                {Math.round(document.score * 100)}%
              </span>
            )}
          </div>
          <CardTitle className="text-base leading-tight mt-2">
            {document.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {truncate(document.excerpt, 150)}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {document.numero && <span>{document.numero}</span>}
            {document.date && <span>{formatDate(document.date, locale)}</span>}
            {document.domaine && (
              <span className="capitalize">{t(`domains.${document.domaine}`)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
