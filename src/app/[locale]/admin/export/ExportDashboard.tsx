'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileText,
  FileJson,
  Table,
  Loader2,
  CheckCircle,
  Scale,
  Gavel,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authClient, getPublicStats, type PublicStats } from '@/lib/api';

const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL || 'https://snij-foundry.yassine-techini.workers.dev';

type ExportType = 'documents' | 'audit';
type ExportFormat = 'json' | 'csv';
type DocumentType = 'all' | 'loi' | 'decret' | 'jurisprudence';

interface ExportHistory {
  type: ExportType;
  format: ExportFormat;
  documentType?: DocumentType;
  timestamp: Date;
  count?: number;
}

export function ExportDashboard() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PublicStats | null>(null);

  // Export state
  const [exportType, setExportType] = useState<ExportType>('documents');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [documentType, setDocumentType] = useState<DocumentType>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  // History
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);

  useEffect(() => {
    if (!authClient.isAuthenticated()) {
      router.push(`/${locale}/admin`);
      return;
    }

    loadStats();
    setLoading(false);
  }, [locale, router]);

  const loadStats = async () => {
    const result = await getPublicStats();
    if (result.success && result.stats) {
      setStats(result.stats);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError('');
    setExportSuccess(false);

    try {
      let url = `${FOUNDRY_URL}/query/export`;

      if (exportType === 'audit') {
        url = `${FOUNDRY_URL}/query/export/audit`;
      }

      const params = new URLSearchParams();
      params.set('format', exportFormat);

      if (exportType === 'documents' && documentType !== 'all') {
        params.set('type', documentType);
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (exportFormat === 'csv') {
        // Download CSV file
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
          `snij-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();

        setExportSuccess(true);
        addToHistory();
      } else {
        // Download JSON file
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `snij-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();

        setExportSuccess(true);
        addToHistory(data.count);
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const addToHistory = (count?: number) => {
    setExportHistory((prev) => [
      {
        type: exportType,
        format: exportFormat,
        documentType: exportType === 'documents' ? documentType : undefined,
        timestamp: new Date(),
        count,
      },
      ...prev.slice(0, 9),
    ]);
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
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/${locale}/admin`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Download className="h-8 w-8 text-snij-primary" />
            Export de Données
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Exportez les documents et logs d&apos;audit en JSON ou CSV
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-snij-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-snij-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lois</p>
                  <p className="text-2xl font-bold">{stats.byType.loi}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Scale className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Décrets</p>
                  <p className="text-2xl font-bold">{stats.byType.decret}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Gavel className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jurisprudences</p>
                  <p className="text-2xl font-bold">{stats.byType.jurisprudence}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration de l&apos;Export</CardTitle>
            <CardDescription>
              Sélectionnez le type de données et le format souhaité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de données</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportType('documents')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportType === 'documents'
                      ? 'border-snij-primary bg-snij-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className={`h-6 w-6 mx-auto mb-2 ${
                    exportType === 'documents' ? 'text-snij-primary' : 'text-gray-400'
                  }`} />
                  <p className="font-medium">Documents</p>
                  <p className="text-xs text-muted-foreground">
                    Lois, décrets, jurisprudences
                  </p>
                </button>
                <button
                  onClick={() => setExportType('audit')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportType === 'audit'
                      ? 'border-snij-primary bg-snij-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ClipboardList className={`h-6 w-6 mx-auto mb-2 ${
                    exportType === 'audit' ? 'text-snij-primary' : 'text-gray-400'
                  }`} />
                  <p className="font-medium">Logs d&apos;Audit</p>
                  <p className="text-xs text-muted-foreground">
                    Historique des actions
                  </p>
                </button>
              </div>
            </div>

            {/* Document Type Filter */}
            {exportType === 'documents' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Filtrer par type</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'loi', 'decret', 'jurisprudence'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDocumentType(type)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        documentType === type
                          ? 'border-snij-primary bg-snij-primary text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type === 'all' ? 'Tous' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Export Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    exportFormat === 'json'
                      ? 'border-snij-primary bg-snij-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileJson className={`h-5 w-5 ${
                    exportFormat === 'json' ? 'text-snij-primary' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <p className="font-medium">JSON</p>
                    <p className="text-xs text-muted-foreground">Données structurées</p>
                  </div>
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    exportFormat === 'csv'
                      ? 'border-snij-primary bg-snij-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Table className={`h-5 w-5 ${
                    exportFormat === 'csv' ? 'text-snij-primary' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <p className="font-medium">CSV</p>
                    <p className="text-xs text-muted-foreground">Compatible Excel</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              {isExporting ? 'Export en cours...' : 'Télécharger'}
            </Button>

            {/* Status Messages */}
            {exportError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {exportError}
              </div>
            )}

            {exportSuccess && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Export téléchargé avec succès!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des Exports</CardTitle>
            <CardDescription>
              Derniers exports effectués sur cette session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exportHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun export effectué</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((exp, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {exp.format === 'json' ? (
                        <FileJson className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Table className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {exp.type === 'documents' ? 'Documents' : 'Audit Logs'}
                          {exp.documentType && exp.documentType !== 'all' && (
                            <span className="text-muted-foreground ml-1">
                              ({exp.documentType})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exp.timestamp.toLocaleTimeString('fr-FR')}
                          {exp.count && ` - ${exp.count} éléments`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs uppercase font-medium text-gray-500">
                      {exp.format}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
