'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, MessageSquare, FileText, Home, Menu, X, ChevronRight, Scale, Heart, Bell, GitCompare } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';

export function Header() {
  const t = useTranslations('common');
  const tFav = useTranslations('favorites');
  const tAlerts = useTranslations('alerts');
  const locale = useLocale();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { count: favoritesCount } = useFavorites();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const compareLabel = locale === 'ar' ? 'مقارنة' : locale === 'fr' ? 'Comparer' : 'Compare';

  const navItems = [
    { href: `/${locale}`, label: t('home'), icon: Home },
    { href: `/${locale}/search`, label: t('search'), icon: Search },
    { href: `/${locale}/documents`, label: t('documents'), icon: FileText },
    { href: `/${locale}/compare`, label: compareLabel, icon: GitCompare },
    { href: `/${locale}/assistant`, label: t('assistant'), icon: MessageSquare },
    { href: `/${locale}/favorites`, label: tFav('title'), icon: Heart, badge: favoritesCount },
    { href: `/${locale}/alerts`, label: tAlerts('title'), icon: Bell },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-lg shadow-lg shadow-gray-200/50 border-b border-gray-100'
            : 'bg-white/80 backdrop-blur-sm'
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-snij-primary to-snij-primary/80 text-white shadow-lg shadow-snij-primary/25 group-hover:shadow-snij-primary/40 transition-shadow duration-300">
                <Scale className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-snij-primary to-snij-accent opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-snij-secondary tracking-tight">SNIJ</span>
              <span className="block text-[10px] text-muted-foreground -mt-1 tracking-wide">
                {locale === 'ar' ? 'النظام الوطني' : locale === 'fr' ? 'Système National' : 'National System'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive(href)
                    ? 'text-snij-primary'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                )}
              >
                <span className="relative">
                  <Icon className={cn('h-4 w-4', isActive(href) && 'text-snij-primary', Icon === Heart && badge && badge > 0 && 'text-red-500 fill-red-500')} />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                <span>{label}</span>
                {isActive(href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-snij-primary to-snij-accent rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side - Language Switcher & Mobile Menu */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300',
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          'fixed top-16 inset-x-0 z-40 md:hidden transition-all duration-300 ease-out',
          isMobileMenuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        )}
      >
        <div className="bg-white shadow-xl rounded-b-2xl mx-4 overflow-hidden border border-gray-100">
          <nav className="p-2">
            {navItems.map(({ href, label, icon: Icon, badge }, idx) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200 animate-slide-up',
                  isActive(href)
                    ? 'bg-snij-primary/10 text-snij-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center relative',
                      isActive(href)
                        ? 'bg-snij-primary text-white'
                        : Icon === Heart && badge && badge > 0
                        ? 'bg-red-100 text-red-500'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', Icon === Heart && badge && badge > 0 && 'fill-current')} />
                    {badge !== undefined && badge > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span>{label}</span>
                </div>
                <ChevronRight
                  className={cn(
                    'h-5 w-5 rtl:rotate-180',
                    isActive(href) ? 'text-snij-primary' : 'text-gray-300'
                  )}
                />
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-center text-muted-foreground">
              {locale === 'ar'
                ? 'البوابة الوطنية للمعلومات القانونية'
                : locale === 'fr'
                ? 'Portail National d\'Information Juridique'
                : 'National Legal Information Portal'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
