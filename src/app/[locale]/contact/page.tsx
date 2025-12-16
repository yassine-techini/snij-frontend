'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setStatus('success');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: MapPin, label: t('info.address') },
    { icon: Phone, label: t('info.phone') },
    { icon: Mail, label: t('info.email') },
    { icon: Clock, label: t('info.hours') },
  ];

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
  ];

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="py-12">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {locale === 'ar' ? 'تم الإرسال!' : locale === 'en' ? 'Sent!' : 'Envoyé !'}
            </h2>
            <p className="text-muted-foreground mb-6">{t('form.success')}</p>
            <Button onClick={() => setStatus('idle')}>
              {locale === 'ar' ? 'رسالة جديدة' : locale === 'en' ? 'New message' : 'Nouveau message'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-snij-primary/10 rounded-2xl mb-6">
          <Mail className="h-12 w-12 text-snij-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {locale === 'ar' ? 'أرسل رسالة' : locale === 'en' ? 'Send a message' : 'Envoyer un message'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('form.name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('form.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t('form.subject')}</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('form.message')}</Label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('form.sending')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('form.submit')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info & FAQ */}
        <div className="space-y-8">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('info.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo.map(({ icon: Icon, label }, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="p-2 bg-snij-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-snij-primary" />
                  </div>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                {t('faq.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {faqs.map(({ q, a }, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{q}</span>
                    {expandedFaq === idx ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      expandedFaq === idx ? 'max-h-40' : 'max-h-0'
                    )}
                  >
                    <p className="px-4 pb-4 text-muted-foreground text-sm">{a}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
