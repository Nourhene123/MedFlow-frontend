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
    id: number;
    firstname: string;
    lastname: string;
  };
  patient_profile?: {
    allergies?: string;
    chronic_conditions?: string;
    medications?: string;
    blood_type?: string;
    emergency_contact?: string;
    insurance_provider?: string;
    insurance_number?: string;
  };
  medical_file?: {
    allergies?: string;
    antecedents_familiaux?: string;
    antecedents_personnels?: string;
    traitements_en_cours?: string;
    notes_importantes?: string;
  } | null;
  medical_record?: {
    diagnostic?: string;
    traitement?: string;
    ordonnance?: string;
    notes?: string;
    poids?: string;
    taille?: string;
    tension?: string;
    temperature?: string;
    heart_rate?: string;
    spo2?: string;
    glycemia?: string;
  };
}

export default function ConsultationPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { data: session, status } = useSession();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

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
    temperature: '',
    heart_rate: '',
    spo2: '',
    glycemia: '',
    allergies: '',
    antecedents_familiaux: '',
    antecedents_personnels: '',
    traitements_en_cours: '',
    notes_importantes: ''
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
          `${BACKEND_URL}/api/appointments/consultation/${id}/`,
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

        const medicalRecord = result.medical_record || {};
        const medicalFile = result.medical_file || {};
        setForm({
          diagnostic: medicalRecord.diagnostic || '',
          traitement: medicalRecord.traitement || '',
          ordonnance: medicalRecord.ordonnance || '',
          notes: medicalRecord.notes || '',
          poids: medicalRecord.poids || '',
          taille: medicalRecord.taille || '',
          tension: medicalRecord.tension || '',
          temperature: medicalRecord.temperature || '',
          heart_rate: medicalRecord.heart_rate || '',
          spo2: medicalRecord.spo2 || '',
          glycemia: medicalRecord.glycemia || '',
          allergies: medicalFile.allergies || '',
          antecedents_familiaux: medicalFile.antecedents_familiaux || '',
          antecedents_personnels: medicalFile.antecedents_personnels || '',
          traitements_en_cours: medicalFile.traitements_en_cours || '',
          notes_importantes: medicalFile.notes_importantes || '',
        });
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
      const payload = {
      appointment: Number(id),
      diagnostic: form.diagnostic,
      traitement: form.traitement,
      ordonnance: form.ordonnance,
      notes: form.notes,
      poids: form.poids,
      taille: form.taille,
      tension: form.tension,
      temperature: form.temperature,
      heart_rate: form.heart_rate,
      spo2: form.spo2,
      glycemia: form.glycemia,
      allergies: form.allergies,
      antecedents_familiaux: form.antecedents_familiaux,
      antecedents_personnels: form.antecedents_personnels,
      traitements_en_cours: form.traitements_en_cours,
      notes_importantes: form.notes_importantes,
    };

    const res = await fetch(
      `${BACKEND_URL}/api/appointments/save-medical-record/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      toast.error('Erreur lors de la sauvegarde du dossier');
      return;
    }

      // 2. Si ordonnance remplie → on la crée automatiquement
      if (form.ordonnance.trim()) {
        const ordonnanceRes = await fetch(
        `${BACKEND_URL}/api/ordonnances/create-from-consultation/`,
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

              <div className="p-4 space-y-4">
                {data.patient_profile && (
                  <div className="flex flex-col gap-2 text-sm text-slate-600">
                    <p><strong>Groupe sanguin :</strong> {data.patient_profile.blood_type || '—'}</p>
                    <p><strong>Contact urgence :</strong> {data.patient_profile.emergency_contact || '—'}</p>
                    <p><strong>Assurance :</strong> {data.patient_profile.insurance_provider || '—'} {data.patient_profile.insurance_number && `(${data.patient_profile.insurance_number})`}</p>
                  </div>
                )}

                {[
                  { label: 'Allergies', key: 'allergies', placeholder: 'Lister les allergies connues...' },
                  { label: 'Antécédents familiaux', key: 'antecedents_familiaux', placeholder: 'Antécédents médicaux familiaux...' },
                  { label: 'Antécédents personnels', key: 'antecedents_personnels', placeholder: 'Antécédents médicaux personnels...' },
                  { label: 'Traitements en cours', key: 'traitements_en_cours', placeholder: 'Traitements actuels...' },
                  { label: 'Notes importantes', key: 'notes_importantes', placeholder: 'Informations critiques à retenir...' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                    <textarea
                      rows={key === 'notes_importantes' ? 4 : 3}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                      placeholder={placeholder}
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Signes vitaux
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {( [
                  { label: 'Poids (kg)', key: 'poids', placeholder: '70' },
                  { label: 'Taille (cm)', key: 'taille', placeholder: '170' },
                  { label: 'Tension', key: 'tension', placeholder: '120/80' },
                  { label: 'Température (°C)', key: 'temperature', placeholder: '37.0' },
                  { label: 'Fréquence cardiaque (bpm)', key: 'heart_rate', placeholder: '72' },
                  { label: 'SpO₂ (%)', key: 'spo2', placeholder: '98' },
                  { label: 'Glycémie (g/L)', key: 'glycemia', placeholder: '1.0' },
                ] as const).map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                      placeholder={placeholder}
                      value={form[key]}
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
