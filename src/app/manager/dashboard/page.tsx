'use client';

import useSWR from "swr";
import Link from "next/link";
import { Stethoscope, Users, Activity, Building } from "lucide-react";
import { CardStats } from "@/components/manager/CardStats";
import { useSession } from "next-auth/react";


const API_BASE = process.env.BACKEND || 'http://localhost:8000/api/';



// === PAGE ===
export default function ManagerDashboard() {
  const { data: session } = useSession();

  const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erreur");
  }
  return res.json();
  };

  // === 1. Utilisateur connecté (Manager) ===
  const { data: currentUser, isLoading: loadingUser } = useSWR(
    `${API_BASE}accounts/current-user/`,
    fetcher
  );
  const managerId = currentUser?.id;

  // === 2. Cliniques du manager ===
  const { data: clinics = [], isLoading: loadingClinics } = useSWR(
    managerId ? `${API_BASE}clinique/managers/${managerId}/clinics/` : null,
    fetcher
  );
  const managerClinic = clinics[0]; // Un manager = une clinique

  // === 3. Médecins de la clinique ===
  const { data: doctors = [], isLoading: loadingDoctors } = useSWR(
    managerClinic
      ? `${API_BASE}accounts/list-medecins/?clinique=${managerClinic.id}`
      : null,
    fetcher
  );

  // === 4. Patients de la clinique ===
  const { data: patients = [], isLoading: loadingPatients } = useSWR(
    managerClinic
      ? `${API_BASE}accounts/patients/?clinique=${managerClinic.id}`
      : null,
    fetcher
  );

 

  const isLoading = loadingUser || loadingClinics || loadingDoctors || loadingPatients;


  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenue, Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {managerClinic ? `Clinique : ${managerClinic.name}` : "Chargement de votre clinique..."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStats
          title="Médecins"
          value={isLoading ? "..." : doctors.length}
          icon={Stethoscope}
          color="teal"
        />
        <CardStats
          title="Patients"
          value={isLoading ? "..." : patients.length}
          icon={Users}
          color="purple"
        />
       
        <CardStats
          title="Cliniques"
          value={isLoading ? "..." : clinics.length}
          icon={Building}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Médecins */}
        <Link href="/manager/doctors" className="block">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-xl font-bold mb-2">Gérer les Médecins</h2>
            <p className="text-teal-100 mb-4">
              {doctors.length} médecin{doctors.length > 1 ? "s" : ""} dans votre clinique.
            </p>
            <span className="inline-block bg-white text-teal-600 px-5 py-2 rounded-lg font-medium">
              Voir les médecins
            </span>
          </div>
        </Link>

        {/* Patients */}
        <Link href="/manager/patients" className="block">
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-xl font-bold mb-2">Gérer les Patients</h2>
            <p className="text-pink-100 mb-4">
              {patients.length} patient{patients.length > 1 ? "s" : ""} enregistré{patients.length > 1 ? "s" : ""}.
            </p>
            <span className="inline-block bg-white text-pink-600 px-5 py-2 rounded-lg font-medium">
              Voir les patients
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}