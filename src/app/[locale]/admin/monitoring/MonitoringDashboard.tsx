'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Loader2,
  RefreshCw,
  ArrowLeft,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Database,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Bell,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authClient, getPublicStats } from '@/lib/api';

interface ServiceHealth {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  lastCheck: Date;
  details?: {
    database?: { status: string; latency: number };
    kv?: { status: string; latency: number };
    documentCount?: number;
    recentActivity?: number;
  };
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface LatencyHistory {
  timestamp: Date;
  foundry: number;
  studio: number;
  frontend: number;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  service: string;
  timestamp: Date;
}

export function MonitoringDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [stats, setStats] = useState<{ total: number; byType: Record<string, number> } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [latencyHistory, setLatencyHistory] = useState<LatencyHistory[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkServiceHealth = useCallback(async (name: string, url: string): Promise<ServiceHealth> => {
    const startTime = performance.now();
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });
      const latency = Math.round(performance.now() - startTime);

      let details;
      if (name === 'Foundry API' && response.ok) {
        try {
          const data = await response.json();
          details = {
            database: data.services?.database,
            kv: data.services?.kv,
            documentCount: data.metrics?.documentCount,
            recentActivity: data.metrics?.recentActivity,
          };
        } catch {
          // ignore parse errors
        }
      }

      return {
        name,
        url,
        status: response.ok ? 'online' : 'degraded',
        latency,
        lastCheck: new Date(),
        details,
      };
    } catch {
      return {
        name,
        url,
        status: 'offline',
        latency: 0,
        lastCheck: new Date(),
      };
    }
  }, []);

  const addAlert = useCallback((type: 'warning' | 'error' | 'info', message: string, service: string) => {
    const newAlert: SystemAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      service,
      timestamp: new Date(),
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setIsConnected(true);

    try {
      // Check all services health
      const serviceChecks = await Promise.all([
        checkServiceHealth('Foundry API', 'https://snij-foundry.yassine-techini.workers.dev/health'),
        checkServiceHealth('Studio API', 'https://snij-studio.yassine-techini.workers.dev/health'),
        checkServiceHealth('Frontend', 'https://snij-frontend.pages.dev/'),
      ]);

      setServices(serviceChecks);

      // Update latency history
      setLatencyHistory(prev => {
        const newEntry: LatencyHistory = {
          timestamp: new Date(),
          foundry: serviceChecks[0].latency,
          studio: serviceChecks[1].latency,
          frontend: serviceChecks[2].latency,
        };
        return [...prev.slice(-19), newEntry]; // Keep last 20 entries
      });

      // Check for service issues and create alerts
      serviceChecks.forEach(service => {
        if (service.status === 'offline') {
          addAlert('error', `${service.name} est hors ligne`, service.name);
        } else if (service.status === 'degraded') {
          addAlert('warning', `${service.name} est en mode dégradé`, service.name);
        } else if (service.latency > 1000) {
          addAlert('warning', `${service.name} a une latence élevée (${service.latency}ms)`, service.name);
        }
      });

      // Load stats
      const statsResponse = await getPublicStats();
      if (statsResponse.success && statsResponse.stats) {
        setStats({
          total: statsResponse.stats.total,
          byType: statsResponse.stats.byType,
        });
      }

      // Calculate metrics
      const avgLatency = Math.round(
        serviceChecks.reduce((acc, s) => acc + s.latency, 0) / serviceChecks.length
      );
      const onlineCount = serviceChecks.filter(s => s.status === 'online').length;
      const foundryService = serviceChecks.find(s => s.name === 'Foundry API');

      setMetrics([
        {
          name: 'Temps de réponse moyen',
          value: avgLatency,
          unit: 'ms',
          trend: avgLatency < 200 ? 'stable' : avgLatency < 500 ? 'up' : 'down',
          description: 'Latence moyenne des services',
        },
        {
          name: 'Disponibilité',
          value: Math.round((onlineCount / serviceChecks.length) * 100),
          unit: '%',
          trend: onlineCount === serviceChecks.length ? 'stable' : 'down',
          description: 'Pourcentage de services en ligne',
        },
        {
          name: 'Documents indexés',
          value: foundryService?.details?.documentCount || statsResponse.stats?.total || 0,
          unit: '',
          trend: 'stable',
          description: 'Nombre total de documents',
        },
        {
          name: 'Activité récente',
          value: foundryService?.details?.recentActivity || 0,
          unit: '/h',
          trend: (foundryService?.details?.recentActivity || 0) > 0 ? 'up' : 'stable',
          description: 'Actions dans la dernière heure',
        },
      ]);

      setLastRefresh(new Date());
    } catch {
      setIsConnected(false);
      addAlert('error', 'Impossible de contacter les services', 'Monitoring');
    } finally {
      setLoading(false);
    }
  }, [checkServiceHealth, addAlert]);

  useEffect(() => {
    if (!authClient.isAuthenticated()) {
      router.push(`/${locale}/admin`);
      return;
    }
    loadData();
  }, [locale, router, loadData]);

  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadData, 15000); // Refresh every 15s
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, loadData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 border-yellow-200';
      default:
        return 'bg-red-100 border-red-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-green-500" />;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return 'text-green-600';
    if (latency < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const maxLatency = Math.max(
    ...latencyHistory.flatMap(h => [h.foundry, h.studio, h.frontend]),
    100
  );

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

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
              <Activity className="h-8 w-8 text-snij-primary" />
              Monitoring DevFactory
            </h1>
            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  Surveillance en temps réel
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  Connexion perdue
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto (15s)' : 'Manuel'}
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Last refresh time */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Clock className="h-4 w-4" />
        <span>Dernière mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}</span>
        {autoRefresh && <span className="text-xs">(actualisation automatique)</span>}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Alertes Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    alert.type === 'error'
                      ? 'bg-red-100 text-red-800'
                      : alert.type === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alert.type === 'error' ? (
                      <XCircle className="h-4 w-4" />
                    ) : alert.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    <span>{alert.message}</span>
                    <span className="text-xs opacity-70">
                      ({alert.timestamp.toLocaleTimeString('fr-FR')})
                    </span>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="hover:opacity-70"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.name}</p>
                  <p className="text-3xl font-bold mt-1">
                    {metric.value}
                    <span className="text-lg font-normal text-muted-foreground ml-1">
                      {metric.unit}
                    </span>
                  </p>
                </div>
                {getTrendIcon(metric.trend)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latency Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Historique de Latence
          </CardTitle>
          <CardDescription>
            Temps de réponse des services (dernières {latencyHistory.length} mesures)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40 mb-4">
            {latencyHistory.map((entry, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5">
                  <div
                    className="bg-blue-500 rounded-t transition-all"
                    style={{ height: `${(entry.foundry / maxLatency) * 120}px` }}
                    title={`Foundry: ${entry.foundry}ms`}
                  />
                  <div
                    className="bg-purple-500 transition-all"
                    style={{ height: `${(entry.studio / maxLatency) * 120}px` }}
                    title={`Studio: ${entry.studio}ms`}
                  />
                  <div
                    className="bg-emerald-500 rounded-b transition-all"
                    style={{ height: `${(entry.frontend / maxLatency) * 120}px` }}
                    title={`Frontend: ${entry.frontend}ms`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Foundry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>Studio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>Frontend</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            État des Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.name}
                className={`p-4 rounded-lg border ${getStatusColor(service.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.url}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-lg ${getLatencyColor(service.latency)}`}>
                      {service.status !== 'offline' ? `${service.latency}ms` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.status === 'online'
                        ? 'En ligne'
                        : service.status === 'degraded'
                        ? 'Dégradé'
                        : 'Hors ligne'}
                    </p>
                  </div>
                </div>
                {/* Foundry sub-services */}
                {service.name === 'Foundry API' && service.details && (
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Database</span>
                      <div className="flex items-center gap-1">
                        {service.details.database?.status === 'healthy' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        )}
                        <span>{service.details.database?.latency || 0}ms</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">KV Store</span>
                      <div className="flex items-center gap-1">
                        {service.details.kv?.status === 'healthy' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        )}
                        <span>{service.details.kv?.latency || 0}ms</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Documents</span>
                      <div className="font-medium">{service.details.documentCount || 0}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Activité/h</span>
                      <div className="font-medium">{service.details.recentActivity || 0}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Foundry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Foundry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rôle</span>
                <span>Ontologie & Data</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base de données</span>
                <span>D1 (SQLite)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vectorisation</span>
                <span>Cloudflare Vectorize</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Endpoints</span>
                <span>/query, /search, /sync</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Studio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Studio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rôle</span>
                <span>IA & RAG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modèle LLM</span>
                <span>Claude 3.5 Sonnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Embeddings</span>
                <span>BGE-M3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Endpoints</span>
                <span>/api/search, /api/rag</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frontend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              Frontend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Framework</span>
                <span>Next.js 15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hébergement</span>
                <span>Cloudflare Pages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Langues</span>
                <span>AR, FR, EN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages</span>
                <span>SSG + Dynamique</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistiques des Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-snij-primary">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{stats.byType.loi || 0}</p>
                <p className="text-sm text-muted-foreground">Lois</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600">{stats.byType.decret || 0}</p>
                <p className="text-sm text-muted-foreground">Décrets</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{stats.byType.jurisprudence || 0}</p>
                <p className="text-sm text-muted-foreground">Jurisprudences</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Accès Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <a
              href="https://snij-foundry.yassine-techini.workers.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Foundry API</p>
              <p className="text-xs text-muted-foreground">API principale</p>
            </a>
            <a
              href="https://snij-studio.yassine-techini.workers.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-medium">Studio API</p>
              <p className="text-xs text-muted-foreground">RAG & IA</p>
            </a>
            <a
              href="https://dash.cloudflare.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Cpu className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="font-medium">Cloudflare</p>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </a>
            <Link
              href={`/${locale}/admin/pipeline`}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="font-medium">Pipeline</p>
              <p className="text-xs text-muted-foreground">Sync & Index</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
