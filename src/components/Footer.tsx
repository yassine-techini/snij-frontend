'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Search,
  MessageSquare,
  FileText,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Heart,
  Globe,
  Shield,
  Scale,
  Landmark,
  GitCompare,
} from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: `/${locale}/search`, label: locale === 'ar' ? 'بحث' : locale === 'fr' ? 'Recherche' : 'Search', icon: Search },
    { href: `/${locale}/documents`, label: locale === 'ar' ? 'الوثائق' : locale === 'fr' ? 'Documents' : 'Documents', icon: FileText },
    { href: `/${locale}/compare`, label: locale === 'ar' ? 'مقارنة' : locale === 'fr' ? 'Comparer' : 'Compare', icon: GitCompare },
    { href: `/${locale}/assistant`, label: locale === 'ar' ? 'المساعد' : locale === 'fr' ? 'Assistant' : 'Assistant', icon: MessageSquare },
  ];

  const legalLinks = [
    { href: `/${locale}/about`, label: t('links.about') },
    { href: `/${locale}/terms`, label: t('links.terms') },
    { href: `/${locale}/privacy`, label: t('links.privacy') },
  ];

  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-snij-primary shadow-lg">
                <Scale className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight">SNIJ</span>
                <span className="block text-xs text-gray-400 -mt-0.5">
                  {locale === 'ar' ? 'النظام الوطني للمعلومات القانونية' : locale === 'fr' ? 'Système National d\'Information Juridique' : 'National Legal Information System'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              {t('ministry')}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Shield className="h-4 w-4" />
              <span>{locale === 'ar' ? 'مصادر رسمية موثقة' : locale === 'fr' ? 'Sources officielles vérifiées' : 'Verified official sources'}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Scale className="h-4 w-4 text-snij-accent" />
              {locale === 'ar' ? 'الروابط السريعة' : locale === 'fr' ? 'Liens rapides' : 'Quick Links'}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors group"
                  >
                    <span className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
              <FileText className="h-4 w-4 text-snij-accent" />
              {locale === 'ar' ? 'معلومات' : locale === 'fr' ? 'Informations' : 'Information'}
            </h4>
            <ul className="space-y-3">
              {legalLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('links.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Globe className="h-4 w-4 text-snij-accent" />
              {locale === 'ar' ? 'اتصل بنا' : locale === 'fr' ? 'Contactez-nous' : 'Contact Us'}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {locale === 'ar'
                    ? 'تونس، الجمهورية التونسية'
                    : locale === 'fr'
                    ? 'Tunis, République Tunisienne'
                    : 'Tunis, Republic of Tunisia'}
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:contact@snij.tn" className="hover:text-white transition-colors">
                  contact@snij.tn
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+21671000000" className="hover:text-white transition-colors">
                  +216 71 000 000
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-700 bg-slate-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>&copy; {currentYear} SNIJ</span>
              <span className="hidden sm:inline">-</span>
              <span className="hidden sm:inline">{t('copyright')}</span>
            </div>

            {/* Made with love */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{locale === 'ar' ? 'صنع بـ' : locale === 'fr' ? 'Fait avec' : 'Made with'}</span>
              <Heart className="h-3 w-3 text-snij-primary fill-snij-primary animate-pulse" />
              <span>{locale === 'ar' ? 'في تونس' : locale === 'fr' ? 'en Tunisie' : 'in Tunisia'}</span>
            </div>

            {/* Language indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Globe className="h-3 w-3" />
              <span>
                {locale === 'ar' ? 'العربية' : locale === 'fr' ? 'Français' : 'English'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
