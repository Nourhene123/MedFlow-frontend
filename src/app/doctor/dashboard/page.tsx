// app/doctor/dashboard/page.tsx
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import useSWR from "swr";
import Link from "next/link";
import { Calendar, FileText, Users, Activity, Stethoscope, Clock } from "lucide-react";
import { CardStats } from "@/components/doctor/CardStats";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

// URL de ton backend Django (à mettre dans .env.local)
const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "")}/api/appointments`;

const fetcher = (url: string, token?: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then((res) => {
    if (!res.ok) throw new Error("Erreur de chargement");
    return res.json();
  });

export default function DoctorDashboard() {
  const { data: session, status } = useSession();

  const token = session?.accessToken as string | undefined;

  // 1. Statistiques du tableau de bord
  const {
    data: summary,
    isLoading: loadingSummary,
    error: errorSummary,
  } = useSWR(token ? [`${API_BASE}/dashboard/`, token] : null, ([url, token]) => fetcher(url, token));

  // 2. Consultations du jour
  const {
    data: todayAppointments = [],
    isLoading: loadingAppts,
    error: errorAppts,
  } = useSWR(token ? [`${API_BASE}/consultations/today/`, token] : null, ([url, token]) => fetcher(url, token));

  const isLoading = status === "loading" || loadingSummary || loadingAppts;
  const hasError = errorSummary || errorAppts;

  if (status === "unauthenticated") {
    return <div>Veuillez vous connecter.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bonjour, Dr. {session?.user?.firstname} {session?.user?.lastname}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isLoading
            ? "Chargement de vos données..."
            : hasError
            ? "Erreur de chargement des données"
            : `Vous avez ${summary?.today_consultations || 0} consultation${summary?.today_consultations > 1 ? "s" : ""} prévue${summary?.today_consultations > 1 ? "s" : ""} aujour&#39;hui.`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStats
          title="Consultations aujourdhui"
          value={isLoading ? "..." : summary?.today_consultations ?? 0}
          icon={Calendar}
          color="blue"
        />
        <CardStats
          title="Patients suivis"
          value={isLoading ? "..." : summary?.total_patients ?? "N/A"}
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
        <Link href="/doctor/agenda" className="block">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Agenda du jour</h2>
              <Calendar className="w-8 h-8 text-blue-100" />
            </div>
            <p className="text-blue-100 mb-4">
              {summary?.today_consultations || 0} rendez-vous prévu{summary?.today_consultations > 1 ? "s" : ""}.
            </p>
            <span className="inline-block bg-white text-blue-600 px-5 py-2 rounded-lg font-medium">
              Voir mon planning
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
              Accédez rapidement aux dossiers médicaux de vos patients.
            </p>
            <span className="inline-block bg-white text-purple-600 px-5 py-2 rounded-lg font-medium">
              Voir les patients
            </span>
          </div>
        </Link>
      </div>

      {/* Prochaines consultations */}
      {todayAppointments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Prochaines consultations
          </h3>
          <div className="space-y-3">
            {todayAppointments.slice(0, 4).map((appt: any) => (
              <div
                key={appt.id}
                className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {appt.patient_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {appt.patient_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(appt.date), "HH:mm")} •{" "}
                      {appt.status === "TERMINE" ? "Terminé" : "À venir"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href={`/doctor/consultation/${appt.id}`}>
                    <span className="text-blue-600 hover:text-blue-700 font-medium text-sm underline">
                      Ouvrir consultation
                    </span>
                  </Link>
                  {appt.patient?.id && (
                    <Link href={`/doctor/patients/${appt.patient.id}`}>
                      <span className="text-gray-600 hover:text-gray-800 text-sm">
                        Dossier
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {todayAppointments.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          Aucune consultation prévue aujourd&apos;hui. Profitez-en pour vous reposer !
        </div>
      )}
    </div>
  );
}