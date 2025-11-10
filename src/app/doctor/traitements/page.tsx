'use client';

import useSWR from "swr";
import { Activity, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function TraitementsPage() {
  const { data: session } = useSession();
  const fetcher = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${session?.accessToken}` } }).then(r => r.json());

  const { data: traitements = [], isLoading } = useSWR(`${API_BASE}traitements/active/`, fetcher);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Traitements actifs</h1>
        <Link href="/doctor/traitements/new" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nouveau
        </Link>
      </div>

      <div className="grid gap-4">
        {traitements.map((t: any) => (
          <div key={t.id} className="bg-white p-5 rounded-xl shadow">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-gray-600">{t.dosage} • {t.frequency}</p>
              </div>
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}