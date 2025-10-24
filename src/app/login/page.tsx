// src/app/login/page.tsx - VERSION COMPLÈTE ET CORRECTE
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { getSession } from 'next-auth/react'

const loginSchema = z.object({
  email: z.email('Veuillez entrer un email valide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔄 Tentative de connexion avec:', values.email);

      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      console.log('📋 Résultat NextAuth:', result);

      if (result?.error) {
        setMessage('❌ Identifiants invalides. Vérifiez votre email et mot de passe.');
        return;
      }

      if (result?.ok) {
        const session = await getSession();  
        const role = session?.user?.role;
        console.log('✅ Connexion réussie! Rôle:', role);
        if (role === 'ADMIN') {
          console.log("role",role)
          router.push('/admin/dashboard');
        }
        else if (role === 'DOCTOR') router.push('/doctor/dashboard');
        else if (role === 'MANAGER') router.push('/manager/dashboard');
        else if (role === 'RECEPTIONIST') router.push('/receptionist/dashboard');
        else if (role === 'PATIENT') router.push('/patient/dashboard');
        else router.push('/dashboard');

      } else {
        setMessage('❌ Erreur lors de la connexion');
      }
      
    } catch (error) {
      console.error('💥 Erreur de connexion:', error);
      setMessage('❌ Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(37,99,235,0.03)_25%,rgba(37,99,235,0.03)_50%,transparent_50%,transparent_75%,rgba(37,99,235,0.03)_75%)] bg-[length:20px_20px]"></div>
      
      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10 backdrop-blur-sm bg-white/95">
        {/* Header Médical */}
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                MedFlow
              </CardTitle>
              <CardDescription className="text-base mt-2 text-slate-600">
                Connectez-vous à votre espace
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Adresse email</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                          type="email" 
                          placeholder="votre@email.com" 
                          className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-colors"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••" 
                          className="pl-10 pr-12 h-11 border-slate-200 focus:border-blue-500 transition-colors"
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Connexion...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Se connecter</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </Form>

          {/* Success/Error Message */}
          {message && (
            <div className={`p-4 rounded-xl border text-center transition-all duration-300 ${
              message.includes('✅') 
                ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' 
                : 'bg-red-50 border-red-200 text-red-700 shadow-sm'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                {message.includes('✅') ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{message}</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{message}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}