'use client';

import useSWR from "swr";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { FlaskConical } from "lucide-react";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000") + "/api/";
const ANALYSES_API = `${API_BASE}patient/analyses/`;

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Analyses</h1>
        <p className="text-gray-600 mt-2">Consultez vos analyses médicales</p>
      </div>

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

