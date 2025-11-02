'use client';

import { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import {
  Search, User, Mail, Phone, Calendar, Plus, Edit, Trash2, X,
  Building2, Heart, Shield, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// === CONFIG ===
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const PATIENT_LIST_API = `${API_BASE}/accounts/patients/`;
const PATIENT_CREATE_API = `${API_BASE}/accounts/create-patient/`;

// === FETCHER ===
const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "Content-Type": "application/json",
    },
  }).then(async (res) => {
    if (res.status === 401) {
      toast.error("Session expirée");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      return [];
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || "Erreur serveur");
    }
    return res.json();
  });

// === TYPES ===
type Patient = {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  blood_type: string;
  emergency_contact: string;
  insurance_provider: string;
  insurance_number: string;
  address: string;
  clinique?: { id: number; name: string } | null;
  clinique_name?: string;
};

type Clinic = {
  id: number;
  name: string;
};

type JWT = {
  user_id: number;
  user_type: string;
};

// === PAGE ===
export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [managerId, setManagerId] = useState<number | null>(null);

  // === RÉCUPÉRER LE MANAGER CONNECTÉ ===
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded: JWT = jwtDecode(token);
        if (decoded.user_type === "MANAGER") {
          setManagerId(decoded.user_id);
        } else {
          toast.error("Accès refusé");
          window.location.href = "/dashboard";
        }
      } catch (err) {
        console.error("Token invalide", err);
      }
    }
  }, []);

  // === CLINIQUES DU MANAGER ===
  const CLINICS_API = managerId ? `${API_BASE}/clinique/managers/${managerId}/clinics/` : null;
  const { data: cliniques = [], isLoading: cliniquesLoading, error: cliniquesError } = useSWR<Clinic[]>(
    CLINICS_API,
    fetcher,
    { revalidateOnFocus: false }
  );

  // === PATIENTS ===
  const { data: patients = [], mutate: refreshPatients } = useSWR<Patient[]>(
    PATIENT_LIST_API,
    fetcher
  );

  // === FORMULAIRE ===
  const [form, setForm] = useState({
    email: "", password: "", firstname: "", lastname: "", phone: "",
    gender: "", date_of_birth: "", blood_type: "", emergency_contact: "",
    insurance_provider: "", insurance_number: "", address: "", clinique_id: ""
  });

  // Pré-remplir avec la première clinique
  useEffect(() => {
    if (cliniques.length === 1) {
      setForm(prev => ({ ...prev, clinique_id: cliniques[0].id.toString() }));
    }
  }, [cliniques]);

  const resetForm = () => {
    setForm({
      email: "", password: "", firstname: "", lastname: "", phone: "",
      gender: "", date_of_birth: "", blood_type: "", emergency_contact: "",
      insurance_provider: "", insurance_number: "", address: "",
      clinique_id: cliniques.length === 1 ? cliniques[0].id.toString() : ""
    });
  };

  const openModal = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient);
      setForm({
        email: patient.email,
        password: "",
        firstname: patient.firstname,
        lastname: patient.lastname,
        phone: patient.phone || "",
        gender: patient.gender || "",
        date_of_birth: patient.date_of_birth || "",
        blood_type: patient.blood_type || "",
        emergency_contact: patient.emergency_contact || "",
        insurance_provider: patient.insurance_provider || "",
        insurance_number: patient.insurance_number || "",
        address: patient.address || "",
        clinique_id: patient.clinique?.id?.toString() || cliniques[0]?.id?.toString() || "",
      });
    } else {
      resetForm();
      setEditingPatient(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
    resetForm();
  };

  // === CREATE & UPDATE ===
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.clinique_id) {
      toast.error("Veuillez sélectionner une clinique");
      return;
    }

    const url = editingPatient
      ? `${API_BASE}/accounts/patients/${editingPatient.id}/`
      : PATIENT_CREATE_API;

    const method = editingPatient ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          ...form,
          clinique_id: form.clinique_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.email?.[0] || data.detail || "Échec";
        toast.error(errorMsg);
        return;
      }

      toast.success(editingPatient ? "Patient mis à jour" : "Patient créé");
      refreshPatients();
      closeModal();
    } catch (err) {
      toast.error("Erreur réseau");
    }
  };

  // === DELETE ===
  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce patient ?")) return;

    try {
      const res = await fetch(`${API_BASE}/accounts/patients/${id}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Échec suppression");
        return;
      }

      toast.success("Patient supprimé");
      refreshPatients();
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const filtered = patients.filter(p =>
    `${p.firstname} ${p.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  // === ERREUR CLINIQUES ===
  if (cliniquesError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <p className="text-red-800">Impossible de charger vos cliniques assignées.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {patients.length} patient{patients.length > 1 ? "s" : ""}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          disabled={cliniques.length === 0}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Ajouter un patient
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 transition"
        />
      </div>

      {/* Cards */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              {search ? "Aucun patient trouvé" : "Aucun patient enregistré"}
            </div>
          ) : (
            filtered.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 p-6 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-md">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {p.firstname} {p.lastname}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{p.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(p)}
                      className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-300 hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 bg-red-50 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-300 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {p.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {p.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {p.clinique_name || "Non assigné"}
                  </div>
                  {p.blood_type && (
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {p.blood_type}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <Modal
            title={editingPatient ? "Modifier le Patient" : "Nouveau Patient"}
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
                {!editingPatient && (
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
                  label="Adresse"
                  name="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <Input
                  label="Téléphone"
                  icon={Phone}
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Genre"
                  name="gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                />
                <Input
                  label="Date de naissance"
                  icon={Calendar}
                  name="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                />
                <Input
                  label="Groupe sanguin"
                  icon={Heart}
                  name="blood_type"
                  value={form.blood_type}
                  onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
                />
                <Input
                  label="Contact urgence"
                  name="emergency_contact"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                />
                <Input
                  label="Assurance"
                  name="insurance_provider"
                  value={form.insurance_provider}
                  onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })}
                />
                <Input
                  label="N° assurance"
                  name="insurance_number"
                  value={form.insurance_number}
                  onChange={(e) => setForm({ ...form, insurance_number: e.target.value })}
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500"
                    required
                    disabled={cliniquesLoading || cliniques.length === 0}
                  >
                    <option value="">
                      {cliniquesLoading
                        ? "Chargement..."
                        : cliniques.length === 0
                        ? "Aucune clinique assignée"
                        : "Sélectionner une clinique"}
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
                  disabled={cliniquesLoading || cliniques.length === 0}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {editingPatient ? "Mettre à jour" : "Créer"}
                </motion.button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

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
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 transition"
        {...props}
      />
    </div>
  );
}