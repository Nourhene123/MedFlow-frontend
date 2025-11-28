'use client';

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import DoctorDetailCard from "../components/MyDoctors";
import DoctorDirectoryCard from "../components/DoctorDirectoryCard";
import BookAppointmentModal from "../components/BookAppointmentModal";

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
  availability?: {
    day_of_week: number;
    day_label: string;
    start_time: string;
    end_time: string;
    duration_per_slot: number;
  }[];
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
  const [scope, setScope] = useState<"related" | "all">("related");
  const [selectedDoctor, setSelectedDoctor] = useState<PatientDoctor | null>(null);

  const { data: doctors = [], isLoading } = useSWR<PatientDoctor[]>(
    accessToken ? [`${DOCTORS_API}?scope=${scope}`, accessToken] : null,
    authedFetcher,
    {
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <div className="max-w-7xl mx-0 lg:mx-auto">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-500">Patient</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">
          Médecins
        </h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          Passez d&rsquo;un coup d&rsquo;œil à vos médecins habituels ou explorez l&rsquo;ensemble du réseau de votre clinique.
        </p>
      </div>

      <div className="mb-10 inline-flex rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
        {([
          { label: "Mes médecins", value: "related" },
          { label: "Tous les médecins", value: "all" },
        ] as const).map((option) => {
          const active = scope === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setScope(option.value)}
              className={
                "relative min-w-[150px] rounded-3xl px-6 py-3 text-sm font-semibold transition" +
                (active
                  ? " bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow"
                  : " text-slate-500 hover:text-slate-700")
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center text-sm text-gray-500">Chargement des médecins…</p>
        ) : doctors.length > 0 ? (
          doctors.map((doctor) => (
            scope === "related" ? (
              <DoctorDetailCard
                key={doctor.id}
                name={doctor.fullname || `${doctor.firstname} ${doctor.lastname}`}
                specialty={doctor.speciality}
                clinic={doctor.clinique_name || ""}
                consultationFee={`${doctor.consultation_fee ?? 0} DT`}
                yearsOfExperience={doctor.experience_years ?? 0}
                onNotesClick={() => {}}
                onAvailabilityClick={() => {}}
                onBookClick={() => setSelectedDoctor(doctor)}
                onMessageClick={() => {}}
              />
            ) : (
              <DoctorDirectoryCard
                key={doctor.id}
                name={doctor.fullname || `${doctor.firstname} ${doctor.lastname}`}
                specialty={doctor.speciality}
                clinic={doctor.clinique_name || ""}
                consultationFee={`${doctor.consultation_fee ?? 0} DT`}
                yearsOfExperience={doctor.experience_years ?? 0}
                availability={doctor.availability}
                onBookClick={() => setSelectedDoctor(doctor)}
                onMessageClick={() => {}}
              />
            )
          ))
        ) : (
          <p className="text-center text-sm text-gray-500">Aucun médecin associé.</p>
        )}
      </div>

      {selectedDoctor && (
        <BookAppointmentModal
          doctor={{
            id: selectedDoctor.id,
            fullname:
              selectedDoctor.fullname ||
              `${selectedDoctor.firstname || ""} ${selectedDoctor.lastname || ""}`.trim(),
            firstname: selectedDoctor.firstname,
            lastname: selectedDoctor.lastname,
            speciality: selectedDoctor.speciality,
            consultation_fee: selectedDoctor.consultation_fee,
            clinique_name: selectedDoctor.clinique_name,
          }}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </div>
  );
}

