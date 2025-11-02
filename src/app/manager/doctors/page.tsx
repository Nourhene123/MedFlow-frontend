'use client';
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Search, Stethoscope, Mail, Phone, Edit, Trash2, Plus, X,
  Building2, User, Lock, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// === TYPES ===
type Doctor = {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  speciality: string;
  consultation_fee: number;
  experience_years: number;
  availability: string;
  clinique?: { id: number; name: string } | null;
  clinique_name?: string;
  is_active: boolean;
};

type Clinique = {
  id: number;
  name: string;
};

// === CONFIG ===
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const DOCTOR_LIST_API   = `${API_BASE}/accounts/list-medecins/`;
const DOCTOR_CREATE_API = `${API_BASE}/accounts/create-medecin/`;
const CURRENT_USER_API  = `${API_BASE}/accounts/current-user/`;

// === FETCHER ===
const fetcher = async (url: string): Promise<any> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    toast.error("Non connecté.");
    window.location.href = "/login";
    return null;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    toast.error("Session expirée.");
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    return null;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Erreur ${res.status}`);
  }

  return res.json();
};

// === PAGE ===
export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // === DATA ===
  const {
    data: doctors = [],
    isLoading: doctorsLoading,
    mutate: mutateDoctors,
  } = useSWR<Doctor[]>(DOCTOR_LIST_API, fetcher);

  // Récupère l'utilisateur connecté (pour son ID)
  const { data: currentUser } = useSWR<{ id: number; user_type: string }>(
    CURRENT_USER_API,
    fetcher
  );

  // Construit l'URL dynamique : /api/clinique/managers/<id>/clinics/
  const managerId = currentUser?.id;
  const CLINICS_API = managerId 
    ? `${API_BASE}/clinique/managers/${managerId}/clinics/`
    : null;

  // Récupère les cliniques du manager
  const { 
    data: clinicsData = [], 
    isLoading: clinicsLoading 
  } = useSWR<Clinique[]>(
    CLINICS_API,
    fetcher
  );

  // Prend la première clinique (un manager = une clinique)
  const managerClinic = clinicsData[0];

  // === FORM STATE ===
  const [form, setForm] = useState({
    email: "", password: "", firstname: "", lastname: "", phone: "",
    speciality: "", consultation_fee: "", experience_years: "", availability: ""
  });

  const resetForm = () => {
    setForm({
      email: "", password: "", firstname: "", lastname: "", phone: "",
      speciality: "", consultation_fee: "", experience_years: "", availability: ""
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // === FILTER ===
  const filtered = doctors.filter(d =>
    `${d.firstname} ${d.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase()) ||
    d.speciality.toLowerCase().includes(search.toLowerCase())
  );

  // === CREATE ===
 const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!managerClinic?.id) {
    toast.error("Aucune clinique trouvée. Impossible de créer le médecin.");
    return;
  }

  const payload = {
    ...form,
    clinique: managerClinic.id,
    consultation_fee: parseFloat(form.consultation_fee) || 0,
    experience_years: parseInt(form.experience_years) || 0,
  };

  try {
    const res = await fetch(DOCTOR_CREATE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // Gestion des erreurs claires
      if (data.details?.email?.[0]?.includes("already exists")) {
        toast.error("Cet email est déjà utilisé.");
      } else {
        toast.error(data.error || data.details?.[0] || "Échec création");
      }
      console.error("Erreur API:", data);
      return;
    }

    toast.success(data.message || "Médecin créé avec succès");
    mutateDoctors();
    setIsCreateOpen(false);
    resetForm();
  } catch (err: any) {
    toast.error("Erreur réseau");
    console.error(err);
  }
};
  // === EDIT ===
  const openEdit = (d: Doctor) => {
    setEditingId(d.id);
    setForm({
      email: d.email,
      password: "",
      firstname: d.firstname,
      lastname: d.lastname,
      phone: d.phone,
      speciality: d.speciality,
      consultation_fee: d.consultation_fee.toString(),
      experience_years: d.experience_years.toString(),
      availability: d.availability,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const { email, password, ...safeForm } = form;

    const payload = {
      ...safeForm,
      consultation_fee: parseFloat(safeForm.consultation_fee) || 0,
      experience_years: parseInt(safeForm.experience_years) || 0,
    };

    try {
      const res = await fetch(`${API_BASE}/accounts/medecins/${editingId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Échec mise à jour");
      }

      toast.success("Médecin mis à jour");
      mutateDoctors();
      setIsEditOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // === DELETE ===
  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce médecin ?")) return;

    try {
      await fetch(`${API_BASE}/accounts/medecins/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      toast.success("Médecin supprimé");
      mutateDoctors();
    } catch {
      toast.error("Échec suppression");
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Médecins</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {doctors.length} médecin{doctors.length > 1 ? "s" : ""}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Ajouter un médecin
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
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* List */}
      {doctorsLoading ? (
        <p className="text-center py-12 text-gray-500">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-gray-500">Aucun médecin.</p>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map(d => (
              <DoctorCard
                key={d.id}
                doctor={d}
                onEdit={() => openEdit(d)}
                onDelete={() => handleDelete(d.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <Modal title="Nouveau Médecin" onClose={() => { setIsCreateOpen(false); resetForm(); }}>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Email" icon={Mail} name="email" type="email" value={form.email} onChange={handleInputChange} required />
                <Input label="Mot de passe" icon={Lock} name="password" type="password" value={form.password} onChange={handleInputChange} required />
                <Input label="Prénom" icon={User} name="firstname" value={form.firstname} onChange={handleInputChange} required />
                <Input label="Nom" icon={User} name="lastname" value={form.lastname} onChange={handleInputChange} required />
                <Input label="Téléphone" icon={Phone} name="phone" value={form.phone} onChange={handleInputChange} />
                <Input label="Spécialité" icon={Stethoscope} name="speciality" value={form.speciality} onChange={handleInputChange} required />
                <Input label="Tarif (€)" name="consultation_fee" type="number" step="0.01" value={form.consultation_fee} onChange={handleInputChange} />
                <Input label="Expérience (années)" name="experience_years" type="number" value={form.experience_years} onChange={handleInputChange} />
                <Input label="Disponibilité" icon={Calendar} name="availability" placeholder="Lun-Ven 9h-18h" value={form.availability} onChange={handleInputChange} />

                {/* Clinique auto-assignée */}
                <div className="md:col-span-2 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/50 dark:to-cyan-900/50 rounded-xl border border-teal-200 dark:border-teal-700">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-medium">
                    <Building2 className="w-5 h-5" />
                    <span>Clinique assignée automatiquement :</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-teal-800 dark:text-teal-200">
                    {clinicsLoading 
                      ? "Chargement..." 
                      : managerClinic?.name || "Aucune clinique trouvée"
                    }
                  </p>
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                    Ce médecin sera rattaché à votre clinique.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); resetForm(); }}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Créer le médecin
                </motion.button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <Modal title="Modifier Médecin" onClose={() => { setIsEditOpen(false); resetForm(); }}>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" /> Email
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {doctors.find(d => d.id === editingId)?.email}
                  </div>
                </div>

                <Input label="Prénom" icon={User} name="firstname" value={form.firstname} onChange={handleInputChange} required />
                <Input label="Nom" icon={User} name="lastname" value={form.lastname} onChange={handleInputChange} required />
                <Input label="Téléphone" icon={Phone} name="phone" value={form.phone} onChange={handleInputChange} />
                <Input label="Spécialité" icon={Stethoscope} name="speciality" value={form.speciality} onChange={handleInputChange} required />
                <Input label="Tarif (€)" name="consultation_fee" type="number" step="0.01" value={form.consultation_fee} onChange={handleInputChange} />
                <Input label="Expérience" name="experience_years" type="number" value={form.experience_years} onChange={handleInputChange} />
                <Input label="Disponibilité" icon={Calendar} name="availability" value={form.availability} onChange={handleInputChange} />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" /> Clinique
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {doctors.find(d => d.id === editingId)?.clinique_name || "Non assignée"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsEditOpen(false); resetForm(); }}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Annuler
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg flex items-center gap-2">
                  Mettre à jour
                </motion.button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// === DOCTOR CARD ===
function DoctorCard({
  doctor,
  onEdit,
  onDelete,
}: {
  doctor: Doctor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Dr. {doctor.firstname} {doctor.lastname}
            </h3>
            <p className="text-sm text-teal-600 dark:text-teal-400">{doctor.speciality}</p>
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-300 hover:bg-blue-100">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 bg-red-50 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-300 hover:bg-red-100">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        {doctor.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {doctor.phone}</div>}
        <div className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {doctor.clinique_name || "Non affecté"}</div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
        Tarif: {doctor.consultation_fee} € • Exp: {doctor.experience_years} ans
      </div>
    </motion.div>
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
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// === INPUT ===
function Input({ label, icon: Icon, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-1" />}
        {label}
      </label>
      <input
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 transition"
        {...props}
      />
    </div>
  );
}