'use client';

import useSWR from "swr";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { useSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function OrdonnancesPage() {
  const { data: session } = useSession();
  const fetcher = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${session?.accessToken}` } }).then(r => r.json());

  const { data: pending = [] } = useSWR(`${API_BASE}ordonnances/pending/`, fetcher);
  const { data: signed = [] } = useSWR(`${API_BASE}ordonnances/?signed=true`, fetcher);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ordonnances</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3 text-orange-600">À signer</h2>
          {pending.map((o: any) => (
            <OrdonnanceCard key={o.id} ordonnance={o} pending />
          ))}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3 text-green-600">Signées</h2>
          {signed.map((o: any) => (
            <OrdonnanceCard key={o.id} ordonnance={o} />
          ))}
        </section>
      </div>
    </div>
  );
}

function OrdonnanceCard({ ordonnance, pending = false }: { ordonnance: any; pending?: boolean }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow flex justify-between items-center">
      <div>
        <p className="font-semibold">{ordonnance.patient_name}</p>
        <p className="text-sm text-gray-500">
          {new Date(ordonnance.created_at).toLocaleDateString('fr-FR')}
        </p>
      </div>
      <div className="flex gap-3">
        {pending && (
          <Link href={`/doctor/ordonnances/${ordonnance.id}/sign`} className="text-orange-600 hover:underline">
            Signer
          </Link>
        )}
        <a
          href={`${API_BASE}ordonnances/${ordonnance.id}/pdf/`}
          target="_blank"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> PDF
        </a>
      </div>
    </div>
  );
}