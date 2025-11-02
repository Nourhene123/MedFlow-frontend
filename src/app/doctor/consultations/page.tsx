// src/app/(manager)/consultations/page.tsx
'use client';

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Search, Calendar, Clock, User, Pill, XCircle, Plus, Edit, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Consultation = {
  id: number;
  patient_name: string;
  medecin_name: string;
  date: string;
  duration_minutes: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  ordonnance_exists: boolean;
};

const fetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
  }).then((res) => res.json());

export default function ConsultationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Consultation["status"] | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: consultations = [], isLoading, mutate } = useSWR<Consultation[]>("/medical/consultations/list/", fetcher);

  const [form, setForm] = useState({
    patient_name: "",
    medecin_name: "",
    date: "",
    duration_minutes: "30",
  });

  const filtered = consultations.filter(c => {
    const matchesSearch = c.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      c.medecin_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // === CREATE ===
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch("/medical/consultations/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      body: JSON.stringify({ ...form, duration_minutes: parseInt(form.duration_minutes) }),
    });
    mutate();
    setIsCreateOpen(false);
    setForm({ patient_name: "", medecin_name: "", date: "", duration_minutes: "30" });
  };

  // === UPDATE ===
  const openEdit = (c: Consultation) => {
    setEditingId(c.id);
    setForm({
      patient_name: c.patient_name,
      medecin_name: c.medecin_name,
      date: c.date.slice(0, 16),
      duration_minutes: c.duration_minutes.toString(),
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    await fetch(`/medical/consultations/${editingId}/update/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      body: JSON.stringify({ ...form, duration_minutes: parseInt(form.duration_minutes) }),
    });
    mutate();
    setIsEditOpen(false);
    setEditingId(null);
  };

  // === DELETE ===
  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette consultation ?")) return;
    await fetch(`/medical/consultations/${id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    });
    mutate();
  };

  // === CANCEL ===
  const cancelConsultation = async (id: number) => {
    if (!confirm("Annuler cette consultation ?")) return;
    await fetch(`/medical/consultations/${id}/cancel/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    });
    mutate();
  };

  // === INPUT CHANGE ===
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // === CONTENT ===
  let content;
  if (isLoading) {
    content = <p className="text-center py-8 text-gray-500">Chargement...</p>;
  } else if (filtered.length === 0) {
    content = <p className="text-center py-8 text-gray-500">Aucune consultation trouvée.</p>;
  } else {
    content = filtered.map(c => (
      <motion.div
        key={c.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{c.patient_name}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">Dr. {c.medecin_name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            c.status === "COMPLETED" ? "bg-green-100 text-green-700" :
            c.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-700" :
            c.status === "SCHEDULED" ? "bg-teal-100 text-teal-700" :
            "bg-red-100 text-red-700"
          }`}>
            {c.status === "SCHEDULED" ? "Planifiée" : c.status === "IN_PROGRESS" ? "En cours" : c.status === "COMPLETED" ? "Terminée" : "Annulée"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(c.date), "dd MMM yyyy HH:mm")}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {c.duration_minutes} min
          </div>
          {c.ordonnance_exists && (
            <div className="flex items-center gap-1 text-teal-600">
              <Pill className="w-4 h-4" />
              Ordonnance
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3 text-sm">
          {c.status === "SCHEDULED" && (
            <>
              <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button onClick={() => cancelConsultation(c.id)} className="text-red-600 hover:text-red-700 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            </>
          )}
          <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-700 flex items-center gap-1">
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </motion.div>
    ));
  }

  return (
    <div className="space-y-6">
      {/* Header + Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Consultations</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les rendez-vous de vos cliniques.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-5 py-3 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouvelle consultation
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher patient ou médecin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Consultation["status"] | "ALL")}
          className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="SCHEDULED">Planifiée</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Terminée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence>
          {content}
        </AnimatePresence>
      </div>

      {/* === CREATE MODAL === */}
      <AnimatePresence>
        {isCreateOpen && (
          <Modal title="Nouvelle Consultation" onClose={() => setIsCreateOpen(false)}>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Patient" icon={User} name="patient_name" value={form.patient_name} onChange={handleInputChange} required />
              <Input label="Médecin" icon={User} name="medecin_name" value={form.medecin_name} onChange={handleInputChange} required />
              <Input label="Date et heure" icon={Calendar} type="datetime-local" name="date" value={form.date} onChange={handleInputChange} required />
              <Select label="Durée" icon={Clock} name="duration_minutes" value={form.duration_minutes} onChange={handleInputChange}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </Select>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition">
                Créer
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* === EDIT MODAL === */}
      <AnimatePresence>
        {isEditOpen && (
          <Modal title="Modifier Consultation" onClose={() => setIsEditOpen(false)}>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input label="Patient" icon={User} name="patient_name" value={form.patient_name} onChange={handleInputChange} required />
              <Input label="Médecin" icon={User} name="medecin_name" value={form.medecin_name} onChange={handleInputChange} required />
              <Input label="Date et heure" icon={Calendar} type="datetime-local" name="date" value={form.date} onChange={handleInputChange} required />
              <Select label="Durée" icon={Clock} name="duration_minutes" value={form.duration_minutes} onChange={handleInputChange}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </Select>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition">
                Mettre à jour
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// === MODAL WITH BLUR BACKGROUND ===
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Fond flou + transparent */}
      <div className="absolute inset-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// === INPUT COMPONENT ===
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
}

function Input({ label, icon: Icon, name, ...props }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-1" />}
        {label}
      </label>
      <input
        name={name}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 transition"
        {...props}
      />
    </div>
  );
}

// === SELECT COMPONENT ===
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

function Select({ label, icon: Icon, name, children, ...props }: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-1" />}
        {label}
      </label>
      <select
        name={name}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 transition"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}