'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t bg-snij-secondary text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Logo & Ministry */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-snij-primary font-bold">
                ب
              </div>
              <span className="font-bold">SNIJ</span>
            </div>
            <p className="text-sm text-gray-300">{t('ministry')}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('links.about')}</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t('links.about')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t('links.contact')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t('links.terms')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t('links.privacy')}
                </a>
              </li>
            </ul>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-300">
            <p>&copy; {new Date().getFullYear()} SNIJ</p>
            <p>{t('copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
