'use client';

import useSWR from "swr";
import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function PatientsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const fetcher = (url: string) => fetch(url, {
    headers: { Authorization: `Bearer ${session?.accessToken}` }
  }).then(r => r.json());

  const { data: patients = [], isLoading } = useSWR(
    `${API_BASE}patients/`,
    fetcher
  );

  const filtered = patients.filter((p: any) =>
    `${p.firstname} ${p.lastname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Link href="/doctor/patients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> Nouveau patient
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((p: any) => (
          <Link key={p.id} href={`/doctor/patients/${p.id}`} className="block">
            <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{p.firstname} {p.lastname}</p>
                  <p className="text-sm text-gray-500">{p.email} • {p.phone}</p>
                </div>
                <span className="text-blue-600">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}