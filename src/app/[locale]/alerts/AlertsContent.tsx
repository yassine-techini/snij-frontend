'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Bell,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Scale,
  Gavel,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FOUNDRY_API = 'https://snij-foundry.yassine-techini.workers.dev';

const DOMAINS = [
  { id: 'constitutionnel', icon: '⚖️' },
  { id: 'civil', icon: '📜' },
  { id: 'penal', icon: '⚠️' },
  { id: 'commercial', icon: '💼' },
  { id: 'administratif', icon: '🏛️' },
  { id: 'travail', icon: '👷' },
  { id: 'fiscal', icon: '💰' },
  { id: 'famille', icon: '👨‍👩‍👧' },
  { id: 'environnement', icon: '🌿' },
];

const DOCUMENT_TYPES = [
  { id: 'loi', Icon: FileText, color: 'bg-blue-100 text-blue-700' },
  { id: 'decret', Icon: Scale, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'jurisprudence', Icon: Gavel, color: 'bg-purple-100 text-purple-700' },
];

const FREQUENCIES = ['immediate', 'daily', 'weekly'] as const;

export function AlertsContent() {
  const locale = useLocale();
  const t = useTranslations('alerts');
  const tSearch = useTranslations('search');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domains: [] as string[],
    types: ['loi', 'decret', 'jurisprudence'] as string[],
    keywords: '',
    frequency: 'weekly' as (typeof FREQUENCIES)[number],
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`${FOUNDRY_API}/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          language: locale,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(t('successMessage'));
      } else {
        setStatus('error');
        setMessage(data.error || t('errorMessage'));
      }
    } catch {
      setStatus('error');
      setMessage(t('errorMessage'));
    }
  };

  const toggleDomain = (domain: string) => {
    setFormData((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((d) => d !== domain)
        : [...prev.domains, domain],
    }));
  };

  const toggleType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="py-12">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('successTitle')}</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button onClick={() => setStatus('idle')}>{t('newSubscription')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-snij-primary/10 rounded-xl mb-4">
          <Bell className="h-8 w-8 text-snij-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('namePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder={t('emailPlaceholder')}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('documentTypes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {DOCUMENT_TYPES.map(({ id, Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleType(id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                    formData.types.includes(id)
                      ? 'border-snij-primary bg-snij-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className={cn('p-1 rounded', color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{tSearch(`types.${id}`)}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legal Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('domains')}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({t('domainsHint')})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map(({ id, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleDomain(id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
                    formData.domains.includes(id)
                      ? 'bg-snij-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  )}
                >
                  <span>{icon}</span>
                  <span>{tSearch(`domains.${id}`)}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('keywords')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value }))}
              placeholder={t('keywordsPlaceholder')}
            />
            <p className="text-sm text-muted-foreground mt-2">{t('keywordsHint')}</p>
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('frequency')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {FREQUENCIES.map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, frequency: freq }))}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 transition-all',
                    formData.frequency === freq
                      ? 'border-snij-primary bg-snij-primary/10 text-snij-primary font-medium'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {t(`frequencies.${freq}`)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>{message}</span>
          </div>
        )}

        {/* Submit */}
        <Button type="submit" size="lg" className="w-full" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('subscribing')}
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              {t('subscribe')}
            </>
          )}
        </Button>

        {/* Disclaimer */}
        <p className="text-sm text-center text-muted-foreground">{t('disclaimer')}</p>
      </form>
    </div>
  );
}
