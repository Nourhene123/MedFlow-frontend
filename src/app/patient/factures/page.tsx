'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Calendar,
  Download,
  Eye,
  Check,
  AlertCircle,
  User,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Clock
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

// Fetcher simple
const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur API');
  return res.json();
};

// Interfaces
interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface Invoice {
  id: number;
  numero: string;
  patient: Patient;
  date_emission: string;
  date_echeance?: string;
  montant_ht: number;
  montant_ttc: number;
  tva: number;
  status: string;
  description?: string;
}

export default function PatientFacturesPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  
  const patientId = parseInt(id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Requête pour les factures avec filtre patient
  const { data: invoicesData, isLoading, error, mutate } = useSWR(
    session?.accessToken 
      ? [`${API_BASE}/invoices/list/?patient=${patientId}&page=${currentPage}&limit=${itemsPerPage}`, session.accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  // Requête pour le patient
  const { data: patientsData } = useSWR(
    session?.accessToken 
      ? [`${API_BASE}/accounts/patients/by-clinique/`, session.accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  const patient = patientsData?.patients?.find((p: Patient) => p.id === patientId);
  const invoices = invoicesData?.results || [];
  const totalItems = invoicesData?.count || 0;

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return '—';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      PAYEE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Payée' },
      EMISE: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Émise' },
      BROUILLON: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Brouillon' },
    };
    
    const { bg, text, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  // Filtrage
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    if (searchTerm && !invoice.numero.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && invoice.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Calculs statistiques
  const totalMontant = invoices.reduce((sum: number, inv: Invoice) => sum + inv.montant_ttc, 0);
  const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'PAYEE');
  const totalPaid = paidInvoices.reduce((sum: number, inv: Invoice) => sum + inv.montant_ttc, 0);

  // Chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Patient non trouvé</h2>
          <Link href="/receptionist/patients" className="text-blue-600 hover:underline">
            Retour aux patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/receptionist/patients" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Factures du patient</h1>
                <p className="text-gray-600">{patient.firstname} {patient.lastname}</p>
              </div>
            </div>
            <Link
              href="/receptionist/billing/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Nouvelle facture
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalMontant)}</div>
            <div className="text-sm text-gray-600">Total facturé</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</div>
            <div className="text-sm text-gray-600">Payé ({paidInvoices.length})</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher une facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Tous les statuts</option>
              <option value="EMISE">Émise</option>
              <option value="PAYEE">Payée</option>
              <option value="BROUILLON">Brouillon</option>
            </select>
          </div>
        </div>

        {/* Liste des factures */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Aucune facture trouvée
              </h3>
              <p className="text-gray-500 mb-4">
                Ce patient n'a pas encore de facture ou aucune ne correspond aux filtres.
              </p>
              <Link
                href="/receptionist/billing/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Créer une première facture
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Facture</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Montant</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice: Invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{invoice.numero}</div>
                        {invoice.description && (
                          <div className="text-sm text-gray-500">{invoice.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-600">{formatDate(invoice.date_emission)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{formatCurrency(invoice.montant_ttc)}</div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/receptionist/billing/invoices/${invoice.id}`}>
                            <button className="p-1 text-blue-600 hover:text-blue-800">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalItems > itemsPerPage && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {filteredInvoices.length} factures
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage * itemsPerPage >= totalItems}
                  className="p-1 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}