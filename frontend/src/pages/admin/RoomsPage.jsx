import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';

const empty = { name: '', description: '', capacity: '', sortOrder: 0, isActive: true };

export default function RoomsPage() {
  const toast = useToast();
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState({ open: false, room: null });
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const [form, setForm]       = useState(empty);
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await client.get('/rooms'); setRooms(data); }
    catch { toast.error('Error al cargar los ambientes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setModal({ open: true, room: null }); };
  const openEdit   = (r) => {
    setForm({ name: r.name, description: r.description||'', capacity: r.capacity||'', sortOrder: r.sort_order, isActive: r.is_active });
    setModal({ open: true, room: r });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (modal.room) {
        await client.put(`/rooms/${modal.room.id}`, form);
        toast.success('Ambiente actualizado');
      } else {
        await client.post('/rooms', form);
        toast.success('Ambiente creado');
      }
      setModal({ open: false });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      await client.delete(`/rooms/${confirm.id}`);
      toast.success('Ambiente eliminado');
      setConfirm({ open: false, id: null, loading: false });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
      setConfirm(c => ({ ...c, loading: false }));
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Ambientes</h2>
          <p>Gestiona los laboratorios disponibles</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Ambiente</button>
      </div>

      {loading ? <div className="flex-center" style={{ height: 120 }}><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {rooms.length === 0 && <tr><td colSpan={6}><div className="empty-state"><p>No hay ambientes</p></div></td></tr>}
              {rooms.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{r.sort_order}</td>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{r.description || '—'}</td>
                  <td>{r.capacity ? `${r.capacity} alumnos` : '—'}</td>
                  <td>
                    <span className={`badge ${r.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {r.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ open: true, id: r.id, loading: false })}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })}
        title={modal.room ? 'Editar Ambiente' : 'Nuevo Ambiente'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nombre <span className="required">*</span></label>
          <input className="form-control" placeholder="Ej: Laboratorio de Innovación 1"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea className="form-control" rows={2} placeholder="Descripción opcional del ambiente"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Capacidad (alumnos)</label>
            <input type="number" className="form-control" placeholder="Ej: 30" min={1}
              value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Orden</label>
            <input type="number" className="form-control" min={0}
              value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value)||0 }))} />
          </div>
        </div>
        {modal.room && (
          <div className="toggle-row">
            <div><div className="toggle-label">Estado activo</div><div className="toggle-desc">Si está inactivo no aparecerá en el horario</div></div>
            <input type="checkbox" className="toggle" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null, loading: false })}
        onConfirm={handleDelete} loading={confirm.loading}
        title="Eliminar Ambiente"
        message="¿Seguro que desea eliminar este ambiente? Si tiene reservas asociadas será desactivado."
        confirmText="Eliminar" />
    </div>
  );
}
