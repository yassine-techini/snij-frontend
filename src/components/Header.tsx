'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Search, MessageSquare, FileText, Home } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations('common');
  const locale = useLocale();

  const navItems = [
    { href: `/${locale}`, label: t('home'), icon: Home },
    { href: `/${locale}/search`, label: t('search'), icon: Search },
    { href: `/${locale}/documents`, label: t('documents'), icon: FileText },
    { href: `/${locale}/assistant`, label: t('assistant'), icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-snij-primary text-white font-bold">
            ب
          </div>
          <span className="hidden font-bold text-snij-secondary sm:inline-block">SNIJ</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
