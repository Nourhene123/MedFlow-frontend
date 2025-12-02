'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { InvoiceCard } from '@/components/receptionist/InvoiceCard';
import { InvoiceFilters } from '@/components/receptionist/InvoiceFilters';
import { 
  ArrowLeft, FileText, Filter, Download, Plus, User, Mail, Phone, 
  Calendar, AlertTriangle, DollarSign, CheckCircle, Clock, Building 
} from 'lucide-react';
import Link from 'next/link';
import { Invoice, InvoiceForCard } from '@/types/invoice';

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

export default function PatientInvoicesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  
  const patientId = params?.id as string;
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patientInfo, setPatientInfo] = useState<any>(null);
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

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  // ✅ FONCTION CORRIGÉE : Charger les informations du patient
  const fetchPatientInfo = async (id: string) => {
    if (!session?.accessToken || !id) {
      console.log('❌ Missing token or patient ID');
      return;
    }

    try {
      console.log(`📡 Fetching patient info for ID: ${id}`);
      
      // ✅ UTILISEZ LE NOUVEL ENDPOINT FONCTIONNEL
      const response = await fetch(`${API_BASE}/api/accounts/patients/${id}/simple/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Patient info loaded:', data);
        setPatientInfo(data);
      } else {
        console.error('❌ API Error:', response.status);
        // Fallback minimal
        setPatientInfo({
          id: id,
          firstname: 'Patient',
          lastname: `#${id}`,
          email: 'Non disponible',
          phone: 'Non disponible'
        });
      }
    } catch (err: any) {
      console.error('❌ Error fetching patient:', err);
      // Utiliser des informations minimales
      setPatientInfo({
        id: id,
        firstname: 'Patient',
        lastname: `#${id}`,
        email: 'Erreur de chargement',
        phone: 'Erreur de chargement'
      });
    }
  };

  // ✅ FONCTION : Charger les factures
  const fetchInvoices = async (id: string) => {
    if (!session?.accessToken || !id) {
      console.log('❌ Cannot fetch invoices: missing token or patientId');
      return;
    }

    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      
      // Ajouter tous les filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value);
        }
      });

      // Essayer différents endpoints pour les factures
      const endpoints = [
        `${API_BASE}/api/invoices/patient/${id}/invoices/simple/?${queryParams}`,
        `${API_BASE}/api/invoices/?patient=${id}&${queryParams}`,
      ];

      let invoicesData = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Trying invoice endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
          });

          if (response.ok) {
            invoicesData = await response.json();
            console.log(`✅ Invoices loaded from: ${endpoint} (${invoicesData?.length || 0} items)`);
            break;
          }
        } catch (err) {
          console.log(`Endpoint failed: ${endpoint}`, err);
          continue;
        }
      }

      if (invoicesData) {
        const normalizedInvoices = Array.isArray(invoicesData) 
          ? invoicesData.map((invoice: any) => normalizeInvoice(invoice))
          : [];
        setInvoices(normalizedInvoices);
      } else {
        setInvoices([]);
        console.warn('⚠️ No invoices data received');
      }
    } catch (err: any) {
      console.error('❌ Error in fetchInvoices:', err);
      setError(err.message);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ EFFET PRINCIPAL
  useEffect(() => {
    console.log('🔄 useEffect triggered', {
      sessionStatus,
      patientId,
      hasSession: !!session?.accessToken
    });

    if (sessionStatus === 'authenticated' && patientId && patientId !== 'undefined') {
      console.log('✅ Loading data for patient:', patientId);
      fetchPatientInfo(patientId);
      fetchInvoices(patientId);
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    } else if (!patientId || patientId === 'undefined') {
      console.log('⚠️ No patient ID, redirecting to billing...');
      router.push('/receptionist/billing');
    }
  }, [sessionStatus, patientId, filters]);

  // Fonction pour créer une facture pour ce patient
  const handleCreateInvoice = () => {
    if (!patientId) return;
    router.push(`/receptionist/billing/create?patient=${patientId}`);
  };

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
      
      alert('Facture émise avec succès !');
      
    } catch (err: any) {
      setError(err.message);
      alert(`Erreur: ${err.message}`);
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
        
        alert('Facture marquée comme payée !');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors du paiement');
      }
    } catch (err: any) {
      setError(err.message);
      alert(`Erreur: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

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
        await fetchInvoices(patientId);
        alert('Facture supprimée avec succès !');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  // Composant pour les actions rapides
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
            title="Émettre la facture"
          >
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
            {isMarkingPaid ? '...' : 'Payée'}
          </button>
        )}
      </div>
    );
  };

  // Calcul des statistiques
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.montant_ttc, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'PAYEE').length;
  const overdueInvoices = invoices.filter(inv => inv.is_overdue).length;
  const draftInvoices = invoices.filter(inv => inv.status === 'BROUILLON').length;

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (!patientId || patientId === 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Patient non trouvé</h2>
          <p className="text-gray-600 mb-4">L'ID patient est invalide.</p>
          <Link href="/receptionist/billing">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Retour aux factures
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/receptionist/billing">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Factures du Patient
            </h1>
            {patientInfo && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {patientInfo.firstname} {patientInfo.lastname} • {patientInfo.email}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Facture
          </button>
        </div>
      </div>

      {/* Informations du patient (version simplifiée) */}
      {patientInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {patientInfo.firstname} {patientInfo.lastname}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    {patientInfo.email || 'Non spécifié'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    {patientInfo.phone || 'Non spécifié'}
                  </div>
                  {patientInfo.clinique && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Building className="w-4 h-4" />
                      {patientInfo.clinique.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Statistiques patient */}
            <div className="flex flex-wrap gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg min-w-[120px]">
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Factures</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {invoices.length}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg min-w-[120px]">
                <p className="text-sm text-green-600 dark:text-green-400">Montant Total</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {totalAmount.toFixed(2)} €
                </p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg min-w-[120px]">
                <p className="text-sm text-purple-600 dark:text-purple-400">Payées</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {paidInvoices}
                </p>
              </div>
             
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

     

      {/* Liste des factures */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Factures ({invoices.length})
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4" />
            <span>Filtrées</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
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
              Ce patient n'a pas encore de facture.
            </p>
            <button
              onClick={handleCreateInvoice}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer la première facture
            </button>
          </div>
        )}
      </div>
    </div>
  );
}