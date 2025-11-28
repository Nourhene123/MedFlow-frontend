'use client';

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { Calendar, Loader2, MapPin, NotebookPen, Stethoscope, X } from "lucide-react";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000") + "/api/";
const CREATE_APPOINTMENT_API = `${API_BASE}appointments/create/`;
const AVAILABLE_SLOTS_API = `${API_BASE}appointments/available-slots/`;
const PAYMENT_INTENT_API = `${API_BASE}invoices/appointments/`;

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

type AvailabilitySlot = {
  time: string;
  label: string;
};

export type BookableDoctor = {
  id: number;
  fullname: string;
  firstname?: string;
  lastname?: string;
  speciality?: string;
  consultation_fee?: number;
  clinique_name?: string | null;
};

interface BookAppointmentModalProps {
  doctor: BookableDoctor;
  onClose: () => void;
  onBooked?: () => void;
}

const defaultErrors = {
  date: "",
  slot: "",
  motif: "",
};

export default function BookAppointmentModal({ doctor, onClose, onBooked }: BookAppointmentModalProps) {
  const { data: session } = useSession();
  const patientId = useMemo(() => {
    const rawId = session?.user?.id;
    if (!rawId) return null;
    const parsed = Number(rawId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [session?.user?.id]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [motif, setMotif] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState(defaultErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "payment">("form");
  const [paymentIntentLoading, setPaymentIntentLoading] = useState(false);
  const [appointmentSummary, setAppointmentSummary] = useState<{ id: number; date?: string } | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{ clientSecret: string; amount: string; currency: string } | null>(
    null
  );

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setSelectedSlot("");
      return;
    }

    const controller = new AbortController();
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setErrors((prev) => ({ ...prev, slot: "" }));
      try {
        const res = await fetch(
          `${AVAILABLE_SLOTS_API}?medecin=${doctor.id}&date=${selectedDate}`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          throw new Error("Impossible de charger les créneaux");
        }

        const data = await res.json();
        setAvailableSlots(data.slots || []);
        if (data.slots?.length === 0) {
          setSelectedSlot("");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          toast.error("Impossible de charger les créneaux disponibles.");
          setAvailableSlots([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();
    return () => controller.abort();
  }, [selectedDate, doctor.id, session?.accessToken]);

  const resetAndClose = () => {
    setStep("form");
    setSelectedDate("");
    setSelectedSlot("");
    setAvailableSlots([]);
    setMotif("");
    setNotes("");
    setErrors(defaultErrors);
    setAppointmentSummary(null);
    setPaymentInfo(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { ...defaultErrors };

    if (!patientId) {
      toast.error("Impossible de déterminer votre profil patient.");
      return;
    }

    if (!selectedDate) {
      newErrors.date = "Choisissez une date";
    }
    if (!selectedSlot) {
      newErrors.slot = "Sélectionnez un créneau horaire";
    }
    if (!motif.trim()) {
      newErrors.motif = "Le motif est requis";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patient_id: patientId,
        medecin_id: doctor.id,
        date: selectedSlot,
        motif: motif.trim(),
        notes: notes.trim(),
        status: "PROGRAMME",
      };

      const res = await fetch(CREATE_APPOINTMENT_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message = errorBody.detail || "Impossible de créer le rendez-vous.";
        throw new Error(message);
      }

      const data = await res.json();
      const createdAppointmentId = Number(data?.id);

      toast.success("Rendez-vous réservé avec succès.");
      onBooked?.();

      if (stripePromise && createdAppointmentId) {
        setAppointmentSummary({ id: createdAppointmentId, date: data?.date });
        await initiatePaymentIntent(createdAppointmentId);
        return;
      }

      resetAndClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inattendue.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiatePaymentIntent = async (appointmentId: number) => {
    if (!stripePromise) return;
    setPaymentIntentLoading(true);
    try {
      const res = await fetch(`${PAYMENT_INTENT_API}${appointmentId}/payment-intent/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.detail || "Impossible de préparer le paiement.");
      }

      const data = await res.json();
      if (!data?.client_secret) {
        throw new Error("Client secret introuvable.");
      }

      setPaymentInfo({
        clientSecret: data.client_secret,
        amount: data.amount,
        currency: data.currency,
      });
      setStep("payment");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur Stripe inattendue.";
      toast.error(message);
      resetAndClose();
    } finally {
      setPaymentIntentLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting && !paymentIntentLoading) {
          resetAndClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-600">Réservation</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {step === "payment" ? "Paiement du rendez-vous" : "Prendre rendez-vous"}
            </h2>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            disabled={isSubmitting || paymentIntentLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="grid gap-6 px-6 py-6 sm:px-8">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Médecin</p>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-teal-600" />
                  Dr {doctor.fullname || `${doctor.firstname || ""} ${doctor.lastname || ""}`.trim()}
                </p>
                <p className="text-sm text-slate-500">
                  {doctor.speciality || "Spécialité non renseignée"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  {doctor.clinique_name || "Clinique indisponible"}
                </div>
                {doctor.consultation_fee != null && (
                  <p className="mt-1 font-semibold text-slate-900">
                    {doctor.consultation_fee} DT la consultation
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div>
              <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date souhaitée
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setErrors((prev) => ({ ...prev, date: "" }));
                }}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.date ? "border-red-400" : "border-slate-200"
                }`}
              />
              {errors.date && <p className="mt-1 text-xs font-medium text-red-500">{errors.date}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">Créneau disponible</label>
              <div className="mt-2 min-h-[64px] rounded-xl border border-slate-200 p-3">
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                    Chargement des créneaux...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Sélectionnez une date pour voir les créneaux disponibles.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot.time}
                        onClick={() => {
                          setSelectedSlot(slot.time);
                          setErrors((prev) => ({ ...prev, slot: "" }));
                        }}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          selectedSlot === slot.time
                            ? "border-teal-600 bg-teal-600 text-white shadow"
                            : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.slot && <p className="mt-1 text-xs font-medium text-red-500">{errors.slot}</p>}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <NotebookPen className="h-4 w-4" />
                Motif de consultation
              </label>
              <input
                type="text"
                value={motif}
                onChange={(event) => {
                  setMotif(event.target.value);
                  setErrors((prev) => ({ ...prev, motif: "" }));
                }}
                placeholder="Ex : Douleurs, suivi, contrôle..."
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.motif ? "border-red-400" : "border-slate-200"
                }`}
              />
              {errors.motif && <p className="mt-1 text-xs font-medium text-red-500">{errors.motif}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">Notes supplémentaires</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Informations complémentaires pour votre médecin..."
              />
            </div>
          </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-110 disabled:opacity-60"
              >
                {isSubmitting ? "Réservation..." : "Confirmer le rendez-vous"}
              </button>
            </div>
          </form>
        )}

        {step === "payment" && (
          <div className="px-6 py-6 sm:px-8 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-500">Récapitulatif</p>
              <div className="flex flex-col gap-1 text-sm text-slate-600">
                <span>
                  Dr {doctor.fullname || `${doctor.firstname || ""} ${doctor.lastname || ""}`.trim()}
                </span>
                <span>{doctor.clinique_name || "Clinique non renseignée"}</span>
                {appointmentSummary?.date && (
                  <span>Date : {new Date(appointmentSummary.date).toLocaleString("fr-FR")}</span>
                )}
                {paymentInfo && (
                  <span className="text-base font-semibold text-slate-900">
                    Montant : {paymentInfo.amount} {paymentInfo.currency?.toUpperCase()}
                  </span>
                )}
              </div>
            </section>

            {paymentIntentLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center gap-3 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                Préparation du paiement...
              </div>
            )}

            {!paymentIntentLoading && stripePromise && paymentInfo?.clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: paymentInfo.clientSecret,
                  appearance: { theme: "stripe" },
                }}
              >
                <StripePaymentForm
                  amountLabel={`${paymentInfo.amount} ${paymentInfo.currency?.toUpperCase()}`}
                  onSuccess={() => {
                    toast.success("Paiement confirmé !");
                    onBooked?.();
                    resetAndClose();
                  }}
                  onSkip={() => {
                    toast.info("Paiement en ligne reporté. Vous pourrez payer depuis vos factures.");
                    resetAndClose();
                  }}
                />
              </Elements>
            )}

            {!stripePromise && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Stripe n&apos;est pas configuré. Merci de contacter l&apos;administrateur pour activer le paiement en ligne.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function StripePaymentForm({
  amountLabel,
  onSuccess,
  onSkip,
}: {
  amountLabel: string;
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);
  const { data: session } = useSession();

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      toast.error("Le système de paiement n'est pas disponible. Veuillez réessayer plus tard.");
      return;
    }

    setIsPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: typeof window !== "undefined" ? window.location.href : undefined,
          payment_method_data: {
            billing_details: {
              name: session?.user?.name || 'Client',
              email: session?.user?.email || '',
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        let errorMessage = "Le paiement a échoué. Veuillez réessayer.";
        if (error.type === "card_error" || error.type === "validation_error") {
          errorMessage = error.message || errorMessage;
        }
        toast.error(errorMessage, {
          description: "Veuillez vérifier vos informations de paiement et réessayer.",
          duration: 5000,
        });
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        toast.success("Paiement réussi !", {
          description: "Votre rendez-vous a été confirmé. Vous recevrez bientôt un email de confirmation.",
          duration: 5000,
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Erreur lors du traitement du paiement", {
        description: "Une erreur inattendue s'est produite. Veuillez réessayer ou contacter le support.",
        duration: 5000,
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <PaymentElement 
        options={{ 
          layout: "tabs",
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'auto',
              phone: 'auto',
            }
          }
        }} 
      />

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onSkip}
          disabled={isPaying}
          className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Payer plus tard
        </button>
        <button
          type="submit"
          disabled={isPaying || !stripe || !elements}
          className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {isPaying ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Traitement...
            </span>
          ) : (
            `Payer ${amountLabel}`
          )}
        </button>
      </div>
    </form>
  );
}