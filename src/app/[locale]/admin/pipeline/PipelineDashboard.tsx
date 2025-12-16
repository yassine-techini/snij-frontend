'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Loader2,
  RefreshCw,
  Database,
  Server,
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Play,
  RotateCcw,
  Clock,
  FileText,
  Scale,
  Gavel,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminClient } from '@/lib/api';

interface PipelineStatus {
  drupal: { status: string; url: string };
  sync: { lastSync: Record<string, string | null>; documentsIndexed: number };
  storage: { d1: string; vectorize: string };
  documentCount: number;
}

interface SyncResult {
  processed: number;
  indexed: number;
  errors: string[];
  duration: number;
}

export function PipelineDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClient.isAuthenticated()) {
      router.push(`/${locale}/admin`);
      return;
    }
    loadStatus();
  }, [locale, router]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminClient.getPipelineStatus();
      if (result.success && result.data) {
        setStatus(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (incremental: boolean = true) => {
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const result = await adminClient.triggerSync({ incremental });
      if (result.success && result.data) {
        setSyncResult(result.data);
        loadStatus();
      } else {
        setError(result.error || 'Erreur lors de la synchronisation');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSyncing(false);
    }
  };

  const handleReindex = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réindexer tous les documents ? Cette opération peut prendre du temps.')) {
      return;
    }
    setReindexing(true);
    setSyncResult(null);
    setError(null);
    try {
      const result = await adminClient.triggerReindex();
      if (result.success && result.data) {
        setSyncResult(result.data);
        loadStatus();
      } else {
        setError(result.error || 'Erreur lors de la réindexation');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setReindexing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    return new Date(dateStr).toLocaleString('fr-FR');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const isOnline = status === 'online' || status === 'connected';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {isOnline ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {isOnline ? 'Connecté' : 'Hors ligne'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Pipeline de données</h1>
        </div>
        <Button variant="outline" onClick={loadStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {syncResult && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 text-blue-700">
          <h3 className="font-semibold mb-2">Résultat de la synchronisation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-500">Traités:</span> {syncResult.processed}
            </div>
            <div>
              <span className="text-blue-500">Indexés:</span> {syncResult.indexed}
            </div>
            <div>
              <span className="text-blue-500">Erreurs:</span> {syncResult.errors.length}
            </div>
            <div>
              <span className="text-blue-500">Durée:</span> {(syncResult.duration / 1000).toFixed(2)}s
            </div>
          </div>
          {syncResult.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600">
              {syncResult.errors.map((e, i) => (
                <div key={i}>• {e}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Architecture Diagram */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Architecture du Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-6 overflow-x-auto">
            <pre className="text-sm text-gray-700 whitespace-pre">
{`
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Sources de    │     │    Pipeline     │     │    Stockage     │
│    données      │────▶│    Engine       │────▶│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
  • Admin UI                • Validation                │
  • Scripts                 • Embedding (AI)      ┌─────┴─────┐
  • Drupal (désactivé)      • Indexation          │           │
                                                  ▼           ▼
                                              ┌───────┐  ┌──────────┐
                                              │  D1   │  │Vectorize │
                                              │(SQL)  │  │(Vectors) │
                                              └───────┘  └──────────┘
`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Drupal Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Source Drupal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">État</span>
                <StatusBadge status={status?.drupal.status || 'offline'} />
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {status?.drupal.url}
              </div>
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                Note: Drupal n'est pas configuré comme source active.
                Les données sont ajoutées via l'admin ou les scripts.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* D1 Database */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base D1 (SQLite)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">État</span>
                <StatusBadge status={status?.storage.d1 || 'offline'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Documents</span>
                <span className="font-semibold">{status?.documentCount || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Stockage des documents complets + recherche FTS5
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vectorize */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Vectorize (Embeddings)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">État</span>
                <StatusBadge status={status?.storage.vectorize || 'offline'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Modèle</span>
                <span className="text-xs font-mono">BGE-M3</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Recherche sémantique multilingue (ar/fr/en)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dernières synchronisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-medium">Lois</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(status?.sync.lastSync?.loi || null)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <Scale className="h-8 w-8 text-emerald-600" />
              <div>
                <div className="font-medium">Décrets</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(status?.sync.lastSync?.decret || null)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Gavel className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-medium">Jurisprudence</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(status?.sync.lastSync?.jurisprudence || null)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions du Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Play className="h-4 w-4" />
                Synchronisation incrémentale
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Synchronise uniquement les documents modifiés depuis la dernière sync.
                Rapide et recommandé pour une mise à jour régulière.
              </p>
              <Button onClick={() => handleSync(true)} disabled={syncing || reindexing}>
                {syncing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Lancer la sync
              </Button>
            </div>

            <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-700">
                <RotateCcw className="h-4 w-4" />
                Réindexation complète
              </h3>
              <p className="text-sm text-yellow-600 mb-4">
                Supprime et reconstruit tout l'index. Utilisez cette option si vous
                rencontrez des problèmes de données ou après une mise à jour majeure.
              </p>
              <Button
                variant="outline"
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                onClick={handleReindex}
                disabled={syncing || reindexing}
              >
                {reindexing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Réindexer tout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Documentation */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comment alimenter le système ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">1. Via l'interface Admin (recommandé)</h4>
              <p className="text-muted-foreground">
                Accédez à <Link href={`/${locale}/admin`} className="text-snij-primary hover:underline">/admin</Link> pour
                ajouter, modifier ou supprimer des documents manuellement.
                Chaque action met à jour automatiquement D1 et Vectorize.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">2. Via l'API REST</h4>
              <p className="text-muted-foreground mb-2">
                Endpoint: <code className="bg-gray-200 px-1 rounded">POST /api/admin/documents</code>
              </p>
              <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`curl -X POST https://snij-studio.yassine-techini.workers.dev/api/admin/documents \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "loi",
    "numero": "2024-01",
    "title": { "ar": "العنوان", "fr": "Titre" },
    "content": { "ar": "المحتوى", "fr": "Contenu" },
    "date": "2024-01-01",
    "domaine": "civil"
  }'`}
              </pre>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">3. Via scripts (batch)</h4>
              <p className="text-muted-foreground">
                Pour importer en masse, utilisez le script <code className="bg-gray-200 px-1 rounded">add-more-documents.ts</code> dans
                snij-foundry/scripts comme modèle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
