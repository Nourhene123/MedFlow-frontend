// src/components/receptionist/FinancialDashboard.tsx
'use client';

import { DollarSign, TrendingUp, FileText, AlertTriangle } from 'lucide-react';

interface FinancialStats {
  period: string;
  total_revenu: number;
  total_paye: number;
  impaye: number;
  taux_recouvrement: number;
  nombre_factures: number;
  factures_payees: number;
  factures_en_retard: number;
  taux_paiement: number;
  top_patients: any[];
  repartition_statut: any[];
}

interface FinancialDashboardProps {
  stats: FinancialStats | null; // ✅ Accepte null
}

export function FinancialDashboard({ stats }: FinancialDashboardProps) {
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenu Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total_revenu?.toFixed(2) || '0.00'} €
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenu Payé</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total_paye?.toFixed(2) || '0.00'} €
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Factures</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.nombre_factures || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Retard</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.factures_en_retard || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Métriques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de Recouvrement</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.taux_recouvrement?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de Paiement</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.taux_paiement?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Impayé</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.impaye?.toFixed(2) || '0.00'} €
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}