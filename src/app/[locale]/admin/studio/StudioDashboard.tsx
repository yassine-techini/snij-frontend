'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Search,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api';

const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL || 'https://snij-studio.yassine-techini.workers.dev';

interface RAGResponse {
  success: boolean;
  data?: {
    answer: string;
    sources: Array<{
      id: string;
      type: string;
      numero: string;
      title: string;
      relevance: number;
    }>;
    metadata?: {
      model: string;
      tokensUsed?: number;
      processingTime?: number;
    };
  };
  error?: string;
}

interface HealthStatus {
  status: string;
  checks: {
    kv: boolean;
    foundry: boolean;
    anthropic: boolean;
  };
}

export function StudioDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Health status
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // RAG Tester
  const [ragQuery, setRagQuery] = useState('');
  const [ragLanguage, setRagLanguage] = useState<'ar' | 'fr' | 'en'>('fr');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResponse, setRagResponse] = useState<RAGResponse | null>(null);
  const [ragError, setRagError] = useState('');

  // Stats
  const [testHistory, setTestHistory] = useState<Array<{
    query: string;
    language: string;
    success: boolean;
    time: number;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    if (!authClient.isAuthenticated()) {
      router.push(`/${locale}/admin`);
      return;
    }
    checkHealth();
    setLoading(false);
  }, [locale, router]);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch(`${STUDIO_URL}/health`);
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const testRAG = async () => {
    if (!ragQuery.trim()) return;

    setRagLoading(true);
    setRagError('');
    setRagResponse(null);

    const startTime = Date.now();

    try {
      const response = await fetch(`${STUDIO_URL}/api/rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: ragQuery,
          language: ragLanguage,
        }),
      });

      const data: RAGResponse = await response.json();
      const endTime = Date.now();

      setRagResponse(data);

      // Add to history
      setTestHistory((prev) => [
        {
          query: ragQuery,
          language: ragLanguage,
          success: data.success,
          time: endTime - startTime,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);

      if (!data.success) {
        setRagError(data.error || 'Unknown error');
      }
    } catch (error) {
      const endTime = Date.now();
      setRagError(error instanceof Error ? error.message : 'Request failed');
      setTestHistory((prev) => [
        {
          query: ragQuery,
          language: ragLanguage,
          success: false,
          time: endTime - startTime,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setRagLoading(false);
    }
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
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-purple-600" />
              Studio IA
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestion et test des agents IA et du pipeline RAG
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={checkHealth} disabled={healthLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Health Status */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className={`border-l-4 ${health?.status === 'healthy' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${health?.status === 'healthy' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {health?.status === 'healthy' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut Global</p>
                <p className="font-semibold capitalize">{health?.status || 'Inconnu'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${health?.checks?.kv ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${health?.checks?.kv ? 'bg-green-100' : 'bg-red-100'}`}>
                <Zap className={`h-5 w-5 ${health?.checks?.kv ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">KV Store</p>
                <p className="font-semibold">{health?.checks?.kv ? 'Connecté' : 'Déconnecté'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${health?.checks?.foundry ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${health?.checks?.foundry ? 'bg-green-100' : 'bg-red-100'}`}>
                <FileText className={`h-5 w-5 ${health?.checks?.foundry ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Foundry</p>
                <p className="font-semibold">{health?.checks?.foundry ? 'Connecté' : 'Déconnecté'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${health?.checks?.anthropic ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${health?.checks?.anthropic ? 'bg-green-100' : 'bg-red-100'}`}>
                <Sparkles className={`h-5 w-5 ${health?.checks?.anthropic ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Claude API</p>
                <p className="font-semibold">{health?.checks?.anthropic ? 'Configuré' : 'Non configuré'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* RAG Tester */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Testeur RAG
            </CardTitle>
            <CardDescription>
              Testez le système de Retrieval-Augmented Generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Langue</label>
              <div className="flex gap-2">
                {(['fr', 'ar', 'en'] as const).map((lang) => (
                  <Button
                    key={lang}
                    variant={ragLanguage === lang ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRagLanguage(lang)}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    {lang.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Question</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && testRAG()}
                  placeholder="Ex: Quelles sont les conditions du mariage en Tunisie?"
                  className="flex-1 p-2 border rounded-lg"
                  dir={ragLanguage === 'ar' ? 'rtl' : 'ltr'}
                />
                <Button onClick={testRAG} disabled={ragLoading || !ragQuery.trim()}>
                  {ragLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Sample Questions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Questions suggérées:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Protection des données personnelles',
                  'Création d\'entreprise',
                  'Droit du travail',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setRagQuery(q)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {ragError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {ragError}
              </div>
            )}

            {ragResponse?.success && ragResponse.data && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium mb-2">Réponse:</p>
                  <p className="text-sm whitespace-pre-wrap">{ragResponse.data.answer}</p>
                </div>

                {ragResponse.data.sources && ragResponse.data.sources.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Sources ({ragResponse.data.sources.length}):</p>
                    <div className="space-y-2">
                      {ragResponse.data.sources.map((source, i) => (
                        <div key={i} className="text-xs p-2 bg-white rounded border flex justify-between items-center">
                          <span>
                            <span className="font-medium">{source.type}</span> - {source.numero}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(source.relevance * 100)}% pertinent
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ragResponse.data.metadata && (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Modèle: {ragResponse.data.metadata.model}</span>
                    {ragResponse.data.metadata.processingTime && (
                      <span>Temps: {ragResponse.data.metadata.processingTime}ms</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique des tests
            </CardTitle>
            <CardDescription>
              Derniers tests effectués sur cette session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun test effectué</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testHistory.map((test, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      test.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{test.query}</p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="uppercase">{test.language}</span>
                          <span>{test.time}ms</span>
                        </div>
                      </div>
                      {test.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Capabilities */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Capacités du Studio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="h-6 w-6 text-purple-600" />
                <h3 className="font-semibold">RAG (Retrieval-Augmented Generation)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Génération de réponses contextualisées basées sur le corpus juridique tunisien avec
                Claude 3.5 Sonnet.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Search className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold">Recherche Sémantique</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Recherche vectorielle via BGE-M3 embeddings pour une compréhension profonde des
                requêtes juridiques.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold">Résumé Automatique</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Génération automatique de résumés pour les textes juridiques avec support
                multilingue (AR/FR/EN).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
