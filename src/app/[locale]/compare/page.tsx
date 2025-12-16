'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { studioClient, type Document } from '@/lib/api';
import {
  GitCompare,
  Search,
  FileText,
  ArrowLeftRight,
  Loader2,
  Plus,
  Minus,
  Equal,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: { left?: number; right?: number };
}

function diffTexts(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  // Simple line-by-line diff
  let oldIdx = 0;
  let newIdx = 0;
  let leftLineNum = 1;
  let rightLineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx >= oldLines.length) {
      // Remaining new lines are additions
      result.push({
        type: 'added',
        content: newLines[newIdx],
        lineNumber: { right: rightLineNum++ },
      });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      // Remaining old lines are removals
      result.push({
        type: 'removed',
        content: oldLines[oldIdx],
        lineNumber: { left: leftLineNum++ },
      });
      oldIdx++;
    } else if (oldLines[oldIdx] === newLines[newIdx]) {
      // Lines are the same
      result.push({
        type: 'unchanged',
        content: oldLines[oldIdx],
        lineNumber: { left: leftLineNum++, right: rightLineNum++ },
      });
      oldIdx++;
      newIdx++;
    } else {
      // Try to find a match ahead
      let foundOld = -1;
      let foundNew = -1;

      // Look ahead in new lines for current old line
      for (let i = newIdx + 1; i < Math.min(newIdx + 5, newLines.length); i++) {
        if (newLines[i] === oldLines[oldIdx]) {
          foundNew = i;
          break;
        }
      }

      // Look ahead in old lines for current new line
      for (let i = oldIdx + 1; i < Math.min(oldIdx + 5, oldLines.length); i++) {
        if (oldLines[i] === newLines[newIdx]) {
          foundOld = i;
          break;
        }
      }

      if (foundNew !== -1 && (foundOld === -1 || foundNew - newIdx <= foundOld - oldIdx)) {
        // Add new lines as additions
        for (let i = newIdx; i < foundNew; i++) {
          result.push({
            type: 'added',
            content: newLines[i],
            lineNumber: { right: rightLineNum++ },
          });
        }
        newIdx = foundNew;
      } else if (foundOld !== -1) {
        // Add old lines as removals
        for (let i = oldIdx; i < foundOld; i++) {
          result.push({
            type: 'removed',
            content: oldLines[i],
            lineNumber: { left: leftLineNum++ },
          });
        }
        oldIdx = foundOld;
      } else {
        // No match found, mark as changed
        result.push({
          type: 'removed',
          content: oldLines[oldIdx],
          lineNumber: { left: leftLineNum++ },
        });
        result.push({
          type: 'added',
          content: newLines[newIdx],
          lineNumber: { right: rightLineNum++ },
        });
        oldIdx++;
        newIdx++;
      }
    }
  }

  return result;
}

function getDocumentTitle(doc: Document, locale: string): string {
  if (typeof doc.title === 'object') {
    return locale === 'ar' ? doc.title.ar : doc.title.fr || doc.title.ar;
  }
  return doc.titleAr || doc.titleFr || doc.title;
}

function getDocumentContent(doc: Document, locale: string): string {
  if (typeof doc.content === 'object') {
    return locale === 'ar' ? doc.content.ar : doc.content.fr || doc.content.ar;
  }
  return doc.content;
}

export default function ComparePage() {
  const locale = useLocale();
  const t = useTranslations('compare');

  const [leftDoc, setLeftDoc] = useState<Document | null>(null);
  const [rightDoc, setRightDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'left' | 'right' | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const labels = {
    title: locale === 'ar' ? 'مقارنة النصوص القانونية' : locale === 'fr' ? 'Comparaison de textes' : 'Text Comparison',
    subtitle:
      locale === 'ar'
        ? 'قارن بين نسختين من الوثائق القانونية لمعرفة التغييرات'
        : locale === 'fr'
        ? 'Comparez deux versions de documents juridiques pour identifier les changements'
        : 'Compare two versions of legal documents to identify changes',
    selectLeft:
      locale === 'ar' ? 'اختر النص الأول' : locale === 'fr' ? 'Sélectionner le texte 1' : 'Select text 1',
    selectRight:
      locale === 'ar' ? 'اختر النص الثاني' : locale === 'fr' ? 'Sélectionner le texte 2' : 'Select text 2',
    search: locale === 'ar' ? 'بحث...' : locale === 'fr' ? 'Rechercher...' : 'Search...',
    noResults:
      locale === 'ar' ? 'لم يتم العثور على نتائج' : locale === 'fr' ? 'Aucun résultat' : 'No results found',
    original: locale === 'ar' ? 'النص الأصلي' : locale === 'fr' ? 'Texte original' : 'Original text',
    modified: locale === 'ar' ? 'النص المعدل' : locale === 'fr' ? 'Texte modifié' : 'Modified text',
    added: locale === 'ar' ? 'مضاف' : locale === 'fr' ? 'Ajouté' : 'Added',
    removed: locale === 'ar' ? 'محذوف' : locale === 'fr' ? 'Supprimé' : 'Removed',
    unchanged: locale === 'ar' ? 'بدون تغيير' : locale === 'fr' ? 'Inchangé' : 'Unchanged',
    startCompare:
      locale === 'ar'
        ? 'اختر وثيقتين لبدء المقارنة'
        : locale === 'fr'
        ? 'Sélectionnez deux documents pour comparer'
        : 'Select two documents to compare',
    linesChanged:
      locale === 'ar' ? 'سطور تم تغييرها' : locale === 'fr' ? 'lignes modifiées' : 'lines changed',
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await studioClient.getDocuments(undefined, 20, 0);
      if (response.success && response.data?.results) {
        // Filter by search query
        const filtered = response.data.results.filter((doc) => {
          const title = getDocumentTitle(doc, locale).toLowerCase();
          const content = getDocumentContent(doc, locale).toLowerCase();
          return title.includes(query.toLowerCase()) || content.includes(query.toLowerCase());
        });
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectDocument = (doc: Document) => {
    if (selectingFor === 'left') {
      setLeftDoc(doc);
    } else if (selectingFor === 'right') {
      setRightDoc(doc);
    }
    setSelectingFor(null);
    setShowDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const diff = useMemo(() => {
    if (!leftDoc || !rightDoc) return [];
    const leftContent = getDocumentContent(leftDoc, locale);
    const rightContent = getDocumentContent(rightDoc, locale);
    return diffTexts(leftContent, rightContent);
  }, [leftDoc, rightDoc, locale]);

  const stats = useMemo(() => {
    const added = diff.filter((d) => d.type === 'added').length;
    const removed = diff.filter((d) => d.type === 'removed').length;
    const unchanged = diff.filter((d) => d.type === 'unchanged').length;
    return { added, removed, unchanged };
  }, [diff]);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-snij-primary/10 rounded-2xl mb-6">
          <GitCompare className="h-12 w-12 text-snij-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{labels.title}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{labels.subtitle}</p>
      </div>

      {/* Document Selection */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Left Document */}
        <Card className={cn('transition-all', selectingFor === 'left' && 'ring-2 ring-snij-primary')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {labels.original}
              </span>
              {leftDoc && (
                <Button variant="ghost" size="icon" onClick={() => setLeftDoc(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leftDoc ? (
              <div className="space-y-2">
                <p className="font-medium">{getDocumentTitle(leftDoc, locale)}</p>
                <p className="text-sm text-muted-foreground">
                  {leftDoc.type} - {leftDoc.numero}
                </p>
              </div>
            ) : (
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setSelectingFor('left');
                    setShowDropdown(true);
                  }}
                >
                  {labels.selectLeft}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compare Icon */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10 mt-16">
          <div className="p-3 bg-white border rounded-full shadow-lg">
            <ArrowLeftRight className="h-6 w-6 text-snij-primary" />
          </div>
        </div>

        {/* Right Document */}
        <Card className={cn('transition-all', selectingFor === 'right' && 'ring-2 ring-snij-primary')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {labels.modified}
              </span>
              {rightDoc && (
                <Button variant="ghost" size="icon" onClick={() => setRightDoc(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rightDoc ? (
              <div className="space-y-2">
                <p className="font-medium">{getDocumentTitle(rightDoc, locale)}</p>
                <p className="text-sm text-muted-foreground">
                  {rightDoc.type} - {rightDoc.numero}
                </p>
              </div>
            ) : (
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setSelectingFor('right');
                    setShowDropdown(true);
                  }}
                >
                  {labels.selectRight}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search Dropdown */}
      {showDropdown && selectingFor && (
        <Card className="mb-8 max-w-xl mx-auto">
          <CardContent className="pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder={labels.search}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              {!loading && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-center text-muted-foreground py-4">{labels.noResults}</p>
              )}
              {searchResults.map((doc) => (
                <button
                  key={doc.id}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => selectDocument(doc)}
                >
                  <p className="font-medium">{getDocumentTitle(doc, locale)}</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.type} - {doc.numero} - {doc.date}
                  </p>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => {
                setShowDropdown(false);
                setSelectingFor(null);
              }}
            >
              {locale === 'ar' ? 'إلغاء' : locale === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {leftDoc && rightDoc ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              <Plus className="h-4 w-4" />
              <span>
                {stats.added} {labels.added}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg">
              <Minus className="h-4 w-4" />
              <span>
                {stats.removed} {labels.removed}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
              <Equal className="h-4 w-4" />
              <span>
                {stats.unchanged} {labels.unchanged}
              </span>
            </div>
          </div>

          {/* Diff View */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[600px]">
                {diff.map((line, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex font-mono text-sm border-b last:border-0',
                      line.type === 'added' && 'bg-green-50',
                      line.type === 'removed' && 'bg-red-50',
                      line.type === 'unchanged' && 'bg-white'
                    )}
                  >
                    <div className="w-12 px-2 py-1 text-xs text-gray-400 border-r bg-gray-50 text-center shrink-0">
                      {line.lineNumber.left || ''}
                    </div>
                    <div className="w-12 px-2 py-1 text-xs text-gray-400 border-r bg-gray-50 text-center shrink-0">
                      {line.lineNumber.right || ''}
                    </div>
                    <div className="w-8 px-2 py-1 text-center shrink-0">
                      {line.type === 'added' && <Plus className="h-4 w-4 text-green-600 mx-auto" />}
                      {line.type === 'removed' && <Minus className="h-4 w-4 text-red-600 mx-auto" />}
                    </div>
                    <div className="flex-1 px-3 py-1 whitespace-pre-wrap break-all">{line.content || ' '}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="max-w-xl mx-auto">
          <CardContent className="py-12 text-center">
            <GitCompare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-muted-foreground">{labels.startCompare}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
