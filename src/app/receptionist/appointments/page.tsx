'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { fr } from 'date-fns/locale';
import {
  Calendar, Clock, Stethoscope, Search, ChevronLeft, ChevronRight,
  Plus, Edit, Trash2, X, Loader2, Check, AlertCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast, Toaster } from 'sonner';
import {
  format, startOfMonth, endOfMonth, isSameMonth, isSameDay,
  addMonths, subMonths
} from 'date-fns';

// === CONFIG ===
const API_BASE = 'http://127.0.0.1:8000/api/';

// === NOTIFICATIONS ===
const notify = (type: 'success' | 'error', message: string) => {
  toast[type](message, {
    style: { borderRadius: '12px', background: '#333', color: '#fff' },
    icon: type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />
  });
};

// === FORMATAGE DATE ===
const formatDate = (dateStr: string | null | undefined, formatStr: string): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '—' : format(date, formatStr);
};

// === TYPES ===
interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  phone?: string;
}

interface Doctor {
  id: number;
  firstname: string;
  lastname: string;
  speciality?: string;
}

interface Appointment {
  id?: number;
  patient: Patient;
  medecin: Doctor;
  date: string;
  motif: string;
  notes?: string;
  status: string;
  status_display?: string;
}

interface Slot {
  time: string;
  label: string;
}

// === MODALE RDV ===
interface AppointmentModalProps {
  appointment?: Appointment;
  onClose: () => void;
  mutate: () => void;
}

function AppointmentModal({ appointment, onClose, mutate }: AppointmentModalProps) {
  const { data: session } = useSession();
  const isEdit = !!appointment;

  const [formData, setFormData] = useState({
    patient_id: appointment?.patient?.id?.toString() || '',
    medecin_id: appointment?.medecin?.id?.toString() || '',
    date: appointment?.date || '',
    motif: appointment?.motif || '',
    notes: appointment?.notes || '',
    status: appointment?.status || 'PROGRAMME',
  });

  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
      },
    }).then(res => {
      if (!res.ok) throw new Error('Erreur réseau');
      return res.json();
    });

  const { data: patientsData = { patients: [] }, isLoading: loadingPatients } = useSWR<{ patients: Patient[] }>(
    `${API_BASE}accounts/patients/by-clinique/`,
    fetcher
  );
  const patients = patientsData.patients || [];

  const { data: doctors = [], isLoading: loadingDoctors } = useSWR<Doctor[]>(
    `${API_BASE}accounts/medecins/by-clinique/`,
    fetcher
  );

  const isLoading = loadingPatients || loadingDoctors;

  // === CHARGER CRÉNEAUX ===
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `${API_BASE}appointments/available-slots/?medecin=${selectedDoctor}&date=${selectedDate}`,
          {
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          }
        );
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      } catch {
        notify('error', 'Erreur chargement créneaux');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDoctor, selectedDate, session?.accessToken]);

  // === GESTION CHANGEMENTS ===
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'medecin_id') {
      setSelectedDoctor(value);
      setFormData(prev => ({ ...prev, date: '' }));
      setAvailableSlots([]);
    }
    if (name === 'date' && value.length === 10) {
      setSelectedDate(value);
    }

    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // === VALIDATION ===
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.patient_id) newErrors.patient_id = 'Patient requis';
    if (!formData.medecin_id) newErrors.medecin_id = 'Médecin requis';
    if (!formData.date) newErrors.date = 'Date et heure requises';
    else if (selectedDoctor && selectedDate) {
      const timeOnly = formData.date.split('T')[1];
      const dateOnly = formData.date.split('T')[0];
      if (!availableSlots.some(s => s.time.includes(dateOnly) && s.time.includes(timeOnly))) {
        newErrors.date = 'Créneau non disponible';
      }
    }
    if (!formData.motif) newErrors.motif = 'Motif requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === SOUMISSION ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `${API_BASE}appointments/${appointment!.id}/update/`
        : `${API_BASE}appointments/create/`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur serveur');
      }

      notify('success', isEdit ? 'RDV modifié !' : 'RDV créé !');
      onClose();
      mutate();
    } catch (error: any) {
      notify('error', error.message || 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Modifier le RDV' : 'Nouveau Rendez-vous'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.patient_id ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            >
              <option value="">{isLoading ? 'Chargement...' : 'Sélectionner un patient'}</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstname} {p.lastname} ({p.phone || '—'})
                </option>
              ))}
            </select>
            {errors.patient_id && <p className="mt-1 text-sm text-red-600">{errors.patient_id}</p>}
          </div>

          {/* Médecin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Médecin <span className="text-red-500">*</span>
            </label>
            <select
              name="medecin_id"
              value={formData.medecin_id}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.medecin_id ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            >
              <option value="">{isLoading ? 'Chargement...' : 'Sélectionner un médecin'}</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.firstname} {d.lastname} - {d.speciality || 'Généraliste'}
                </option>
              ))}
            </select>
            {errors.medecin_id && <p className="mt-1 text-sm text-red-600">{errors.medecin_id}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date.split('T')[0] || ''}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            />
          </div>

          {/* Créneaux */}
          {selectedDoctor && selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Heure disponible <span className="text-red-500">*</span>
              </label>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-orange-600">Aucun créneau disponible</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, date: slot.time }));
                        setErrors(prev => ({ ...prev, date: '' }));
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        formData.date === slot.time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motif <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="motif"
              value={formData.motif}
              onChange={handleChange}
              placeholder="Ex: Consultation générale"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.motif ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            />
            {errors.motif && <p className="mt-1 text-sm text-red-600">{errors.motif}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="PROGRAMME">Programmé</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading || loadingSlots}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEdit ? 'Modification...' : 'Création...'}
                </>
              ) : (
                isEdit ? 'Modifier' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// === PAGE PRINCIPALE ===
export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const itemsPerPage = 10;

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Erreur réseau');
    return res.json();
  };

  const { data: paginatedData, isLoading, mutate } = useSWR(
    `${API_BASE}appointments/list/?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&date=${selectedDate}&status=${statusFilter}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const appointments: Appointment[] = paginatedData?.results || [];
  const totalItems = paginatedData?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await fetch(`${API_BASE}appointments/${id}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      notify('success', 'RDV supprimé');
      mutate();
    } catch {
      notify('error', 'Erreur lors de la suppression');
    }
  };

  // === CALENDRIER ===
  const CalendarView = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days: Date[] = [];
    const current = new Date(monthStart);
    while (current <= monthEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const appointmentsByDate = useMemo(() => {
      const map: Record<string, Appointment[]> = {};
      appointments.forEach(appt => {
        const key = format(new Date(appt.date), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(appt);
      });
      return map;
    }, [appointments]);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{(format as any)(currentMonth, 'MMMM yyyy', { locale: fr })}</h3>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 mt-2">
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayAppts = appointmentsByDate[key] || [];
            const isToday = isSameDay(day, today);
            const isCurrent = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toString()}
                className={`min-h-24 p-2 rounded-lg border ${
                  isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                } ${!isCurrent && 'opacity-40'}`}
              >
                <div className="text-sm font-medium">{format(day, 'd')}</div>
                <div className="text-xs space-y-1 mt-1">
                  {dayAppts.slice(0, 3).map(appt => (
                    <div key={appt.id} className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded text-xs truncate">
                      {appt.patient.firstname} - {formatDate(appt.date, 'HH:mm')}
                    </div>
                  ))}
                  {dayAppts.length > 3 && <div className="text-xs text-gray-500">+{dayAppts.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 p-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rendez-vous</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gérez le planning des consultations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {viewMode === 'list' ? 'Vue Calendrier' : 'Vue Liste'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Nouveau RDV
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="PROGRAMME">Programmé</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
        </div>

        {/* Contenu */}
        {viewMode === 'list' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun rendez-vous trouvé</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Médecin</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date & Heure</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {appointments.map(appt => (
                        <tr key={appt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                                {appt.patient.firstname[0] || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {appt.patient.firstname} {appt.patient.lastname}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{appt.patient.phone || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-indigo-600" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                Dr. {appt.medecin.firstname} {appt.medecin.lastname}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900 dark:text-white">{formatDate(appt.date, 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(appt.date, 'HH:mm')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              appt.status === 'PROGRAMME' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : appt.status === 'TERMINE' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : appt.status === 'ANNULE' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {appt.status_display || appt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditingAppointment(appt); setShowModal(true); }}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(appt.id!)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} sur {totalPages} ({totalItems} RDV)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <CalendarView />
        )}

        {/* Modale */}
        {showModal && (
          <AppointmentModal
            appointment={editingAppointment || undefined}
            onClose={() => {
              setShowModal(false);
              setEditingAppointment(null);
            }}
            mutate={mutate}
          />
        )}
      </div>
    </>
  );
}