// app/doctor/consultations/page.tsx
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Activity, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, Plus } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    patient_name: string;
    status: string;
    room_number: string;
    patient_id: string;
  };
}

export default function AgendaPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Work around type issue with FullCalendar React typings in strict builds
  const FullCalendarComponent = FullCalendar as unknown as React.ComponentType<any>;

  const fetcher = (url: string) =>
    fetch(url, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    }).then(r => r.json());

  const { data: agenda } = useSWR(`${API_BASE}doctor/agenda/`, fetcher);

  useEffect(() => {
    if (!agenda) return;

    const mappedEvents: Event[] = agenda.map((rdv: any) => ({
      id: rdv.id.toString(),
      title: rdv.patient_name,
      start: rdv.date,
      end: new Date(new Date(rdv.date).getTime() + rdv.duration_minutes * 60000).toISOString(),
      backgroundColor: getStatusColor(rdv.status),
      borderColor: getStatusColor(rdv.status),
      extendedProps: {
        patient_name: rdv.patient_name,
        status: rdv.status,
        room_number: rdv.room_number,
        patient_id: rdv.patient.id,
      },
    }));

    setEvents(mappedEvents);
  }, [agenda]);

  const agendaList = agenda ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '#3B82F6'; // blue
      case 'IN_PROGRESS': return '#F59E0B'; // amber
      case 'COMPLETED': return '#10B981'; // green
      case 'CANCELLED': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setShowModal(true);
  };

  const handleEventClick = (arg: any) => {
    const event = arg.event;
    const rdvId = event.id;
    window.location.href = `/doctor/consultations/${rdvId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Mon Agenda
            </h1>
            <p className="text-gray-600 mt-1">Gérez vos consultations en un coup d&apos;œil</p>
          </div>
          <Link
            href="/doctor/consultations/new"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau RDV
          </Link>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
          <FullCalendarComponent
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locale={fr}
            buttonText={{
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
            }}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            height="auto"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            dayHeaderClassNames="text-gray-700 font-semibold"
            slotLabelClassNames="text-gray-600"
            nowIndicator={true}
            selectable={true}
            editable={true}
            droppable={true}
            eventOverlap={false}
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
            allDaySlot={false}
            views={{
              timeGridWeek: {
                dayHeaderFormat: { weekday: 'long', day: 'numeric' },
              },
            }}
          />
        </div>

        {/* Today Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Consultations aujourd&apos;hui</p>
                <p className="text-3xl font-bold mt-1">
                  {agendaList.filter((r: any) => new Date(r.date).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">En cours</p>
                <p className="text-3xl font-bold mt-1">
                  {agendaList.filter((r: any) => r.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Terminées</p>
                <p className="text-3xl font-bold mt-1">
                  {agendaList.filter((r: any) => r.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Création Rapide */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Nouveau RDV</h3>
            <p className="text-sm text-gray-600 mb-4">
              {format(selectedDate, 'EEEE d MMMM yyyy à HH:mm')}
            </p>
            <Link
              href={`/doctor/consultations/new?date=${selectedDate.toISOString()}`}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-center block hover:bg-blue-700 transition"
            >
              Créer le rendez-vous
            </Link>
            <button
              onClick={() => setShowModal(false)}
              className="mt-3 w-full text-gray-600 hover:text-gray-800 font-medium"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Event Rendering
function renderEventContent(eventInfo: any) {
  const { patient_name, status, room_number } = eventInfo.event.extendedProps;
  const timeText = eventInfo.timeText;

  return (
    <div className="p-2 text-white rounded-lg cursor-pointer">
      <div className="font-semibold text-sm truncate">{patient_name}</div>
      <div className="text-xs opacity-90 flex items-center gap-1 mt-1">
        <Clock className="w-3 h-3" />
        {timeText}
        {room_number && ` • S${room_number}`}
      </div>
      <div className="text-xs mt-1 bg-white/30 rounded px-2 py-0.5 inline-block">
        {status === 'SCHEDULED' ? 'Prévu' : status === 'IN_PROGRESS' ? 'En cours' : status}
      </div>
    </div>
  );
}