import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import client from '../../api/client';

const DAYS_ES = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };

export default function ReservationModal({ isOpen, onClose, onCreated, room, date, availableSlots = [] }) {
  const [selectedCount, setSelectedCount] = useState(1);
  const [form, setForm]   = useState({ teacherName: '', subject: '', grade: '', section: '', notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Resetear selección cuando cambia el modal
  useEffect(() => {
    setSelectedCount(1);
    setForm({ teacherName: '', subject: '', grade: '', section: '', notes: '' });
    setError('');
  }, [isOpen, date, room?.id]);

  const dayOfWeek = date ? new Date(date + 'T00:00:00').getDay() : null;
  const dayName   = DAYS_ES[dayOfWeek] || '';
  const [y, m, d] = date ? date.split('-') : ['', '', ''];
  const dateFormatted = date ? `${dayName} ${parseInt(d)}/${parseInt(m)}/${y}` : '';

  const selectedSlots = availableSlots.slice(0, selectedCount);
  const firstSlot     = availableSlots[0];
  const lastSelected  = selectedSlots[selectedSlots.length - 1];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.teacherName.trim() || !form.subject.trim() || !form.grade || !form.section) {
      setError('Complete todos los campos obligatorios');
      return;
    }
    if (!selectedSlots.length) {
      setError('Selecciona al menos una franja horaria');
      return;
    }
    setLoading(true);
    try {
      await client.post('/reservations/batch', {
        roomId:          room.id,
        timeSlotIds:     selectedSlots.map(s => s.id),
        reservationDate: date,
        teacherName:     form.teacherName.trim(),
        subject:         form.subject.trim(),
        grade:           form.grade,
        section:         form.section,
        notes:           form.notes.trim() || null,
      });
      onCreated(selectedSlots.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Reserva"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? 'Guardando...'
              : selectedCount > 1
                ? `Reservar ${selectedCount} horas`
                : 'Confirmar Reserva'}
          </button>
        </>
      }
    >
      {/* Información de contexto */}
      <div className="res-context-bar">
        <div className="res-context-item">
          <span className="res-context-label">AMBIENTE</span>
          <span className="res-context-value">{room?.name}</span>
        </div>
        <div className="res-context-item">
          <span className="res-context-label">FECHA</span>
          <span className="res-context-value">{dateFormatted}</span>
        </div>
        {firstSlot && lastSelected && (
          <div className="res-context-item" style={{ gridColumn: '1 / -1' }}>
            <span className="res-context-label">HORARIO RESERVADO</span>
            <span className="res-context-value">
              {firstSlot.startTime} – {lastSelected.endTime}
              {selectedCount > 1 && (
                <span className="badge badge-blue" style={{ marginLeft: '.5rem' }}>
                  {selectedCount} horas
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Selector de franjas consecutivas ─────────────── */}
      {availableSlots.length > 1 && (
        <div className="slot-range-section">
          <div className="slot-range-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Selecciona cuántas horas seguidas reservar
          </div>
          <div className="slot-range-chips">
            {availableSlots.map((slot, idx) => {
              const isSelected = idx < selectedCount;
              const isFirst    = idx === 0;
              const isLast     = idx === selectedCount - 1;
              return (
                <button
                  key={slot.id}
                  type="button"
                  className={`slot-chip${isSelected ? ' slot-chip-selected' : ''}${isFirst ? ' slot-chip-first' : ''}${isLast && isSelected ? ' slot-chip-last' : ''}`}
                  onClick={() => setSelectedCount(isSelected && !isFirst ? idx : idx + 1)}
                  title={isFirst ? 'Primera hora (obligatoria)' : isSelected ? 'Clic para deseleccionar desde aquí' : 'Clic para incluir hasta esta hora'}
                >
                  <span className="slot-chip-name">{slot.label}</span>
                  <span className="slot-chip-time">{slot.startTime}–{slot.endTime}</span>
                  {isFirst && <span className="slot-chip-pin">inicio</span>}
                </button>
              );
            })}
          </div>
          <div className="slot-range-summary">
            {selectedCount === 1
              ? `1 hora: ${firstSlot?.startTime} – ${firstSlot?.endTime}`
              : `${selectedCount} horas consecutivas: ${firstSlot?.startTime} – ${lastSelected?.endTime}`}
          </div>
        </div>
      )}

      {/* ── Solo hay 1 slot disponible — mostrar info simple ── */}
      {availableSlots.length === 1 && (
        <div className="slot-range-section">
          <div className="slot-single-info">
            <span className="slot-chip slot-chip-selected slot-chip-first slot-chip-last">
              <span className="slot-chip-name">{firstSlot?.label}</span>
              <span className="slot-chip-time">{firstSlot?.startTime}–{firstSlot?.endTime}</span>
            </span>
            <span className="slot-range-summary" style={{ marginTop: 0 }}>
              Solo 1 hora disponible (la siguiente ya está ocupada o es un descanso)
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="form-error-banner">{error}</div>
      )}

      {/* ── Datos de la reserva ───────────────────────────── */}
      <div className="form-group">
        <label className="form-label">Nombre del Docente <span className="required">*</span></label>
        <input
          className="form-control"
          placeholder="Ej: Prof. Juan Pérez García"
          value={form.teacherName}
          onChange={e => set('teacherName', e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">Asignatura / Curso <span className="required">*</span></label>
        <input
          className="form-control"
          placeholder="Ej: Computación, EPT"
          value={form.subject}
          onChange={e => set('subject', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Grado <span className="required">*</span></label>
          <select className="form-control" value={form.grade} onChange={e => set('grade', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="1ro">1ro</option>
            <option value="2do">2do</option>
            <option value="3ro">3ro</option>
            <option value="4to">4to</option>
            <option value="5to">5to</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Sección <span className="required">*</span></label>
          <select className="form-control" value={form.section} onChange={e => set('section', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Observaciones</label>
        <textarea
          className="form-control"
          rows={2}
          placeholder="Opcional: actividad especial, requerimientos..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>
    </Modal>
  );
}
