'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FileText, Scale, Gavel, Calendar, Hash, Folder, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, truncate } from '@/lib/utils';
import type { SearchResult } from '@/lib/api';

interface DocumentCardProps {
  document: SearchResult;
}

const typeConfig = {
  loi: {
    icon: FileText,
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    hoverBg: 'group-hover:bg-blue-100',
  },
  decret: {
    icon: Scale,
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    hoverBg: 'group-hover:bg-emerald-100',
  },
  jurisprudence: {
    icon: Gavel,
    gradient: 'from-purple-500 to-purple-600',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    hoverBg: 'group-hover:bg-purple-100',
  },
};

export function DocumentCard({ document }: DocumentCardProps) {
  const locale = useLocale();
  const t = useTranslations('search');

  const config = typeConfig[document.type] || typeConfig.loi;
  const Icon = config.icon;

  const scorePercent = Math.round(document.score * 100);

  return (
    <Link href={`/${locale}/document/${document.id}`} className="group block h-full">
      <Card className="h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white">
        {/* Top accent bar */}
        <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgLight} ${config.borderColor} border transition-colors ${config.hoverBg}`}>
              <Icon className={`h-4 w-4 ${config.textColor}`} />
              <span className={`text-xs font-semibold ${config.textColor}`}>
                {t(`types.${document.type}`)}
              </span>
            </div>

            {scorePercent > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                    style={{ width: `${Math.min(scorePercent, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {scorePercent}%
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-base text-gray-900 mb-3 line-clamp-2 group-hover:text-snij-primary transition-colors leading-snug">
            {document.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
            {truncate(document.excerpt || document.aiSummary || '', 150)}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {document.numero && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                <Hash className="h-3 w-3" />
                <span>{document.numero}</span>
              </div>
            )}
            {document.date && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(document.date, locale)}</span>
              </div>
            )}
            {document.domaine && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                <Folder className="h-3 w-3" />
                <span className="capitalize">{t(`domains.${document.domaine.id}`)}</span>
              </div>
            )}
          </div>

          {/* View link */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-snij-primary group-hover:underline">
              {locale === 'ar' ? 'عرض التفاصيل' : locale === 'fr' ? 'Voir les détails' : 'View details'}
            </span>
            <ArrowUpRight className="h-4 w-4 text-snij-primary opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
