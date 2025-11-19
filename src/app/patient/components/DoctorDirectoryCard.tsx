import { CalendarDays, MapPin, Stethoscope, Clock3, Star, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilitySlot {
  day_label: string;
  start_time: string;
  end_time: string;
  duration_per_slot: number;
}

interface DoctorDirectoryCardProps {
  name: string;
  specialty: string;
  clinic: string;
  consultationFee: string;
  yearsOfExperience: number;
  availability?: AvailabilitySlot[];
  className?: string;
  onBookClick?: () => void;
  onMessageClick?: () => void;
}

export default function DoctorDirectoryCard({
  name,
  specialty,
  clinic,
  consultationFee,
  yearsOfExperience,
  availability = [],
  className,
  onBookClick,
  onMessageClick,
}: DoctorDirectoryCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        "overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.12)]",
        className
      )}
    >
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Stethoscope className="h-3.5 w-3.5" />
              Disponible pour rendez-vous
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">{name}</h3>
            <p className="text-sm font-medium text-slate-500">{specialty}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
              <MapPin className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Clinique</p>
                <p className="font-semibold text-slate-800">{clinic || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
              <Clock3 className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Tarif</p>
                <p className="font-semibold text-slate-800">{consultationFee}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
              <Star className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Expérience</p>
                <p className="font-semibold text-slate-800">{yearsOfExperience} ans</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarDays className="h-4 w-4 text-teal-500" />
            Disponibilités récentes
          </div>
          {availability.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
              Aucun créneau disponible pour le moment.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availability.slice(0, 6).map((slot, idx) => (
                <div
                  key={`${slot.day_label}-${idx}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {slot.day_label}
                  </p>
                  <p className="font-semibold text-slate-800">
                    {slot.start_time} - {slot.end_time}
                  </p>
                  <p className="text-xs text-slate-500">Intervalle {slot.duration_per_slot} min</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onBookClick}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-110"
          >
            <CalendarDays className="h-4 w-4" />
            Prendre rendez-vous
          </button>
          <button
            onClick={onMessageClick}
            className="inline-flex min-w-[180px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-600"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter
          </button>
        </div>
      </div>
    </div>
  );
}
