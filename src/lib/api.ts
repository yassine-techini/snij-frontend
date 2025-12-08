// Client API pour communiquer avec snij-studio

const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL || 'https://snij-studio.yassine-techini.workers.dev';

export interface SearchFilters {
  type?: string[];
  domaine?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchResult {
  id: string;
  type: 'loi' | 'decret' | 'jurisprudence';
  title: string;
  excerpt: string;
  date: string;
  numero?: string;
  domaine?: string;
  score: number;
}

export interface SearchResponse {
  success: boolean;
  data?: {
    results: SearchResult[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
  meta?: {
    executionTime: number;
  };
}

export interface RAGResponse {
  success: boolean;
  data?: {
    answer: string;
    sources: Array<{
      id: string;
      title: string;
      type: string;
      excerpt: string;
      relevance: number;
    }>;
    confidence: number;
  };
  error?: string;
  meta?: {
    executionTime: number;
  };
}

export interface Document {
  id: string;
  type: 'loi' | 'decret' | 'jurisprudence';
  numero: string;
  title: {
    ar: string;
    fr: string;
    en?: string;
  };
  content: {
    ar: string;
    fr: string;
    en?: string;
  };
  date: string;
  domaine: string;
  statut: 'en_vigueur' | 'abroge' | 'modifie';
  jortRef?: string;
  aiSummary?: {
    ar: string;
    fr: string;
    en?: string;
  };
}

class StudioClient {
  private baseUrl: string;

  constructor(baseUrl: string = STUDIO_URL) {
    this.baseUrl = baseUrl;
  }

  async search(
    query: string,
    filters?: SearchFilters,
    page: number = 1,
    limit: number = 20,
    language: string = 'ar'
  ): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
      },
      body: JSON.stringify({
        query,
        filters,
        page,
        limit,
        language,
      }),
    });

    return response.json();
  }

  async askQuestion(
    question: string,
    language: string = 'ar',
    stream: boolean = false
  ): Promise<RAGResponse | ReadableStream> {
    const response = await fetch(`${this.baseUrl}/api/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
      },
      body: JSON.stringify({
        question,
        language,
        stream,
      }),
    });

    if (stream) {
      return response.body as ReadableStream;
    }

    return response.json();
  }

  async getDocuments(
    type?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ success: boolean; data?: { results: Document[]; total: number } }> {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());

    const response = await fetch(`${this.baseUrl}/api/documents?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  }

  async getDocument(id: string): Promise<{ success: boolean; data?: Document; error?: string }> {
    const response = await fetch(`${this.baseUrl}/api/documents/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  }

  async summarize(
    documentId: string,
    type: 'short' | 'detailed' = 'short',
    language: string = 'ar'
  ): Promise<{ success: boolean; data?: { summary: string }; error?: string }> {
    const response = await fetch(`${this.baseUrl}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
      },
      body: JSON.stringify({
        documentId,
        type,
        language,
      }),
    });

    return response.json();
  }
}

export const studioClient = new StudioClient();
export default studioClient;
