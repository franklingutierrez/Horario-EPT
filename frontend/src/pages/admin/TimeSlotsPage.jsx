import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';

const empty = { label: '', startTime: '07:45', endTime: '08:30', isBookable: true, sortOrder: 0 };

export default function TimeSlotsPage() {
  const toast = useToast();
  const [slots, setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState({ open: false, slot: null });
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const [form, setForm]     = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await client.get('/timeslots'); setSlots(data); }
    catch { toast.error('Error al cargar las franjas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setModal({ open: true, slot: null }); };
  const openEdit   = (s) => {
    setForm({ label: s.label, startTime: s.startTime, endTime: s.endTime, isBookable: s.isBookable, sortOrder: s.sortOrder });
    setModal({ open: true, slot: s });
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.startTime || !form.endTime) { toast.error('Todos los campos son requeridos'); return; }
    setSaving(true);
    try {
      if (modal.slot) { await client.put(`/timeslots/${modal.slot.id}`, form); toast.success('Franja actualizada'); }
      else            { await client.post('/timeslots', form); toast.success('Franja creada'); }
      setModal({ open: false }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      await client.delete(`/timeslots/${confirm.id}`);
      toast.success('Franja eliminada');
      setConfirm({ open: false, id: null, loading: false }); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
      setConfirm(c => ({ ...c, loading: false }));
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Franjas Horarias</h2>
          <p>Configura las horas disponibles para reservar</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nueva Franja</button>
      </div>

      {loading ? <div className="flex-center" style={{ height: 120 }}><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Orden</th><th>Etiqueta</th><th>Inicio</th><th>Fin</th><th>Reservable</th><th>Acciones</th></tr></thead>
            <tbody>
              {slots.length === 0 && <tr><td colSpan={6}><div className="empty-state"><p>No hay franjas</p></div></td></tr>}
              {slots.map(s => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{s.sortOrder}</td>
                  <td style={{ fontWeight: 600 }}>{s.label}</td>
                  <td>{s.startTime}</td>
                  <td>{s.endTime}</td>
                  <td>
                    <span className={`badge ${s.isBookable ? 'badge-green' : 'badge-gray'}`}>
                      {s.isBookable ? 'Sí' : 'No (Recreo/Almuerzo)'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ open: true, id: s.id, loading: false })}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })}
        title={modal.slot ? 'Editar Franja Horaria' : 'Nueva Franja Horaria'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Etiqueta <span className="required">*</span></label>
          <input className="form-control" placeholder="Ej: 1ra Hora, Recreo, Almuerzo"
            value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Hora inicio <span className="required">*</span></label>
            <input type="time" className="form-control" value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Hora fin <span className="required">*</span></label>
            <input type="time" className="form-control" value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Orden</label>
          <input type="number" className="form-control" min={0} value={form.sortOrder}
            onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value)||0 }))} />
        </div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">Permite reservas</div>
            <div className="toggle-desc">Desmarcar para recreos, almuerzos u otras pausas</div>
          </div>
          <input type="checkbox" className="toggle" checked={form.isBookable}
            onChange={e => setForm(f => ({ ...f, isBookable: e.target.checked }))} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null, loading: false })}
        onConfirm={handleDelete} loading={confirm.loading}
        title="Eliminar Franja Horaria"
        message="¿Seguro que desea eliminar esta franja? No se podrá eliminar si tiene reservas asociadas."
        confirmText="Eliminar" />
    </div>
  );
}
