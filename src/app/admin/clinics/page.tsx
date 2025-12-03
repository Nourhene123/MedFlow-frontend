'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, X, Building2, Phone, Mail, MapPin, Copy, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

const clinicSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  address: z.string().min(1, 'Adresse requise'),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});

type ClinicForm = z.infer<typeof clinicSchema>;

interface Clinic {
  id: number;
  tenant_id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
  managers: { id: number; firstname: string; lastname: string }[];
}

const API_BASE = process.env.BACKEND_URL || 'http://localhost:8000/api/';

const useClinics = (accessToken?: string) => {
  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Erreur de chargement');
    return res.json();
  };

  const { data, error, isLoading } = useSWR<Clinic[]>(
    accessToken ? `${API_BASE}clinique/list/` : null,
    fetcher
  );
  return { data: data || [], error, isLoading };
};

export default function ClinicsPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Clinic | null>(null);

  const { data: clinics = [], isLoading } = useClinics(accessToken);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClinicForm>({ resolver: zodResolver(clinicSchema) });

  const filtered = clinics.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tenant_id.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (formData: ClinicForm) => {
    const url = editing
      ? `${API_BASE}clinique/${editing.id}/update/`
      : `${API_BASE}clinique/create-clinique/`;

    try {
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || 'Échec de l\'opération');
      }

      toast.success(editing ? 'Clinique mise à jour' : 'Clinique créée avec succès');
      mutate(`${API_BASE}clinique/list/`);
      closeForm();
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue');
    }
  };

  const openForm = (clinic?: Clinic) => {
    if (clinic) {
      setEditing(clinic);
      setValue('name', clinic.name);
      setValue('address', clinic.address);
      setValue('phone', clinic.phone || '');
      setValue('email', clinic.email || '');
    } else {
      setEditing(null);
      reset();
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    reset();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette clinique ?')) return;
    try {
      await fetch(`${API_BASE}clinique/${id}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success('Clinique supprimée');
      mutate(`${API_BASE}clinique/list/`);
    } catch {
      toast.error('Échec de la suppression');
    }
  };

  const copyTenantId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Tenant ID copié !');
  };
  const handleRemoveManager = async (clinicId: number, managerId: number, accessToken: string) => {
  try {
    const res = await fetch(`${API_BASE}clinique/${clinicId}/remove-manager/${managerId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Échec de la suppression du gestionnaire');
    }

    toast.success('Gestionnaire retiré avec succès');
    mutate(`${API_BASE}clinique/list/`);
  } catch (err: any) {
    toast.error(err.message || 'Une erreur est survenue');
  }
};

  return (
    <>
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Cliniques</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {clinics.length} clinique{clinics.length > 1 ? 's' : ''}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openForm()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Clinique
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom ou tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Liste des cliniques */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucune clinique trouvée.</div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((clinic) => (
                <ClinicCard
  key={clinic.id}
  clinic={clinic}
  onEdit={() => openForm(clinic)}
  onDelete={() => handleDelete(clinic.id)}
  onCopy={() => copyTenantId(clinic.tenant_id)}
  onRemoveManager={handleRemoveManager}
  accessToken={accessToken || ''}
/>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* MODALE DE FORMULAIRE */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeForm}
          >
            {/* Backdrop flou */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Contenu de la modale */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barre colorée en haut */}
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editing ? 'Modifier la Clinique' : 'Créer une Nouvelle Clinique'}
                  </h2>
                  <button
                    onClick={closeForm}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative">
                      <input
                        {...register('name')}
                        placeholder=" "
                        className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-900 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
                        Nom de la Clinique *
                      </label>
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div className="relative md:col-span-2">
                      <input
                        {...register('address')}
                        placeholder=" "
                        className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-900 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
                        Adresse Complète *
                      </label>
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                    </div>

                    <div className="relative">
                      <input
                        {...register('phone')}
                        placeholder=" "
                        className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-900 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
                        Téléphone
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        {...register('email')}
                        type="email"
                        placeholder=" "
                        className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-900 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
                        Email
                      </label>
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      Annuler
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {isSubmitting ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Créer la Clinique')}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// === CARTE CLINIQUE — PRO + COPIE DE TENANT_ID ===
function ClinicCard({
  clinic,
  onEdit,
  onDelete,
  onCopy,
  onRemoveManager,
  accessToken
}: {
  clinic: Clinic;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onRemoveManager: (clinicId: number, managerId: number, accessToken: string) => void;
  accessToken: string;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ 
        y: -12, 
        scale: 1.02,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        transition: { duration: 0.3 }
      }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300"
    >
      {/* Barre colorée en haut (exactement comme ManagerCard) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-6">
        {/* Header : Icône + Nom + Tenant ID */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                {clinic.name}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs font-mono text-purple-600 dark:text-purple-400">
                  {clinic.tenant_id}
                </p>
                <button
                  onClick={onCopy}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copier le Tenant ID"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-500 hover:text-purple-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Boutons d'action (identiques au ManagerCard) */}
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onEdit}
              className="p-2.5 bg-blue-50 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              title="Modifier"
            >
              <Edit className="w-4.5 h-4.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDelete}
              className="p-2.5 bg-red-50 dark:bg-red-900/50 rounded-xl text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </motion.button>
          </div>
        </div>

        {/* Infos de contact */}
        <div className="space-y-3 text-sm">
          {clinic.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4.5 h-4.5 text-blue-500 mt-0.5" />
              <p className="text-gray-600 dark:text-gray-300">{clinic.address}</p>
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center gap-2.5">
              <Phone className="w-4.5 h-4.5 text-green-500" />
              <a href={`tel:${clinic.phone}`} className="text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors">
                {clinic.phone}
              </a>
            </div>
          )}
          {clinic.email && (
            <div className="flex items-center gap-2.5">
              <Mail className="w-4.5 h-4.5 text-amber-500" />
              <a href={`mailto:${clinic.email}`} className="text-gray-600 dark:text-gray-300 hover:text-amber-600 transition-colors break-all">
                {clinic.email}
              </a>
            </div>
          )}
        </div>

        {/* Gestionnaires assignés — Tu gardes exactement ton design actuel (très bon !) */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Gestionnaires</span>
              <span className="text-xs font-normal text-gray-500">
                ({clinic.managers?.length || 0})
              </span>
            </div>
           
          </div>

          {clinic.managers && clinic.managers.length > 0 && (
            <div className="space-y-2">
              {clinic.managers.map((manager) => (
                <div
                  key={manager.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group/manager"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow">
                      {manager.firstname[0]}{manager.lastname[0]}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {manager.firstname} {manager.lastname}
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveManager(clinic.id, manager.id, accessToken)}
                    className="opacity-0 group-hover/manager:opacity-100 p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer : date de création + badge actif */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            Créée le{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatDate(clinic.created_at)}
            </span>
          </span>
          <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Effet de fond au hover (identique au ManagerCard) */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}
// === SQUELETTE PRO ===
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
  );
}  