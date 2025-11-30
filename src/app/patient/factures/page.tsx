// src/app/patient/factures/page.tsx
'use client';

import { useState } from 'react';
import useSWR from "swr";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Building,
  Calendar,
  User,
  DollarSign,
  Eye
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
const INVOICES_API = `${API_BASE}/api/invoices/patient-invoices/`;

interface PatientInvoice {
  id: number;
  numero: string;
  status: 'BROUILLON' | 'EMISE' | 'PAYEE' | 'ANNULEE';
  date_emission: string;
  date_echeance?: string;
  montant_ttc: number | string;
  montant_ht: number | string;
  tva: number | string;
  description?: string;
  is_overdue?: boolean;
  days_overdue?: number;
  patient: {
    id: number;
    firstname: string;
    lastname: string;
    email?: string;
  };
  clinique: {
    id: number;
    nom: string;
  };
}

const authedFetcher = async ([url, token]: [string, string]) => {
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

const formatShortDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAYEE': return 'bg-green-100 text-green-800 border-green-200';
    case 'EMISE': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'BROUILLON': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'ANNULEE': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PAYEE': return <CheckCircle className="w-4 h-4" />;
    case 'EMISE': return <Clock className="w-4 h-4" />;
    case 'ANNULEE': return <AlertCircle className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'BROUILLON': 'Brouillon',
    'EMISE': 'En attente',
    'PAYEE': 'Payée',
    'ANNULEE': 'Annulée'
  };
  return statusMap[status] || status;
};

const getAmountColor = (status: string) => {
  switch (status) {
    case 'PAYEE': return 'text-green-600';
    case 'EMISE': return 'text-blue-600';
    case 'ANNULEE': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const toNumber = (value: number | string): number => {
  if (typeof value === 'string') {
    return parseFloat(value) || 0;
  }
  return value || 0;
};

export default function FacturesPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  const { data: invoices = [], isLoading, mutate } = useSWR<PatientInvoice[]>(
    accessToken ? [INVOICES_API, accessToken] : null,
    authedFetcher,
    {
      onError: (err) => toast.error(err.message),
      revalidateOnFocus: false,
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // ✅ CORRECTION : Téléchargement simplifié sans header Accept problématique
  const handleDownloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
  if (!accessToken || downloadingIds.has(invoiceId)) return;
  
  try {
    setDownloadingIds(prev => new Set(prev).add(invoiceId));
    
    console.log('🔄 Début du téléchargement (contournement IDM)...');

    const response = await fetch('/api/auth/download-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        invoiceId,
        invoiceNumber,
        apiBase: API_BASE
      }),
    });

    console.log('📥 Réponse proxy:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur ${response.status}`);
    }

    const result = await response.json();
    console.log('📦 Données reçues:', { 
      success: result.success, 
      size: result.size,
      hasDataUrl: !!result.dataUrl 
    });

    if (!result.success || !result.dataUrl) {
      throw new Error('Réponse invalide du serveur');
    }

    // ✅ TÉLÉCHARGEMENT AVEC DATA URL (contourne IDM)
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = result.dataUrl;
    a.download = result.fileName;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1000);
    
    console.log('✅ Téléchargement réussi (contournement IDM)');
    toast.success('Facture téléchargée avec succès');
    
  } catch (err: any) {
    console.error('❌ Erreur:', err);
    toast.error(err.message || 'Erreur lors du téléchargement');
  } finally {
    setDownloadingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(invoiceId);
      return newSet;
    });
  }
};

  // ✅ CORRECTION : Prévisualisation simplifiée
  const handlePreviewInvoice = async (invoiceId: number, invoiceNumber: string) => {
  if (!accessToken) return;
  
  try {
    console.log('👁️ Début de la prévisualisation via proxy...', { invoiceId, invoiceNumber });
    
    // ✅ UTILISER LE NOUVEAU PROXY NEXT.JS
    const response = await fetch('/api/auth/download-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        invoiceId,
        invoiceNumber,
        apiBase: API_BASE
      }),
    });

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.details || errorMessage;
      } catch {
        errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Le fichier PDF est vide');
    }

    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      throw new Error('Impossible d\'ouvrir une nouvelle fenêtre. Vérifiez les bloqueurs de pop-up.');
    }

    // Nettoyage après 30 secondes
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 30000);
    
    console.log('✅ Prévisualisation réussie');
    
  } catch (err: any) {
    console.error('❌ Erreur de prévisualisation:', err);
    toast.error(err.message || 'Erreur lors de l\'ouverture de la facture');
  }
};

  // Statistiques
  const stats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'PAYEE').length,
    pending: invoices.filter(inv => inv.status === 'EMISE').length,
    overdue: invoices.filter(inv => inv.is_overdue).length,
    totalAmount: invoices.reduce((sum, inv) => sum + toNumber(inv.montant_ttc), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Factures</h1>
              <p className="text-gray-600 mt-2">
                Consultez et téléchargez vos factures médicales
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total des factures</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payées</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.pending}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Montant total</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.totalAmount.toFixed(2)} €
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section principale des factures */}
        <section className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* En-tête de section */}
          <div className="bg-blue-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Factures Médicales</h2>
                  <p className="text-blue-100 text-sm">
                    {invoices.length} facture(s) trouvée(s)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-8">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <p className="mt-4 text-gray-600 text-lg">Chargement de vos factures...</p>
                <p className="text-gray-500 text-sm">Veuillez patienter</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Aucune facture
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Vous n'avez aucune facture pour le moment. Vos factures apparaîtront ici après vos consultations.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {invoices.map((invoice) => {
                  const isDownloading = downloadingIds.has(invoice.id);
                  const isOverdue = invoice.is_overdue && invoice.status === 'EMISE';
                  const montantTTC = toNumber(invoice.montant_ttc);
                  
                  return (
                    <div
                      key={invoice.id}
                      className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-white group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Informations principales */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  Facture {invoice.numero}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getStatusColor(invoice.status)}`}>
                                    {getStatusIcon(invoice.status)}
                                    {getStatusLabel(invoice.status)}
                                  </span>
                                  {isOverdue && (
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 border border-red-200 rounded-full text-sm font-medium">
                                      <AlertCircle className="w-4 h-4" />
                                      Retard: {invoice.days_overdue} jour(s)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Montant */}
                            <div className="text-right">
                              <p className={`text-3xl font-bold ${getAmountColor(invoice.status)}`}>
                                {montantTTC.toFixed(2)} €
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                TTC
                              </p>
                            </div>
                          </div>

                          {/* Grille d'informations */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">Émission</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatShortDate(invoice.date_emission)}
                                </p>
                              </div>
                            </div>

                            {invoice.date_echeance && (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <div>
                                  <p className="text-xs text-gray-600">Échéance</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatShortDate(invoice.date_echeance)}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Building className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">Clinique</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {invoice.clinique.nom}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <User className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">Patient</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {invoice.patient.firstname} {invoice.patient.lastname}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          {invoice.description && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-sm text-blue-900">
                                {invoice.description}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col gap-3">
                         
                          
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id, invoice.numero)}
                            disabled={isDownloading}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                              isDownloading
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                            }`}
                            title="Télécharger la facture"
                          >
                            {isDownloading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            {isDownloading ? '...' : 'PDF'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Informations légales */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Pour toute question concernant vos factures, contactez le secrétariat de votre clinique.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Vos factures sont conservées pendant 10 ans conformément à la réglementation.
          </p>
        </div>
      </div>
    </div>
  );
}