'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Stethoscope,
  Thermometer,
  Heart,
  Activity,
  Scale,
  Ruler,
  AlertCircle,
  History,
  Pill,
  ClipboardCheck,
  Download,
  Printer,
  Edit,
  Mail,
  Phone,
  Loader2,
  Users,
  AlertTriangle,
  NotebookPen
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

// === MÊME FETCHER QUE LE MÉDECIN ===
async function fetcher<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Erreur de chargement');
  }
  return (await res.json()) as T;
}

// === MÊME INTERFACES ===
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

export default function PatientDossierPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'fiche' | 'historique'>('fiche');

  // === EXACTEMENT LES MÊMES REQUÊTES QUE LE MÉDECIN ===

  // 1. Fiche médicale (contient déjà les infos patient !)
  const { data: medicalFile, isLoading: medicalFileLoading } = useSWR<MedicalFile>(
    session?.accessToken 
      ? ([`${API_BASE}/api/medical/medical-file/${id}/`, session.accessToken] as [string, string]) 
      : null,
    ([url, token]: [string, string]) => fetcher<MedicalFile>(url, token)
  );

  // 2. Dernier dossier médical
  const { data: latestMedicalRecord } = useSWR<LatestMedicalRecord>(
    session?.accessToken
      ? ([`${API_BASE}/api/medical/patient/${id}/latest-record/`, session.accessToken] as [string, string])
      : null,
    ([url, token]: [string, string]) => fetcher<LatestMedicalRecord>(url, token),
    { revalidateOnFocus: false }
  );

  // 3. Historique des consultations (vous pouvez utiliser celui que vous avez déjà)
  const { data: medicalHistory = [], isLoading: historyLoading } = useSWR<MedicalRecordEntry[]>(
    session?.accessToken
      ? ([`${API_BASE}/api/medical/patient/${id}/`, session.accessToken] as [string, string])
      : null,
    ([url, token]: [string, string]) => fetcher<MedicalRecordEntry[]>(url, token),
    { revalidateOnFocus: false }
  );

  // === MÊME LOGIQUE D'EXTRACTION DES INFOS PATIENT ===
  const patientInfo = medicalFile
    ? (() => {
        const nameParts = (medicalFile.patient_name || '')
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        const firstname = nameParts[0] || medicalFile.patient_name;
        const lastname = nameParts.slice(1).join(' ') || undefined;
        return {
          id: medicalFile.patient_id,
          firstname,
          lastname,
          email: medicalFile.patient_email,
          phone: medicalFile.patient_phone,
          clinique: medicalFile.clinique_name,
        };
      })()
    : null;

  // === ÉTATS ===
  const isLoading = medicalFileLoading || historyLoading;
  const hasError = !medicalFile && !isLoading;

  // === FONCTIONS UTILITAIRES ===
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date invalide';
    }
  };

  // === AFFICHAGE CHARGEMENT/ERREUR ===
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (hasError || !patientInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Dossier non trouvé
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {hasError ? "Erreur de chargement" : "Ce patient n'a pas encore de fiche médicale"}
          </p>
          <Link
            href="/receptionist/patients"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  // === RENDER PRINCIPAL (vous pouvez garder votre design) ===
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header avec navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/receptionist/patients"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Dossier Médical
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {patientInfo.firstname} {patientInfo.lastname}
                </p>
              </div>
            </div>
           
          </div>
        </div>

        {/* Informations patient */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {patientInfo.firstname?.[0]}{patientInfo.lastname?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {patientInfo.firstname} {patientInfo.lastname}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Patient • {patientInfo.clinique}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium">{patientInfo.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Phone className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                <p className="font-medium">{patientInfo.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Votre contenu existant pour la fiche médicale et l'historique */}
        {/* ... */}
        
      </div>
    </div>
  );
}