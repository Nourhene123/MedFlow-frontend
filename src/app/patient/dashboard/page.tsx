'use client';

import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { FlaskConical, CalendarDays, CreditCard, FileText, ArrowRight, Stethoscope } from "lucide-react";
import { useSession } from "next-auth/react";

import DoctorCard from "../components/DoctorCard";
import AppointmentCard from "../components/AppointmentCard";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000") + "/api/";
const PATIENT_BASE = `${API_BASE}patient/`;
const APPOINTMENTS_API = `${PATIENT_BASE}appointments/`;
const DOCTORS_API = `${PATIENT_BASE}doctors/`;
const ANALYSES_API = `${PATIENT_BASE}analyses/`;
const INVOICES_API = `${PATIENT_BASE}invoices/`;
const PROFILE_API = `${PATIENT_BASE}profile/`;

type PatientDoctor = {
  id: number;
  firstname: string;
  lastname: string;
  fullname: string;
  speciality: string;
  consultation_fee: number;
  experience_years: number;
  availability: string;
  clinique_name: string | null;
};

type PatientAppointment = {
  id: number;
  date: string;
  status: string;
  notes: string;
  symptoms: string;
  diagnosis: string;
  duration_minutes: number;
  room_number: string;
  doctor: PatientDoctor | null;
};

type PatientInvoice = {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  payment_date: string | null;
  payment_method: string;
  description: string;
  consultation_date: string | null;
  doctor_fullname: string | null;
};

type PatientAnalysis = {
  id: number;
  consultation_date: string;
  doctor: PatientDoctor | null;
  content: string;
  pdf_url: string;
  valid_until: string | null;
  created_at: string;
};

type PatientProfile = {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  gender: string;
  address: string;
  date_of_birth: string | null;
  blood_type: string;
  emergency_contact: string;
  insurance_provider: string;
  insurance_number: string;
  fiche_medicale: {
    taille: number | null;
    poids: number | null;
    allergies: string;
    antecedents_medicaux: string;
    groupe_sanguin: string;
    notes: string;
    updated_at: string;
  } | null;
};

type FetchKey = [string, string];

const authedFetcher = async ([url, token]: FetchKey) => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.detail || errorBody.error || "Erreur serveur";
    throw new Error(message);
  }

  return res.json();
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
};

const formatTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const calculateAge = (dateOfBirth?: string | null) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
};

export default function PatientDashboard() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const {
    data: appointmentsData = [],
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useSWR<PatientAppointment[]>(accessToken ? [APPOINTMENTS_API, accessToken] : null, authedFetcher, {
    onError: (err) => toast.error(err.message),
  });

  const {
    data: doctorsData = [],
    isLoading: doctorsLoading,
  } = useSWR<PatientDoctor[]>(accessToken ? [DOCTORS_API, accessToken] : null, authedFetcher, {
    onError: (err) => toast.error(err.message),
  });

  const {
    data: analysesData = [],
  } = useSWR<PatientAnalysis[]>(accessToken ? [ANALYSES_API, accessToken] : null, authedFetcher, {
    onError: (err) => toast.error(err.message),
  });

  const {
    data: invoicesData = [],
  } = useSWR<PatientInvoice[]>(accessToken ? [INVOICES_API, accessToken] : null, authedFetcher, {
    onError: (err) => toast.error(err.message),
  });

  const { data: profileData } = useSWR<PatientProfile>(accessToken ? [PROFILE_API, accessToken] : null, authedFetcher, {
    onError: (err) => toast.error(err.message),
  });

  const appointments = appointmentsData.map((appointment) => ({
    id: appointment.id,
    date: formatDate(appointment.date),
    time: formatTime(appointment.date),
    doctor: appointment.doctor?.fullname || "Médecin",
    clinic: appointment.doctor?.clinique_name || "Clinique",
  }));

  const invoices = invoicesData.map((invoice) => ({
    id: invoice.id,
    number: `#${invoice.id}`,
    amount: invoice.amount?.toFixed(2) ?? "0.00",
    date: formatDate(invoice.created_at),
  }));

  const analyses = analysesData.map((analysis) => ({
    id: analysis.id,
    doctor: analysis.doctor?.fullname || "Médecin",
    createdAt: formatDate(analysis.created_at),
    content: analysis.content || "Rapport médical",
    pdfUrl: analysis.pdf_url,
  }));

  const age = useMemo(() => calculateAge(profileData?.date_of_birth), [profileData?.date_of_birth]);
  const userInitial = (profileData?.firstname?.[0] || session?.user?.firstname?.[0] || session?.user?.name?.[0] || "P").toUpperCase();
  const userName = profileData
    ? `${profileData.firstname || ""} ${profileData.lastname || ""}`.trim() || session?.user?.name || "Patient"
    : session?.user?.name || "Patient";
  const userEmail = profileData?.email || session?.user?.email || "";
  const userPhone = profileData?.phone || "Non renseigné";
  const userGender = profileData?.gender || "Non renseigné";

  const nextAppointment = appointments[0];

  const statsHighlights = [
    { label: 'RDV à venir', value: appointments.length, icon: CalendarDays },
    { label: 'Factures', value: invoices.length, icon: CreditCard },
    { label: 'Analyses', value: analyses.length, icon: FlaskConical },
  ];

  const quickActions = [
    { href: '/patient/doctors', label: 'Trouver un médecin', icon: Stethoscope },
    { href: '/patient/analyses', label: 'Voir mes analyses', icon: FlaskConical },
    { href: '/patient/factures', label: 'Suivre mes paiements', icon: CreditCard },
    { href: '/patient/parametres', label: 'Mettre à jour mon profil', icon: FileText },
  ];

  return (
    <div className="max-w-[1204px] mx-auto space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D9488] via-[#0B7F75] to-[#04524C] text-white p-8 shadow-[0_35px_80px_rgba(13,148,136,0.35)]">
        <div className="absolute inset-y-0 -right-10 w-64 bg-white/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Espace patient</p>
            <h1 className="text-3xl lg:text-4xl font-semibold mt-2">Bonjour, {userName || 'Patient'}</h1>
            <p className="text-white/80 mt-2 max-w-2xl">
              Gérez vos rendez-vous, vos factures et vos documents médicaux depuis un espace fluide et sécurisé.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,1fr)]">
            <div className="rounded-2xl bg-white/15 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-white/70 text-sm uppercase tracking-wide">
                <CalendarDays className="w-5 h-5" />
                Prochain rendez-vous
              </div>
              {nextAppointment ? (
                <div className="flex flex-col gap-1">
                  <p className="text-xl font-semibold">{nextAppointment.date}</p>
                  <p className="text-white/80">{nextAppointment.time} • {nextAppointment.doctor}</p>
                  <p className="text-white/60 text-sm">{nextAppointment.clinic}</p>
                </div>
              ) : (
                <p className="text-white/80">Vous n avez pas de rendez-vous programme.</p>
              )}
              <Link
                href="/patient/appointments"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
              >
                Gérer mes rendez-vous <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {statsHighlights.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <Icon className="w-5 h-5 text-white/80" />
                  <p className="text-2xl font-semibold mt-3">{value}</p>
                  <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {quickActions.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
              >
                <Icon className="w-4 h-4" />
                {label}
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#E7E2E2] bg-white/90 shadow-[0_20px_45px_rgba(15,23,42,0.08)] p-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex px-6 py-2 justify-center items-center rounded-[15px] bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#00746E] shadow-[0_6px_10px_0_#68BA7F]">
                <h2 className="text-white text-xl font-bold">Prochains RDV</h2>
              </div>
            </div>

            <div className="space-y-4">
              {appointmentsLoading ? (
                <p className="text-center text-sm text-gray-500">Chargement des rendez-vous...</p>
              ) : appointments.length > 0 ? (
                appointments.map((apt) => <AppointmentCard key={apt.id} {...apt} />)
              ) : (
                <p className="text-center text-sm text-gray-500">Aucun rendez-vous prévu.</p>
              )}
              {appointmentsError && (
                <p className="text-center text-sm text-red-500">Impossible de charger les rendez-vous.</p>
              )}
            </div>

            <div className="flex justify-center mt-6">
              <Link
                href="/patient/appointments"
                className="px-8 py-2 rounded-[10px] bg-[#68BA7F] shadow-[0_15px_30px_rgba(104,186,127,0.35)] text-[#FEFEFE] text-[15px] font-medium hover:bg-[#5AA970] transition-colors"
              >
                Planifier un rendez-vous
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E6E0E0] bg-white/90 shadow-[0_20px_45px_rgba(15,23,42,0.08)] p-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex px-6 py-2 justify-center items-center rounded-[15px] bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#00746E] shadow-[0_6px_10px_0_#68BA7F]">
                <h2 className="text-white text-xl font-bold">Factures</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#B4AEAE]">
                    <th className="text-left py-4 px-3 text-xl font-medium text-[#8B8181]">
                      Invoice #
                    </th>
                    <th className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                      Montant (DT)
                    </th>
                    <th className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-[#B4AEAE]">
                        <td className="py-4 px-3 text-xl font-medium text-[#8B8181]">
                          {invoice.number}
                        </td>
                        <td className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                          {invoice.amount}
                        </td>
                        <td className="text-center py-4 px-3 text-xl font-medium text-[#8B8181]">
                          {invoice.date || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-sm text-gray-500">
                        Aucune facture disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E6E0E0] bg-white/90 shadow-[0_20px_45px_rgba(15,23,42,0.08)] p-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex px-6 py-2 justify-center items-center rounded-[15px] bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#00746E] shadow-[0_6px_10px_0_#68BA7F]">
                <h2 className="text-white text-xl font-bold">Rapport Médicaux</h2>
              </div>
            </div>

            <div className="space-y-4">
              {analyses.length > 0 ? (
                analyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="w-[30px] h-[30px] text-black" />
                      <div>
                        <p className="text-[15px] font-bold text-black">{analysis.content}</p>
                        <p className="text-xs text-[#8B8181]">
                          {analysis.doctor} • {analysis.createdAt}
                        </p>
                      </div>
                    </div>
                    {analysis.pdfUrl ? (
                      <a
                        href={analysis.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-1 rounded-[5px] bg-gradient-to-b from-[#68BA7F] to-[#2F5439] text-[#FFFBFB] text-[15px] font-bold hover:from-[#5AA970] hover:to-[#254432] transition-colors"
                      >
                        Ouvrir
                      </a>
                    ) : (
                      <button
                        className="px-6 py-1 rounded-[5px] bg-gradient-to-b from-[#68BA7F] to-[#2F5439] text-[#FFFBFB] text-[15px] font-bold opacity-60 cursor-default"
                        disabled
                      >
                        Indisponible
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-6">
                  <img src="/images/medical-report.svg" alt="Medical Report" className="w-24 h-24 mb-4" />
                  <p className="text-center text-sm text-gray-500">Aucun rapport médical disponible.</p>
                  <button
                    className="px-6 py-1 rounded-[10px] bg-[#68BA7F] shadow-[0_15px_30px_rgba(104,186,127,0.35)] text-[#FEFEFE] text-[15px] font-medium hover:bg-[#5AA970] transition-colors"
                  >
                    Demander un rapport médical
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl lg:text-[30px] font-extrabold text-[#7D7777] text-center mb-4">
              Doctors
            </h2>
            <div className="border border-[#C6C2C2] rounded-[24px] bg-white/90 shadow-[0_20px_45px_rgba(15,23,42,0.08)] p-4 max-h-[754px] overflow-y-auto space-y-4">
              {doctorsLoading ? (
                <p className="text-center text-sm text-gray-500">Chargement des médecins…</p>
              ) : doctorsData.length > 0 ? (
                doctorsData.slice(0, 6).map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    name={doctor.fullname || `${doctor.firstname} ${doctor.lastname}`}
                    specialty={doctor.speciality}
                    clinic={doctor.clinique_name || ""}
                  />
                ))
              ) : (
                <p className="text-center text-sm text-gray-500">Aucun médecin associé.</p>
              )}
              <div className="flex justify-center pt-2">
                <a
                  href="/patient/doctors"
                  className="px-6 py-1 rounded-[10px] bg-[#68BA7F] shadow-[0_15px_30px_rgba(104,186,127,0.35)] text-[#FEFEFE] text-[15px] font-medium hover:bg-[#5AA970] transition-colors"
                >
                  Voir tout
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E6E0E0] bg-white/90 shadow-[0_20px_45px_rgba(15,23,42,0.08)] p-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex px-6 py-2 justify-center items-center rounded-[15px] bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#00746E] shadow-[0_6px_10px_0_#68BA7F]">
                <h2 className="text-white text-xl font-bold">Mes Informations</h2>
              </div>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="w-[108px] h-[100px] rounded-full bg-gradient-to-br from-teal-primary to-teal-dark flex items-center justify-center mb-2">
                <span className="text-white text-5xl font-bold">{userInitial}</span>
              </div>
              <h3 className="text-xl font-bold text-black">{userName}</h3>
              <p className="text-xl font-medium text-[#8F8C8C]">
                {age !== null ? `${age} ans` : "Âge non renseigné"}
              </p>
            </div>

            <div className="border border-[#CDC8C8] bg-[#FEFBFB] divide-y divide-[#E5DFDF]">
              <div className="flex items-center py-3 px-4">
                <span className="text-xl font-medium text-black w-32">Genre</span>
                <span className="text-xl font-medium text-black ml-auto">{userGender}</span>
              </div>
              <div className="flex items-center py-3 px-4">
                <span className="text-xl font-medium text-black w-32">Téléphone</span>
                <span className="text-xl font-medium text-black ml-auto">{userPhone}</span>
              </div>
              <div className="flex items-center py-3 px-4">
                <span className="text-xl font-medium text-black w-32">Mail</span>
                <span className="text-[15px] font-medium text-black ml-auto">{userEmail}</span>
              </div>
              {profileData?.blood_type && (
                <div className="flex items-center py-3 px-4">
                  <span className="text-xl font-medium text-black w-32">Groupe sanguin</span>
                  <span className="text-[15px] font-medium text-black ml-auto">{profileData.blood_type}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

