'use client';

import useSWR from "swr";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000") + "/api/";
const INVOICES_API = `${API_BASE}patient/invoices/`;

type PatientInvoice = {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  doctor_fullname: string | null;
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

export default function FacturesPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const { data: invoices = [], isLoading } = useSWR<PatientInvoice[]>(
    accessToken ? [INVOICES_API, accessToken] : null,
    authedFetcher,
    {
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Factures</h1>
        <p className="text-gray-600 mt-2">Consultez vos factures</p>
      </div>

      <section className="border-[0.5px] border-[#AFA9A9] rounded-[15px] shadow-[0_0_6px_0_#68BA7F] p-6">
        <div className="flex justify-center mb-6">
          <div className="inline-flex px-6 py-2 justify-center items-center rounded-[15px] bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#00746E] shadow-[0_6px_10px_0_#68BA7F]">
            <h2 className="text-white text-xl font-bold">Factures</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#B4AEAE]">
                <th className="text-left py-4 px-3 text-xl font-medium text-[#8B8181]">
                  Invoice #
                </th>
                <th className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                  Montant (DT)
                </th>
                <th className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                  Date
                </th>
                <th className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                  Médecin
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
                    Chargement des factures…
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[#B4AEAE]">
                    <td className="py-4 px-3 text-xl font-medium text-[#8B8181]">
                      #{invoice.id}
                    </td>
                    <td className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                      {invoice.amount?.toFixed(2) ?? "0.00"}
                    </td>
                    <td className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                      {invoice.doctor_fullname || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
                    Aucune facture disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

