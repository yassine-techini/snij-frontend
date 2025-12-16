import { FavoritesContent } from './FavoritesContent';

export default function FavoritesPage() {
  return <FavoritesContent />;
}

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'fr' }, { locale: 'en' }];
}
