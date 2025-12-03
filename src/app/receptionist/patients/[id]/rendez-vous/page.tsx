'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Check,
  AlertCircle,
  User,
  Phone,
  Mail,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

// === FETCHER ===
async function fetcher<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Erreur de chargement');
  }
  return (await res.json()) as T;
}

// === INTERFACES ===
interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
}

interface Doctor {
  id: number;
  firstname: string;
  lastname: string;
  speciality?: string;
}

interface Appointment {
  id: number;
  patient: Patient;
  medecin: Doctor;
  date: string;
  motif: string;
  notes?: string;
  status: string;
  status_display?: string;
  facture_status?: string;
  is_paid?: boolean;
  created_at: string;
  updated_at: string;
}

export default function PatientRendezVousPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // === REQUÊTES ===

  // 1. Récupérer les infos du patient via l'endpoint patients/by-clinique
  const { data: patientsData, isLoading: patientsLoading } = useSWR<{ patients: Patient[] }>(
    session?.accessToken 
      ? ([`${API_BASE}/accounts/patients/by-clinique/`, session.accessToken] as [string, string]) 
      : null,
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  // 2. Récupérer les rendez-vous de CE PATIENT SPÉCIFIQUE
  // Utilisez le bon endpoint pour filtrer par patient
  const { data: appointmentsData, isLoading: appointmentsLoading, mutate } = useSWR<{
    results: Appointment[];
    count: number;
    next: string | null;
    previous: string | null;
  }>(
    session?.accessToken
      ? ([
          `${API_BASE}/appointments/list/?patient=${id}&page=${currentPage}&limit=${itemsPerPage}`,
          session.accessToken
        ] as [string, string])
      : null,
    ([url, token]: [string, string]) => fetcher(url, token),
    { revalidateOnFocus: false }
  );

  // === EXTRACTION DES INFOS ===
  // Trouver le patient correspondant à l'ID dans la liste des patients
  const patient = patientsData?.patients?.find(p => p.id === parseInt(id));

  // === DONNÉES ===
  const appointments = appointmentsData?.results || [];
  const totalItems = appointmentsData?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const isLoading = patientsLoading || appointmentsLoading;
  const hasError = !patient && !isLoading;

  // === FONCTIONS UTILITAIRES ===
  const formatDate = (dateString: string, formatType: 'date' | 'time' | 'full' = 'date') => {
    try {
      const date = new Date(dateString);
      
      switch (formatType) {
        case 'date':
          return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }).format(date);
          
        case 'time':
          return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(date);
          
        case 'full':
          const datePart = new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).format(date);
          
          const timePart = new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(date);
          
          return `${datePart} ${timePart}`;
          
        default:
          return '—';
      }
    } catch {
      return '—';
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      PROGRAMME: { 
        bg: 'bg-blue-100 dark:bg-blue-900/30', 
        text: 'text-blue-700 dark:text-blue-300', 
        label: 'Programmé' 
      },
      TERMINE: { 
        bg: 'bg-green-100 dark:bg-green-900/30', 
        text: 'text-green-700 dark:text-green-300', 
        label: 'Terminé' 
      },
      ANNULE: { 
        bg: 'bg-red-100 dark:bg-red-900/30', 
        text: 'text-red-700 dark:text-red-300', 
        label: 'Annulé' 
      },
      EN_COURS: { 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
        text: 'text-yellow-700 dark:text-yellow-300', 
        label: 'En cours' 
      },
    };
    
    const { bg, text, label } = config[status] || { 
      bg: 'bg-gray-100 dark:bg-gray-700', 
      text: 'text-gray-700 dark:text-gray-300', 
      label: status 
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const getPaymentBadge = (isPaid?: boolean) => {
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
          <Check className="w-3 h-3" /> Payé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
        <AlertCircle className="w-3 h-3" /> Non payé
      </span>
    );
  };

  // === FONCTIONS D'ACTION ===
  const handleDelete = async (appointmentId: number) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    try {
      const res = await fetch(`${API_BASE}/appointments/${appointmentId}/delete/`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      mutate(); // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // === AFFICHAGE CHARGEMENT/ERREUR ===
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des rendez-vous...</p>
        </div>
      </div>
    );
  }

  if (hasError || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Patient non trouvé
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Impossible de charger les informations du patient.
          </p>
          <Link
            href="/receptionist/patients"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  // === FILTRAGE CLIENT-SIDE POUR LES RECHERCHES ===
  const filteredAppointments = appointments.filter(appt => {
    // Filtre par recherche texte (motif ou médecin)
    if (searchTerm && 
        !appt.motif.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !appt.medecin.firstname.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !appt.medecin.lastname.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtre par statut
    if (statusFilter && appt.status !== statusFilter) {
      return false;
    }
    
    // Filtre par date
    if (dateFilter) {
      const appointmentDate = new Date(appt.date).toISOString().split('T')[0];
      if (appointmentDate !== dateFilter) {
        return false;
      }
    }
    
    return true;
  });

  // Pagination après filtrage
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const filteredTotalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  // === RENDER PRINCIPAL ===
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* === HEADER === */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/receptionist/patients"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Retour à la liste"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Rendez-vous
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {patient.firstname} {patient.lastname}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/receptionist/appointments"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <Eye className="w-5 h-5" />
                Tous les RDV
              </Link>
            </div>
          </div>
        </div>

        {/* === INFORMATIONS PATIENT === */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {patient.firstname?.[0]}{patient.lastname?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {patient.firstname} {patient.lastname}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    {patient.email}
                  </div>
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      {patient.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {filteredAppointments.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                RDV au total
              </div>
            </div>
          </div>
        </div>

        {/* === FILTRES === */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par motif ou médecin..."
                value={searchTerm}
                onChange={(e) => { 
                  setSearchTerm(e.target.value); 
                  setCurrentPage(1); 
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Filtre par statut */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { 
                  setStatusFilter(e.target.value); 
                  setCurrentPage(1); 
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
              >
                <option value="">Tous les statuts</option>
                <option value="PROGRAMME">Programmé</option>
                <option value="TERMINE">Terminé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>

            {/* Filtre par date */}
            <div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { 
                  setDateFilter(e.target.value); 
                  setCurrentPage(1); 
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
          </div>
          
          {/* Réinitialiser les filtres */}
          {(searchTerm || statusFilter || dateFilter) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setDateFilter('');
                  setCurrentPage(1);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* === LISTE DES RENDEZ-VOUS === */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {appointments.length === 0 ? "Aucun rendez-vous" : "Aucun résultat"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter || dateFilter
                  ? "Aucun rendez-vous ne correspond aux filtres"
                  : "Ce patient n'a pas encore de rendez-vous"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Date & Heure
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Médecin
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Motif
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Paiement
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedAppointments.map((appointment) => {
                      const formattedDate = formatDate(appointment.date, 'date');
                      const formattedTime = formatDate(appointment.date, 'time');
                      
                      return (
                        <tr
                          key={appointment.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          {/* Date & Heure */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {formattedDate}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formattedTime}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Médecin */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-full flex items-center justify-center">
                                <Stethoscope className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  Dr. {appointment.medecin.firstname} {appointment.medecin.lastname}
                                </div>
                                {appointment.medecin.speciality && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {appointment.medecin.speciality}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Motif */}
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {appointment.motif}
                            </div>
                            {appointment.notes && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {appointment.notes}
                              </div>
                            )}
                          </td>

                          {/* Statut */}
                          <td className="px-6 py-4">
                            {getStatusBadge(appointment.status)}
                          </td>

                          {/* Paiement */}
                          <td className="px-6 py-4">
                            {getPaymentBadge(appointment.is_paid)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(appointment.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredTotalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} sur {filteredTotalPages} • {filteredAppointments.length} rendez-vous
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(filteredTotalPages, p + 1))}
                      disabled={currentPage === filteredTotalPages}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* === STATISTIQUES === */}
        {appointments.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* RDV programmés */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {appointments.filter(a => a.status === 'PROGRAMME').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    RDV programmés
                  </div>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* RDV terminés */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-green-100 dark:border-green-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {appointments.filter(a => a.status === 'TERMINE').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    RDV terminés
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Taux de paiement */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {appointments.filter(a => a.is_paid).length}/{appointments.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    RDV payés
                  </div>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}