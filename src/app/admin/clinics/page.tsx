'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, Building2, Phone, Mail, MapPin, X, Copy, User } from 'lucide-react';

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
  admins: {
    id: number;
    firstname: string;
    lastname: string;
  }[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/clinique/';

const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
  }).then((res) => {
    if (!res.ok) throw new Error('Erreur de chargement');
    return res.json();
  });

export default function ClinicsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Clinic | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: clinics = [], error, isLoading } = useSWR<Clinic[]>(`${API_BASE}list/`, fetcher);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClinicForm>({ resolver: zodResolver(clinicSchema) });

  const filtered = clinics.filter((c: Clinic) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tenant_id.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: ClinicForm) => {
    const url = editing ? `${API_BASE}${editing.id}/update/` : `${API_BASE}create-clinique/`;
    const method = editing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), // tenant_id NON envoyé
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Échec de l’opération');
      }

      toast.success(editing ? 'Clinique mise à jour' : 'Clinique créée avec succès');
      mutate(`${API_BASE}list/`);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    reset();
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette clinique ?')) return;
    try {
      await fetch(`${API_BASE}${id}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      toast.success('Clinique supprimée');
      mutate(`${API_BASE}list/`);
    } catch {
      toast.error('Échec de la suppression');
    }
  };

  const startEdit = (c: Clinic) => {
    setEditing(c);
    setValue('name', c.name);
    setValue('address', c.address);
    setValue('phone', c.phone);
    setValue('email', c.email);
    setShowForm(true);
  };

  const copyTenantId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Tenant ID copié !');
  };

  return (
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
          onClick={() => {
            showForm ? resetForm() : setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="w-5 h-5" />
          {showForm ? 'Annuler' : 'Nouvelle Clinique'}
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

      {/* === FORMULAIRE ANIMÉ (sans tenant_id) === */}
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
                {editing ? 'Modifier la Clinique' : 'Créer une Nouvelle Clinique'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                {/* Nom */}
                <div className="relative">
                  <input
                    {...register('name')}
                    placeholder=" "
                    className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
                    Nom de la Clinique *
                  </label>
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Adresse */}
                <div className="relative md:col-span-2">
                  <input
                    {...register('address')}
                    placeholder=" "
                    className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
                    Adresse Complète *
                  </label>
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>

                {/* Téléphone */}
                <div className="relative">
                  <input
                    {...register('phone')}
                    placeholder=" "
                    className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
                    Téléphone
                  </label>
                </div>

                {/* Email */}
                <div className="relative">
                  <input
                    {...register('email')}
                    type="email"
                    placeholder=" "
                    className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-2 text-sm font-medium text-gray-600 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
                    Email
                  </label>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={resetForm}
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
                  {isSubmitting ? (
                    <>Enregistrement...</>
                  ) : (
                    <>{editing ? 'Mettre à jour' : 'Créer la Clinique'}</>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === LISTE DES CLINIQUES === */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucune clinique trouvée.
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onEdit={() => startEdit(clinic)}
                onDelete={() => handleDelete(clinic.id)}
                onCopy={() => copyTenantId(clinic.tenant_id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// === CARTE CLINIQUE — PRO + COPIE DE TENANT_ID ===
function ClinicCard({ clinic, onEdit, onDelete, onCopy }: { clinic: Clinic; onEdit: () => void; onDelete: () => void; onCopy: () => void }) {
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

        <div className="space-y-3">
          <div className="flex items-start gap-2.5 text-sm">
            <MapPin className="w-4.5 h-4.5 text-purple-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {clinic.address}
            </p>
          </div>

          {clinic.phone && (
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="w-4.5 h-4.5 text-green-500" />
              <a href={`tel:${clinic.phone}`} className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                {clinic.phone}
              </a>
            </div>
          )}

          {clinic.email && (
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="w-4.5 h-4.5 text-blue-500" />
              <a href={`mailto:${clinic.email}`} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                {clinic.email}
              </a>
            </div>
          )}

          <div className="flex items-start gap-2.5 text-sm">
            <User className="w-4.5 h-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">Managers :</p>
              {clinic.admins && clinic.admins.length > 0 ? (
                <ul className="list-disc pl-4 text-gray-600 dark:text-gray-300 mt-1 space-y-1">
                  {clinic.admins.map((admin) => (
                    <li key={admin.id} className="text-sm">
                      {admin.firstname} {admin.lastname}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Aucun manager assigné</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            Créée le{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {new Date(clinic.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: '2-digit'
              })}
            </span>
          </span>
          <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
            Active
          </span>
        </div>
      </div>

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