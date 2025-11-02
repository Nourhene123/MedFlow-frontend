'use client';

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Plus, Download } from "lucide-react";

type Consultation = {
  id: number;
  patient_name: string;
  medecin_name: string;
  date: string;
  ordonnance_exists: boolean;
  status: string;
  ordonnance?: {
    pdf_url?: string;
  };
};

export default function OrdonnancesPage() {
  const { data: consultations = [], isLoading } = useSWR<Consultation[]>("/medical/consultations/list/");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  const ordonnances = consultations.filter(c => c.ordonnance_exists);

  const createOrdonnance = async () => {
    if (!selectedConsultation) return;

    await fetch(`/api/medical/consultations/${selectedConsultation.id}/create-ordonnance/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: "Ordonnance générée automatiquement." }),
    });

    // 🔹 Update SWR cache instead of reloading the page
    mutate("/medical/consultations/list/");

    setShowCreate(false);
    setSelectedConsultation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ordonnances</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les prescriptions médicales.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          Créer
        </button>
      </div>

      <div className="space-y-4">
  {(() => {
    if (isLoading) {
      return <p className="text-center py-8">Chargement...</p>;
    }

    if (ordonnances.length === 0) {
      return <p className="text-center py-8 text-gray-500">Aucune ordonnance.</p>;
    }

    return ordonnances.map(c => (
      <div
        key={c.id}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              {c.patient_name}
            </h3>
            <p className="text-sm text-gray-600">Dr. {c.medecin_name}</p>
          </div>
          <a
            href={c.ordonnance?.pdf_url || "#"}
            className="flex items-center gap-1 text-teal-600 hover:text-teal-700"
            target="_blank"
            rel="noreferrer"
          >
            <Download className="w-4 h-4" />
            PDF
          </a>
        </div>
      <p className="mt-2 text-sm text-gray-600">
        {format(new Date(c.date), "dd MMM yyyy HH:mm")}
       </p>
      </div>
    ));
  })()}
</div>


      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Créer une ordonnance</h2>
            <select
              value={selectedConsultation?.id || ""}
              onChange={e =>
                setSelectedConsultation(
                  consultations.find(c => c.id === parseInt(e.target.value)) || null
                )
              }
              className="w-full p-3 border rounded-xl mb-4"
            >
              <option value="">Sélectionner une consultation</option>
              {consultations
                .filter(c => !c.ordonnance_exists && c.status === "COMPLETED")
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.patient_name} - {format(new Date(c.date), "dd MMM HH:mm")}
                  </option>
                ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={createOrdonnance}
                className="flex-1 bg-teal-600 text-white py-2 rounded-xl"
              >
                Créer
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-xl"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
