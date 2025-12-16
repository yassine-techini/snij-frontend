'use client';

import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { container: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-sm' },
  md: { container: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-base' },
  lg: { container: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-lg' },
  xl: { container: 'h-24 w-24', icon: 'h-12 w-12', text: 'text-2xl' },
};

export function Logo({ size = 'md', variant = 'primary', showText = false, className }: LogoProps) {
  const config = sizeConfig[size];

  const containerClasses = cn(
    config.container,
    'rounded-xl flex items-center justify-center shadow-lg',
    variant === 'primary'
      ? 'bg-gradient-to-br from-snij-primary to-snij-primary/80 text-white'
      : 'bg-white text-snij-primary',
    className
  );

  return (
    <div className="flex items-center gap-3">
      <div className={containerClasses}>
        <Scale className={config.icon} strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={cn(
          'font-bold tracking-tight',
          config.text,
          variant === 'primary' ? 'text-snij-secondary' : 'text-white'
        )}>
          SNIJ
        </span>
      )}
    </div>
  );
}
