// src/app/receptionist/billing/invoices/overdue/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, FileText, Calendar, User, Building, Mail } from 'lucide-react';
import Link from 'next/link';
import { Invoice } from '@/types/invoice';

export default function OverdueInvoicesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchOverdueInvoices();
    }
  }, [sessionStatus]);

  const fetchOverdueInvoices = async () => {
    if (!session?.accessToken) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/invoices/overdue/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des factures en retard');
      const data = await response.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMontant = (montant: number | string): string => {
    try {
      const montantNumber = typeof montant === 'string' ? parseFloat(montant) : montant;
      if (isNaN(montantNumber)) return '0.00 DT';
      return montantNumber.toFixed(2) + ' DT';
    } catch {
      return '0.00 DT';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const handleSendReminder = async (invoice: Invoice) => {
    if (confirm(`Envoyer un rappel pour la facture ${invoice.numero} ?`)) {
      // Implémentez l'envoi d'email de rappel ici
      alert(`Rappel envoyé pour la facture ${invoice.numero}`);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/receptionist/billing">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Factures en Retard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez les factures dont la date d'échéance est dépassée
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-lg font-semibold">
              {invoices.length} facture(s) en retard
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Liste des factures en retard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
              ))}
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border border-red-200 dark:border-red-800 rounded-xl p-6 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {invoice.numero}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Émise le {formatDate(invoice.date_emission)}
                        </p>
                      </div>
                    </div>
                    <div className="text-red-600 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-sm font-medium">
                      {invoice.days_overdue} jour(s) de retard
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{invoice.patient.firstname} {invoice.patient.lastname}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building className="w-4 h-4" />
                      <span>{invoice.clinique.nom}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Échéance: {formatDate(invoice.date_echeance!)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-red-200 dark:border-red-700 pt-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatMontant(invoice.montant_ttc)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        HT: {formatMontant(invoice.montant_ht)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link href={`/receptionist/billing/invoices/${invoice.id}`}>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <FileText className="w-4 h-4" />
                        </button>
                      </Link>
                      
                      <button
                        onClick={() => handleSendReminder(invoice)}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        Rappel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune facture en retard
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Toutes les factures sont à jour. Excellente gestion !
              </p>
              <Link href="/receptionist/billing">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Retour aux factures
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}