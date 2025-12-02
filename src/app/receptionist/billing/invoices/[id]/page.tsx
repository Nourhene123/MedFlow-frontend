'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Edit, Trash2, AlertTriangle, Printer } from 'lucide-react';
import Link from 'next/link';
import { Invoice } from '@/types/invoice';

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

export default function InvoiceDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (session?.accessToken && invoiceId) {
      fetchInvoice();
    }
  }, [session, invoiceId]);

  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Facture non trouvée');
      const data = await response.json();
      
      const normalizedInvoice = normalizeInvoice(data);
      setInvoice(normalizedInvoice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // FONCTION POUR RÉCEPTIONNISTES - MÊME QUE PATIENT
  const handleDownload = async () => {
    if (!session?.accessToken || !invoice) return;

    setIsDownloading(true);
    try {
      console.log('🔄 Début du téléchargement réceptionniste...');

      // ✅ UTILISER LE MÊME PROXY QUE LE PATIENT
      const response = await fetch('/api/auth/download-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber: invoice.numero,
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

      // ✅ MÊME MÉTHODE DATA URL QUE LE PATIENT
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = result.dataUrl;
      a.download = result.fileName || `facture-${invoice.numero}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
      }, 1000);
      
      console.log('✅ Téléchargement réussi (proxy réceptionniste)');
      
    } catch (err: any) {
      console.error('❌ Erreur réceptionniste:', err);
      setError(err.message || 'Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  // FONCTION D'IMPRESSION
  const handlePrint = async () => {
    if (!session?.accessToken || !invoice) return;

    setIsDownloading(true);
    try {
      console.log('🖨️ Début impression réceptionniste...');

      const response = await fetch('/api/auth/download-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber: invoice.numero,
          action: 'print'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.dataUrl) {
        throw new Error('Réponse invalide du serveur');
      }

      // Ouvrir le PDF dans un nouvel onglet pour impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Facture ${invoice.numero}</title>
              <style>
                body { margin: 0; padding: 20px; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${result.dataUrl}"></iframe>
              <script>
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                }, 1000);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      
      console.log('✅ Impression lancée');
      
    } catch (err: any) {
      console.error('❌ Erreur impression:', err);
      setError(err.message || 'Erreur lors de l\'impression');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.numero} ? Cette action est irréversible.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        router.push('/receptionist/billing');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la suppression');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatMontant = (montant: number): string => {
    try {
      if (isNaN(montant)) return '0.00 DT';
      return montant.toFixed(2) + ' DT';
    } catch {
      return '0.00 DT';
    }
  };

  const calculateTVA = (): number => {
    if (!invoice) return 0;
    return invoice.montant_ttc - invoice.montant_ht;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAYEE': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'EMISE': return invoice?.is_overdue 
        ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'BROUILLON': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      case 'ANNULEE': return 'text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAYEE': return 'Payée';
      case 'EMISE': return invoice?.is_overdue ? 'En retard' : 'Émise';
      case 'BROUILLON': return 'Brouillon';
      case 'ANNULEE': return 'Annulée';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-32 mb-6"></div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              {error || 'Facture non trouvée'}
            </h2>
            <Link href="/receptionist/billing">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Retour aux factures
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ CORRECTION : Utiliser les propriétés optionnelles avec fallback
  const cliniquePhone = invoice.clinique.phone || 'Non spécifié';
  const cliniqueEmail = invoice.clinique.email || 'contact@clinique.com';
  const cliniqueAddress = invoice.clinique.address || 'Adresse non spécifiée';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/receptionist/billing">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Facture {invoice.numero}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Détails de la facture - Même design que l'espace patient
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
           

            {/* Bouton Télécharger PDF */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Téléchargement...' : 'PDF'}
            </button>

            {/* Bouton Modifier - seulement pour les factures BROUILLON et EMISE */}
            {(invoice.status === 'BROUILLON' || invoice.status === 'EMISE') && (
              <Link href={`/receptionist/billing/invoices/${invoice.id}/edit`}>
                <button className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
              </Link>
            )}

            {/* Bouton Supprimer - pour TOUTES les factures sauf PAYEE */}
            {invoice.status !== 'PAYEE' && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Aperçu PDF-like - Même design que le PDF généré */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          {/* En-tête facture style PDF */}
          <div className="border-b-2 border-blue-500 pb-6 mb-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-blue-600 mb-2">{invoice.clinique.nom}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Votre partenaire santé</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Tél: {cliniquePhone}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Email: {cliniqueEmail}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Adresse: {cliniqueAddress}
                </p>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-blue-600 mb-2">FACTURE</h1>
                <p className="text-gray-900 dark:text-white font-semibold mb-1">
                  N° {invoice.numero}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Date: {formatDate(invoice.date_emission)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Échéance: {invoice.date_echeance ? formatDate(invoice.date_echeance) : 'Non spécifiée'}
                </p>
              </div>
            </div>
          </div>

          {/* Informations patient */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              INFORMATIONS PATIENT
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="font-semibold text-gray-700 dark:text-gray-300 py-1 w-32">Nom:</td>
                    <td className="text-gray-700 dark:text-gray-300 py-1">
                      {invoice.patient.firstname} {invoice.patient.lastname}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-gray-700 dark:text-gray-300 py-1">Email:</td>
                    <td className="text-gray-700 dark:text-gray-300 py-1">
                      {invoice.patient.email || 'Non spécifié'}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-gray-700 dark:text-gray-300 py-1">ID Patient:</td>
                    <td className="text-gray-700 dark:text-gray-300 py-1">{invoice.patient.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Description */}
          {invoice.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
                DESCRIPTION
              </h3>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                {invoice.description}
              </p>
            </div>
          )}

          {/* Prestations */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              DÉTAIL DES PRESTATIONS
            </h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-right p-3 font-semibold">Prix Unitaire HT</th>
                    <th className="text-right p-3 font-semibold">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr 
                        key={item.id || index} 
                        className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}
                      >
                        <td className="p-3 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600">
                          {item.description}
                        </td>
                        <td className="p-3 text-center text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600">
                          {item.quantite}
                        </td>
                        <td className="p-3 text-right text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600">
                          {formatMontant(item.prix_unitaire_ht)}
                        </td>
                        <td className="p-3 text-right text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600">
                          {formatMontant(item.montant_ht || (item.quantite * item.prix_unitaire_ht))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
                        Consultation médicale
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
            <div className="max-w-md ml-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 dark:text-gray-300">Sous-total HT:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatMontant(invoice.montant_ht)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 dark:text-gray-300">TVA ({invoice.tva}%):</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatMontant(calculateTVA())}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-blue-200 dark:border-blue-700">
                <span className="text-xl font-bold text-gray-900 dark:text-white">TOTAL TTC:</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatMontant(invoice.montant_ttc)}
                </span>
              </div>
            </div>
          </div>

          {/* Statut et mentions */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start">
              <div>
                <p className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                  STATUT: {getStatusText(invoice.status)}
                </p>
              </div>
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 max-w-md">
                <p className="italic">Facture établie électroniquement - Valable sans signature</p>
                <p className="italic">En cas de question, contactez le secrétariat</p>
                <p className="italic">Conserver ce document pendant 10 ans conformément à la réglementation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}