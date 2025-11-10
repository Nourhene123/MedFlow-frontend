// app/doctor/dashboard/page.tsx
'use client';

import useSWR from "swr";
import Link from "next/link";
import { Calendar, FileText, Users, Activity, Stethoscope } from "lucide-react";
import { CardStats } from "@/components/doctor/CardStats";
import { useSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') + '/api/medical/';

export default function DoctorDashboard() {
  const { data: session } = useSession();

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Erreur");
    return res.json();
  };

  // 1. Summary
  const { data: summary, isLoading: loadingSummary } = useSWR(
    `${API_BASE}dashboard/`,
    fetcher
  );

  // 2. Today’s appointments
  const { data: todayAppointments = [], isLoading: loadingAppts } = useSWR(
    `${API_BASE}consultations/today/`,
    fetcher
  );

  const isLoading = loadingSummary || loadingAppts;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bonjour, Dr. {session?.user?.firstname} {session?.user?.lastname}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isLoading
            ? "Chargement..."
            : `Vous avez ${summary?.today_consultations || 0} consultation${summary?.today_consultations > 1 ? 's' : ''} aujourd'hui.`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStats
          title="Consultations aujourd'hui"
          value={isLoading ? "..." : summary?.today_consultations ?? 0}
          icon={Calendar}
          color="blue"
        />
        <CardStats
          title="Patients suivis"
          value={isLoading ? "..." : summary?.total_patients ?? 0}
          icon={Users}
          color="purple"
        />
        <CardStats
          title="Ordonnances en attente"
          value={isLoading ? "..." : summary?.pending_prescriptions ?? 0}
          icon={FileText}
          color="orange"
        />
        <CardStats
          title="Traitements actifs"
          value={isLoading ? "..." : summary?.active_treatments ?? 0}
          icon={Activity}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/doctor/consultations" className="block">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Consultations du jour</h2>
              <Calendar className="w-8 h-8 text-blue-100" />
            </div>
            <p className="text-blue-100 mb-4">
              {summary?.today_consultations || 0} rendez-vous prévu{summary?.today_consultations > 1 ? 's' : ''}.
            </p>
            <span className="inline-block bg-white text-blue-600 px-5 py-2 rounded-lg font-medium">
              Voir le planning
            </span>
          </div>
        </Link>

        <Link href="/doctor/patients" className="block">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Dossiers patients</h2>
              <Stethoscope className="w-8 h-8 text-purple-100" />
            </div>
            <p className="text-purple-100 mb-4">
              {summary?.total_patients || 0} patient{summary?.total_patients > 1 ? 's' : ''} dans votre suivi.
            </p>
            <span className="inline-block bg-white text-purple-600 px-5 py-2 rounded-lg font-medium">
              Accéder aux dossiers
            </span>
          </div>
        </Link>
      </div>

      {/* Next Appointments */}
      {todayAppointments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Prochaines consultations
          </h3>
          <div className="space-y-3">
            {todayAppointments.slice(0, 3).map((appt: any) => (
              <div
                key={appt.id}
                className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {appt.patient_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • Consultation
                    </p>
                  </div>
                </div>
                <Link href={`/doctor/patients/${appt.patient.id}`}>
                  <span className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Voir dossier
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}