'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  patient_name: string;
  date: string;
  status: 'PROGRAMME' | 'TERMINE' | 'ANNULE';
  duration_minutes: number;
  patient_id: string;
  motif?: string;
}

// Fonction de formatage de date
const formatDate = (date: Date, formatStr: string) => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const daysShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const monthsShort = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
  
  const day = date.getDate();
  const dayName = days[date.getDay()];
  const dayShort = daysShort[date.getDay()];
  const month = months[date.getMonth()];
  const monthShort = monthsShort[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  if (formatStr === 'EEEE d MMMM yyyy') {
    return `${dayName} ${day} ${month} ${year}`;
  }
  if (formatStr === 'HH:mm') {
    return `${hours}:${minutes}`;
  }
  if (formatStr === 'EEE d MMM • HH:mm') {
    return `${dayShort} ${day} ${monthShort} • ${hours}:${minutes}`;
  }
  return `${dayName} ${day} ${month} ${year}`;
};

export default function DoctorAgendaPage() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.accessToken) {
      setError('Session non disponible');
      setLoading(false);
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      
      const cleanHost = backendUrl
        .replace(/^https?:\/\//, '')   
        .replace(/\/+$/, '');         

      const socketProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = `${socketProtocol}://${cleanHost}/ws/doctor/agenda/?token=${session.accessToken}`;

      console.log('Connexion WebSocket →', wsUrl);

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connecté !');
        setConnected(true);
        setError('');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'initial_data') {
          setAppointments(data.appointments || []);
          setLoading(false);
        }

        if (data.type === 'update') {
          const appt = data.appointment as Appointment;
          setAppointments((prev) => {
            const exists = prev.some((a) => a.id === appt.id);
            if (exists) {
              return prev
                .map((a) => (a.id === appt.id ? appt : a))
                .sort((a, b) => a.date.localeCompare(b.date));
            }
            return [...prev, appt].sort((a, b) => a.date.localeCompare(b.date));
          });
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket erreur', e);
        setError('Connexion perdue...');
        setConnected(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket fermé', event.code, event.reason);
        setConnected(false);
        wsRef.current = null;

        // RECONNEXION AUTOMATIQUE SI TOKEN TOUJOURS VALIDE
        if (!event.wasClean || event.code === 1006) {
          reconnectTimeout = setTimeout(() => {
            if (session?.accessToken) {
              console.log('Tentative de reconnexion...');
              connectWebSocket();
            }
          }, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      wsRef.current?.close();
    };
  }, [session?.accessToken, status]); // Reconnecte si le token change 

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROGRAMME': 
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'Programmé',
          icon: '📅'
        };
      case 'TERMINE': 
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          label: 'Terminé',
          icon: '✓'
        };
      case 'ANNULE': 
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          label: 'Annulé',
          icon: '✕'
        };
      default: 
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          label: status,
          icon: '•'
        };
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-xl font-medium text-slate-600">Chargement de votre agenda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Erreur de connexion</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-slate-500 space-y-1">
            <p>Session: {session ? '✓ Chargée' : '✗ Absente'}</p>
            <p>Token: {session?.accessToken ? '✓ Valide' : '✗ Manquant'}</p>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date.startsWith(today));
  const upcoming = appointments
    .filter(a => new Date(a.date) > new Date() && a.status === 'PROGRAMME')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .appt-card {
          transition: all 0.3s ease;
        }
        .appt-card:hover {
          transform: translateX(8px) scale(1.02);
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 animate-fadeInUp">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Mon Agenda Médical
              </h1>
              <p className="text-slate-500 text-lg">
                {formatDate(new Date(), 'EEEE d MMMM yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {connected ? (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-semibold text-sm">Synchronisé</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                  <span className="text-amber-700 font-semibold text-sm">Reconnexion...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Consultations du jour */}
          <div className="lg:col-span-2 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 card-hover">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Aujourd&apos;hui
                </h2>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold text-lg">
                  {todayAppointments.length} {todayAppointments.length === 1 ? 'consultation' : 'consultations'}
                </div>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-24 h-24 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xl text-slate-500 font-medium">Aucune consultation programmée</p>
                  <p className="text-slate-400 mt-2">Profitez de cette journée tranquille</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((appt, index) => {
                    const statusInfo = getStatusColor(appt.status);
                    return (
                      <button
                        key={appt.id}
                        onClick={() => router.push(`/doctor/consultations/${appt.id}`)}
                        className="w-full text-left appt-card animate-scaleIn"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className={`p-6 rounded-xl border-2 ${
                          appt.status === 'TERMINE'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:from-green-100 hover:to-emerald-100'
                            : appt.status === 'ANNULE'
                            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:from-blue-100 hover:to-indigo-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl shadow-md ${
                                appt.status === 'TERMINE' ? 'bg-green-600 text-white' :
                                appt.status === 'ANNULE' ? 'bg-red-600 text-white' :
                                'bg-blue-600 text-white'
                              }`}>
                                {formatDate(new Date(appt.date), 'HH:mm')}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <p className="text-xl font-bold text-slate-800">{appt.patient_name}</p>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {appt.duration_minutes} min
                                  </span>
                                  {appt.motif && (
                                    <>
                                      <span className="text-slate-400">•</span>
                                      <span>{appt.motif}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                              {appt.status === 'PROGRAMME' && (
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Rendez-vous à venir */}
          <div className="animate-slideInRight" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 card-hover">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Prochains rendez-vous
              </h2>
              {upcoming.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-slate-500 font-medium">Aucun RDV programmé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt, index) => (
                    <div
                      key={appt.id}
                      className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 hover:from-indigo-100 hover:to-blue-100 transition-all cursor-pointer animate-scaleIn"
                      style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
                      onClick={() => router.push(`/doctor/consultations/${appt.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                          {appt.patient_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{appt.patient_name}</p>
                          <p className="text-sm text-indigo-700 font-medium">
                            {formatDate(new Date(appt.date), 'EEE d MMM • HH:mm')}
                          </p>
                        </div>
                      </div>
                      {appt.motif && (
                        <p className="text-xs text-slate-600 bg-white/60 px-3 py-1 rounded-full inline-block">
                          {appt.motif}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Statistiques */}
            <div className="mt-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white card-hover animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistiques
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Total aujourd&apos;hui</span>
                  <span className="text-2xl font-bold">{todayAppointments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">À venir</span>
                  <span className="text-2xl font-bold">{upcoming.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Terminées</span>
                  <span className="text-2xl font-bold">
                    {todayAppointments.filter(a => a.status === 'TERMINE').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}