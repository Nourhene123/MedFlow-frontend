'use client';

import useSWR from "swr";
import Link from "next/link";
import { FileText, Download, User, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function OrdonnancesPage() {
  const { data: session, status } = useSession();

 const fetcher = (url: string) => {
    if (!session?.accessToken) {
      throw new Error("Pas de token");
    }
    return fetch(url, {
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          // Optionnel : forcer la reconnexion
          window.location.href = "/login";
        }
        throw new Error("Erreur auth");
      }
      return res.json();
    });
  };

  // On récupère toutes les consultations terminées du médecin
 const { data: response = {}, isLoading } = useSWR(
  `${API_BASE}/api/appointments/list/?status=completed`,
  fetcher
);

// Tu extrait le vrai tableau ici
const appointments = response.results || [];   

  // On filtre celles qui ont une ordonnance
  const ordonnances = appointments
    .filter((apt: any) => apt.medical_record?.ordonnance?.trim())
    .map((apt: any) => ({
      id: apt.id,
      patient_name: `${apt.patient.firstname} ${apt.patient.lastname}`,
      doctor_name: apt.doctor_name || "Dr. Vous",
      content: apt.medical_record.ordonnance,
      created_at: apt.medical_record.updated_at || apt.date,
      signed: true, // tu pourras ajouter un champ signed plus tard
    }))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <FileText className="w-10 h-10 text-blue-600" />
            Mes Ordonnances
          </h1>
          <p className="text-slate-600 mt-2">Toutes les ordonnances générées lors de vos consultations</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : ordonnances.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <FileText className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Aucune ordonnance générée pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ordonnances.map((ordo: any) => (
              <div key={ordo.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center font-bold text-xl">
                      {ordo.patient_name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <h3 className="font-bold">{ordo.patient_name}</h3>
                      <p className="text-sm opacity-90 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(ordo.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <User className="w-4 h-4" />
                    <span>{ordo.doctor_name}</span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap line-clamp-3">
                      {ordo.content}
                    </pre>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <Link
                      href={`/doctor/consultation/${ordo.id}`}
                      className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      Voir consultation
                    </Link>
                    <a
                      href={`${API_BASE}/api/appointments/${ordo.id}/pdf-ordonnance/`}
                      target="_blank"
                      className="text-emerald-600 hover:underline font-medium flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}