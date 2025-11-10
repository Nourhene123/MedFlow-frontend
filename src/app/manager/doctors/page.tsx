/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Search, Stethoscope, Mail, Phone, Edit, Trash2, Plus, X,
  Building2, User, Lock, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

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
  // availability: string;  ← SUPPRIMÉ
  clinique?: { id: number; name: string } | null;
  clinique_name?: string;
  is_active: boolean;
};

type Clinique = {
  id: number;
  name: string;
};

type Availability = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_per_slot: number;
};

// === CRÉNEAUX PAR DÉFAUT : Lun-Ven, 9h-12h + 14h-17h, 30 min ===
const defaultAvailabilities: Availability[] = [
  // Matin
  { day_of_week: 0, start_time: "09:00:00", end_time: "12:00:00", duration_per_slot: 30 },
  { day_of_week: 1, start_time: "09:00:00", end_time: "12:00:00", duration_per_slot: 30 },
  { day_of_week: 2, start_time: "09:00:00", end_time: "12:00:00", duration_per_slot: 30 },
  { day_of_week: 3, start_time: "09:00:00", end_time: "12:00:00", duration_per_slot: 30 },
  { day_of_week: 4, start_time: "09:00:00", end_time: "12:00:00", duration_per_slot: 30 },
  // Après-midi
  { day_of_week: 0, start_time: "14:00:00", end_time: "17:00:00", duration_per_slot: 30 },
  { day_of_week: 1, start_time: "14:00:00", end_time: "17:00:00", duration_per_slot: 30 },
  { day_of_week: 2, start_time: "14:00:00", end_time: "17:00:00", duration_per_slot: 30 },
  { day_of_week: 3, start_time: "14:00:00", end_time: "17:00:00", duration_per_slot: 30 },
  { day_of_week: 4, start_time: "14:00:00", end_time: "17:00:00", duration_per_slot: 30 },
];

// === CONFIG ===
const API_BASE = process.env.BACKEND_URL || 'http://localhost:8000/api/';
const DOCTOR_LIST_API   = `${API_BASE}accounts/list-medecins/`;
const DOCTOR_CREATE_API = `${API_BASE}accounts/create-medecin/`;
const CURRENT_USER_API  = `${API_BASE}accounts/current-user/`;

// === FETCHER ===
const makeFetcher = (token: string) => async (url: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 401) {
    toast.error("Session expirée");
    signOut({ callbackUrl: "/login" });
    return null;
  }
  if (!res.ok) throw new Error("Erreur API");
  return res.json();
};

// === COMPOSANT : PLANNING MÉDECIN ===
interface AvailabilitySchedulerProps {
  onChange: (availabilities: Availability[]) => void;
}

function AvailabilityScheduler({ onChange }: AvailabilitySchedulerProps) {
  const [availabilities, setAvailabilities] = useState<Availability[]>(defaultAvailabilities);
  const [selectedDay, setSelectedDay] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [duration, setDuration] = useState('30');

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Init avec créneaux par défaut
  useEffect(() => {
    onChange(defaultAvailabilities);
  }, [onChange]);

  const addSlot = () => {
    if (startTime >= endTime) {
      toast.error("L'heure de début doit être avant la fin");
      return;
    }
    const newSlot: Availability = {
      day_of_week: selectedDay,
      start_time: startTime + ':00',
      end_time: endTime + ':00',
      duration_per_slot: parseInt(duration),
    };
    const updated = [...availabilities, newSlot];
    setAvailabilities(updated);
    onChange(updated);
  };

  const removeSlot = (index: number) => {
    const updated = availabilities.filter((_, i) => i !== index);
    setAvailabilities(updated);
    onChange(updated);
  };

  return (
    <div className="md:col-span-2 space-y-4 p-4 border border-teal-200 dark:border-teal-700 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30">
      <h4 className="font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2">
        <Calendar className="w-5 h-5" /> Créneaux de consultation
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(parseInt(e.target.value))}
          className="px-3 py-2 border border-teal-300 dark:border-teal-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500"
        >
          {days.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="px-3 py-2 border border-teal-300 dark:border-teal-600 rounded-lg" />
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-2 border border-teal-300 dark:border-teal-600 rounded-lg" />
        <select value={duration} onChange={(e) => setDuration(e.target.value)} className="px-3 py-2 border border-teal-300 dark:border-teal-600 rounded-lg">
          <option value="15">15 min</option>
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">60 min</option>
        </select>
        <button
          type="button"
          onClick={addSlot}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center justify-center gap-1 transition"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {availabilities.length === 0 ? (
          <p className="text-sm text-teal-600 dark:text-teal-400 italic">Aucun créneau défini</p>
        ) : (
          availabilities.map((slot, i) => (
            <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="text-teal-600 dark:text-teal-400">{days[slot.day_of_week]}</span>
                <span>{slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)}</span>
                <span className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded">
                  {slot.duration_per_slot} min
                </span>
              </div>
              <button
                onClick={() => removeSlot(i)}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// === PAGE ===
export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [doctorAvailabilities, setDoctorAvailabilities] = useState<Availability[]>([]);
  const { data: session } = useSession();

  const fetcher = makeFetcher(session?.accessToken as string);

  const {
    data: doctors = [],
    isLoading: doctorsLoading,
    mutate: mutateDoctors,
  } = useSWR<Doctor[]>(DOCTOR_LIST_API, fetcher);

  const { data: currentUser } = useSWR<{ id: number; user_type: string }>(
    CURRENT_USER_API,
    fetcher
  );

  const managerId = currentUser?.id;
  const CLINICS_API = managerId 
    ? `${API_BASE}clinique/managers/${managerId}/clinics/`
    : null;

  const { 
    data: clinicsData = [], 
    isLoading: clinicsLoading 
  } = useSWR<Clinique[]>(
    CLINICS_API,
    fetcher
  );

  const managerClinic = clinicsData[0];

  const [form, setForm] = useState({
    email: "", password: "", firstname: "", lastname: "", phone: "",
    speciality: "", consultation_fee: "", experience_years: ""
  });

  const resetForm = () => {
    setForm({
      email: "", password: "", firstname: "", lastname: "", phone: "",
      speciality: "", consultation_fee: "", experience_years: ""
    });
    setDoctorAvailabilities(defaultAvailabilities); // ← Réinitialise avec défaut
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const filtered = doctors.filter(d =>
    `${d.firstname} ${d.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase()) ||
    d.speciality.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!managerClinic?.id) {
      toast.error("Aucune clinique trouvée. Impossible de créer le médecin.");
      return;
    }

    // Plus de validation → on envoie toujours les créneaux par défaut
    const payload = {
      email: form.email,
      password: form.password,
      firstname: form.firstname,
      lastname: form.lastname,
      phone: form.phone,
      speciality: form.speciality,
      consultation_fee: parseFloat(form.consultation_fee) || 0,
      experience_years: parseInt(form.experience_years) || 0,
      clinique: managerClinic.id,
      availabilities: doctorAvailabilities, // ← ENVOYÉ
    };

    try {
      const res = await fetch(DOCTOR_CREATE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details?.email?.[0]?.includes("already exists")) {
          toast.error("Cet email est déjà utilisé.");
        } else {
          toast.error(data.error || "Échec création");
        }
        return;
      }

      toast.success("Médecin créé avec succès");
      mutateDoctors();
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Erreur réseau");
    }
  };

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
      const res = await fetch(`${API_BASE}accounts/medecins/${editingId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
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

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce médecin ?")) return;

    try {
      await fetch(`${API_BASE}accounts/medecins/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
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

                {/* PLANNING AVEC CRÉNEAUX PAR DÉFAUT */}
                <AvailabilityScheduler onChange={setDoctorAvailabilities} />

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

      {/* EDIT MODAL (inchangé) */}
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

// === DOCTOR CARD, MODAL, INPUT (inchangés) ===
function DoctorCard({ doctor, onEdit, onDelete }: { doctor: Doctor; onEdit: () => void; onDelete: () => void }) {
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