// Client API pour communiquer avec snij-studio

const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL || 'https://snij-studio.yassine-techini.workers.dev';
const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL || 'https://snij-foundry.yassine-techini.workers.dev';

// Public Statistics Response
export interface PublicStats {
  total: number;
  byType: {
    loi: number;
    decret: number;
    jurisprudence: number;
  };
  byDomain: Array<{ domaine: string; count: number }>;
}

export interface StatsResponse {
  success: boolean;
  stats?: PublicStats;
  error?: string;
}

// Fetch public statistics (no auth required)
export async function getPublicStats(): Promise<StatsResponse> {
  try {
    const response = await fetch(`${FOUNDRY_URL}/query/stats/counts`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    return response.json();
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}

// Analytics response types
export interface AnalyticsData {
  byYear: Array<{ year: string; count: number }>;
  byStatus: Array<{ statut: string; count: number }>;
  recentDocuments: Array<{
    id: string;
    type: string;
    numero: string;
    date_promulgation: string;
    created_at: number;
  }>;
  typeByDomain: Array<{ type: string; domaine: string; count: number }>;
}

export interface AnalyticsResponse {
  success: boolean;
  analytics?: AnalyticsData;
  error?: string;
}

// Fetch analytics data (no auth required)
export async function getAnalytics(): Promise<AnalyticsResponse> {
  try {
    const response = await fetch(`${FOUNDRY_URL}/query/stats/analytics`, {
      next: { revalidate: 300 },
    });
    return response.json();
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return { success: false, error: 'Failed to fetch analytics' };
  }
}

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
  titleAr?: string;
  titleFr?: string;
  excerpt?: string;
  aiSummary?: string;
  content?: string;
  date: string;
  numero?: string;
  domaine?: {
    id: string;
    name: string;
  };
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
  // API can return either string or multilingual object
  title: string | { ar: string; fr: string; en?: string };
  titleAr?: string;
  titleFr?: string;
  content: string | { ar: string; fr: string; en?: string };
  date: string;
  domaine: string | { id: string; name: string };
  statut?: 'en_vigueur' | 'abroge' | 'modifie';
  jortRef?: string;
  aiSummary?: string | { ar: string; fr: string; en?: string };
  excerpt?: string;
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

  /**
   * Stream RAG response with Server-Sent Events
   * Yields events: { type: 'start' | 'sources' | 'token' | 'done' | 'error', data: unknown }
   */
  async *askQuestionStream(
    question: string,
    language: string = 'ar'
  ): AsyncGenerator<{ type: string; data: unknown }, void, unknown> {
    const response = await fetch(`${this.baseUrl}/api/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
      },
      body: JSON.stringify({
        question,
        language,
        stream: true,
      }),
    });

    if (!response.ok) {
      yield { type: 'error', data: { message: `HTTP error: ${response.status}` } };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', data: { message: 'No response body' } };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.slice(6).trim();
            // Next line should be data
            continue;
          }
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                // Extract event type from previous line or infer from data
                yield { type: data.type || 'token', data };
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
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

// Admin API Client
export interface AdminDocument {
  id?: string;
  type: 'loi' | 'decret' | 'jurisprudence';
  numero: string;
  title: { ar: string; fr?: string; en?: string };
  content: { ar: string; fr?: string; en?: string };
  aiSummary?: { ar: string; fr?: string; en?: string };
  date: string;
  domaine: string;
  statut?: 'en_vigueur' | 'abroge' | 'modifie';
  jortReference?: string;
}

class AdminClient {
  private baseUrl: string;

  constructor(baseUrl: string = STUDIO_URL) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async createDocument(doc: AdminDocument): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/api/admin/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(doc),
    });

    return response.json();
  }

  async updateDocument(id: string, doc: Partial<AdminDocument>): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/api/admin/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(doc),
    });

    return response.json();
  }

  async deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/api/admin/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async getStats(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async getPipelineStatus(): Promise<{
    success: boolean;
    data?: {
      drupal: { status: string; url: string };
      sync: { lastSync: Record<string, string | null>; documentsIndexed: number };
      storage: { d1: string; vectorize: string };
      documentCount: number;
    };
    error?: string;
  }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/api/admin/pipeline/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async triggerSync(options?: {
    incremental?: boolean;
    entityTypes?: ('loi' | 'decret' | 'jurisprudence')[];
  }): Promise<{
    success: boolean;
    data?: { processed: number; indexed: number; errors: string[]; duration: number };
    error?: string;
  }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/api/admin/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(options || {}),
    });

    return response.json();
  }

  async triggerReindex(): Promise<{
    success: boolean;
    data?: { processed: number; indexed: number; errors: string[]; duration: number };
    error?: string;
  }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/api/admin/reindex`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }
}

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: number;
  createdAt: number;
  updatedAt: number;
  twoFactorEnabled?: boolean;
}

export interface AuditLogEntry {
  id: number;
  timestamp: number;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'error';
  errorMessage?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
    permissions: string[];
  };
  error?: string;
}

// Auth Client for user authentication
class AuthClient {
  private baseUrl: string;

  constructor(baseUrl: string = FOUNDRY_URL) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('auth_user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  private getPermissions(): string[] {
    if (typeof window !== 'undefined') {
      const perms = localStorage.getItem('auth_permissions');
      return perms ? JSON.parse(perms) : [];
    }
    return [];
  }

  setSession(token: string, user: User, permissions: string[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_permissions', JSON.stringify(permissions));
    }
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_permissions');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.getUser();
  }

  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }

  async login(email: string, password: string, totpCode?: string): Promise<LoginResponse & { requires2FA?: boolean }> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, totpCode }),
    });

    const result = await response.json();

    if (result.success && result.data) {
      this.setSession(result.data.token, result.data.user, result.data.permissions);
    }

    return result;
  }

  // 2FA Methods
  async setup2FA(): Promise<{ success: boolean; data?: { secret: string; uri: string }; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/2fa/setup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async enable2FA(code: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/2fa/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    return response.json();
  }

  async disable2FA(password: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/2fa/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    return response.json();
  }

  async logout(): Promise<{ success: boolean }> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore logout errors
      }
    }
    this.clearSession();
    return { success: true };
  }

  async getMe(): Promise<{ success: boolean; data?: { user: User; permissions: string[] }; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async getUsers(filters?: {
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data?: { users: User[]; total: number }; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${this.baseUrl}/auth/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async getUserById(id: string): Promise<{ success: boolean; data?: User; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  }): Promise<{ success: boolean; data?: User; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    return response.json();
  }

  async updateUser(
    id: string,
    userData: { name?: string; role?: string; status?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    return response.json();
  }

  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  async changePassword(id: string, password: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${this.baseUrl}/auth/users/${id}/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    return response.json();
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    fromDate?: number;
    toDate?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data?: { logs: AuditLogEntry[]; total: number }; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const params = new URLSearchParams();
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.action) params.set('action', filters.action);
    if (filters?.resourceType) params.set('resourceType', filters.resourceType);
    if (filters?.fromDate) params.set('fromDate', filters.fromDate.toString());
    if (filters?.toDate) params.set('toDate', filters.toDate.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${this.baseUrl}/auth/audit?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }
}

export const authClient = new AuthClient();
export const adminClient = new AdminClient();
