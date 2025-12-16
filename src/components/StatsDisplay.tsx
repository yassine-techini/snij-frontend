'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Scale, Gavel } from 'lucide-react';
import { getPublicStats, type PublicStats } from '@/lib/api';

interface StatsDisplayProps {
  locale: string;
  className?: string;
}

export function StatsDisplay({ locale, className = '' }: StatsDisplayProps) {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await getPublicStats();
        if (response.success && response.stats) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${Math.floor(num / 1000)}K+`;
    }
    return num > 0 ? `${num}+` : '0';
  };

  const labels = {
    laws: locale === 'ar' ? 'القوانين' : locale === 'fr' ? 'Lois' : 'Laws',
    decrees: locale === 'ar' ? 'المراسيم' : locale === 'fr' ? 'Décrets' : 'Decrees',
    jurisprudence: locale === 'ar' ? 'الاجتهادات' : locale === 'fr' ? 'Jurisprudences' : 'Jurisprudence',
  };

  const displayStats = [
    {
      icon: BookOpen,
      value: loading ? '...' : formatNumber(stats?.byType.loi ?? 0),
      label: labels.laws,
    },
    {
      icon: Scale,
      value: loading ? '...' : formatNumber(stats?.byType.decret ?? 0),
      label: labels.decrees,
    },
    {
      icon: Gavel,
      value: loading ? '...' : formatNumber(stats?.byType.jurisprudence ?? 0),
      label: labels.jurisprudence,
    },
  ];

  return (
    <div className={`grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto ${className}`}>
      {displayStats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm mb-3">
            <Icon className="h-6 w-6 text-snij-accent" />
          </div>
          <div className={`text-2xl md:text-3xl font-bold text-white mb-1 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {value}
          </div>
          <div className="text-xs md:text-sm text-gray-400">{label}</div>
        </div>
      ))}
    </div>
  );
}
