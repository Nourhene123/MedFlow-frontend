'use client';

import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { FlaskConical, HeartPulse } from "lucide-react";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000") + "/api/";
const ANALYSES_API = `${API_BASE}patient/analyses/`;
const PROFILE_API = `${API_BASE}patient/profile/`;

type PatientDoctor = {
  fullname: string;
};

type PatientAnalysis = {
  id: number;
  consultation_date: string;
  doctor: PatientDoctor | null;
  content: string;
  pdf_url: string;
  created_at: string;
};

type PatientProfile = {
  id: number;
  firstname: string;
  lastname: string;
  fiche_medicale: {
    taille: number | null;
    poids: number | null;
    allergies: string;
    antecedents_medicaux: string;
    groupe_sanguin: string;
    history?: string;
    notes?: string;
    updated_at: string;
  } | null;
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

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
};

export default function AnalysesPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const { data: analyses = [], isLoading } = useSWR<PatientAnalysis[]>(
    accessToken ? [ANALYSES_API, accessToken] : null,
    authedFetcher,
    {
      onError: (err) => toast.error(err.message),
    }
  );

  const { data: profile, isLoading: profileLoading } = useSWR<PatientProfile>(
    accessToken ? [PROFILE_API, accessToken] : null,
    authedFetcher,
    {
      onError: (err) => toast.error(err.message),
    }
  );

  const fiche = profile?.fiche_medicale;

  const ficheStats = [
    { label: "Taille", value: fiche?.taille ? `${fiche.taille} cm` : "Non renseignée" },
    { label: "Poids", value: fiche?.poids ? `${fiche.poids} kg` : "Non renseigné" },
    { label: "Groupe sanguin", value: fiche?.groupe_sanguin || "Non renseigné" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Analyses</h1>
        <p className="text-gray-600 mt-2">Consultez vos analyses médicales</p>
      </div>

      <section className="rounded-3xl bg-gradient-to-br from-[#0D9488] via-[#0B7F75] to-[#04524C] text-white shadow-[0_20px_45px_rgba(13,148,136,0.35)] p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/15">
              <HeartPulse className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-white/70">Espace fiche médicale</p>
              <h2 className="text-2xl font-bold mt-1">Suivi personnalisé</h2>
              <p className="text-sm md:text-base text-white/80 mt-2 max-w-xl">
                Retrouvez vos informations médicales essentielles (allergies, antécédents, groupe sanguin…)
                et gardez-les à jour pour aider vos médecins à mieux vous prendre en charge.
              </p>
              <p className="text-xs text-white/70 mt-2">
                Dernière mise à jour : {fiche?.updated_at ? formatDate(fiche.updated_at) : "Non renseignée"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 min-w-[220px]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ficheStats.map((stat) => (
                <div key={stat.label} className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                  <p className="text-lg font-semibold">{profileLoading ? "…" : stat.value}</p>
                </div>
              ))}
            </div>
            <Link
              href="/patient/parametres"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-[#04524C] font-semibold py-3 px-6 transition hover:translate-y-0.5"
            >
              Mettre à jour ma fiche
            </Link>
          </div>
        </div>

        {fiche && (
          <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-widest text-white/70 mb-1">Allergies</p>
              <p className="text-white/90">{fiche.allergies || "Non renseignées"}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-widest text-white/70 mb-1">Antécédents médicaux</p>
              <p className="text-white/90">{fiche.antecedents_medicaux || "Non renseignés"}</p>
            </div>
            {fiche.notes && (
              <div className="bg-white/10 rounded-2xl p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-widest text-white/70 mb-1">Notes</p>
                <p className="text-white/90">{fiche.notes}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="border-[0.5px] border-[#AFA9A9] rounded-[15px] shadow-[0_0_6px_0_#68BA7F] p-6">
        <div className="flex justify-center mb-6">
          <div className="inline-flex px-6 py-2 justify-center items-center rounded-[15px] bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#00746E] shadow-[0_6px_10px_0_#68BA7F]">
            <h2 className="text-white text-xl font-bold">Rapport Médicaux</h2>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-sm text-gray-500">Chargement des rapports…</p>
          ) : analyses.length > 0 ? (
            analyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-4 border border-[#CDC8C8] rounded-lg">
                <div>
                  <div className="flex items-center gap-3">
                    <FlaskConical className="w-[30px] h-[30px] text-black" />
                    <div>
                      <span className="text-[15px] font-bold text-black">{analysis.content || "Rapport médical"}</span>
                      <p className="text-xs text-[#8B8181]">
                        {analysis.doctor?.fullname || "Médecin"} • {formatDate(analysis.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                {analysis.pdf_url ? (
                  <a
                    href={analysis.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-1 rounded-[5px] bg-gradient-to-b from-[#68BA7F] to-[#2F5439] text-[#FFFBFB] text-[15px] font-bold hover:from-[#5AA970] hover:to-[#254432] transition-colors"
                  >
                    Ouvrir
                  </a>
                ) : (
                  <button
                    className="px-6 py-1 rounded-[5px] bg-gradient-to-b from-[#68BA7F] to-[#2F5439] text-[#FFFBFB] text-[15px] font-bold opacity-60 cursor-default"
                    disabled
                  >
                    Indisponible
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-500">Aucun rapport disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}

