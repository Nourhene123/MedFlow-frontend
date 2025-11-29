// components/receptionist/InvoiceCard.tsx
'use client';

import { FileText, Calendar, User, Building, CheckCircle, Clock, Edit, Trash2, Eye } from 'lucide-react';
import { InvoiceForCard } from '@/types/invoice';

interface InvoiceCardProps {
  invoice: InvoiceForCard;
  onView?: (invoice: InvoiceForCard) => void;
  onEdit?: (invoice: InvoiceForCard) => void;
  onDelete?: (invoice: InvoiceForCard) => void;
}

export function InvoiceCard({ invoice, onView, onEdit, onDelete }: InvoiceCardProps) {
  const formatMontant = (montant: number): string => {
    try {
      if (isNaN(montant)) return '0.00 €';
      return montant.toFixed(2) + ' €';
    } catch {
      return '0.00 €';
    }
  };

  const formatDate = (dateString: string): string => {
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PAYEE': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'EMISE': return invoice.is_overdue 
        ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'BROUILLON': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      case 'ANNULEE': return 'text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'PAYEE': return <CheckCircle className="w-4 h-4" />;
      case 'EMISE': return invoice.is_overdue 
        ? <Clock className="w-4 h-4" />
        : <Clock className="w-4 h-4" />;
      case 'BROUILLON': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PAYEE': return 'Payée';
      case 'EMISE': return invoice.is_overdue ? 'En retard' : 'Émise';
      case 'BROUILLON': return 'Brouillon';
      case 'ANNULEE': return 'Annulée';
      default: return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {invoice.numero}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(invoice.date_emission)}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(invoice.status)}`}>
          {getStatusIcon(invoice.status)}
          {getStatusText(invoice.status)}
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
        {invoice.date_echeance && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Échéance: {formatDate(invoice.date_echeance)}</span>
            {invoice.is_overdue && (
              <span className="text-red-600 font-medium">
                ({invoice.days_overdue} jour(s) de retard)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatMontant(invoice.montant_ttc)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            HT: {formatMontant(invoice.montant_ht)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {onView && (
            <button
              onClick={() => onView(invoice)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Voir la facture"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          
          {invoice.status === 'BROUILLON' && (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(invoice)}
                  className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors"
                  title="Modifier la facture"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(invoice)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Supprimer la facture"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}