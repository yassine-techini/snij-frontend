'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  placeholder?: string;
  size?: 'default' | 'large';
  className?: string;
}

export function SearchBar({ placeholder, size = 'default', className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('home');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const isLarge = size === 'large';

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className={`
          relative flex items-center gap-3
          bg-white rounded-2xl
          shadow-xl shadow-black/10
          border-2 transition-all duration-300
          ${isFocused ? 'border-snij-primary shadow-snij-primary/20' : 'border-transparent'}
          ${isLarge ? 'p-2' : 'p-1.5'}
        `}
      >
        {/* Search Icon */}
        <div className={`flex items-center justify-center ${isLarge ? 'ps-4' : 'ps-3'}`}>
          <Search className={`text-gray-400 ${isLarge ? 'h-6 w-6' : 'h-5 w-5'}`} />
        </div>

        {/* Input */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || t('searchPlaceholder')}
          className={`
            flex-1 bg-transparent outline-none
            text-gray-900 placeholder:text-gray-400
            ${isLarge ? 'text-lg py-3' : 'text-base py-2'}
          `}
        />

        {/* AI Badge - only on large */}
        {isLarge && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-purple-600">IA</span>
          </div>
        )}

        {/* Search Button */}
        <Button
          type="submit"
          className={`
            bg-snij-primary hover:bg-snij-primary/90 text-white
            rounded-xl transition-all duration-200
            hover:scale-105 active:scale-95
            ${isLarge ? 'h-12 px-6 text-base font-semibold' : 'h-9 px-4'}
          `}
        >
          <Search className={`${isLarge ? 'h-5 w-5 me-2' : 'h-4 w-4'}`} />
          {isLarge && (
            <span className="hidden sm:inline">
              {locale === 'ar' ? 'بحث' : locale === 'fr' ? 'Rechercher' : 'Search'}
            </span>
          )}
        </Button>
      </div>

      {/* Search suggestions hint */}
      {isLarge && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[
            locale === 'ar' ? 'قانون الشغل' : locale === 'fr' ? 'Code du travail' : 'Labor code',
            locale === 'ar' ? 'حماية البيانات' : locale === 'fr' ? 'Protection des données' : 'Data protection',
            locale === 'ar' ? 'قانون الاستثمار' : locale === 'fr' ? 'Loi d\'investissement' : 'Investment law',
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/20"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
