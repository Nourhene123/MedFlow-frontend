'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import useSWR from "swr";
import Link from "next/link";
import { Calendar, Users, FileText, DollarSign, Stethoscope } from "lucide-react";
import { CardStats } from "@/components/receptionist/CardStats";
import { useSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/';

export default function ReceptionistDashboard() {
  const { data: session } = useSession();

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Erreur");
    const data = await res.json();

    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object" && Array.isArray(data.results)) {
      return data.results;
    }

    return [];
  };

  // === 1. Utilisateur connecté ===
  const { data: currentUser, isLoading: loadingUser } = useSWR(
    `${API_BASE}accounts/current-user/`,
    fetcher
  );

  // === 2. RDV du jour ===
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAppointments = [], isLoading: loadingToday } = useSWR(
    currentUser ? `${API_BASE}appointments/list/?date=${today}` : null,
    fetcher
  );

  // === 3. Patients ===
  const { data: patients = [], isLoading: loadingPatients } = useSWR(
    currentUser ? `${API_BASE}accounts/patients/` : null,
    fetcher
  );

  // === 4. Médecins ===
  const { data: doctors = [], isLoading: loadingDoctors } = useSWR(
    currentUser ? `${API_BASE}accounts/list-medecins/` : null,
    fetcher
  );

  const isLoading = loadingUser || loadingToday || loadingPatients || loadingDoctors;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bonjour, {currentUser?.firstname || "Réceptionniste"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {currentUser?.clinique ? `Clinique : ${currentUser.clinique.name}` : "Chargement..."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStats
          title="RDV Aujourd'hui"
          value={isLoading ? "..." : todayAppointments.length}
          icon={Calendar}
          color="blue"
        />
        <CardStats
          title="Patients"
          value={isLoading ? "..." : patients.length}
          icon={Users}
          color="emerald"
        />
        <CardStats
          title="Médecins"
          value={isLoading ? "..." : doctors.length}
          icon={Stethoscope}
          color="indigo"
        />
        <CardStats
          title="Factures en attente"
          value={isLoading ? "..." : "0"}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Prendre RDV */}
        <Link href="/receptionist/appointments/create" className="block">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-xl font-bold mb-2">Prendre un RDV</h2>
            <p className="text-blue-100 mb-4">
              Planifier une consultation
            </p>
            <span className="inline-block bg-white text-blue-600 px-5 py-2 rounded-lg font-medium">
              Nouveau RDV
            </span>
          </div>
        </Link>

        {/* Enregistrer Patient */}
        <Link href="/receptionist/patients/create" className="block">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-xl font-bold mb-2">Nouveau Patient</h2>
            <p className="text-emerald-100 mb-4">
              Enregistrer un nouveau patient
            </p>
            <span className="inline-block bg-white text-emerald-600 px-5 py-2 rounded-lg font-medium">
              Ajouter
            </span>
          </div>
        </Link>

        {/* Facturation */}
        <Link href="/receptionist/billing/create" className="block">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-xl font-bold mb-2">Facturer</h2>
            <p className="text-amber-100 mb-4">
              Émettre une facture
            </p>
            <span className="inline-block bg-white text-amber-600 px-5 py-2 rounded-lg font-medium">
              Nouvelle facture
            </span>
          </div>
        </Link>
      </div>

      {/* Planning du jour */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          RDV d&apos;aujourd&apos;hui
        </h3>
        {isLoading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : !Array.isArray(todayAppointments) || todayAppointments.length === 0 ? (
          <p className="text-gray-500">Aucun RDV aujourd&apos;hui</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.slice(0, 5).map((appt: any) => (
              <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {appt.patient.fullname}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dr. {appt.medecin.fullname} • {new Date(appt.date).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  appt.status === 'PROGRAMME' ? 'bg-blue-100 text-blue-700' :
                  appt.status === 'TERMINE' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {appt.status_display}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}