'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  FileText,
  Scale,
  Gavel,
  Users,
  Search,
  MessageSquare,
  Globe,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authClient, getPublicStats, getAnalytics, type PublicStats, type AnalyticsData } from '@/lib/api';

interface DomainStat {
  domaine: string;
  count: number;
}

export function AnalyticsDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        getPublicStats(),
        getAnalytics(),
      ]);
      if (statsResponse.success && statsResponse.stats) {
        setStats(statsResponse.stats);
      }
      if (analyticsResponse.success && analyticsResponse.analytics) {
        setAnalytics(analyticsResponse.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authClient.isAuthenticated()) {
      router.push(`/${locale}/admin`);
      return;
    }
    loadData();
  }, [locale, router, loadData]);

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const getBarWidth = (value: number, max: number) => {
    if (max === 0) return 0;
    return Math.round((value / max) * 100);
  };

  const domainLabels: Record<string, string> = {
    administratif: 'Administratif',
    civil: 'Civil',
    commercial: 'Commercial',
    penal: 'Pénal',
    travail: 'Travail',
    constitutionnel: 'Constitutionnel',
    environnement: 'Environnement',
    famille: 'Famille',
    fiscal: 'Fiscal',
    autres: 'Autres',
  };

  const domainColors: Record<string, string> = {
    administratif: 'bg-blue-500',
    civil: 'bg-green-500',
    commercial: 'bg-purple-500',
    penal: 'bg-red-500',
    travail: 'bg-orange-500',
    constitutionnel: 'bg-indigo-500',
    environnement: 'bg-teal-500',
    famille: 'bg-pink-500',
    fiscal: 'bg-yellow-500',
    autres: 'bg-gray-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
      </div>
    );
  }

  const maxDomainCount = Math.max(...(stats?.byDomain.map(d => d.count) || [1]));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/admin`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-snij-primary" />
              Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Statistiques et analyses de la plateforme SNIJ
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-snij-primary/10 to-snij-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-snij-primary/20 rounded-xl">
                <FileText className="h-6 w-6 text-snij-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-3xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lois</p>
                <p className="text-3xl font-bold">{stats?.byType.loi || 0}</p>
                <p className="text-xs text-blue-600">
                  {getPercentage(stats?.byType.loi || 0, stats?.total || 0)}% du total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Scale className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Décrets</p>
                <p className="text-3xl font-bold">{stats?.byType.decret || 0}</p>
                <p className="text-xs text-emerald-600">
                  {getPercentage(stats?.byType.decret || 0, stats?.total || 0)}% du total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Gavel className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jurisprudences</p>
                <p className="text-3xl font-bold">{stats?.byType.jurisprudence || 0}</p>
                <p className="text-xs text-purple-600">
                  {getPercentage(stats?.byType.jurisprudence || 0, stats?.total || 0)}% du total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Documents by Type - Pie Chart visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              {/* Simple pie chart using CSS */}
              <div
                className="relative w-48 h-48 rounded-full"
                style={{
                  background: `conic-gradient(
                    #3b82f6 0% ${getPercentage(stats?.byType.loi || 0, stats?.total || 0)}%,
                    #10b981 ${getPercentage(stats?.byType.loi || 0, stats?.total || 0)}% ${getPercentage(stats?.byType.loi || 0, stats?.total || 0) + getPercentage(stats?.byType.decret || 0, stats?.total || 0)}%,
                    #8b5cf6 ${getPercentage(stats?.byType.loi || 0, stats?.total || 0) + getPercentage(stats?.byType.decret || 0, stats?.total || 0)}% 100%
                  )`,
                }}
              >
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{stats?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Lois</span>
                </div>
                <span className="font-semibold">{stats?.byType.loi || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Décrets</span>
                </div>
                <span className="font-semibold">{stats?.byType.decret || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Jurisprudences</span>
                </div>
                <span className="font-semibold">{stats?.byType.jurisprudence || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents by Domain - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Répartition par Domaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.byDomain.map((domain: DomainStat) => (
                <div key={domain.domaine} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{domainLabels[domain.domaine] || domain.domaine}</span>
                    <span className="font-semibold">{domain.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${domainColors[domain.domaine] || 'bg-gray-500'} rounded-full transition-all duration-500`}
                      style={{ width: `${getBarWidth(domain.count, maxDomainCount)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Usage Insights */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights Plateforme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Search className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Recherche</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Recherche full-text FTS5 et sémantique via embeddings BGE-M3 pour une précision maximale.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Assistant IA</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                RAG avec Claude 3.5 Sonnet pour des réponses contextualisées basées sur le corpus juridique.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold">Multilingue</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Support complet arabe, français et anglais avec traduction automatique des contenus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents by Year */}
      {analytics?.byYear && analytics.byYear.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Documents par Année
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.byYear.map((item) => {
                const maxYearCount = Math.max(...analytics.byYear.map(y => y.count));
                return (
                  <div key={item.year} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.year}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-snij-primary to-snij-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${getBarWidth(item.count, maxYearCount)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        {/* Documents by Status */}
        {analytics?.byStatus && analytics.byStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Statut des Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.byStatus.map((item) => {
                  const statusLabels: Record<string, string> = {
                    en_vigueur: 'En vigueur',
                    abroge: 'Abrogé',
                    modifie: 'Modifié',
                  };
                  const statusColors: Record<string, string> = {
                    en_vigueur: 'bg-green-500',
                    abroge: 'bg-red-500',
                    modifie: 'bg-yellow-500',
                  };
                  return (
                    <div key={item.statut} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[item.statut] || 'bg-gray-500'}`} />
                        <span>{statusLabels[item.statut] || item.statut}</span>
                      </div>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Documents */}
        {analytics?.recentDocuments && analytics.recentDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents Récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentDocuments.map((doc) => {
                  const typeLabels: Record<string, string> = {
                    loi: 'Loi',
                    decret: 'Décret',
                    jurisprudence: 'Jurisprudence',
                  };
                  const typeColors: Record<string, string> = {
                    loi: 'text-blue-600 bg-blue-50',
                    decret: 'text-emerald-600 bg-emerald-50',
                    jurisprudence: 'text-purple-600 bg-purple-50',
                  };
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[doc.type] || 'text-gray-600 bg-gray-50'}`}>
                          {typeLabels[doc.type] || doc.type}
                        </span>
                        <span className="font-medium text-sm">{doc.numero}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {doc.date_promulgation || 'N/A'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Résumé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <p className="text-2xl font-bold text-snij-primary">{stats?.byDomain.length || 0}</p>
              <p className="text-sm text-muted-foreground">Domaines juridiques</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-sm text-muted-foreground">Types de documents</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">3</p>
              <p className="text-sm text-muted-foreground">Langues supportées</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{analytics?.byYear?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Années couvertes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
