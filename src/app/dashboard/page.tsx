// src/app/dashboard/page.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield, Stethoscope, Users, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="h-6 w-6" />;
      case 'DOCTOR': return <Stethoscope className="h-6 w-6" />;
      case 'RECEPTIONIST': return <Users className="h-6 w-6" />;
      case 'PATIENT': return <User className="h-6 w-6" />;
      default: return <User className="h-6 w-6" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'DOCTOR': return 'Médecin';
      case 'RECEPTIONIST': return 'Réceptionniste';
      case 'PATIENT': return 'Patient';
      default: return 'Utilisateur';
    }
  };

  const redirectToRoleDashboard = () => {
    const role = session.user?.role;
    if (role === 'ADMIN') router.push('/admin');
    else if (role === 'DOCTOR') router.push('/doctor');
    else if (role === 'RECEPTIONIST') router.push('/receptionist');
    else if (role === 'PATIENT') router.push('/patient');
    else router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">MedFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getRoleIcon(session.user?.role || '')}
                <span className="text-slate-600">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Bienvenue sur MedFlow
          </h1>
          <p className="text-xl text-slate-600">
            Votre plateforme de gestion médicale
          </p>
        </div>

        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Mon Compte</CardTitle>
            <CardDescription>
              Informations de votre profil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Email</label>
                <p className="text-lg text-slate-900">{session.user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Rôle</label>
                <div className="flex items-center space-x-2">
                  {getRoleIcon(session.user?.role || '')}
                  <p className="text-lg text-slate-900">
                    {getRoleDisplayName(session.user?.role || '')}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Nom</label>
                <p className="text-lg text-slate-900">{session.user?.name || 'Non spécifié'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">ID</label>
                <p className="text-lg text-slate-900 font-mono text-sm">{session.user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accéder à votre espace</CardTitle>
            <CardDescription>
              Accédez à votre tableau de bord personnalisé selon votre rôle
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={redirectToRoleDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Accéder à mon tableau de bord
            </Button>
            <p className="text-sm text-slate-500 mt-4">
              Vous serez redirigé vers l&apos;espace {getRoleDisplayName(session.user?.role || '').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        {/* Debug Info - À supprimer en production */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Debug Info (Session)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-blue-700 overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}