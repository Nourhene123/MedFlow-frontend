'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface ConsultationData {
  appointment: {
    id: number;
    date: string;
    motif?: string;
    status: string;
  };
  patient: {
    firstname: string;
    lastname: string;
  };
  patient_profile?: {
    allergies?: string;
    chronic_conditions?: string;
    medications?: string;
  };
  medical_record?: {
    diagnostic?: string;
    traitement?: string;
    ordonnance?: string;
    notes?: string;
    poids?: string;
    taille?: string;
    tension?: string;
    temperature?: string;
  };
}

export default function ConsultationPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { data: session, status } = useSession();

  const [data, setData] = useState<ConsultationData | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    diagnostic: '',
    traitement: '',
    ordonnance: '',
    notes: '',
    poids: '',
    taille: '',
    tension: '',
    temperature: ''
  });

  const [timeLeft, setTimeLeft] = useState(30 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('30 minutes écoulées !', { duration: 8000 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.accessToken) {
      toast.error('Veuillez vous reconnecter');
      router.push('/login');
      return;
    }
    if (!id) return;

    const fetchConsultation = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/appointments/consultation/${id}/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`, 
            },
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            toast.error('Session expirée');
            router.push('/login');
          } else if (res.status === 403) {
            toast.error('Accès refusé');
          } else {
            toast.error('Impossible de charger la consultation');
          }
          return;
        }

        const result: ConsultationData = await res.json();
        setData(result);

        if (result.medical_record) {
          setForm({
            diagnostic: result.medical_record.diagnostic || '',
            traitement: result.medical_record.traitement || '',
            ordonnance: result.medical_record.ordonnance || '',
            notes: result.medical_record.notes || '',
            poids: result.medical_record.poids || '',
            taille: result.medical_record.taille || '',
            tension: result.medical_record.tension || '',
            temperature: result.medical_record.temperature || '',
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Erreur réseau');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [id, session?.accessToken, status, router]);

 const save = async () => {
  if (!session?.accessToken || !id) return;

  try {
    // 1. Sauvegarde du dossier médical (comme avant)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/appointments/save-medical-record/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          appointment: Number(id),
          ...form,
        }),
      }
    );

    if (!res.ok) {
      toast.error('Erreur lors de la sauvegarde du dossier');
      return;
    }

    // 2. Si ordonnance remplie → on la crée automatiquement
    if (form.ordonnance.trim()) {
      const ordonnanceRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ordonnances/create-from-consultation/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            appointment_id: Number(id),
            content: form.ordonnance,
          }),
        }
      );

      if (!ordonnanceRes.ok) {
        toast.error('Ordonnance non créée (mais dossier sauvegardé)');
      }
    }

    toast.success('Consultation terminée ! Ordonnance générée');
    router.push('/doctor/ordonnances');
  } catch (err) {
    toast.error('Erreur réseau');
  }
};

  if (!session || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Accès refusé</h2>
          <p className="text-slate-600">Veuillez vous connecter pour continuer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Timer et Header - Stack sur mobile */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Timer */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${timeLeft <= 120 ? 'bg-red-100' : 'bg-blue-100'}`}>
                  <svg className={`w-6 h-6 ${timeLeft <= 120 ? 'text-red-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Temps restant</p>
                  <p className={`text-2xl font-bold ${timeLeft <= 120 ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Header */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-sm flex-shrink-0">
                    {data.patient.firstname[0]}{data.patient.lastname[0]}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
                      {data.patient.firstname} {data.patient.lastname}
                    </h1>
                    <p className="text-sm text-slate-500 flex items-center mt-1">
                      <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{format(new Date(data.appointment.date), "d MMM yyyy, HH:mm")}</span>
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  En consultation
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Sidebar - Dossier Patient */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Dossier Médical
                </h2>
              </div>

              <div className="p-4 space-y-3">
                {data.patient_profile ? (
                  <>
                    <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-red-800 text-xs mb-0.5">Allergies</p>
                          <p className="text-red-700 text-sm">{data.patient_profile.allergies || 'Aucune'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-amber-800 text-xs mb-0.5">Antécédents</p>
                          <p className="text-amber-700 text-sm">{data.patient_profile.chronic_conditions || 'Aucun'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-blue-800 text-xs mb-0.5">Traitement</p>
                          <p className="text-blue-700 text-sm">{data.patient_profile.medications || 'Aucun'}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-slate-500">Aucun antécédent</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Signes Vitaux */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Signes Vitaux
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Poids', placeholder: 'kg', color: 'blue', key: 'poids' },
                  { label: 'Taille', placeholder: 'cm', color: 'green', key: 'taille' },
                  { label: 'Tension', placeholder: 'mmHg', color: 'purple', key: 'tension' },
                  { label: 'Temp.', placeholder: '°C', color: 'orange', key: 'temperature' }
                ].map(({ label, placeholder, color, key }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      className={`w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-center font-semibold text-slate-700 focus:border-${color}-500 focus:ring-2 focus:ring-${color}-100 outline-none transition text-sm`}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Diagnostic
              </label>
              <textarea
                rows={4}
                placeholder="Saisir le diagnostic médical..."
                className="w-full border-2 border-slate-200 rounded-lg p-3 sm:p-4 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                value={form.diagnostic}
                onChange={(e) => setForm({ ...form, diagnostic: e.target.value })}
              />
            </div>

            {/* Ordonnance */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Ordonnance
              </label>
              <textarea
                rows={6}
                placeholder="Médicaments, posologie, durée du traitement..."
                className="w-full border-2 border-slate-200 rounded-lg p-3 sm:p-4 text-sm text-slate-700 font-mono bg-slate-50 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition resize-none"
                value={form.ordonnance}
                onChange={(e) => setForm({ ...form, ordonnance: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => router.push('/doctor/agenda')}
                className="flex-1 sm:flex-none bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Annuler
              </button>
              <button
                onClick={save}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Terminer la consultation</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}