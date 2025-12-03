// app/receptionist/billing/invoices/[id]/edit/page.tsx - CODE COMPLET CORRIGÉ
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Calculator, AlertTriangle, Search, User, ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { Invoice, InvoiceCreateData, InvoiceCreateItem } from '@/types/invoice';

// Interface pour les patients
interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  cin?: string;
}

// Fonction de normalisation
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

export default function EditInvoicePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<InvoiceCreateData>({
    patient: 0,
    description: '',
    tva: 20,
    items: []
  });
  
  // NOUVEAUX ÉTATS pour le sélecteur de patient
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger la facture et les patients
  useEffect(() => {
    if (session?.accessToken && invoiceId) {
      fetchInvoice();
      fetchPatients();
    }
  }, [session, invoiceId]);

  const fetchInvoice = async (): Promise<void> => {
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
      
      // Initialiser le formulaire avec les données de la facture
      setFormData({
        patient: normalizedInvoice.patient.id,
        description: normalizedInvoice.description,
        tva: normalizedInvoice.tva,
        date_echeance: normalizedInvoice.date_echeance,
        items: normalizedInvoice.items?.map((item) => ({
          description: item.description,
          quantite: item.quantite,
          prix_unitaire_ht: item.prix_unitaire_ht
        })) || []
      });

      // Initialiser le nom du patient sélectionné
      setSelectedPatientName(`${normalizedInvoice.patient.firstname} ${normalizedInvoice.patient.lastname}`);
      setSearchTerm(`${normalizedInvoice.patient.firstname} ${normalizedInvoice.patient.lastname}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger la liste des patients
  const fetchPatients = async () => {
    if (!session?.accessToken) return;
    
    setIsLoadingPatients(true);
    try {
      const response = await fetch(`${API_BASE}/api/accounts/patients/by-clinique/`, {
        headers: { 
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        const patientsList = data.patients || data;
        
        // Trier par nom
        const sortedPatients = patientsList.sort((a: Patient, b: Patient) => 
          a.lastname.localeCompare(b.lastname)
        );
        
        setPatients(sortedPatients);
        setFilteredPatients(sortedPatients);
      }
    } catch (err) {
      console.error('❌ Erreur chargement patients:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // Filtrer les patients selon la recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient => {
      const fullName = `${patient.firstname} ${patient.lastname}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return fullName.includes(searchLower) ||
             patient.lastname.toLowerCase().includes(searchLower) ||
             patient.firstname.toLowerCase().includes(searchLower) ||
             (patient.cin && patient.cin.toLowerCase().includes(searchLower)) ||
             (patient.email && patient.email.toLowerCase().includes(searchLower)) ||
             (patient.id && patient.id.toString().includes(searchLower));
    });

    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  // Sélectionner un patient
  const handleSelectPatient = (patient: Patient) => {
    setFormData(prev => ({ ...prev, patient: patient.id }));
    setSelectedPatientName(`${patient.firstname} ${patient.lastname}`);
    setSearchTerm(`${patient.firstname} ${patient.lastname}`);
    setShowDropdown(false);
    setError(''); // Effacer les erreurs précédentes
  };

  // Effacer la sélection
  const handleClearSelection = () => {
    setFormData(prev => ({ ...prev, patient: 0 }));
    setSelectedPatientName('');
    setSearchTerm('');
    setShowDropdown(true);
  };

  const handleAddItem = (): void => {
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

  const handleRemoveItem = (index: number): void => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceCreateItem, value: any): void => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotalHT = (): number => {
    return formData.items.reduce((total: number, item: InvoiceCreateItem) => {
      return total + (item.quantite * item.prix_unitaire_ht);
    }, 0);
  };

  const calculateTotalTTC = (): number => {
    const totalHT = calculateTotalHT();
    return totalHT * (1 + (formData.tva || 20) / 100);
  };

  const calculateTVA = (): number => {
    const totalHT = calculateTotalHT();
    return totalHT * (formData.tva || 20) / 100;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!session?.accessToken || !invoice) return;

    // Validation
    if (!formData.patient || formData.patient <= 0) {
      setError('Veuillez sélectionner un patient');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: formData.items.map(item => ({
            description: item.description.trim(),
            quantite: item.quantite,
            prix_unitaire_ht: item.prix_unitaire_ht
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la modification de la facture');
      }

      // Redirection vers la page de détail
      router.push(`/receptionist/billing/invoices/${invoiceId}?updated=true`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification de la facture');
    } finally {
      setIsSubmitting(false);
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

  if (error && !invoice) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/receptionist/billing/invoices/${invoiceId}`}>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Modification de la facture
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {invoice?.numero} - {invoice?.patient.firstname} {invoice?.patient.lastname}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {invoice?.status === 'PAYEE' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-200">
              Cette facture est déjà payée. Certaines modifications peuvent être limitées.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base - MODIFIÉ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Informations de la facture
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NOUVEAU: Sélecteur de patient avec recherche */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient *
                </label>
                
                <div className="relative" ref={dropdownRef}>
                  <div className="flex items-center">
                    <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Rechercher un patient..."
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoadingPatients || invoice?.status === 'PAYEE'}
                    />
                    {formData.patient > 0 && !isLoadingPatients && invoice?.status !== 'PAYEE' && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="absolute right-10 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Effacer la sélection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {isLoadingPatients ? (
                      <div className="absolute right-3 animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    ) : (
                      <ChevronDown className="w-4 h-4 absolute right-3 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Dropdown des patients */}
                  {showDropdown && !isLoadingPatients && invoice?.status !== 'PAYEE' && (
                    <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                          {filteredPatients.length} patient(s) trouvé(s)
                        </p>
                      </div>
                      
                      {filteredPatients.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="font-medium">{searchTerm ? 'Aucun patient trouvé' : 'Aucun patient disponible'}</p>
                          <p className="text-sm mt-1">
                            {searchTerm ? 'Essayez avec un autre terme de recherche' : 'Contactez votre administrateur'}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {filteredPatients.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => handleSelectPatient(patient)}
                              className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors ${
                                formData.patient === patient.id 
                                  ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' 
                                  : ''
                              }`}
                            >
                              <div className="flex-shrink-0">
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
                                  <User className="w-4.5 h-4.5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                  {patient.firstname} {patient.lastname}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                  {patient.cin && <span>CIN: {patient.cin}</span>}
                                  {patient.email && <span>• {patient.email}</span>}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <div className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                  ID: {patient.id}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Affichage du patient sélectionné */}
                {formData.patient > 0 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-300">
                            {selectedPatientName}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            Patient actuel de la facture
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full">
                        ID: {formData.patient}
                      </div>
                    </div>
                  </div>
                )}
                
                {invoice?.status === 'PAYEE' && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    ⚠️ Le patient ne peut pas être modifié car la facture est payée
                  </p>
                )}
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
                disabled={invoice?.status === 'PAYEE'}
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
                        disabled={invoice?.status === 'PAYEE'}
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
                        disabled={invoice?.status === 'PAYEE'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix unitaire HT (DT) *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={item.prix_unitaire_ht}
                        onChange={(e) => handleItemChange(index, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={invoice?.status === 'PAYEE'}
                      />
                    </div>
                  </div>
                  
                  {formData.items.length > 1 && invoice?.status !== 'PAYEE' && (
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
                  {calculateTotalHT().toFixed(2)} DT
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">TVA ({formData.tva}%)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calculateTVA().toFixed(2)} DT
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Total TTC</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calculateTotalTTC().toFixed(2)} DT
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <Link href={`/receptionist/billing/invoices/${invoiceId}`}>
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting || (invoice?.status === 'PAYEE')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Modification...' : 'Modifier la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}