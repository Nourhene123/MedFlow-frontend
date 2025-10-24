// src/app/patient/page.tsx - VERSION NEXT AUTH
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, User, Clock, LogOut } from 'lucide-react';

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    } else if (session.user?.role !== 'PATIENT') {
      // Rediriger selon le rôle
      const role = session.user?.role;
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'DOCTOR') router.push('/doctor');
      else if (role === 'RECEPTIONIST') router.push('/receptionist');
      else router.push('/dashboard');
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">MedFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">Bonjour, {session.user?.name || session.user?.email}</span>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Tableau de Bord Patient</h2>
          <p className="text-slate-600 mt-2">Gérez vos rendez-vous et votre santé</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mes Rendez-vous */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg ml-2">Mes Rendez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Consultez et gérez vos prochains rendez-vous médicaux
              </CardDescription>
              <Button className="w-full mt-4">Voir les rendez-vous</Button>
            </CardContent>
          </Card>

          {/* Mes Documents */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <FileText className="h-6 w-6 text-green-600" />
              <CardTitle className="text-lg ml-2">Mes Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Accédez à vos ordonnances et résultats d'analyses
              </CardDescription>
              <Button className="w-full mt-4" variant="outline">
                Consulter
              </Button>
            </CardContent>
          </Card>

          {/* Prise de Rendez-vous */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Clock className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-lg ml-2">Prendre RDV</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Réservez un nouveau rendez-vous avec un professionnel
              </CardDescription>
              <Button className="w-full mt-4">Prendre rendez-vous</Button>
            </CardContent>
          </Card>
        </div>

        {/* Prochains Rendez-vous */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Prochains Rendez-vous</CardTitle>
            <CardDescription>Vos rendez-vous à venir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-slate-500 py-8">
              <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p>Aucun rendez-vous programmé</p>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className="mt-8 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-blue-700">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}