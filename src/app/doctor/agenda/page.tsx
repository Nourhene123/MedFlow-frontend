'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';

interface Appointment {
  id: string;
  patient_name: string;
  date: string;
  status: 'PROGRAMME' | 'TERMINE' | 'ANNULE';
  duration_minutes: number;
  patient_id: string;
}


 export default function DoctorAgendaPage() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  // CETTE LIGNE CORRIGÉE (elle enlève http/https + les slashes en trop)
  const cleanHost = backendUrl
    .replace(/^https?:\/\//, '')   
    .replace(/\/+$/, '');         

  const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${cleanHost}/ws/doctor/agenda/?token=${session.accessToken}`;

  console.log('Connexion WebSocket →', wsUrl);

  ws = new WebSocket(wsUrl);


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
        const appt = data.appointment;
        setAppointments(prev => {
          const exists = prev.some(a => a.id === appt.id);
          if (exists) {
            return prev.map(a => a.id === appt.id ? appt : a);
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
    clearTimeout(reconnectTimeout);
    if (ws) ws.close();
  };
}, [session?.accessToken, status]); // Reconnecte si le token change 
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROGRAMME': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TERMINE': return 'bg-green-100 text-green-800 border-green-200';
      case 'ANNULE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PROGRAMME': return 'Programmé';
      case 'TERMINE': return 'Terminé';
      case 'ANNULE': return 'Annulé';
      default: return status;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-gray-500 mt-2">
          Session: {session ? 'Chargée' : 'Absente'} | Token: {session?.accessToken ? 'OK' : 'Manquant'}
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date.startsWith(today));
  const upcoming = appointments
    .filter(a => new Date(a.date) > new Date() && a.status === 'PROGRAMME')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 border">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Calendar className="w-7 h-7 text-blue-600" />
            Mon Agenda
          </h1>
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">En direct</span>
              </>
            ) : (
              <span className="text-gray-500">Hors ligne</span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {format(new Date(), 'EEEE d MMMM yyyy')}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Consultations du jour ({todayAppointments.length})
            </h2>
            {todayAppointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune consultation aujourd'hui</p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map(appt => (
                  <div key={appt.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-mono">{format(new Date(appt.date), 'HH:mm')}</div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {appt.patient_name}
                        </p>
                        <p className="text-sm text-gray-500">{appt.duration_minutes} min</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appt.status)}`}>
                      {getStatusLabel(appt.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold mb-4">À venir</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun RDV</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(appt => (
                  <div key={appt.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-sm">{appt.patient_name}</p>
                    <p className="text-xs text-blue-700">
                      {format(new Date(appt.date), 'EEE d MMM • HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}