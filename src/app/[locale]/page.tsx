import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import {
  Search,
  MessageSquare,
  FileText,
  Scale,
  Gavel,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Globe,
  ChevronRight,
  Zap,
  Users,
  Building2,
} from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { RecentDocuments } from '@/components/RecentDocuments';
import { StatsDisplay } from '@/components/StatsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { locales } from '@/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePageContent locale={locale} />;
}

function HomePageContent({ locale }: { locale: string }) {
  const t = useTranslations('home');

  const features = [
    {
      icon: Search,
      title: t('features.search.title'),
      description: t('features.search.description'),
      href: `/${locale}/search`,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      icon: MessageSquare,
      title: t('features.assistant.title'),
      description: t('features.assistant.description'),
      href: `/${locale}/assistant`,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      icon: FileText,
      title: t('features.documents.title'),
      description: t('features.documents.description'),
      href: `/${locale}/documents`,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
  ];


  const highlights = [
    { icon: Sparkles, text: locale === 'ar' ? 'بحث ذكي بالذكاء الاصطناعي' : locale === 'fr' ? 'Recherche IA' : 'AI Search' },
    { icon: Shield, text: locale === 'ar' ? 'مصادر موثقة' : locale === 'fr' ? 'Sources officielles' : 'Official sources' },
    { icon: Clock, text: locale === 'ar' ? 'تحديث يومي' : locale === 'fr' ? 'Mis à jour' : 'Updated daily' },
    { icon: Globe, text: locale === 'ar' ? 'متعدد اللغات' : locale === 'fr' ? 'Multilingue' : 'Multilingual' },
  ];

  const trustedBy = [
    { icon: Building2, text: locale === 'ar' ? 'الوزارات' : locale === 'fr' ? 'Ministères' : 'Ministries' },
    { icon: Gavel, text: locale === 'ar' ? 'المحاكم' : locale === 'fr' ? 'Tribunaux' : 'Courts' },
    { icon: Users, text: locale === 'ar' ? 'المحامون' : locale === 'fr' ? 'Avocats' : 'Lawyers' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section - Modern Gradient Design */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background with gradient and pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-snij-primary/30" />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-snij-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-snij-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-snij-primary/10 to-snij-accent/10 rounded-full blur-3xl" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Official Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-10 animate-fade-in">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-snij-primary">
                <Scale className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white/90">
                {locale === 'ar' ? 'الجمهورية التونسية - البوابة الوطنية للمعلومات القانونية' : locale === 'fr' ? 'République Tunisienne - Portail National d\'Information Juridique' : 'Tunisian Republic - National Legal Information Portal'}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 animate-slide-up">
              <span className="text-white">{locale === 'ar' ? 'النظام الوطني' : locale === 'fr' ? 'Système National' : 'National System'}</span>
              <br />
              <span className="bg-gradient-to-r from-snij-primary via-snij-accent to-amber-400 bg-clip-text text-transparent">
                {locale === 'ar' ? 'للمعلومات القانونية' : locale === 'fr' ? 'd\'Information Juridique' : 'of Legal Information'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: '100ms' }}>
              {locale === 'ar'
                ? 'وصولك الموحد إلى التشريعات والقوانين والاجتهادات القضائية التونسية'
                : locale === 'fr'
                ? 'Votre accès unifié aux législations, lois et jurisprudences tunisiennes'
                : 'Your unified access to Tunisian legislation, laws, and jurisprudence'}
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <SearchBar size="large" />
            </div>

            {/* Highlight Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
              {highlights.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Icon className="h-4 w-4 text-snij-accent" />
                  <span className="text-sm font-medium text-gray-200">{text}</span>
                </div>
              ))}
            </div>

            {/* Quick Stats - Real data from DB */}
            <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
              <StatsDisplay locale={locale} />
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 100V50C240 80 480 90 720 80C960 70 1200 50 1440 40V100H0Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 px-4 bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {locale === 'ar' ? 'موثوق من قبل' : locale === 'fr' ? 'Utilisé par' : 'Trusted by'}
            </span>
            <div className="flex items-center gap-8 md:gap-12">
              {trustedBy.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-gray-600">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Documents Section */}
      <RecentDocuments />

      {/* Features Section - Modern Cards */}
      <section className="py-24 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-snij-primary/10 text-snij-primary text-sm font-semibold mb-6">
              <Zap className="h-4 w-4" />
              {locale === 'ar' ? 'أدوات متطورة' : locale === 'fr' ? 'Outils Avancés' : 'Advanced Tools'}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {locale === 'ar' ? 'خدماتنا' : locale === 'fr' ? 'Nos Services' : 'Our Services'}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {locale === 'ar'
                ? 'أدوات متطورة للوصول إلى المعلومات القانونية التونسية'
                : locale === 'fr'
                ? 'Des outils avancés pour accéder aux informations juridiques tunisiennes'
                : 'Advanced tools to access Tunisian legal information'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map(({ icon: Icon, title, description, href, gradient, bgGradient }) => (
              <Link key={title} href={href} className="group">
                <Card className="relative h-full border-0 shadow-lg shadow-slate-200/50 bg-white overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-2">
                  {/* Gradient accent on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <CardHeader className="relative pb-4 pt-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 group-hover:text-snij-primary transition-colors">
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative pb-8">
                    <p className="text-gray-600 mb-6 text-base leading-relaxed">{description}</p>
                    <div className="flex items-center text-snij-primary font-semibold group-hover:gap-4 gap-2 transition-all duration-300">
                      <span>{locale === 'ar' ? 'اكتشف المزيد' : locale === 'fr' ? 'En savoir plus' : 'Learn more'}</span>
                      <ChevronRight className="h-5 w-5 rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Modern Design */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-snij-primary/40" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-snij-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-snij-accent/20 rounded-full blur-3xl" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <Sparkles className="h-4 w-4 text-snij-accent" />
              <span className="text-sm font-medium text-white/90">
                {locale === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : locale === 'fr' ? 'Propulsé par l\'IA' : 'Powered by AI'}
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              {locale === 'ar'
                ? 'هل لديك سؤال قانوني؟'
                : locale === 'fr'
                ? 'Vous avez une question juridique ?'
                : 'Have a legal question?'}
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              {locale === 'ar'
                ? 'استخدم مساعدنا الذكي للحصول على إجابات فورية مبنية على التشريع التونسي'
                : locale === 'fr'
                ? 'Utilisez notre assistant IA pour obtenir des réponses instantanées basées sur la législation tunisienne'
                : 'Use our AI assistant to get instant answers based on Tunisian legislation'}
            </p>
            <Link href={`/${locale}/assistant`}>
              <Button size="lg" className="bg-white text-snij-primary hover:bg-gray-100 text-lg px-10 py-7 h-auto shadow-2xl shadow-black/20 font-semibold group">
                <MessageSquare className="h-5 w-5 me-3 group-hover:scale-110 transition-transform" />
                {locale === 'ar' ? 'ابدأ المحادثة' : locale === 'fr' ? 'Démarrer la conversation' : 'Start conversation'}
                <ArrowRight className="h-5 w-5 ms-3 rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
