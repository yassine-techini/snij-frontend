'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Smartphone,
  Key,
  Check,
  X,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api';

type SetupStep = 'idle' | 'setup' | 'verify' | 'success';

export function SecuritySettings() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ twoFactorEnabled?: boolean; email?: string } | null>(null);

  // 2FA Setup state
  const [setupStep, setSetupStep] = useState<SetupStep>('idle');
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  // Disable 2FA state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    if (!authClient.isAuthenticated()) {
      router.push(`/${locale}/admin`);
      return;
    }

    const currentUser = authClient.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, [locale, router]);

  const handleSetup2FA = async () => {
    setSetupStep('setup');
    const result = await authClient.setup2FA();

    if (result.success && result.data) {
      setSecret(result.data.secret);
      setUri(result.data.uri);
    } else {
      setVerifyError(result.error || 'Failed to setup 2FA');
      setSetupStep('idle');
    }
  };

  const handleVerify2FA = async () => {
    if (verifyCode.length !== 6) {
      setVerifyError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setVerifyError('');

    const result = await authClient.enable2FA(verifyCode);

    if (result.success) {
      setSetupStep('success');
      // Update local user state
      setUser((prev) => (prev ? { ...prev, twoFactorEnabled: true } : null));
      // Refresh user from server
      const meResult = await fetch(
        `${process.env.NEXT_PUBLIC_FOUNDRY_URL || 'https://snij-foundry.yassine-techini.workers.dev'}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      const meData = await meResult.json();
      if (meData.success && meData.data?.user) {
        localStorage.setItem('auth_user', JSON.stringify(meData.data.user));
      }
    } else {
      setVerifyError(result.error || 'Invalid code');
    }

    setIsVerifying(false);
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setDisableError('Password is required');
      return;
    }

    setIsDisabling(true);
    setDisableError('');

    const result = await authClient.disable2FA(disablePassword);

    if (result.success) {
      setShowDisableModal(false);
      setDisablePassword('');
      setUser((prev) => (prev ? { ...prev, twoFactorEnabled: false } : null));
      // Refresh user from server
      const meResult = await fetch(
        `${process.env.NEXT_PUBLIC_FOUNDRY_URL || 'https://snij-foundry.yassine-techini.workers.dev'}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      const meData = await meResult.json();
      if (meData.success && meData.data?.user) {
        localStorage.setItem('auth_user', JSON.stringify(meData.data.user));
      }
    } else {
      setDisableError(result.error || 'Failed to disable 2FA');
    }

    setIsDisabling(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetSetup = () => {
    setSetupStep('idle');
    setSecret('');
    setUri('');
    setVerifyCode('');
    setVerifyError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-snij-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/${locale}/admin`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-snij-primary" />
            Sécurité
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez les paramètres de sécurité de votre compte
          </p>
        </div>
      </div>

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte en utilisant une application
            d&apos;authentification comme Google Authenticator ou Authy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">2FA activé</p>
                  <p className="text-sm text-green-700">
                    Votre compte est protégé par l&apos;authentification à deux facteurs.
                  </p>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDisableModal(true)}
                className="mt-4"
              >
                <X className="h-4 w-4 mr-2" />
                Désactiver le 2FA
              </Button>
            </div>
          ) : setupStep === 'idle' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-800">2FA non activé</p>
                  <p className="text-sm text-yellow-700">
                    Nous recommandons d&apos;activer le 2FA pour sécuriser votre compte.
                  </p>
                </div>
              </div>

              <Button onClick={handleSetup2FA}>
                <Key className="h-4 w-4 mr-2" />
                Configurer le 2FA
              </Button>
            </div>
          ) : setupStep === 'setup' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Étape 1: Scanner le QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Scannez ce QR code avec votre application d&apos;authentification (Google
                  Authenticator, Authy, etc.)
                </p>

                {uri && (
                  <div className="flex justify-center p-4 bg-white border rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Ou entrez cette clé manuellement:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-gray-100 rounded font-mono text-sm break-all">
                      {showSecret ? secret : '••••••••••••••••••••'}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon" onClick={copySecret}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Étape 2: Vérifier</h3>
                <p className="text-sm text-muted-foreground">
                  Entrez le code à 6 chiffres généré par votre application
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerifyCode(value);
                      setVerifyError('');
                    }}
                    placeholder="000000"
                    className="flex-1 p-3 border rounded-lg text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>

                {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetSetup}>
                    Annuler
                  </Button>
                  <Button onClick={handleVerify2FA} disabled={isVerifying || verifyCode.length !== 6}>
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Activer le 2FA
                  </Button>
                </div>
              </div>
            </div>
          ) : setupStep === 'success' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">2FA activé avec succès!</p>
                  <p className="text-sm text-green-700">
                    Votre compte est maintenant protégé par l&apos;authentification à deux facteurs.
                  </p>
                </div>
              </div>

              <Button onClick={resetSetup}>Terminé</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Désactiver le 2FA
              </CardTitle>
              <CardDescription>
                Cette action réduira la sécurité de votre compte. Entrez votre mot de passe pour
                confirmer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => {
                    setDisablePassword(e.target.value);
                    setDisableError('');
                  }}
                  placeholder="Votre mot de passe"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {disableError && <p className="text-sm text-red-600">{disableError}</p>}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDisableModal(false);
                    setDisablePassword('');
                    setDisableError('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={isDisabling || !disablePassword}
                >
                  {isDisabling ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Désactiver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
