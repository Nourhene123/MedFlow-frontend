import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { User, Calendar, Clock, Pill } from "lucide-react";

type ConsultationStatus = "COMPLETED" | "IN_PROGRESS" | "SCHEDULED" | "CANCELLED";

type Consultation = {
  id: number;
  patient_name: string;
  medecin_name: string;
  date: string;
  duration_minutes: number;
  status: ConsultationStatus;
  ordonnance_exists: boolean;
};

export function ConsultationCard({ consultation }: { consultation: Consultation }) {
  const statusMap: Record<ConsultationStatus, { label: string; color: string }> = {
    COMPLETED: { label: "Terminée", color: "bg-green-100 text-green-700" },
    IN_PROGRESS: { label: "En cours", color: "bg-yellow-100 text-yellow-700" },
    SCHEDULED: { label: "Planifiée", color: "bg-teal-100 text-teal-700" },
    CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-700" },
  };

  const status = statusMap[consultation.status];

  return (
    <Link href={`/consultations/${consultation.id}`} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{consultation.patient_name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dr. {consultation.medecin_name}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(consultation.date), "dd MMM HH:mm")}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {consultation.duration_minutes} min
          </div>
          {consultation.ordonnance_exists && (
            <div className="flex items-center gap-1 text-teal-600">
              <Pill className="w-4 h-4" />
              Ordonnance
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
