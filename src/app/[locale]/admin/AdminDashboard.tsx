'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  FileText,
  Scale,
  Gavel,
  Search,
  AlertCircle,
  CheckCircle,
  Database,
  Users,
  ClipboardList,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Key,
  Activity,
  BarChart3,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  studioClient,
  adminClient,
  authClient,
  type Document,
  type AdminDocument,
  type User,
  type AuditLogEntry,
} from '@/lib/api';

type DocumentType = 'loi' | 'decret' | 'jurisprudence';
type TabType = 'documents' | 'users' | 'audit';

const typeIcons = {
  loi: FileText,
  decret: Scale,
  jurisprudence: Gavel,
};

const domaineOptions = [
  'constitutionnel',
  'civil',
  'penal',
  'commercial',
  'administratif',
  'travail',
  'fiscal',
  'famille',
  'environnement',
  'autres',
];

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  editor: 'Éditeur',
  viewer: 'Lecteur',
};

const statusLabels: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
};

export function AdminDashboard() {
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('documents');

  // Document state
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDocForm, setShowDocForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [docFormData, setDocFormData] = useState<AdminDocument>({
    type: 'loi',
    numero: '',
    title: { ar: '', fr: '' },
    content: { ar: '', fr: '' },
    date: new Date().toISOString().split('T')[0],
    domaine: 'autres',
    statut: 'en_vigueur',
  });

  // User state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'viewer' as 'super_admin' | 'admin' | 'editor' | 'viewer',
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });
  const [showChangePassword, setShowChangePassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    resourceType: '',
  });

  // Common state
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authClient.isAuthenticated()) {
        const result = await authClient.getMe();
        if (result.success && result.data) {
          setIsAuthenticated(true);
          setCurrentUser(result.data.user);
          setPermissions(result.data.permissions);
          // Sync admin token for document operations
          const token = localStorage.getItem('auth_token');
          if (token) adminClient.setToken(token);
          loadDocuments();
        } else {
          authClient.clearSession();
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'users' && users.length === 0) {
        loadUsers();
      } else if (activeTab === 'audit' && auditLogs.length === 0) {
        loadAuditLogs();
      }
    }
  }, [activeTab, isAuthenticated]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await studioClient.getDocuments(
        typeFilter === 'all' ? undefined : typeFilter,
        100
      );
      if (response.success && response.data) {
        setDocuments(response.data.results);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!hasPermission('users:read')) return;
    setLoadingUsers(true);
    try {
      const response = await authClient.getUsers({ limit: 100 });
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAuditLogs = async () => {
    if (!hasPermission('audit:read')) return;
    setLoadingAudit(true);
    try {
      const response = await authClient.getAuditLogs({
        action: auditFilters.action || undefined,
        resourceType: auditFilters.resourceType || undefined,
        limit: 100,
      });
      if (response.success && response.data) {
        setAuditLogs(response.data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
    }
  }, [typeFilter, isAuthenticated]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const result = await authClient.login(email, password, requires2FA ? totpCode : undefined);

      if (result.requires2FA) {
        setRequires2FA(true);
        setLoginLoading(false);
        return;
      }

      if (result.success && result.data) {
        setIsAuthenticated(true);
        setCurrentUser(result.data.user);
        setPermissions(result.data.permissions);
        // Sync admin token for document operations
        adminClient.setToken(result.data.token);
        setEmail('');
        setPassword('');
        setTotpCode('');
        setRequires2FA(false);
        loadDocuments();
      } else {
        setLoginError(result.error || 'Identifiants invalides');
      }
    } catch (err) {
      setLoginError('Erreur de connexion');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await authClient.logout();
    adminClient.clearToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPermissions([]);
    setDocuments([]);
    setUsers([]);
    setAuditLogs([]);
  };

  // Document handlers
  const handleCreateDoc = () => {
    setEditingDoc(null);
    setDocFormData({
      type: 'loi',
      numero: '',
      title: { ar: '', fr: '' },
      content: { ar: '', fr: '' },
      date: new Date().toISOString().split('T')[0],
      domaine: 'autres',
      statut: 'en_vigueur',
    });
    setShowDocForm(true);
  };

  const handleEditDoc = (doc: Document) => {
    setEditingDoc(doc);
    let titleAr = '',
      titleFr = '';
    if (typeof doc.title === 'string') {
      titleFr = doc.title;
      titleAr = doc.titleAr || '';
    } else {
      titleAr = doc.title?.ar || '';
      titleFr = doc.title?.fr || '';
    }
    let contentAr = '',
      contentFr = '';
    if (typeof doc.content === 'string') {
      contentFr = doc.content;
    } else if (doc.content) {
      contentAr = doc.content.ar || '';
      contentFr = doc.content.fr || '';
    }
    const domaineId = typeof doc.domaine === 'string' ? doc.domaine : doc.domaine?.id || 'autres';
    setDocFormData({
      id: doc.id,
      type: doc.type,
      numero: doc.numero,
      title: { ar: titleAr, fr: titleFr },
      content: { ar: contentAr, fr: contentFr },
      date: doc.date,
      domaine: domaineId,
      statut: doc.statut || 'en_vigueur',
    });
    setShowDocForm(true);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    setSubmitting(true);
    try {
      const result = await adminClient.deleteDocument(id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Document supprimé avec succès' });
        loadDocuments();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la suppression' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = editingDoc
        ? await adminClient.updateDocument(editingDoc.id, docFormData)
        : await adminClient.createDocument(docFormData);
      if (result.success) {
        setMessage({ type: 'success', text: editingDoc ? 'Document mis à jour' : 'Document créé' });
        setShowDocForm(false);
        loadDocuments();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSubmitting(false);
    }
  };

  // User handlers
  const handleCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      email: '',
      password: '',
      name: '',
      role: 'viewer',
      status: 'active',
    });
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      status: user.status,
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    setSubmitting(true);
    try {
      const result = await authClient.deleteUser(id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Utilisateur supprimé avec succès' });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la suppression' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      if (editingUser) {
        const result = await authClient.updateUser(editingUser.id, {
          name: userFormData.name,
          role: userFormData.role,
          status: userFormData.status,
        });
        if (result.success) {
          setMessage({ type: 'success', text: 'Utilisateur mis à jour' });
          setShowUserForm(false);
          loadUsers();
        } else {
          setMessage({ type: 'error', text: result.error || 'Erreur' });
        }
      } else {
        const result = await authClient.createUser({
          email: userFormData.email,
          password: userFormData.password,
          name: userFormData.name,
          role: userFormData.role,
        });
        if (result.success) {
          setMessage({ type: 'success', text: 'Utilisateur créé' });
          setShowUserForm(false);
          loadUsers();
        } else {
          setMessage({ type: 'error', text: result.error || 'Erreur' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await authClient.changePassword(userId, newPassword);
      if (result.success) {
        setMessage({ type: 'success', text: 'Mot de passe modifié' });
        setShowChangePassword(null);
        setNewPassword('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la modification' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = typeof doc.title === 'string' ? doc.title : doc.title?.fr || doc.title?.ar || '';
    return (
      title.toLowerCase().includes(query) ||
      doc.numero?.toLowerCase().includes(query) ||
      doc.id.toLowerCase().includes(query)
    );
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR');
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-snij-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-snij-primary" />
            </div>
            <CardTitle className="text-2xl">Administration SNIJ</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Connectez-vous pour accéder au tableau de bord
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {loginError}
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@snij.tn"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mot de passe</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={requires2FA}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {requires2FA && (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Entrez le code de votre application d&apos;authentification
                  </div>
                  <label className="text-sm font-medium mb-1 block">Code 2FA</label>
                  <Input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-xl font-mono tracking-widest"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setRequires2FA(false);
                      setTotpCode('');
                      setLoginError('');
                    }}
                    className="text-sm text-snij-primary hover:underline"
                  >
                    Utiliser un autre compte
                  </button>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loginLoading || (requires2FA && totpCode.length !== 6)}>
                {loginLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {requires2FA ? 'Vérifier le code' : 'Se connecter'}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-center text-muted-foreground mb-3">
                Compte de démonstration
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <code className="bg-white px-2 py-0.5 rounded text-xs">admin@snij.tn</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mot de passe:</span>
                  <code className="bg-white px-2 py-0.5 rounded text-xs">admin123</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Document form
  if (showDocForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{editingDoc ? 'Modifier le document' : 'Nouveau document'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitDoc} className="space-y-6">
              {message && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {message.text}
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <select
                    value={docFormData.type}
                    onChange={(e) => setDocFormData({ ...docFormData, type: e.target.value as DocumentType })}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="loi">Loi</option>
                    <option value="decret">Décret</option>
                    <option value="jurisprudence">Jurisprudence</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Numéro</label>
                  <Input
                    value={docFormData.numero}
                    onChange={(e) => setDocFormData({ ...docFormData, numero: e.target.value })}
                    placeholder="Ex: 2024-01"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={docFormData.date}
                    onChange={(e) => setDocFormData({ ...docFormData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Domaine</label>
                  <select
                    value={docFormData.domaine}
                    onChange={(e) => setDocFormData({ ...docFormData, domaine: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {domaineOptions.map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Statut</label>
                  <select
                    value={docFormData.statut}
                    onChange={(e) =>
                      setDocFormData({ ...docFormData, statut: e.target.value as 'en_vigueur' | 'abroge' | 'modifie' })
                    }
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="en_vigueur">En vigueur</option>
                    <option value="abroge">Abrogé</option>
                    <option value="modifie">Modifié</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Titre (Arabe)</label>
                <Input
                  dir="rtl"
                  value={docFormData.title.ar}
                  onChange={(e) => setDocFormData({ ...docFormData, title: { ...docFormData.title, ar: e.target.value } })}
                  placeholder="العنوان بالعربية"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Titre (Français)</label>
                <Input
                  value={docFormData.title.fr || ''}
                  onChange={(e) => setDocFormData({ ...docFormData, title: { ...docFormData.title, fr: e.target.value } })}
                  placeholder="Titre en français"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contenu (Arabe)</label>
                <textarea
                  dir="rtl"
                  value={docFormData.content.ar}
                  onChange={(e) => setDocFormData({ ...docFormData, content: { ...docFormData.content, ar: e.target.value } })}
                  placeholder="المحتوى بالعربية"
                  className="w-full border rounded-md px-3 py-2 min-h-[200px]"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contenu (Français)</label>
                <textarea
                  value={docFormData.content.fr || ''}
                  onChange={(e) => setDocFormData({ ...docFormData, content: { ...docFormData.content, fr: e.target.value } })}
                  placeholder="Contenu en français"
                  className="w-full border rounded-md px-3 py-2 min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowDocForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingDoc ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User form
  if (showUserForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitUser} className="space-y-6">
              {message && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {message.text}
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">Nom complet</label>
                <Input
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="Nom complet"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Mot de passe</label>
                  <Input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder="Min. 8 caractères"
                    required
                    minLength={8}
                  />
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Rôle</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, role: e.target.value as typeof userFormData.role })
                    }
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="viewer">Lecteur</option>
                    <option value="editor">Éditeur</option>
                    <option value="admin">Administrateur</option>
                    {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
                {editingUser && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Statut</label>
                    <select
                      value={userFormData.status}
                      onChange={(e) =>
                        setUserFormData({ ...userFormData, status: e.target.value as typeof userFormData.status })
                      }
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="suspended">Suspendu</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowUserForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Administration SNIJ</h1>
          <p className="text-muted-foreground mt-1">
            Connecté en tant que <span className="font-medium">{currentUser?.name}</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-snij-primary/10 text-snij-primary rounded-full">
              {roleLabels[currentUser?.role || 'viewer']}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/admin/analytics`}>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href={`/${locale}/admin/monitoring`}>
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Monitoring
            </Button>
          </Link>
          <Link href={`/${locale}/admin/pipeline`}>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Pipeline
            </Button>
          </Link>
          <Link href={`/${locale}/admin/security`}>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Sécurité
            </Button>
          </Link>
          <Link href={`/${locale}/admin/studio`}>
            <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
              <span className="h-4 w-4 mr-2">🤖</span>
              Studio IA
            </Button>
          </Link>
          <Link href={`/${locale}/admin/export`}>
            <Button variant="outline" className="border-green-200 hover:bg-green-50">
              <Download className="h-4 w-4 mr-2 text-green-600" />
              Export
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-current hover:opacity-70">
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'border-snij-primary text-snij-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          Documents
        </button>
        {hasPermission('users:read') && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-snij-primary text-snij-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Utilisateurs
          </button>
        )}
        {hasPermission('audit:read') && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-snij-primary text-snij-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Journal d'audit
          </button>
        )}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <>
          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-10"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">Tous les types</option>
                <option value="loi">Lois</option>
                <option value="decret">Décrets</option>
                <option value="jurisprudence">Jurisprudence</option>
              </select>
            </div>
            {hasPermission('documents:create') && (
              <Button onClick={handleCreateDoc}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau document
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{documents.length}</div>
                <div className="text-sm text-muted-foreground">Total documents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {documents.filter((d) => d.type === 'loi').length}
                </div>
                <div className="text-sm text-muted-foreground">Lois</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-emerald-600">
                  {documents.filter((d) => d.type === 'decret').length}
                </div>
                <div className="text-sm text-muted-foreground">Décrets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">
                  {documents.filter((d) => d.type === 'jurisprudence').length}
                </div>
                <div className="text-sm text-muted-foreground">Jurisprudence</div>
              </CardContent>
            </Card>
          </div>

          {/* Documents list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Aucun document trouvé</div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc) => {
                const TypeIcon = typeIcons[doc.type] || FileText;
                const title =
                  typeof doc.title === 'string' ? doc.title : doc.title?.fr || doc.title?.ar || 'Sans titre';
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-lg ${
                              doc.type === 'loi'
                                ? 'bg-blue-100 text-blue-700'
                                : doc.type === 'decret'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{title}</div>
                            <div className="text-sm text-muted-foreground">
                              {doc.numero} • {doc.date}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasPermission('documents:update') && (
                            <Button size="sm" variant="ghost" onClick={() => handleEditDoc(doc)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('documents:delete') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteDoc(doc.id)}
                              disabled={submitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && hasPermission('users:read') && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
            {hasPermission('users:create') && (
              <Button onClick={handleCreateUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            )}
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Aucun utilisateur trouvé</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-snij-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-snij-primary font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${
                              user.role === 'super_admin'
                                ? 'bg-red-100 text-red-700'
                                : user.role === 'admin'
                                ? 'bg-orange-100 text-orange-700'
                                : user.role === 'editor'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {roleLabels[user.role]}
                          </div>
                          <div
                            className={`text-xs mt-1 ${
                              user.status === 'active'
                                ? 'text-green-600'
                                : user.status === 'suspended'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {statusLabels[user.status]}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasPermission('users:update') && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowChangePassword(user.id)}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {hasPermission('users:delete') && user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={submitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {showChangePassword === user.id && (
                      <div className="mt-4 pt-4 border-t flex items-center gap-3">
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nouveau mot de passe (min. 8 car.)"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleChangePassword(user.id)}
                          disabled={submitting}
                        >
                          Changer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowChangePassword(null);
                            setNewPassword('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && hasPermission('audit:read') && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Journal d'audit</h2>
            <Button variant="outline" onClick={loadAuditLogs}>
              Actualiser
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <select
                  value={auditFilters.action}
                  onChange={(e) => {
                    setAuditFilters({ ...auditFilters, action: e.target.value });
                  }}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">Toutes les actions</option>
                  <option value="login">Connexion</option>
                  <option value="logout">Déconnexion</option>
                  <option value="create">Création</option>
                  <option value="update">Modification</option>
                  <option value="delete">Suppression</option>
                </select>
                <select
                  value={auditFilters.resourceType}
                  onChange={(e) => {
                    setAuditFilters({ ...auditFilters, resourceType: e.target.value });
                  }}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">Toutes les ressources</option>
                  <option value="user">Utilisateur</option>
                  <option value="document">Document</option>
                  <option value="session">Session</option>
                </select>
                <Button onClick={loadAuditLogs}>Filtrer</Button>
              </div>
            </CardContent>
          </Card>

          {loadingAudit ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Aucune entrée dans le journal</div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            log.status === 'success'
                              ? 'bg-green-500'
                              : log.status === 'failure'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <div className="font-medium">
                            {log.action}{' '}
                            <span className="text-muted-foreground font-normal">sur</span>{' '}
                            {log.resourceType}
                            {log.resourceId && (
                              <span className="text-xs text-muted-foreground ml-1">({log.resourceId})</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.userEmail || 'Système'} • {formatDate(log.timestamp)}
                          </div>
                        </div>
                      </div>
                      {log.ipAddress && (
                        <div className="text-xs text-muted-foreground">IP: {log.ipAddress}</div>
                      )}
                    </div>
                    {log.errorMessage && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">{log.errorMessage}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
