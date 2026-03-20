import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import ReservationModal from '../components/reservations/ReservationModal';
import { ToastProvider, useToast } from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import client from '../api/client';
import '../styles/print.css';

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmt(d) { return d.toISOString().split('T')[0]; }

function formatWeekLabel(start) {
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const sm = months[start.getMonth()], em = months[end.getMonth()];
  if (sm === em) return `${start.getDate()} - ${end.getDate()} de ${sm} ${start.getFullYear()}`;
  return `${start.getDate()} ${sm} - ${end.getDate()} ${em} ${end.getFullYear()}`;
}

function ScheduleContent() {
  const { user, isAdmin } = useAuth();
  const { institutionName, logoUrl } = useSettings();
  const toast = useToast();

  const [weekStart, setWeekStart]   = useState(() => getMondayOf(new Date()));
  const [activeRoom, setActiveRoom] = useState(null);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);

  const [modal, setModal]   = useState({ open: false, date: null, availableSlots: [], room: null });
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: d } = await client.get(`/reservations?weekStart=${fmt(weekStart)}`);
      setData(d);
      if (!activeRoom && d.rooms.length) setActiveRoom(d.rooms[0].id);
    } catch { toast.error('Error al cargar el horario'); }
    finally { setLoading(false); }
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday  = () => setWeekStart(getMondayOf(new Date()));

  const openReserve = (date, slot, roomId) => {
    const room = data.rooms.find(r => r.id === roomId);

    // Calcular todas las franjas consecutivas disponibles desde la franja clicada
    const startIdx = data.timeslots.findIndex(s => s.id === slot.id);
    const availableSlots = [];
    for (let i = startIdx; i < data.timeslots.length; i++) {
      const s = data.timeslots[i];
      if (!s.isBookable) break;              // Se detiene en recreo/almuerzo
      if (room.schedule?.[date]?.[s.id]) break; // Se detiene si el slot ya está reservado
      availableSlots.push(s);
    }

    setModal({ open: true, date, availableSlots, room });
  };

  const handleCreated = (count = 1) => {
    setModal({ open: false });
    load();
    toast.success(count > 1 ? `${count} horas reservadas correctamente` : 'Reserva registrada correctamente');
  };

  const handleDeleteClick = (id) => setConfirm({ open: true, id, loading: false });
  const handleDeleteConfirm = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      await client.delete(`/reservations/${confirm.id}`);
      setConfirm({ open: false, id: null, loading: false });
      toast.success('Reserva eliminada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
      setConfirm(c => ({ ...c, loading: false }));
    }
  };

  const handlePrint = () => window.print();

  const today = fmt(new Date());
  const currentRoom = data?.rooms.find(r => r.id === activeRoom);

  return (
    <div className="schedule-page">
      {/* Membrete de impresión (oculto en pantalla, visible al imprimir) */}
      <div className="print-header">
        {logoUrl
          ? <img src={logoUrl} alt="Logo" className="print-logo" />
          : <div className="print-logo-placeholder">{institutionName.charAt(0)}</div>
        }
        <div className="print-header-text">
          <div className="print-institution">{institutionName}</div>
          <div className="print-report-title">
            Horario Semanal — {currentRoom?.name || 'Ambientes de Innovación'}
          </div>
          <div className="print-week-label">Semana del {formatWeekLabel(weekStart)}</div>
        </div>
        <div className="print-meta">
          <div>Impreso: {new Date().toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' })}</div>
        </div>
      </div>

      <Navbar title="Horario de Laboratorios" />

      <main className="schedule-main">
        {/* Controles de semana */}
        <div className="week-controls">
          <div className="week-nav">
            <button className="btn btn-secondary btn-sm" onClick={prevWeek}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="week-label">Semana del {formatWeekLabel(weekStart)}</span>
            <button className="btn btn-secondary btn-sm" onClick={nextWeek}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          <div className="week-actions">
            <button className="btn btn-secondary btn-sm" onClick={goToday}>Hoy</button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimir / Exportar
            </button>
          </div>
        </div>

        {/* Tabs de ambientes */}
        {data && (
          <div className="room-tabs">
            {data.rooms.map(room => (
              <button
                key={room.id}
                className={`room-tab${activeRoom === room.id ? ' active' : ''}`}
                onClick={() => setActiveRoom(room.id)}
              >
                {room.name}
              </button>
            ))}
          </div>
        )}

        {/* Grilla */}
        {loading ? (
          <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
        ) : data && currentRoom ? (
          <div className="schedule-grid-wrapper">
            <div className="schedule-grid">
              {/* Encabezados */}
              <div className="grid-header-cell" />
              {data.days.map((d, i) => (
                <div key={d} className={`grid-header-cell${d === today ? ' today' : ''}`}>
                  <div>{DAYS_ES[i]}</div>
                  <div className="grid-day-date">{d.slice(8)}/{d.slice(5,7)}</div>
                </div>
              ))}

              {/* Filas de franjas */}
              {data.timeslots.map(slot => (
                <React.Fragment key={slot.id}>
                  <div className="grid-time-cell">
                    <div className="time-label">{slot.label}</div>
                    <div className="time-range">{slot.startTime} - {slot.endTime}</div>
                  </div>
                  {data.days.map(day => {
                    const res = currentRoom.schedule?.[day]?.[slot.id];
                    if (!slot.isBookable) {
                      return (
                        <div key={day} className="grid-slot-cell slot-disabled">
                          <div className="disabled-label">
                            <span className="disabled-badge">{slot.label}</span>
                          </div>
                        </div>
                      );
                    }
                    if (res) {
                      return (
                        <div key={day} className="grid-slot-cell slot-reserved">
                          <div className="reservation-card">
                            <div className="res-teacher">{res.teacherName}</div>
                            <div className="res-subject">{res.subject}</div>
                            <div className="res-grade">{res.grade}{res.section ? ` — Sec. ${res.section}` : ''}</div>
                          </div>
                          {isAdmin ? (
                            <button className="res-delete-btn" onClick={() => handleDeleteClick(res.id)} title="Eliminar reserva (Admin)">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                              </svg>
                            </button>
                          ) : (
                            <span className="res-lock-icon" title="Reserva confirmada · Solo el administrador puede cancelarla">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            </span>
                          )}
                        </div>
                      );
                    }
                    // Disponible — solo para fechas presentes o futuras
                    const isPast = day < today;
                    return (
                      <div
                        key={day}
                        className={`grid-slot-cell${isPast ? ' slot-disabled' : ' slot-available'}`}
                        onClick={() => !isPast && openReserve(day, slot, currentRoom.id)}
                      >
                        {!isPast && <div className="slot-empty-hint">+ Reservar</div>}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay datos disponibles</p>
          </div>
        )}

        {/* Pie de página — solo visible al imprimir */}
        <div className="print-footer">
          <span className="print-footer-left">
            {institutionName} &mdash; Sistema de Reserva de Laboratorios
          </span>
          <span className="print-footer-right">
            Documento generado el&nbsp;
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </main>

      {modal.open && (
        <ReservationModal
          isOpen={modal.open}
          onClose={() => setModal({ open: false })}
          onCreated={handleCreated}
          room={modal.room}
          date={modal.date}
          availableSlots={modal.availableSlots}
        />
      )}

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        loading={confirm.loading}
        title="Eliminar reserva"
        message="¿Está seguro que desea eliminar esta reserva? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
      />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ToastProvider>
      <ScheduleContent />
    </ToastProvider>
  );
}
