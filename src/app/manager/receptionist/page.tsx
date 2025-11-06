/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Search, User, Mail, Phone, Clock, Plus, Edit, Trash2, X,
  Building2, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// === CONFIG ===
const API_BASE = process.env.BACKEND_URL || 'http://localhost:8000/api/';
const RECEPTIONNISTE_LIST_API = `${API_BASE}accounts/receptionnistes/`;
const RECEPTIONNISTE_CREATE_API = `${API_BASE}accounts/create-receptionniste/`;
const CLINICS_API = (id: number) => `${API_BASE}clinique/managers/${id}/clinics/`;

// === FETCHER ===
const fetcher = (url: string, token: any) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then(async (res) => {
    if (res.status === 401) {
      toast.error("Session expirée");
      window.location.href = "/login";
      return [];
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Erreur serveur");
    }
    return res.json();
  });

// === TYPES ===
type Receptionniste = {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  work_shift: string;
  desk_number: string;
  clinique?: { id: number; name: string } | null;
  clinique_name?: string;
};

type Clinic = {
  id: number;
  name: string;
};

// === PAGE ===
export default function ReceptionnistesPage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const role = session?.user?.role;
  const managerId = session?.user?.id;

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecep, setEditingRecep] = useState<Receptionniste | null>(null);
  const [form, setForm] = useState({
    email: "", password: "", firstname: "", lastname: "", phone: "",
    work_shift: "", desk_number: "", clinique_id: ""
  });

  // === ACCESS CONTROL ===
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      window.location.href = "/login";
    } else if (role !== "MANAGER") {
      window.location.href = "/dashboard";
    }
  }, [status, session, role]);

  // === CLINIQUES DU MANAGER ===
  const { data: cliniques = [], isLoading: cliniquesLoading } = useSWR<Clinic[]>(
    managerId && token ? [CLINICS_API(managerId), token] : null,
    ([url, t]) => fetcher(url, t),
    { revalidateOnFocus: false }
  );

  // === RÉCEPTIONNISTES ===
  const { data: receptionnistes = [], mutate: refreshRecep } = useSWR<Receptionniste[]>(
    token ? [RECEPTIONNISTE_LIST_API, token] : null,
    ([url, t]) => fetcher(url, t)
  );

  useEffect(() => {
    if (cliniques.length === 1) {
      setForm(prev => ({ ...prev, clinique_id: cliniques[0].id.toString() }));
    }
  }, [cliniques]);

  const resetForm = () => {
    setForm({
      email: "", password: "", firstname: "", lastname: "", phone: "",
      work_shift: "", desk_number: "",
      clinique_id: cliniques.length === 1 ? cliniques[0].id.toString() : ""
    });
  };

  const openModal = (recep?: Receptionniste) => {
    if (recep) {
      setEditingRecep(recep);
      setForm({
        email: recep.email,
        password: "",
        firstname: recep.firstname,
        lastname: recep.lastname,
        phone: recep.phone || "",
        work_shift: recep.work_shift || "",
        desk_number: recep.desk_number || "",
        clinique_id: recep.clinique?.id?.toString() || cliniques[0]?.id?.toString() || "",
      });
    } else {
      resetForm();
      setEditingRecep(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRecep(null);
    resetForm();
  };

  // === CREATE & UPDATE ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clinique_id) {
      toast.error("Veuillez sélectionner une clinique");
      return;
    }

    const url = editingRecep
      ? `${API_BASE}accounts/receptionnistes/${editingRecep.id}/`
      : RECEPTIONNISTE_CREATE_API;

    const method = editingRecep ? "PATCH" : "POST";
    const payload: any = {
      email: form.email,
      firstname: form.firstname,
      lastname: form.lastname,
      phone: form.phone,
      work_shift: form.work_shift,
      desk_number: form.desk_number,
      clinique_id: parseInt(form.clinique_id),
    };
    if (!editingRecep) payload.password = form.password;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.email?.[0] || data.clinique_id?.[0] || data.detail || "Échec";
        toast.error(errorMsg);
        return;
      }

      toast.success(editingRecep ? "Réceptionniste mise à jour" : "Réceptionniste créée");
      refreshRecep();
      closeModal();
    } catch {
      toast.error("Erreur réseau");
    }
  };

  // === DELETE ===
  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette réceptionniste ?")) return;

    try {
      const res = await fetch(`${API_BASE}accounts/receptionnistes/${id}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Échec suppression");
        return;
      }

      toast.success("Réceptionniste supprimée");
      refreshRecep();
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const filtered = receptionnistes.filter(r =>
    `${r.firstname} ${r.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Réceptionnistes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {receptionnistes.length} réceptionniste{receptionnistes.length > 1 ? "s" : ""}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          disabled={cliniques.length === 0}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Ajouter une réceptionniste
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Cards */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              {search ? "Aucune réceptionniste trouvée" : "Aucune réceptionniste"}
            </div>
          ) : (
            filtered.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 p-6 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {r.firstname} {r.lastname}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{r.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(r)}
                      className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-300 hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 bg-red-50 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-300 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {r.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {r.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {r.work_shift || "Non défini"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {r.clinique_name || "Non assignée"}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            title={editingRecep ? "Modifier la Réceptionniste" : "Nouvelle Réceptionniste"}
            onClose={closeModal}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Email"
                  icon={Mail}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                {!editingRecep && (
                  <Input
                    label="Mot de passe"
                    icon={Shield}
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                )}
                <Input
                  label="Prénom"
                  icon={User}
                  name="firstname"
                  value={form.firstname}
                  onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                  required
                />
                <Input
                  label="Nom"
                  icon={User}
                  name="lastname"
                  value={form.lastname}
                  onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                  required
                />
                <Input
                  label="Téléphone"
                  icon={Phone}
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Poste de travail"
                  name="desk_number"
                  value={form.desk_number}
                  onChange={(e) => setForm({ ...form, desk_number: e.target.value })}
                />
                <Input
                  label="Horaires"
                  icon={Clock}
                  name="work_shift"
                  placeholder="ex: 8h-16h"
                  value={form.work_shift}
                  onChange={(e) => setForm({ ...form, work_shift: e.target.value })}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Clinique
                  </label>
                  <select
                    name="clinique_id"
                    value={form.clinique_id}
                    onChange={(e) => setForm({ ...form, clinique_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={cliniquesLoading || cliniques.length === 0}
                  >
                    <option value="">
                      {cliniquesLoading ? "Chargement..." : cliniques.length === 0 ? "Aucune clinique" : "Sélectionner"}
                    </option>
                    {cliniques.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={cliniquesLoading}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {editingRecep ? "Mettre à jour" : "Créer"}
                </motion.button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// === MODAL ===
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// === INPUT ===
function Input({
  label,
  icon: Icon,
  ...props
}: {
  label: string;
  icon?: React.ElementType;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-1" />}
        {label}
      </label>
      <input
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 transition"
        {...props}
      />
    </div>
  );
}