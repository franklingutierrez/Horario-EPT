import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';

const emptyUser = { username: '', password: '', role: 'teacher', displayName: '', isActive: true };

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState({ open: false, user: null, type: 'create' });
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const [form, setForm]     = useState(emptyUser);
  const [pwdModal, setPwdModal] = useState({ open: false, userId: null, password: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await client.get('/users'); setUsers(data); }
    catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyUser); setModal({ open: true, user: null, type: 'create' }); };
  const openEdit   = (u) => {
    setForm({ username: u.username, password: '', role: u.role, displayName: u.display_name, isActive: u.is_active === 1 });
    setModal({ open: true, user: u, type: 'edit' });
  };

  const handleSave = async () => {
    if (!form.displayName.trim() || !form.role) { toast.error('Nombre y rol son requeridos'); return; }
    if (modal.type === 'create' && (!form.username.trim() || !form.password)) { toast.error('Usuario y contraseña son requeridos'); return; }
    setSaving(true);
    try {
      if (modal.type === 'edit') { await client.put(`/users/${modal.user.id}`, form); toast.success('Usuario actualizado'); }
      else                       { await client.post('/users', form); toast.success('Usuario creado'); }
      setModal({ open: false }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleChangePwd = async () => {
    if (!pwdModal.password || pwdModal.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    setSaving(true);
    try {
      await client.patch(`/users/${pwdModal.userId}/password`, { password: pwdModal.password });
      toast.success('Contraseña actualizada');
      setPwdModal({ open: false, userId: null, password: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      await client.delete(`/users/${confirm.id}`);
      toast.success('Usuario desactivado');
      setConfirm({ open: false, id: null, loading: false }); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
      setConfirm(c => ({ ...c, loading: false }));
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Usuarios</h2>
          <p>Gestiona administradores y la cuenta de docentes</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Usuario</button>
      </div>

      {loading ? <div className="flex-center" style={{ height: 120 }}><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Registrado</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={6}><div className="empty-state"><p>No hay usuarios</p></div></td></tr>}
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.display_name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '.85rem' }}>{u.username}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-yellow'}`}>
                      {u.role === 'admin' ? 'Administrador' : 'Docente'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('es-PE')}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Editar</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setPwdModal({ open: true, userId: u.id, password: '' })}>Contraseña</button>
                      {u.is_active ? (
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ open: true, id: u.id, loading: false })}>Desactivar</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })}
        title={modal.type === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nombre completo <span className="required">*</span></label>
          <input className="form-control" placeholder="Ej: Prof. María García"
            value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} autoFocus />
        </div>
        {modal.type === 'create' && (
          <>
            <div className="form-group">
              <label className="form-label">Nombre de usuario <span className="required">*</span></label>
              <input className="form-control" placeholder="Ej: admin, docentes"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              <div className="form-hint">Solo letras minúsculas, números y guiones</div>
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña <span className="required">*</span></label>
              <input type="password" className="form-control" placeholder="Mínimo 6 caracteres"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">Rol <span className="required">*</span></label>
          <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="teacher">Docente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {modal.type === 'edit' && (
          <div className="toggle-row">
            <div><div className="toggle-label">Usuario activo</div></div>
            <input type="checkbox" className="toggle" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
          </div>
        )}
      </Modal>

      {/* Modal Cambiar Contraseña */}
      <Modal isOpen={pwdModal.open} onClose={() => setPwdModal({ open: false, userId: null, password: '' })}
        title="Cambiar Contraseña" size="modal-sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPwdModal({ open: false, userId: null, password: '' })} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleChangePwd} disabled={saving}>{saving ? 'Guardando...' : 'Actualizar'}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nueva contraseña <span className="required">*</span></label>
          <input type="password" className="form-control" placeholder="Mínimo 6 caracteres" autoFocus
            value={pwdModal.password} onChange={e => setPwdModal(p => ({ ...p, password: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null, loading: false })}
        onConfirm={handleDeactivate} loading={confirm.loading}
        title="Desactivar Usuario"
        message="¿Seguro que desea desactivar este usuario? No podrá iniciar sesión."
        confirmText="Desactivar" />
    </div>
  );
}
