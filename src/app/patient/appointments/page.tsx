'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Search,
  Stethoscope,
  XCircle,
} from "lucide-react";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000") + "/api/";
const APPOINTMENTS_API = `${API_BASE}patient/appointments/`;

type PatientDoctor = {
  id: number;
  fullname?: string;
  firstname?: string;
  lastname?: string;
  speciality?: string;
  clinique_name?: string;
};

type PatientAppointment = {
  id: number;
  date: string;
  status: "PROGRAMME" | "TERMINE" | "ANNULE";
  motif?: string;
  notes?: string;
  doctor?: PatientDoctor | null;
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

const formatDate = (value?: string | Date | null, options?: Intl.DateTimeFormatOptions) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("fr-FR", options ?? { weekday: "long", day: "numeric", month: "long" });
};

const formatTime = (value?: string | Date | null) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const statusStyles: Record<
  PatientAppointment["status"],
  { label: string; badge: string; accent: string }
> = {
  PROGRAMME: {
    label: "Programmé",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    accent: "from-blue-50 to-indigo-50 border-blue-200",
  },
  TERMINE: {
    label: "Terminé",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accent: "from-emerald-50 to-lime-50 border-emerald-200",
  },
  ANNULE: {
    label: "Annulé",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    accent: "from-rose-50 to-red-50 border-rose-200",
  },
};

export default function PatientAppointmentsPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const [scope, setScope] = useState<"upcoming" | "past" | "all">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const now = new Date();

  const {
    data: appointmentsData = [],
    isLoading,
    error,
  } = useSWR<PatientAppointment[]>(accessToken ? [APPOINTMENTS_API, accessToken] : null, authedFetcher, {
    onError: (err) => toast.error(err.message),
  });

  const normalized = useMemo(() => {
    return appointmentsData
      .map((appointment) => {
        const dateObj = new Date(appointment.date);
        const doctorName =
          appointment.doctor?.fullname ||
          `${appointment.doctor?.firstname || ""} ${appointment.doctor?.lastname || ""}`.trim() ||
          "Médecin";
        return {
          ...appointment,
          doctorName,
          clinicName: appointment.doctor?.clinique_name || "Clinique",
          dateObj,
        };
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [appointmentsData]);

  const today = normalized.filter((appointment) => {
    const date = appointment.dateObj;
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const upcoming = normalized.filter((appointment) => appointment.dateObj >= now && appointment.status === "PROGRAMME");
  const past = normalized.filter((appointment) => appointment.dateObj < now || appointment.status !== "PROGRAMME");

  const filtered = useMemo(() => {
    let scoped = normalized;
    if (scope === "upcoming") scoped = upcoming;
    if (scope === "past") scoped = past;

    if (!searchQuery.trim()) {
      return scoped;
    }

    const q = searchQuery.toLowerCase();
    return scoped.filter((appointment) => {
      return (
        appointment.doctorName.toLowerCase().includes(q) ||
        appointment.clinicName.toLowerCase().includes(q) ||
        (appointment.motif || "").toLowerCase().includes(q)
      );
    });
  }, [normalized, upcoming, past, scope, searchQuery]);

  const summaryCards = [
    {
      label: "Aujourd'hui",
      value: today.length,
      description: "Consultations prévues",
    },
    {
      label: "À venir",
      value: upcoming.length,
      description: "Rendez-vous programmés",
    },
    {
      label: "Historique",
      value: past.length,
      description: "RDV terminés/annulés",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-[#0D9488] via-[#0C7E74] to-[#04524C] text-white p-8 shadow-[0_20px_60px_rgba(6,112,105,0.35)]">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">Espace patient</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-semibold">Mes rendez-vous</h1>
            <p className="text-white/80 mt-2 max-w-2xl">
              Retrouvez l&apos;ensemble de vos consultations programmées, passées ou annulées et gardez le contrôle sur votre calendrier médical.
            </p>
          </div>
          <Link
            href="/patient/doctors"
            className="inline-flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur px-5 py-3 text-sm font-semibold hover:bg-white/25 transition"
          >
            Planifier un rendez-vous
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl bg-white/15 p-4 border border-white/20">
              <p className="text-sm uppercase tracking-wide text-white/70">{card.label}</p>
              <p className="text-3xl font-semibold mt-2">{card.value}</p>
              <p className="text-sm text-white/70 mt-1">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#E6E0E0] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)] p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            {([
              { label: "À venir", value: "upcoming" },
              { label: "Historique", value: "past" },
              { label: "Tous", value: "all" },
            ] as const).map((tab) => {
              const active = scope === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setScope(tab.value)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold border transition ${
                    active ? "border-teal-600 text-teal-700 bg-teal-50" : "border-gray-200 text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher (médecin, clinique, motif...)"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 py-2 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <CalendarDays className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            Chargement de vos rendez-vous...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-6 text-center">
            Impossible de récupérer vos rendez-vous.
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
            Aucun rendez-vous à afficher pour ce filtre.
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((appointment) => {
            const styles = statusStyles[appointment.status];
            return (
              <div
                key={appointment.id}
                className={`p-5 rounded-2xl border bg-gradient-to-r ${styles.accent} transition hover:shadow-lg`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/70 px-5 py-3 text-center min-w-[110px]">
                      <span className="text-xs uppercase text-gray-500">Date</span>
                      <span className="text-lg font-semibold text-gray-900">{formatDate(appointment.dateObj, { weekday: "short", day: "numeric", month: "short" })}</span>
                      <span className="text-sm text-gray-600">{formatTime(appointment.dateObj)}</span>
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-teal-600" />
                        {appointment.doctorName}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4" />
                        {appointment.clinicName}
                      </p>
                      {appointment.motif && (
                        <p className="text-sm text-gray-500 mt-1">
                          Motif : <span className="font-medium text-gray-700">{appointment.motif}</span>
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-gray-500">Notes : {appointment.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className={`inline-flex items-center gap-2 px-4 py-1 rounded-full border text-sm font-semibold ${styles.badge}`}>
                      {appointment.status === "PROGRAMME" && <Clock className="w-4 h-4" />}
                      {appointment.status === "TERMINE" && <CheckCircle2 className="w-4 h-4" />}
                      {appointment.status === "ANNULE" && <XCircle className="w-4 h-4" />}
                      {styles.label}
                    </span>
                    <button
                      className="inline-flex items-center justify-center rounded-xl border border-teal-200 bg-white/70 px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm hover:bg-white"
                      disabled
                    >
                      Détails bientôt disponibles
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!!today.length && (
        <section className="rounded-3xl border border-[#E6E0E0] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-teal-600" />
              Aujourd&apos;hui
            </h2>
            <span className="text-sm font-semibold text-gray-500">{today.length} rendez-vous</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {today.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-gray-200 p-4">
                <p className="text-sm uppercase text-gray-500">{formatDate(appointment.dateObj, { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{formatTime(appointment.dateObj)}</p>
                <p className="text-sm text-gray-500 mt-2">{appointment.clinicName}</p>
                <p className="text-base font-semibold text-gray-900 flex items-center gap-2 mt-4">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  {appointment.doctorName}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


