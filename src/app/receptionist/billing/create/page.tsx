// src/app/receptionist/billing/create/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Calculator } from 'lucide-react';
import Link from 'next/link';
import { InvoiceCreateData, InvoiceCreateItem } from '@/types/invoice';

export default function CreateInvoicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState<InvoiceCreateData>({
    patient: 0,
    description: 'Consultation médicale',
    tva: 20,
    items: [
      {
        description: 'Consultation',
        quantite: 1,
        prix_unitaire_ht: 25
      }
    ]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantite: 1,
          prix_unitaire_ht: 0
        }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceCreateItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotalHT = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantite * item.prix_unitaire_ht);
    }, 0);
  };

  const calculateTotalTTC = () => {
    const totalHT = calculateTotalHT();
    return totalHT * (1 + (formData.tva || 20) / 100);
  };

  const calculateTVA = () => {
    const totalHT = calculateTotalHT();
    return totalHT * (formData.tva || 20) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    // ✅ VALIDATION AVANT ENVOI
    if (!formData.patient || formData.patient <= 0) {
      setError('Veuillez saisir un ID patient valide (supérieur à 0)');
      return;
    }

    // Vérifier que tous les articles ont des valeurs valides
    const hasInvalidItems = formData.items.some(item => 
      !item.description || 
      item.quantite <= 0 || 
      item.prix_unitaire_ht < 0
    );

    if (hasInvalidItems) {
      setError('Veuillez vérifier les informations des articles');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // ✅ Préparer les données pour l'API
      const invoiceData = {
        patient: formData.patient,
        description: formData.description,
        tva: formData.tva,
        date_echeance: formData.date_echeance || null,
        items: formData.items
      };

      console.log('Données envoyées:', invoiceData);

      const response = await fetch(`${API_BASE}/api/invoices/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      console.log('Status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log('Erreur détaillée:', errorData);
        } catch (parseError) {
          console.log('Impossible de parser la réponse erreur');
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const errorMessage = 
          errorData.detail || 
          errorData.message || 
          errorData.patient || 
          errorData.items || 
          errorData.non_field_errors ||
          JSON.stringify(errorData) ||
          'Erreur lors de la création de la facture';
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Facture créée:', result);
      router.push('/receptionist/billing');
    } catch (err: any) {
      console.error('Erreur complète:', err);
      setError(err.message || 'Erreur lors de la création de la facture');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/receptionist/billing">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nouvelle Facture
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Créez une nouvelle facture pour un patient
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Informations de la facture
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Patient *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.patient || ''} // ✅ CORRECTION SIMPLIFIÉE
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    patient: parseInt(e.target.value) || 0 // ✅ CORRECTION SIMPLIFIÉE
                  }))}
                  placeholder="ID du patient"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">ID numérique du patient (ex: 1, 2, 3...)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tva}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    tva: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={formData.date_echeance || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_echeance: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Articles de la facture */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Articles de la facture
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un article
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Consultation, Médicaments..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantite}
                        onChange={(e) => handleItemChange(index, 'quantite', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix unitaire HT (€) *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={item.prix_unitaire_ht}
                        onChange={(e) => handleItemChange(index, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-6"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Récapitulatif
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total HT</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calculateTotalHT().toFixed(2)} €
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">TVA ({formData.tva}%)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calculateTVA().toFixed(2)} €
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Total TTC</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calculateTotalTTC().toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <Link href="/receptionist/billing">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}