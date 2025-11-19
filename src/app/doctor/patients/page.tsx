// app/doctor/patients/page.tsx → VERSION 100% CORRIGÉE

'use client';

import useSWR from "swr";
import { Search, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fetcher = (url: string, token: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then(async (res) => {
    if (!res.ok) throw new Error("Erreur de chargement");
    const data = await res.json();
    // DRF renvoie souvent { results: [...] } → on normalise ici
    return data.results || data || [];
  });

export default function PatientsListPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");

  const { data: rawAppointments = [], isLoading } = useSWR(
    session?.accessToken
      ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/appointments/list/`, session.accessToken]
      : null,
    ([url, token]) => fetcher(url, token),
    { revalidateOnFocus: false }
  );

  // Maintenant appointments est TOUJOURS un tableau
  const appointments: any[] = Array.isArray(rawAppointments) ? rawAppointments : [];

  // Extraction des patients uniques + prochain RDV
  const patientsMap = new Map<number, any>();

  appointments.forEach((appt: any) => {
    if (!appt.patient || !["PROGRAMME", "TERMINE"].includes(appt.status)) return;

    const patientId = appt.patient.id;
    if (!patientsMap.has(patientId)) {
      patientsMap.set(patientId, {
        ...appt.patient,
        nextAppointment: null,
      });
    }

    const patientEntry = patientsMap.get(patientId);
    // On garde le prochain RDV (le plus proche dans le futur)
    if (
      appt.status === "PROGRAMME" &&
      (!patientEntry.nextAppointment ||
        new Date(appt.date) < new Date(patientEntry.nextAppointment.date))
    ) {
      patientEntry.nextAppointment = appt;
    }
  });

  const patients = Array.from(patientsMap.values());

  const filtered = patients.filter((p: any) =>
    `${p.firstname} ${p.lastname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="w-10 h-10 text-blue-600" />
          Mes Patients
        </h1>
        <p className="text-gray-600 mt-2">
          {isLoading ? "..." : `${patients.length} patient${patients.length > 1 ? "s" : ""} suivi${patients.length > 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement des patients...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow">
          <Users className="w-24 h-24 text-gray-200 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-600">
            {search ? "Aucun patient trouvé" : "Aucun patient pour le moment"}
          </p>
          <p className="text-gray-500 mt-2">
            Les patients apparaissent ici après leur premier rendez-vous.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map((patient: any) => (
            <Link
              key={patient.id}
              href={`/doctor/patients/${patient.id}`}
              className="block hover:-translate-y-1 transition-all duration-200"
            >
              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {patient.firstname[0]}{patient.lastname[0]}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {patient.firstname} {patient.lastname}
                      </p>
                      <p className="text-gray-500">
                        {patient.email} • {patient.phone || "Non renseigné"}
                      </p>
                      {patient.nextAppointment && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-medium">
                            Prochain RDV : {format(new Date(patient.nextAppointment.date), "EEE d MMM yyyy • HH:mm")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-3xl text-blue-600">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}