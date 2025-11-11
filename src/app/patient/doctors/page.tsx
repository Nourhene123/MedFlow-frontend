'use client';

import useSWR from "swr";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import DoctorDetailCard from "../components/MyDoctors";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000") + "/api/";
const DOCTORS_API = `${API_BASE}patient/doctors/`;

type PatientDoctor = {
  id: number;
  firstname: string;
  lastname: string;
  fullname: string;
  speciality: string;
  consultation_fee: number;
  experience_years: number;
  clinique_name: string | null;
};

type FetchKey = [string, string];

const authedFetcher = async ([url, token]: FetchKey) => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.detail || errorBody.error || "Erreur serveur";
    throw new Error(message);
  }

  return res.json();
};

export default function DoctorsPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const { data: doctors = [], isLoading } = useSWR<PatientDoctor[]>(
    accessToken ? [DOCTORS_API, accessToken] : null,
    authedFetcher,
    {
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <div className="max-w-7xl mx-0 lg:mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Médecins</h1>
        <p className="text-gray-600 mt-2">Consultez la liste de vos médecins</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center text-sm text-gray-500">Chargement des médecins…</p>
        ) : doctors.length > 0 ? (
          doctors.map((doctor) => (
            <DoctorDetailCard
              key={doctor.id}
              name={doctor.fullname || `${doctor.firstname} ${doctor.lastname}`}
              specialty={doctor.speciality}
              clinic={doctor.clinique_name || ""}
              consultationFee={`${doctor.consultation_fee ?? 0} DT`}
              yearsOfExperience={doctor.experience_years ?? 0}
              onNotesClick={() => {}}
              onAvailabilityClick={() => {}}
              onBookClick={() => {}}
              onMessageClick={() => {}}
            />
          ))
        ) : (
          <p className="text-center text-sm text-gray-500">Aucun médecin associé.</p>
        )}
      </div>
    </div>
  );
}

