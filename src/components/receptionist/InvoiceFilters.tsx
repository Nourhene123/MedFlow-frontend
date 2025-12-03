// src/components/receptionist/InvoiceFilters.tsx
'use client';
import { useState, useEffect } from 'react'; // AJOUT: Import useEffect
import { useSearchParams } from 'next/navigation'; // AJOUT: Import useSearchParams

import { Search, Filter, X } from 'lucide-react';

interface InvoiceFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export function InvoiceFilters({ filters, onFiltersChange }: InvoiceFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const searchParams = useSearchParams(); // AJOUT: Récupérer les paramètres d'URL

  // AJOUT: Effet pour lire le paramètre patient depuis l'URL
  useEffect(() => {
    const patientId = searchParams?.get('patient');
    if (patientId) {
      onFiltersChange({
        ...filters,
        patient: patientId // Ajoute le filtre patient
      });
    }
  }, [searchParams]); // Se déclenche quand les paramètres changent


  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: '',
      payment_status: '',
      period: '',
      search: '',
      ordering: '-date_emission'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value && value !== '' && value !== '-date_emission'
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Recherche */}
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, patient..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtres de base */}
        <div className="flex gap-2">
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="BROUILLON">Brouillon</option>
            <option value="EMISE">Émise</option>
            <option value="PAYEE">Payée</option>
            <option value="ANNULEE">Annulée</option>
          </select>

          <select
            value={filters.payment_status}
            onChange={(e) => updateFilter('payment_status', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les paiements</option>
            <option value="PAID">Payé</option>
            <option value="UNPAID">Impayé</option>
          </select>

          <select
            value={filters.period}
            onChange={(e) => updateFilter('period', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toute période</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Avancé
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <X className="w-4 h-4" />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter('date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tri
            </label>
            <select
              value={filters.ordering}
              onChange={(e) => updateFilter('ordering', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="-date_emission">Date (récent)</option>
              <option value="date_emission">Date (ancien)</option>
              <option value="-montant_ttc">Montant (haut)</option>
              <option value="montant_ttc">Montant (bas)</option>
              <option value="numero">Numéro</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}