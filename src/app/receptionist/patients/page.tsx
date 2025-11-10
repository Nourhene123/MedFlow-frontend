'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, User, Phone, Mail, Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const API_BASE =  'http://127.0.0.1:8000/api/';

export default function PatientsPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // === FETCH PATIENTS PAR CLINIQUE DU RÉCEPTIONNISTE ===
  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
      },
    }).then(res => {
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    });

  const { data: patientsData = {}, isLoading, error } = useSWR(
    `${API_BASE}accounts/patients/by-clinique/`,
    fetcher
  );

  const patients = patientsData.patients || [];
  const cliniqueName = patientsData.clinique?.nom || 'Clinique inconnue';

  // === FILTRAGE LOCAL (RECHERCHE) ===
  const filteredPatients = patients.filter((p: any) =>
    `${p.firstname} ${p.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginated = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // === RESET PAGE ON SEARCH ===
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Erreur de chargement. Veuillez réessayer.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Patients
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {cliniqueName} • <span className="font-medium">{patients.length} patients</span>
          </p>
        </div>
        <Link href="/receptionist/appointments/new">
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
            <Plus className="w-5 h-5" />
            Nouveau RDV
          </button>
        </Link>
      </div>

      {/* === RECHERCHE === */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Effacer la recherche
          </button>
        )}
      </div>

      {/* === LISTE DES PATIENTS === */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-gray-500">Chargement des patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Aucun patient trouvé
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Essayez une autre recherche.' : `Aucun patient dans ${cliniqueName}.`}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Inscrit le
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginated.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* === NOM + AVATAR === */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {p.firstname?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {p.firstname} {p.lastname}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {cliniqueName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* === CONTACT === */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4" />
                            {p.phone || '—'}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            {p.email || '—'}
                          </div>
                        </div>
                      </td>

                      {/* === DATE INSCRIPTION === */}
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(p.date_inscription).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* === ACTIONS === */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/receptionist/patients/${p.id}/dossier`}>
                            <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                              Dossier
                            </button>
                          </Link>
                          <Link href={`/receptionist/patients/${p.id}/factures`}>
                            <button className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                              Factures
                            </button>
                          </Link>
                          <Link href={`/receptionist/appointments/new?patient=${p.id}`}>
                            <button className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                              RDV
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* === PAGINATION === */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} sur {totalPages} ({filteredPatients.length} résultats)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}