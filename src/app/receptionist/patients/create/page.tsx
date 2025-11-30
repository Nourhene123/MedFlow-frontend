'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Shield,
  User,
  Phone,
  Calendar,
  Heart,
  Loader2,
  NotebookPen,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/';

const initialFormState = {
  email: '',
  password: '',
  firstname: '',
  lastname: '',
  address: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  blood_type: '',
  emergency_contact: '',
  insurance_provider: '',
  insurance_number: '',
  allergies: '',
  antecedents_familiaux: '',
  antecedents_personnels: '',
  traitements_en_cours: '',
  notes_importantes: '',
};

export default function CreatePatientPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE}accounts/create-patient/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          date_of_birth: form.date_of_birth || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(data?.details || data || {}).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            fieldErrors[key] = value[0] as string;
          }
        });
        setErrors(fieldErrors);
        toast.error(data.detail || data.error || 'Création impossible');
        return;
      }

      const patientId = data?.patient?.id;

      if (patientId) {
        const medicalPayload = {
          allergies: form.allergies.trim(),
          antecedents_familiaux: form.antecedents_familiaux.trim(),
          antecedents_personnels: form.antecedents_personnels.trim(),
          traitements_en_cours: form.traitements_en_cours.trim(),
          notes_importantes: form.notes_importantes.trim(),
        };

        const hasMedicalDetails = Object.values(medicalPayload).some((value) => value.length > 0);

        if (hasMedicalDetails) {
          const payload = Object.fromEntries(
            Object.entries(medicalPayload).filter(([, value]) => value.length > 0)
          );
          const medicalRes = await fetch(`${API_BASE}medical/medical-file/${patientId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (!medicalRes.ok) {
            toast.warning("Patient créé mais la fiche médicale n'a pas été enregistrée");
          }
        }
      }

      toast.success('Patient et fiche médicale créés avec succès');
      setForm(initialFormState);
      router.push('/receptionist/patients');
    } catch (error) {
      toast.error('Erreur réseau, réessayez');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/receptionist/patients"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la liste
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-wide text-emerald-500 font-semibold mb-2">
            Réceptionniste
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-emerald-500" />
            Nouveau patient
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Formulaire aligné avec l'expérience Manager : renseignez les mêmes informations détaillées.
          </p>
        </div>

        <form onSubmit={submitForm} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Email"
              icon={Mail}
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              required
              error={errors.email}
            />
            <Input
              label="Mot de passe"
              icon={Shield}
              name="password"
              type="password"
              value={form.password}
              onChange={handleInputChange}
              required
              error={errors.password}
            />
            <Input
              label="Prénom"
              icon={User}
              name="firstname"
              value={form.firstname}
              onChange={handleInputChange}
              required
              error={errors.firstname}
            />
            <Input
              label="Nom"
              icon={User}
              name="lastname"
              value={form.lastname}
              onChange={handleInputChange}
              required
              error={errors.lastname}
            />
            <Input
              label="Adresse"
              name="address"
              value={form.address}
              onChange={handleInputChange}
              error={errors.address}
            />
            <Input
              label="Téléphone"
              icon={Phone}
              name="phone"
              value={form.phone}
              onChange={handleInputChange}
              error={errors.phone}
            />
            <Input
              label="Genre"
              name="gender"
              value={form.gender}
              onChange={handleInputChange}
              error={errors.gender}
            />
            <Input
              label="Date de naissance"
              icon={Calendar}
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleInputChange}
              error={errors.date_of_birth}
            />
            <Input
              label="Groupe sanguin"
              icon={Heart}
              name="blood_type"
              value={form.blood_type}
              onChange={handleInputChange}
              error={errors.blood_type}
            />
            <Input
              label="Contact urgence"
              name="emergency_contact"
              value={form.emergency_contact}
              onChange={handleInputChange}
              error={errors.emergency_contact}
            />
            <Input
              label="Assurance"
              name="insurance_provider"
              value={form.insurance_provider}
              onChange={handleInputChange}
              error={errors.insurance_provider}
            />
            <Input
              label="N° assurance"
              name="insurance_number"
              value={form.insurance_number}
              onChange={handleInputChange}
              error={errors.insurance_number}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <NotebookPen className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Fiche médicale</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ajoutez les premières informations médicales du patient (optionnel).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Textarea
                label="Allergies"
                name="allergies"
                value={form.allergies}
                onChange={handleInputChange}
              />
              <Textarea
                label="Antécédents familiaux"
                name="antecedents_familiaux"
                value={form.antecedents_familiaux}
                onChange={handleInputChange}
              />
              <Textarea
                label="Antécédents personnels"
                name="antecedents_personnels"
                value={form.antecedents_personnels}
                onChange={handleInputChange}
              />
              <Textarea
                label="Traitements en cours"
                name="traitements_en_cours"
                value={form.traitements_en_cours}
                onChange={handleInputChange}
              />
            </div>

            <Textarea
              label="Notes importantes"
              name="notes_importantes"
              value={form.notes_importantes}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4">
            <Link
              href="/receptionist/patients"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TextareaProps = {
  label: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function Textarea({ label, ...props }: TextareaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <textarea
        className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition border-gray-300 dark:border-gray-700"
        {...props}
      />
    </div>
  );
}

type InputProps = {
  label: string;
  icon?: React.ElementType;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

function Input({ label, icon: Icon, error, ...props }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon className="w-4 h-4 inline mr-1" />}
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
