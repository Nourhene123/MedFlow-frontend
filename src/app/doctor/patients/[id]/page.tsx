'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

import { Calendar, User, FileText, Stethoscope, Pill, NotebookPen } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

async function fetcher<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Erreur de chargement');
  }
  return (await res.json()) as T;
}

interface MedicalFile {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone?: string;
  clinique?: number | null;
  clinique_name?: string;
  allergies?: string;
  antecedents_familiaux?: string;
  antecedents_personnels?: string;
  traitements_en_cours?: string;
  notes_importantes?: string;
}

interface MedicalRecordEntry {
  id: number;
  date: string;
  motif?: string;
  medecin_name?: string;
  medical_record?: {
    poids?: string;
    taille?: string;
    tension?: string;
    temperature?: string;
    heart_rate?: string;
    spo2?: string;
    glycemia?: string;
    diagnostic?: string;
    ordonnance?: string;
    traitement?: string;
    notes?: string;
  };
}

interface LatestMedicalRecord {
  id: number;
  date: string;
  medecin_name?: string;
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
}

export default function PatientHistoryPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();

  const { data: medicalFile, isLoading: medicalFileLoading } = useSWR<MedicalFile>(
    session?.accessToken ? ([`${API_BASE}/api/medical/medical-file/${id}/`, session.accessToken] as [string, string]) : null,
    ([url, token]: [string, string]) => fetcher<MedicalFile>(url, token)
  );

  const { data: latestMedicalRecord } = useSWR<LatestMedicalRecord>(
    session?.accessToken
      ? ([`${API_BASE}/api/medical/patient/${id}/latest-record/`, session.accessToken] as [string, string])
      : null,
    ([url, token]: [string, string]) => fetcher<LatestMedicalRecord>(url, token),
    { revalidateOnFocus: false }
  );

  const { data: medicalHistory = [], isLoading: historyLoading } = useSWR<MedicalRecordEntry[]>(
    session?.accessToken
      ? ([`${API_BASE}/api/appointments/patients/${id}/history/`, session.accessToken] as [string, string])
      : null,
    ([url, token]: [string, string]) => fetcher<MedicalRecordEntry[]>(url, token),
    { revalidateOnFocus: false }
  );

  const patientInfo = medicalFile
    ? (() => {
        const nameParts = (medicalFile.patient_name || '')
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        const firstname = nameParts[0] || medicalFile.patient_name;
        const lastname = nameParts.slice(1).join(' ') || undefined;
        return {
          firstname,
          lastname,
          email: medicalFile.patient_email,
          phone: medicalFile.patient_phone,
          clinique: medicalFile.clinique_name,
        };
      })()
    : null;

  const medicalRecords: MedicalRecordEntry[] = (medicalHistory || []).filter(
    (entry) => entry.medical_record
  );

  const fallbackRecord = medicalRecords[0];
  const latestRecordForSummary = latestMedicalRecord || fallbackRecord?.medical_record || null;
  const latestRecordDate = latestMedicalRecord?.date || fallbackRecord?.date;
  const latestRecordDoctor = latestMedicalRecord?.medecin_name || fallbackRecord?.medecin_name;

  const recentOrdonnances = medicalRecords
    .filter((entry) => entry.medical_record?.ordonnance?.trim())
    .slice(0, 3);

  if (historyLoading || medicalFileLoading) return <div className="p-8 text-center">Chargement...</div>;

  if (!patientInfo) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center bg-white rounded-2xl shadow">
        <p className="text-xl text-slate-600">
          Aucun dossier trouvé pour ce patient ou aucun rendez-vous enregistré.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* En-tête patient */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {patientInfo?.firstname?.[0]}{patientInfo?.lastname?.[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {patientInfo?.firstname} {patientInfo?.lastname}
            </h1>
            <p className="text-slate-600 mt-2 flex items-center gap-4">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5" /> {patientInfo?.email}
              </span>
              {patientInfo?.phone && <span>• {patientInfo.phone}</span>}
              {patientInfo?.clinique && <span>• {patientInfo.clinique}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <h3 className="text-slate-500 text-sm font-semibold mb-3">Fiche médicale</h3>
        {medicalFile ? (
          <div className="grid gap-4 md:grid-cols-2">
            {([
              { key: 'allergies', label: 'Allergies', accent: 'text-red-500' },
              { key: 'antecedents_familiaux', label: 'Antécédents familiaux', accent: 'text-amber-500' },
              { key: 'antecedents_personnels', label: 'Antécédents personnels', accent: 'text-emerald-500' },
              { key: 'traitements_en_cours', label: 'Traitements en cours', accent: 'text-blue-500' },
              { key: 'notes_importantes', label: 'Notes importantes', accent: 'text-slate-500' },
            ] as { key: 'allergies' | 'antecedents_familiaux' | 'antecedents_personnels' | 'traitements_en_cours' | 'notes_importantes'; label: string; accent: string }[]).map(({ key, label, accent }) => {
              const value = medicalFile[key] || '';
              const hasValue = value.trim().length > 0;
              return (
                <div key={key} className="rounded-xl border border-slate-100 p-4">
                  <p className={`text-xs uppercase tracking-wide font-semibold ${accent}`}>{label}</p>
                  <p
                    className={`mt-2 whitespace-pre-wrap text-sm ${
                      hasValue ? 'text-slate-800' : 'text-slate-400 italic'
                    }`}
                  >
                    {hasValue ? value : 'Non renseigné'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500">Fiche médicale non disponible.</p>
        )}
      </div>

      {/* Signes vitaux */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-slate-500 text-sm font-semibold">Signes vitaux (dernière consultation)</h3>
            {latestRecordDate && (
              <p className="text-xs text-slate-400">
                {format(new Date(latestRecordDate), 'dd MMM yyyy HH:mm')} {latestRecordDoctor && `• ${latestRecordDoctor}`}
              </p>
            )}
          </div>
        </div>
        {latestRecordForSummary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 text-center">
            {latestRecordForSummary.poids && (
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Poids</p>
                <p className="text-2xl font-bold text-slate-900">{latestRecordForSummary.poids} kg</p>
              </div>
            )}
            {latestRecordForSummary.tension && (
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Tension</p>
                <p className="text-2xl font-bold text-slate-900">{latestRecordForSummary.tension}</p>
              </div>
            )}
            {latestRecordForSummary.temperature && (
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Température</p>
                <p className="text-2xl font-bold text-slate-900">{latestRecordForSummary.temperature}°C</p>
              </div>
            )}
            {latestRecordForSummary.taille && (
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Taille</p>
                <p className="text-2xl font-bold text-slate-900">{latestRecordForSummary.taille} cm</p>
              </div>
            )}
            {latestRecordForSummary.heart_rate && (
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Fréquence cardiaque</p>
                <p className="text-2xl font-bold text-slate-900">{latestRecordForSummary.heart_rate} bpm</p>
              </div>
            )}
            {latestRecordForSummary.spo2 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">SpO₂</p>
                <p className="text-2xl font-bold text-slate-900">{latestRecordForSummary.spo2}%</p>
              </div>
            )}
            {latestRecordForSummary.glycemia && (
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Glycémie</p>
                <p className="text-2xl font-bold text-slate-900">{latestRecordForSummary.glycemia} g/L</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500">Aucune mesure récente.</p>
        )}
      </div>
    </div>
  );
}