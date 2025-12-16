import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { DocumentContent } from './DocumentContent';

const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL || 'https://snij-studio.yassine-techini.workers.dev';

// Fetch all document IDs at build time for static generation
async function getDocumentIds(): Promise<string[]> {
  try {
    const response = await fetch(`${STUDIO_URL}/api/documents?limit=100`, {
      next: { revalidate: 60 },
    });
    const data = await response.json();
    if (data.success && data.data?.results) {
      return data.data.results.map((doc: { id: string }) => doc.id);
    }
  } catch (error) {
    console.error('Failed to fetch document IDs:', error);
  }
  return [];
}

export async function generateStaticParams() {
  const documentIds = await getDocumentIds();

  // Generate paths for all documents across all locales
  return locales.flatMap((locale) =>
    documentIds.map((id) => ({ locale, id }))
  );
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <DocumentContent documentId={id} />;
}
