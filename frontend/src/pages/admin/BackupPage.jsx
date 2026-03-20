import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { useToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function BackupPage() {
  const toast = useToast();
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirm, setConfirm]     = useState({ open: false });
  const [restoreFile, setRestoreFile] = useState(null);
  const fileRef = useRef();

  const loadLogs = async () => {
    setLoading(true);
    try { const { data } = await client.get('/backup/logs'); setLogs(data); }
    catch { toast.error('Error al cargar el historial'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const response = await client.post('/backup/create', {}, { responseType: 'blob' });
      const disposition = response.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `backup_${new Date().toISOString().slice(0,10)}.sql`;

      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);

      toast.success('Respaldo creado y descargado correctamente');
      loadLogs();
    } catch (err) {
      toast.error('Error al crear el respaldo');
    } finally { setCreating(false); }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    setConfirm({ open: false });
    try {
      const fd = new FormData();
      fd.append('backup', restoreFile);
      await client.post('/backup/restore', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Base de datos restaurada correctamente. Recargando...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al restaurar');
    } finally {
      setRestoring(false);
      setRestoreFile(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Respaldos</h2>
        <p>Crea y restaura copias de seguridad de la base de datos</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Crear respaldo */}
        <div className="card">
          <div className="card-header"><h3>Crear Respaldo</h3></div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem' }}>
              Genera un archivo SQL con toda la información de la base de datos.
              El archivo se descargará automáticamente.
            </p>
            <button className="btn btn-primary" onClick={handleCreateBackup} disabled={creating}>
              {creating ? (
                <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creando...</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Crear y Descargar Respaldo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Restaurar */}
        <div className="card">
          <div className="card-header">
            <h3>Restaurar Respaldo</h3>
            <span className="badge badge-red">Precaución</span>
          </div>
          <div className="card-body">
            <div style={{ background: 'var(--warning-light)', border: '1px solid #fbbf24', borderRadius: 'var(--radius)', padding: '.75rem', marginBottom: '1rem', fontSize: '.85rem', color: '#92400e' }}>
              ⚠ Restaurar sobrescribirá todos los datos actuales. Esta acción no se puede deshacer.
            </div>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={restoring}>
                Seleccionar archivo .sql
              </button>
              <input type="file" ref={fileRef} accept=".sql" style={{ display: 'none' }}
                onChange={e => { setRestoreFile(e.target.files[0]); e.target.value = ''; }} />
              {restoreFile && (
                <>
                  <span style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{restoreFile.name}</span>
                  <button className="btn btn-danger" onClick={() => setConfirm({ open: true })} disabled={restoring}>
                    {restoring ? 'Restaurando...' : 'Restaurar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <div className="card-header">
          <h3>Historial de respaldos</h3>
          <button className="btn btn-ghost btn-sm" onClick={loadLogs}>↺ Actualizar</button>
        </div>
        <div style={{ overflow: 'hidden' }}>
          {loading ? (
            <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state"><p>No hay registros de respaldos</p></div>
          ) : (
            <table>
              <thead><tr><th>Fecha</th><th>Archivo</th><th>Acción</th><th>Usuario</th><th>Estado</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('es-PE')}
                    </td>
                    <td style={{ fontSize: '.8rem', fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.filename}</td>
                    <td>
                      <span className={`badge ${log.action === 'backup' ? 'badge-blue' : 'badge-yellow'}`}>
                        {log.action === 'backup' ? 'Respaldo' : 'Restauración'}
                      </span>
                    </td>
                    <td>{log.display_name}</td>
                    <td>
                      <span className={`badge ${log.status === 'success' ? 'badge-green' : 'badge-red'}`}>
                        {log.status === 'success' ? 'Exitoso' : 'Fallido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={handleRestore}
        loading={restoring}
        title="Confirmar restauración"
        message={`¿Seguro que desea restaurar desde "${restoreFile?.name}"? TODOS los datos actuales serán reemplazados. Esta acción no se puede deshacer.`}
        confirmText="Sí, restaurar ahora"
      />
    </div>
  );
}
