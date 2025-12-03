'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { InvoiceCard } from '@/components/receptionist/InvoiceCard';
import { FinancialDashboard } from '@/components/receptionist/FinancialDashboard';
import { InvoiceFilters } from '@/components/receptionist/InvoiceFilters';
import { Plus, FileText, Filter, Download, RefreshCw, AlertTriangle, Clock, Send, CheckCircle, User, X } from 'lucide-react';
import Link from 'next/link';
import { Invoice, FinancialStats, InvoiceForCard } from '@/types/invoice';
import { useSearchParams } from 'next/navigation';

// Fonction de normalisation des montants
const normalizeInvoice = (invoiceData: any): Invoice => {
  return {
    ...invoiceData,
    montant_ht: typeof invoiceData.montant_ht === 'string' ? parseFloat(invoiceData.montant_ht) : invoiceData.montant_ht,
    montant_ttc: typeof invoiceData.montant_ttc === 'string' ? parseFloat(invoiceData.montant_ttc) : invoiceData.montant_ttc,
    tva: typeof invoiceData.tva === 'string' ? parseFloat(invoiceData.tva) : invoiceData.tva,
    items: invoiceData.items?.map((item: any) => ({
      ...item,
      prix_unitaire_ht: typeof item.prix_unitaire_ht === 'string' ? parseFloat(item.prix_unitaire_ht) : item.prix_unitaire_ht,
      montant_ht: typeof item.montant_ht === 'string' ? parseFloat(item.montant_ht) : (item.montant_ht || item.quantite * item.prix_unitaire_ht),
    })) || []
  };
};

export default function BillingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    period: '',
    search: '',
    date_from: '',
    date_to: '',
    ordering: '-date_emission'
  });
  
  // État pour gérer le patient depuis l'URL
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  // Effet pour lire le paramètre patient depuis l'URL
  useEffect(() => {
    const patientParam = searchParams?.get('patient');
    if (patientParam) {
      setSelectedPatientId(patientParam);
      console.log('Patient ID from URL:', patientParam);
    } else {
      setSelectedPatientId(null);
    }
  }, [searchParams]);

  // Fonction pour émettre une facture
  const handleIssueInvoice = async (invoiceId: number) => {
    if (!session?.accessToken) return;

    setActionLoading(`issue-${invoiceId}`);
    try {
      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/send-to-patient/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'émission de la facture');
      }

      const result = await response.json();
      
      // Mettre à jour l'état local
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: 'EMISE', ...result.invoice }
          : inv
      ));
      
      // Recharger les stats
      await fetchDashboard();
      
      alert('Facture émise avec succès ! Elle est maintenant disponible dans l\'espace patient.');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour marquer comme payée
  const handleMarkAsPaid = async (invoiceId: number) => {
    if (!session?.accessToken) return;

    setActionLoading(`paid-${invoiceId}`);
    try {
      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAYEE'
        }),
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setInvoices(prev => prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: 'PAYEE' }
            : inv
        ));
        
        await fetchDashboard();
        alert('Facture marquée comme payée !');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchInvoices = async () => {
  if (!session?.accessToken) return;

  try {
    setIsLoading(true);
    
    // ✅ UTILISEZ LA VUE DÉDIÉE POUR LES FACTURES PAR PATIENT
    let url = `${API_BASE}/api/invoices/`;
    
    if (selectedPatientId) {
      // Utilisez l'endpoint dédié aux factures par patient
      url = `${API_BASE}/api/invoices/patient/${selectedPatientId}/invoices/simple/`;
    } else {
      // Utilisez l'endpoint normal avec filtres
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') params.append(key, value);
      });
      url = `${API_BASE}/api/invoices/?${params}`;
    }

    console.log('📡 Fetch URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status} lors du chargement des factures`);
    }
    
    const data = await response.json();
    console.log(`✅ ${data.length} factures chargées`);
    
    const normalizedInvoices = data.map((invoice: any) => normalizeInvoice(invoice));
    setInvoices(normalizedInvoices);
  } catch (err: any) {
    setError(err.message);
    console.error('Erreur:', err);
  } finally {
    setIsLoading(false);
  }
};

  const fetchDashboard = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(`${API_BASE}/api/invoices/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur dashboard:', err);
    }
  };

  const fetchOverdueInvoices = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/invoices/overdue/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      
      if (response.ok) {
        console.log('Factures en retard chargées');
      }
    } catch (err) {
      console.error('Erreur factures en retard:', err);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchInvoices();
      fetchDashboard();
      fetchOverdueInvoices();
    }
  }, [sessionStatus, filters, selectedPatientId]); // Ajout de selectedPatientId dans les dépendances

  // Fonction pour effacer le filtre patient
  const clearPatientFilter = () => {
    setSelectedPatientId(null);
    // Retirer le paramètre de l'URL
    router.push('/receptionist/billing');
  };

  // Trouver le patient actuel (pour affichage)
  const currentPatient = selectedPatientId && invoices.length > 0 
    ? invoices.find(inv => inv.patient?.id?.toString() === selectedPatientId)?.patient
    : null;

  const convertToInvoiceForCard = (invoice: Invoice): InvoiceForCard => {
    return {
      id: invoice.id,
      numero: invoice.numero,
      patient: invoice.patient,
      clinique: invoice.clinique,
      date_emission: invoice.date_emission,
      date_echeance: invoice.date_echeance,
      montant_ht: invoice.montant_ht,
      montant_ttc: invoice.montant_ttc,
      tva: invoice.tva,
      description: invoice.description,
      status: invoice.status,
      is_overdue: invoice.is_overdue,
      days_overdue: invoice.days_overdue,
      payment_status: invoice.payment_status,
    };
  };

  const handleViewInvoice = (invoice: InvoiceForCard) => {
    router.push(`/receptionist/billing/invoices/${invoice.id}`);
  };

  const handleEditInvoice = (invoice: InvoiceForCard) => {
    router.push(`/receptionist/billing/invoices/${invoice.id}/edit`);
  };

  const handleDeleteInvoice = async (invoice: InvoiceForCard) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.numero} ?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/invoices/${invoice.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        await fetchInvoices();
        await fetchDashboard();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleExport = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(`${API_BASE}/api/invoices/export/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factures-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Fallback côté client
        const csvContent = generateCSV(invoices);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factures-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Erreur lors de l\'export');
    }
  };

  const generateCSV = (invoices: Invoice[]): string => {
    const headers = ['Numéro', 'Patient', 'Date Émission', 'Montant HT', 'TVA', 'Montant TTC', 'Statut', 'Description'];
    const rows = invoices.map(invoice => [
      invoice.numero,
      `${invoice.patient.firstname} ${invoice.patient.lastname}`,
      new Date(invoice.date_emission).toLocaleDateString('fr-FR'),
      invoice.montant_ht.toString(),
      invoice.tva.toString(),
      invoice.montant_ttc.toString(),
      invoice.status,
      invoice.description
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  // Composant pour les boutons d'action rapides
  const QuickActions = ({ invoice }: { invoice: Invoice }) => {
    const isIssuing = actionLoading === `issue-${invoice.id}`;
    const isMarkingPaid = actionLoading === `paid-${invoice.id}`;

    return (
      <div className="flex gap-2">
        {invoice.status === 'BROUILLON' && (
          <button
            onClick={() => handleIssueInvoice(invoice.id)}
            disabled={isIssuing}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            title="Émettre la facture vers l'espace patient"
          >
            <Send className="w-3 h-3" />
            {isIssuing ? '...' : 'Émettre'}
          </button>
        )}
        
        {invoice.status === 'EMISE' && (
          <button
            onClick={() => handleMarkAsPaid(invoice.id)}
            disabled={isMarkingPaid}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            title="Marquer comme payée"
          >
            <CheckCircle className="w-3 h-3" />
            {isMarkingPaid ? '...' : 'Payée'}
          </button>
        )}
      </div>
    );
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Factures
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les factures, les paiements et suivez votre activité financière
          </p>
          
          {/* Afficher le patient filtré */}
          {selectedPatientId && currentPatient && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 inline-flex">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 text-sm">
                Patient: <strong>{currentPatient.firstname} {currentPatient.lastname}</strong>
              </span>
              <button
                onClick={clearPatientFilter}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                title="Afficher toutes les factures"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {/* Message si aucun patient trouvé mais ID présent */}
          {selectedPatientId && invoices.length === 0 && !isLoading && (
            <div className="mt-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 inline-flex">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-700 dark:text-amber-300 text-sm">
                Aucune facture trouvée pour ce patient (ID: {selectedPatientId})
              </span>
              <button
                onClick={clearPatientFilter}
                className="ml-2 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                title="Afficher toutes les factures"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchInvoices();
              fetchDashboard();
              fetchOverdueInvoices();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          
          <Link href="/receptionist/billing/create">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Nouvelle Facture
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Tableau de bord financier */}
      <FinancialDashboard stats={stats} />

      {/* Filtres */}
      <InvoiceFilters filters={filters} onFiltersChange={setFilters} />

      {/* Liste des factures */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Factures ({invoices.length})
            {selectedPatientId && currentPatient && (
              <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                • Patient: {currentPatient.firstname} {currentPatient.lastname}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4" />
            <span>Filtrées</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
            ))}
          </div>
        ) : invoices.length > 0 ? (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="relative">
                <InvoiceCard
                  invoice={convertToInvoiceForCard(invoice)}
                  onView={handleViewInvoice}
                  onEdit={handleEditInvoice}
                  onDelete={handleDeleteInvoice}
                />
                {/* Actions rapides */}
                <div className="absolute top-4 right-4">
                  <QuickActions invoice={invoice} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune facture trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {selectedPatientId 
                ? `Aucune facture ne correspond au patient sélectionné.`
                : `Aucune facture ne correspond à vos critères de recherche.`
              }
            </p>
            <div className="flex gap-3 justify-center">
              {selectedPatientId && (
                <button
                  onClick={clearPatientFilter}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Voir toutes les factures
                </button>
              )}
              <Link href="/receptionist/billing/create">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Créer une nouvelle facture
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



