'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Calculator, Search, User, ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { InvoiceCreateData, InvoiceCreateItem } from '@/types/invoice';

// Interface pour les patients
interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  cin?: string;
  clinique?: {
    id: number;
    name: string;
  };
}

export default function CreateInvoicePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Récupérer l'ID patient depuis l'URL (si présent)
  const patientIdFromUrl = searchParams?.get('patient');
  
  const [formData, setFormData] = useState<InvoiceCreateData>({
    patient: patientIdFromUrl ? parseInt(patientIdFromUrl) : 0,
    description: 'Consultation médicale',
    tva: 19,
    items: [
      {
        description: 'Consultation médicale',
        quantite: 1,
        prix_unitaire_ht: 80
      }
    ]
  });
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Charger les patients
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
        
        // Si un patient est spécifié dans l'URL, le présélectionner
        if (patientIdFromUrl) {
          const patientFromUrl = sortedPatients.find((p: Patient) => p.id === parseInt(patientIdFromUrl));
          if (patientFromUrl) {
            setSelectedPatientName(`${patientFromUrl.firstname} ${patientFromUrl.lastname}`);
            setSearchTerm(`${patientFromUrl.firstname} ${patientFromUrl.lastname}`);
          }
        }
      } else {
        console.error('Erreur lors du chargement des patients:', response.status);
      }
    } catch (err) {
      console.error('❌ Erreur chargement patients:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchPatients();
    }
  }, [sessionStatus, patientIdFromUrl]);

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

  // Gestion des articles de facture
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        description: '', 
        quantite: 1, 
        prix_unitaire_ht: 0 
      }]
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

  // Calculs financiers
  const calculateTotalHT = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantite * item.prix_unitaire_ht);
    }, 0);
  };

  const calculateTVA = () => {
    const totalHT = calculateTotalHT();
    return totalHT * (formData.tva || 19) / 100;
  };

  const calculateTotalTTC = () => {
    const totalHT = calculateTotalHT();
    const tva = calculateTVA();
    return totalHT + tva;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sessionStatus !== 'authenticated' || !session?.accessToken) {
      setError('Veuillez vous connecter pour créer une facture');
      return;
    }

    // Validation
    if (!formData.patient || formData.patient <= 0) {
      setError('Veuillez sélectionner un patient');
      return;
    }

    // Validation des articles
    const invalidItems = formData.items.filter(item => 
      !item.description.trim() || 
      item.quantite <= 0 || 
      item.prix_unitaire_ht < 0
    );

    if (invalidItems.length > 0) {
      setError('Veuillez vérifier les informations des articles (description, quantité > 0, prix ≥ 0)');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Préparer les données pour l'API
      const invoiceData = {
        patient: formData.patient,
        description: formData.description.trim() || 'Facture',
        tva: formData.tva,
        date_echeance: formData.date_echeance || null,
        items: formData.items.map(item => ({
          description: item.description.trim(),
          quantite: item.quantite,
          prix_unitaire_ht: item.prix_unitaire_ht
        }))
      };

      console.log('Envoi des données:', invoiceData);

      const response = await fetch(`${API_BASE}/api/invoices/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = 
          responseData.detail || 
          responseData.message || 
          responseData.error || 
          (responseData.patient && `Patient: ${responseData.patient}`) ||
          (responseData.items && `Articles: ${responseData.items}`) ||
          `Erreur ${response.status}: ${response.statusText}`;
        
        throw new Error(errorMessage);
      }

      console.log('✅ Facture créée:', responseData);
      
      // Succès
      setSuccess('Facture créée avec succès ! Redirection...');
      
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push('/receptionist/billing');
      }, 2000);

    } catch (err: any) {
      console.error('❌ Erreur création facture:', err);
      setError(err.message || 'Une erreur est survenue lors de la création de la facture');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Affichage pendant le chargement de la session
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirection si non authentifié
  if (sessionStatus === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/receptionist/billing">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Nouvelle Facture
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Créez une nouvelle facture pour un patient
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden sm:inline">Statut:</span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
              {patients.length} patients disponibles
            </span>
          </div>
        </div>

        {/* Messages d'alerte */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 font-medium">Erreur</p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button 
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-green-800 dark:text-green-200 font-medium">Succès</p>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Informations de base */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                Informations de la facture
              </h2>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Étape 1/3
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Sélecteur de patient avec recherche */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient <span className="text-red-500">*</span>
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
                      placeholder="Rechercher un patient par nom, prénom, CIN ou email..."
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoadingPatients}
                    />
                    {formData.patient > 0 && !isLoadingPatients && (
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
                  {showDropdown && !isLoadingPatients && (
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
                                  {patient.clinique && <span>• {patient.clinique.name}</span>}
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
                  <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">
                            {selectedPatientName}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Patient sélectionné
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                        ID: {formData.patient}
                      </div>
                    </div>
                  </div>
                )}
                
                {!formData.patient && !isLoadingPatients && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Search className="w-3.5 h-3.5" />
                    Commencez à taper pour rechercher un patient
                  </p>
                )}
              </div>

              {/* TVA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TVA (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tva}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        setFormData(prev => ({ ...prev, tva: value }));
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Taux de TVA applicable</p>
              </div>

              {/* Date d'échéance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={formData.date_echeance || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_echeance: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Optionnel - Date limite de paiement</p>
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description de la facture
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  placeholder="Décrivez les prestations facturées..."
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cette description apparaîtra sur la facture PDF
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Articles de la facture */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                  Articles de la facture
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ajoutez les prestations ou produits à facturer
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  Étape 2/3
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un article
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Article {index + 1}
                      </span>
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Supprimer cet article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Ex: Consultation, Médicaments, Analyse..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                   
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix unitaire HT (DT) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={item.prix_unitaire_ht}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0) {
                              handleItemChange(index, 'prix_unitaire_ht', value);
                            }
                          }}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">DT</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Sous-total: <span className="font-medium">{(item.quantite * item.prix_unitaire_ht).toFixed(2)} DT</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {formData.items.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Aucun article ajouté</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Cliquez sur "Ajouter un article" pour commencer
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Récapitulatif */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Récapitulatif
              </h2>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Étape 3/3
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total HT */}
              <div className="text-center p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-700 dark:text-gray-300 font-bold">HT</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hors Taxes</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {calculateTotalHT().toFixed(2)} <span className="text-lg">DT</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.items.length} article(s)
                </p>
              </div>
              
              {/* TVA */}
              <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                <div className="w-12 h-12 bg-blue-200 dark:bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-700 dark:text-blue-300 font-bold">TVA</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  TVA ({formData.tva}%)
                </p>
                <p className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {calculateTVA().toFixed(2)} <span className="text-lg">DT</span>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Calculée sur le total HT
                </p>
              </div>
              
              {/* Total TTC */}
              <div className="text-center p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                <div className="w-12 h-12 bg-green-200 dark:bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-700 dark:text-green-300 font-bold">TTC</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Toutes Taxes Comprises</p>
                <p className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">
                  {calculateTotalTTC().toFixed(2)} <span className="text-lg">DT</span>
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Montant total à payer
                </p>
              </div>
            </div>
            
            {/* Détails du calcul */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Détails du calcul</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {item.description}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.quantite} × {item.prix_unitaire_ht.toFixed(2)} DT = {(item.quantite * item.prix_unitaire_ht).toFixed(2)} DT
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sous-total HT</span>
                    <span className="font-medium">{calculateTotalHT().toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">TVA ({formData.tva}%)</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">+ {calculateTVA().toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total TTC</span>
                    <span className="text-green-600 dark:text-green-400">{calculateTotalTTC().toFixed(2)} DT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Tous les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/receptionist/billing">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting || formData.patient <= 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Créer la facture
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}