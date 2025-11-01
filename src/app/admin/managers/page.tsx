'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Search,
  UserPlus,
  Building2,
  Mail,
  Phone,
  Trash2,
  X,
  MapPin,
  Copy,
  User,
} from 'lucide-react';

const managerSchema = z.object({
  email: z.string().email('Email invalide'),
  firstname: z.string().min(1, 'Prénom requis'),
  lastname: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  password: z.string().min(6, '6 caractères minimum'),
});

type ManagerForm = z.infer<typeof managerSchema>;

interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  user_type: string;
  created_at: string;
}

interface Clinic {
  id: number;
  name: string;
  tenant_id: string;
  admins: User[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const ACCOUNTS_API = `${API_BASE}/accounts/`;
const CLINIQUE_API = `${API_BASE}/clinique/`;

const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
  }).then((res) => {
    if (!res.ok) throw new Error('Erreur serveur');
    return res.json();
  });


export default function ManagersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [selectedClinics, setSelectedClinics] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Data fetching
  const {
    data: managers = [],
    isLoading: loadingManagers,
  } = useSWR<User[]>(`${ACCOUNTS_API}users/?user_type=MANAGER`, fetcher);

  const { data: clinics = [] } = useSWR<Clinic[]>(`${CLINIQUE_API}list/`, fetcher);

  // Pre-populate selectedClinics
  useEffect(() => {
    if (selectedManager && clinics.length > 0) {
      const assignedIds = clinics
        .filter((c) => c.admins?.some((a) => a.id === selectedManager.id))
        .map((c) => c.id);
      setSelectedClinics(assignedIds);
    }
  }, [selectedManager, clinics]);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManagerForm>({ resolver: zodResolver(managerSchema) });

  // Filtering
  const filteredManagers = managers.filter(
    (m) =>
      `${m.firstname} ${m.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Handlers ───────────────────────────────────────────────
  const createManager = async (data: ManagerForm) => {
    try {
      const res = await fetch(`${ACCOUNTS_API}create-manager/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, user_type: 'MANAGER' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.email?.[0] || err.detail || 'Échec de création');
      }

      toast.success('Manager créé avec succès');
      mutate(`${ACCOUNTS_API}users/?user_type=MANAGER`);
      reset();
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteManager = async (id: number) => {
    if (!confirm('Supprimer ce manager ?')) return;

    try {
      const res = await fetch(`${ACCOUNTS_API}users/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      if (!res.ok) throw new Error('Échec suppression');
      toast.success('Manager supprimé');
      mutate(`${ACCOUNTS_API}users/?user_type=MANAGER`);
    } catch {
      toast.error('Impossible de supprimer');
    }
  };

  const assignClinics = async () => {
    if (!selectedManager) return;
    setIsAssigning(true);

    try {
      const res = await fetch(`${CLINIQUE_API}managers/${selectedManager.id}/assign-clinics/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clinic_ids: selectedClinics }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec assignation');
      }

      toast.success('Cliniques assignées');
      setSelectedManager(null);
      setSelectedClinics([]);
      mutate(`${CLINIQUE_API}list/`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  // ─── UI ─────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Managers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {managers.length} manager{managers.length > 1 ? 's' : ''}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm((v) => !v)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <UserPlus className="w-5 h-5" />
          {showForm ? 'Annuler' : 'Nouveau Manager'}
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un manager..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Créer un Manager
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(createManager)} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <InputField
                  label="Prénom *"
                  {...register('firstname')}
                  error={errors.firstname?.message}
                />
                <InputField
                  label="Nom *"
                  {...register('lastname')}
                  error={errors.lastname?.message}
                />
                <InputField
                  label="Email *"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  className="md:col-span-2"
                />
                <InputField label="Téléphone" {...register('phone')} />
                <InputField
                  label="Mot de passe *"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isSubmitting ? 'Création...' : 'Créer'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {selectedManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedManager(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Assigner des Cliniques</h3>
                <button onClick={() => setSelectedManager(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manager :{' '}
                <span className="font-medium">
                  {selectedManager.firstname} {selectedManager.lastname}
                </span>
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cliniques</label>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {clinics.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Aucune clinique</p>
                  ) : (
                    clinics.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClinics.includes(c.id)}
                          onChange={(e) =>
                            setSelectedClinics((prev) =>
                              e.target.checked
                                ? [...prev, c.id]
                                : prev.filter((id) => id !== c.id)
                            )
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.tenant_id}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setSelectedManager(null)}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={assignClinics}
                  disabled={isAssigning}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isAssigning ? 'Assignation...' : 'Assigner'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loadingManagers ? (
        <LoadingGrid />
      ) : filteredManagers.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredManagers.map((manager) => (
              <ManagerCard
                key={manager.id}
                manager={manager}
                onAssign={() => setSelectedManager(manager)}
                onDelete={() => deleteManager(manager.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Reusable Components
// ──────────────────────────────────────────────────────────────
function InputField({
  label,
  error,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        {...props}
        placeholder=" "
        className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
      <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
        {label}
      </label>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse"
        >
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-500">
      Aucun manager trouvé.
    </div>
  );
}

function ManagerCard({
  manager,
  onAssign,
  onDelete,
}: {
  manager: User;
  onAssign: () => void;
  onDelete: () => void;
}) {
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
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                {manager.firstname} {manager.lastname}
              </h3>
              <p className="text-xs font-mono text-purple-600 dark:text-purple-400 mt-1">
                Manager
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAssign}
              className="p-2.5 bg-blue-50 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              title="Assigner cliniques"
            >
              <Building2 className="w-4.5 h-4.5" />
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

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4.5 h-4.5 text-blue-500" />
            <a
              href={`mailto:${manager.email}`}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
            >
              {manager.email}
            </a>
          </div>
          {manager.phone && (
            <div className="flex items-center gap-2.5">
              <Phone className="w-4.5 h-4.5 text-green-500" />
              <a
                href={`tel:${manager.phone}`}
                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                {manager.phone}
              </a>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            Créé le{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {new Date(manager.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: '2-digit'
              })}
            </span>
          </span>
          <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
            Actif
          </span>
        </div>
      </div>

      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}