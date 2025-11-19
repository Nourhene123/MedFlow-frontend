'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, User, FileText, Stethoscope } from 'lucide-react';

const fetcher = (url: string, token: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());

export default function PatientHistoryPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();

  const { data: patient, isLoading } = useSWR(
    session?.accessToken
      ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/patients/${id}/`, session.accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  const { data: history = [] } = useSWR(
    session?.accessToken
      ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/patients/${id}/history/`, session.accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  if (isLoading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* En-tête patient */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {patient?.firstname[0]}{patient?.lastname[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {patient?.firstname} {patient?.lastname}
            </h1>
            <p className="text-slate-600 mt-2 flex items-center gap-4">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5" /> {patient?.email}
              </span>
              {patient?.phone && <span>• {patient?.phone}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Historique des consultations */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          Historique des consultations
        </h2>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <Stethoscope className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">Aucune consultation terminée pour le moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((consult: any) => (
                <div key={consult.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6" />
                        <span className="text-lg font-semibold">
                          {format(new Date(consult.date), "EEEE d MMMM yyyy 'à' HH:mm")}
                        </span>
                      </div>
                      {consult.motif && (
                        <span className="bg-white/20 px-4 py-1 rounded-full text-sm">
                          {consult.motif}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Signes vitaux */}
                    {(consult.medical_record?.poids || consult.medical_record?.temperature) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {consult.medical_record.poids && (
                          <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <p className="font-medium text-blue-900">Poids</p>
                            <p className="text-2xl font-bold text-blue-700">{consult.medical_record.poids} kg</p>
                          </div>
                        )}
                        {consult.medical_record.tension && (
                          <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <p className="font-medium text-purple-900">Tension</p>
                            <p className="text-2xl font-bold text-purple-700">{consult.medical_record.tension}</p>
                          </div>
                        )}
                        {consult.medical_record.temperature && (
                          <div className="bg-orange-50 p-3 rounded-lg text-center">
                            <p className="font-medium text-orange-900">Température</p>
                            <p className="text-2xl font-bold text-orange-700">{consult.medical_record.temperature}°C</p>
                          </div>
                        )}
                        {consult.medical_record.taille && (
                          <div className="bg-green-50 p-3 rounded-lg text-center">
                            <p className="font-medium text-green-900">Taille</p>
                            <p className="text-2xl font-bold text-green-700">{consult.medical_record.taille} cm</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Diagnostic */}
                    {consult.medical_record?.diagnostic && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Diagnostic</h4>
                        <p className="bg-gray-50 p-4 rounded-lg text-slate-700 whitespace-pre-wrap">
                          {consult.medical_record.diagnostic}
                        </p>
                      </div>
                    )}

                    {/* Ordonnance */}
                    {consult.medical_record?.ordonnance && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Ordonnance</h4>
                        <pre className="bg-slate-900 text-green-400 p-5 rounded-lg font-mono text-sm whitespace-pre-wrap">
                          {consult.medical_record.ordonnance}
                        </pre>
                      </div>
                    )}

                    {/* Notes */}
                    {consult.medical_record?.notes && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Notes</h4>
                        <p className="text-slate-600 italic">{consult.medical_record.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}