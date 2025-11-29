// src/components/patient/PatientInvoicesSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Download, Eye, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface PatientInvoice {
  id: number;
  numero: string;
  date_emission: string;
  date_echeance?: string;
  status: string;
  montant_ht: number;
  montant_ttc: number;
  tva: number;
  description?: string;
  is_overdue?: boolean;
  days_overdue?: number;
  patient: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

const PatientInvoicesSection = () => {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (session?.accessToken) {
      fetchPatientInvoices();
    }
  }, [session]);

  const fetchPatientInvoices = async () => {
    if (!session?.accessToken) return;
    
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/invoices/patient-invoices/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des factures');
      }
      
      const data = await response.json();
      const normalizedInvoices = data.map((invoice: any) => ({
        ...invoice,
        montant_ht: typeof invoice.montant_ht === 'string' ? parseFloat(invoice.montant_ht) : invoice.montant_ht,
        montant_ttc: typeof invoice.montant_ttc === 'string' ? parseFloat(invoice.montant_ttc) : invoice.montant_ttc,
        tva: typeof invoice.tva === 'string' ? parseFloat(invoice.tva) : invoice.tva,
      }));
      setInvoices(normalizedInvoices);
    } catch (err: any) {
      console.error('Erreur chargement factures:', err);
      setError(err.message || 'Erreur lors du chargement des factures');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
    if (!session?.accessToken || downloadingIds.has(invoiceId)) return;
    
    try {
      setDownloadingIds(prev => new Set(prev).add(invoiceId));
      
      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/download/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
    } catch (err: any) {
      console.error('Erreur téléchargement:', err);
      alert('Erreur lors du téléchargement de la facture');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PAYEE':
        return 'bg-green-100 text-green-800';
      case 'EMISE':
        return 'bg-blue-100 text-blue-800';
      case 'BROUILLON':
        return 'bg-yellow-100 text-yellow-800';
      case 'ANNULEE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAYEE':
        return <CheckCircle className="w-4 h-4" />;
      case 'EMISE':
        return <Clock className="w-4 h-4" />;
      case 'ANNULEE':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'BROUILLON': 'Brouillon',
      'EMISE': 'En attente',
      'PAYEE': 'Payée',
      'ANNULEE': 'Annulée'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const formatMontant = (montant: number): string => {
    return montant.toFixed(2) + ' €';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mes Factures</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-20"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Mes Factures</h2>
        <button
          onClick={fetchPatientInvoices}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={fetchPatientInvoices}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture</h3>
          <p className="text-gray-600">Vous n'avez aucune facture pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const isDownloading = downloadingIds.has(invoice.id);
            
            return (
              <div
                key={invoice.id}
                className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Facture {invoice.numero}
                      </h3>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Date d'émission:</strong> {formatDate(invoice.date_emission)}
                      </div>
                      {invoice.date_echeance && (
                        <div>
                          <strong>Échéance:</strong> {formatDate(invoice.date_echeance)}
                        </div>
                      )}
                      <div>
                        <strong>Montant TTC:</strong>{' '}
                        <span className="font-semibold text-green-600">
                          {formatMontant(invoice.montant_ttc)}
                        </span>
                      </div>
                    </div>

                    {invoice.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {invoice.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id, invoice.numero)}
                      disabled={isDownloading}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      PDF
                    </button>
                    
                    <button
                      onClick={() => window.open(`/patient/invoices/${invoice.id}`, '_blank')}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </button>
                  </div>
                </div>

                {invoice.is_overdue && invoice.status === 'EMISE' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Facture en retard de {invoice.days_overdue} jour(s)
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientInvoicesSection;