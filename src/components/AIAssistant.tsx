'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Send,
  Bot,
  User,
  Loader2,
  RefreshCw,
  FileText,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Scale,
  Gavel,
  Zap,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studioClient } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    title: string;
    type: string;
    excerpt: string;
    relevance: number;
  }>;
  confidence?: number;
  classification?: {
    domain: string;
    intent: string;
  };
  fromCache?: boolean;
}

// Labels pour les domaines juridiques
const domainLabels: Record<string, Record<string, string>> = {
  travail: { fr: 'Droit du travail', ar: 'قانون الشغل', en: 'Labor Law' },
  commercial: { fr: 'Droit commercial', ar: 'القانون التجاري', en: 'Commercial Law' },
  fiscal: { fr: 'Droit fiscal', ar: 'القانون الجبائي', en: 'Tax Law' },
  civil: { fr: 'Droit civil', ar: 'القانون المدني', en: 'Civil Law' },
  penal: { fr: 'Droit pénal', ar: 'القانون الجزائي', en: 'Criminal Law' },
  administratif: { fr: 'Droit administratif', ar: 'القانون الإداري', en: 'Administrative Law' },
  constitutionnel: { fr: 'Droit constitutionnel', ar: 'القانون الدستوري', en: 'Constitutional Law' },
  famille: { fr: 'Droit de la famille', ar: 'قانون الأسرة', en: 'Family Law' },
  environnement: { fr: "Droit de l'environnement", ar: 'قانون البيئة', en: 'Environmental Law' },
  propriete: { fr: 'Propriété intellectuelle', ar: 'الملكية الفكرية', en: 'Intellectual Property' },
  donnees: { fr: 'Protection des données', ar: 'حماية المعطيات', en: 'Data Protection' },
  general: { fr: 'Général', ar: 'عام', en: 'General' },
};

export function AIAssistant() {
  const locale = useLocale();
  const t = useTranslations('assistant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create placeholder for streaming response
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      sources: [],
      confidence: 0,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const stream = studioClient.askQuestionStream(userMessage.content, locale);
      let fullContent = '';
      let sources: Message['sources'] = [];
      let confidence = 0;

      for await (const event of stream) {
        const { type, data } = event as { type: string; data: Record<string, unknown> };

        switch (type) {
          case 'start':
            // Stream started - capture classification
            if (data.classification) {
              const classification = data.classification as { domain: string; intent: string; confidence?: number };
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, classification: { domain: classification.domain, intent: classification.intent } }
                    : msg
                )
              );
            }
            break;

          case 'sources':
            // Sources received
            if (data.sources && Array.isArray(data.sources)) {
              sources = data.sources.map((s: Record<string, unknown>) => ({
                id: String(s.id || ''),
                title: String(s.title || ''),
                type: String(s.type || ''),
                excerpt: String(s.relevantPassage || s.excerpt || ''),
                relevance: Number(s.relevance || 0),
              }));
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, sources } : msg
                )
              );
            }
            break;

          case 'token':
            // Token received - append to content
            if (data.token) {
              fullContent += String(data.token);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              );
            }
            break;

          case 'done':
            // Stream completed
            if (data.confidence !== undefined) {
              confidence = Number(data.confidence);
            }
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      confidence,
                      fromCache: data.fromCache === true,
                    }
                  : msg
              )
            );
            break;

          case 'error':
            // Error occurred
            const errorMsg =
              locale === 'ar'
                ? 'عذرا، حدث خطأ. يرجى المحاولة مرة أخرى.'
                : locale === 'fr'
                ? "Désolé, une erreur s'est produite. Veuillez réessayer."
                : 'Sorry, an error occurred. Please try again.';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: errorMsg }
                  : msg
              )
            );
            break;
        }
      }

      // If no content was streamed, show error
      if (!fullContent) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    locale === 'ar'
                      ? 'لم يتم العثور على إجابة. يرجى المحاولة مرة أخرى.'
                      : locale === 'fr'
                      ? 'Aucune réponse trouvée. Veuillez réessayer.'
                      : 'No answer found. Please try again.',
                }
              : msg
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  locale === 'ar'
                    ? 'عذرا، حدث خطأ. يرجى المحاولة مرة أخرى.'
                    : locale === 'fr'
                    ? "Désolé, une erreur s'est produite. Veuillez réessayer."
                    : 'Sorry, an error occurred. Please try again.',
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  const examples = [
    { key: 'q1', text: t('examples.q1'), icon: Scale },
    { key: 'q2', text: t('examples.q2'), icon: FileText },
    { key: 'q3', text: t('examples.q3'), icon: Gavel },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'loi':
        return <FileText className="h-3 w-3 text-blue-500" />;
      case 'decret':
        return <Scale className="h-3 w-3 text-emerald-500" />;
      case 'jurisprudence':
        return <Gavel className="h-3 w-3 text-purple-500" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gradient-to-b from-gray-50 to-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-snij-secondary to-snij-secondary/90 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">{t('title')}</h2>
            <p className="text-xs text-white/70">{t('subtitle')}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 me-2" />
            {t('newChat')}
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-snij-primary/10 to-snij-secondary/10 flex items-center justify-center mb-6">
              <MessageCircle className="h-10 w-10 text-snij-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {locale === 'ar'
                ? 'كيف يمكنني مساعدتك؟'
                : locale === 'fr'
                ? 'Comment puis-je vous aider ?'
                : 'How can I help you?'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              {locale === 'ar'
                ? 'اطرح أي سؤال حول التشريع التونسي وسأساعدك في العثور على المعلومات ذات الصلة.'
                : locale === 'fr'
                ? 'Posez toute question sur la législation tunisienne et je vous aiderai à trouver les informations pertinentes.'
                : 'Ask any question about Tunisian legislation and I will help you find relevant information.'}
            </p>

            <div className="w-full max-w-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t('examples.title')}
              </h4>
              <div className="space-y-3">
                {examples.map(({ key, text, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleExampleClick(text)}
                    className="w-full text-start p-4 rounded-xl border border-gray-200 bg-white hover:border-snij-primary/50 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-snij-primary/10 transition-colors">
                        <Icon className="h-4 w-4 text-gray-500 group-hover:text-snij-primary transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 group-hover:text-gray-900">
                          {text}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-snij-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, idx) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-4 animate-slide-up',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className={cn(
                  'flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm',
                  message.role === 'user'
                    ? 'bg-snij-primary text-white'
                    : 'bg-gradient-to-br from-snij-secondary to-snij-secondary/80 text-white'
                )}
              >
                {message.role === 'user' ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl shadow-sm',
                  message.role === 'user'
                    ? 'bg-snij-primary text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 rounded-tl-sm'
                )}
              >
                {/* Classification & Cache badges for assistant messages */}
                {message.role === 'assistant' && (message.classification || message.fromCache) && (
                  <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
                    {message.classification && message.classification.domain !== 'general' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-snij-primary/10 text-snij-primary text-xs font-medium">
                        <Tag className="h-3 w-3" />
                        {domainLabels[message.classification.domain]?.[locale] || message.classification.domain}
                      </span>
                    )}
                    {message.fromCache && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        <Zap className="h-3 w-3" />
                        {locale === 'ar' ? 'إجابة سريعة' : locale === 'fr' ? 'Réponse rapide' : 'Quick response'}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <p
                    className={cn(
                      'whitespace-pre-wrap leading-relaxed',
                      message.role === 'assistant' && 'text-gray-700'
                    )}
                  >
                    {message.content}
                  </p>
                </div>

                {message.sources && message.sources.length > 0 && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50 rounded-b-2xl">
                    <h4 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      {t('sources')} ({message.sources.length})
                    </h4>
                    <div className="space-y-2">
                      {message.sources.map((source, sourceIdx) => (
                        <Link
                          key={source.id}
                          href={`/${locale}/document/${source.id}`}
                          className="block p-3 rounded-lg bg-white border border-gray-100 hover:border-snij-primary/30 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 h-5 w-5 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                              {sourceIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(source.type)}
                                <span className="text-sm font-medium text-gray-900 truncate group-hover:text-snij-primary transition-colors">
                                  {source.title}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {source.excerpt}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {message.confidence !== undefined && message.confidence > 0 && (
                  <div className="px-4 pb-3 flex items-center gap-2 text-xs text-gray-400">
                    <span>
                      {locale === 'ar'
                        ? 'مستوى الثقة:'
                        : locale === 'fr'
                        ? 'Niveau de confiance :'
                        : 'Confidence:'}
                    </span>
                    <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-snij-primary to-snij-accent rounded-full"
                        style={{ width: `${message.confidence * 100}%` }}
                      />
                    </div>
                    <span>{Math.round(message.confidence * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-4 animate-fade-in">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-snij-secondary to-snij-secondary/80 text-white flex items-center justify-center shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-snij-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-snij-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-snij-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-500">{t('thinking')}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
        <p className="text-xs text-center text-amber-700">{t('disclaimer')}</p>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              disabled={isLoading}
              className="h-12 pe-12 rounded-xl border-gray-200 focus:border-snij-primary focus:ring-snij-primary/20"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="absolute end-1 top-1 h-10 w-10 rounded-lg bg-snij-primary hover:bg-snij-primary/90"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
