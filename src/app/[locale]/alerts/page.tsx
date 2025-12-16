import { AlertsContent } from './AlertsContent';

export default function AlertsPage() {
  return <AlertsContent />;
}

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'fr' }, { locale: 'en' }];
}
