'use client';

import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, User, Stethoscope, FileText, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/';

export default function MedicalRecordPage() {
  const { id } = useParams();
  const { data: session } = useSession();

  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
    }).then(res => res.json());

  const { data: records = [], isLoading } = useSWR(
    `${API_BASE}medical-records/patient/${id}/`,
    fetcher
  );

  const { data: patient } = useSWR(
    `${API_BASE}accounts/patients/${id}/`,
    fetcher
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/receptionist/patients">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dossier Médical
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {patient ? `${patient.firstname} ${patient.lastname}` : 'Chargement...'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        {isLoading ? (
          <p className="text-center text-gray-500">Chargement du dossier...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-gray-500">Aucun dossier médical</p>
        ) : (
          <div className="space-y-6">
            {records.map((r: any) => (
              <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">
                      {format(new Date(r.date), 'dd MMMM yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Stethoscope className="w-4 h-4" />
                    Dr. {r.medecin?.fullname || 'Inconnu'}
                  </div>
                </div>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p><strong>Diagnostic :</strong> {r.diagnostic || '—'}</p>
                  <p><strong>Traitement :</strong> {r.traitement || '—'}</p>
                  {r.notes && <p><strong>Notes :</strong> {r.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}