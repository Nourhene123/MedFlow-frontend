'use client';

import useSWR from "swr";
import { useParams } from "next/navigation";
import { Stethoscope, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function PatientDetail() {
  const { id } = useParams();
  const { data: session } = useSession();
  const fetcher = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${session?.accessToken}` } }).then(r => r.json());

  const { data: patient } = useSWR(`${API_BASE}accounts/patients/${id}/`, fetcher);
  const { data: fiche } = useSWR(`${API_BASE}fiche-medicale/${id}/`, fetcher);
  const { data: consultations = [] } = useSWR(`${API_BASE}consultations/?patient=${id}`, fetcher);

  if (!patient || !fiche) return <p>Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">{patient.firstname} {patient.lastname}</h1>
        <p className="text-gray-600">{patient.email} • {patient.phone}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5" /> Fiche médicale
          </h2>
          <div className="space-y-2 text-sm">
            <p><strong>Taille:</strong> {fiche.taille} cm</p>
            <p><strong>Poids:</strong> {fiche.poids} kg</p>
            <p><strong>Allergies:</strong> {fiche.allergies || "Aucune"}</p>
            <p><strong>Groupe sanguin:</strong> {fiche.groupe_sanguin}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" /> Dernières consultations
          </h2>
          <div className="space-y-2">
            {consultations.slice(0, 3).map((c: any) => (
              <div key={c.id} className="text-sm">
                <p>{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                <p className="text-gray-600">{c.diagnosis || "Aucun diagnostic"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}