'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  placeholder?: string;
  size?: 'default' | 'large';
  className?: string;
}

export function SearchBar({ placeholder, size = 'default', className }: SearchBarProps) {
  const [query, setQuery] = useState('');
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
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${
              isLarge ? 'start-4 h-5 w-5' : 'start-3 h-4 w-4'
            }`}
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder || t('searchPlaceholder')}
            className={`${isLarge ? 'h-14 ps-12 text-lg' : 'h-10 ps-10'}`}
          />
        </div>
        <Button
          type="submit"
          variant="snij"
          className={isLarge ? 'h-14 px-8 text-lg' : ''}
        >
          <Search className={isLarge ? 'h-5 w-5' : 'h-4 w-4'} />
        </Button>
      </div>
    </form>
  );
}
