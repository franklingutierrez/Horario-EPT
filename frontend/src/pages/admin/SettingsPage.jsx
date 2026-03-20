import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../components/common/Toast';

export default function SettingsPage() {
  const toast = useToast();
  const { institutionName, logoUrl, refresh } = useSettings();
  const [name, setName]         = useState('');
  const [preview, setPreview]   = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { setName(institutionName); }, [institutionName]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      await client.put('/settings', { institutionName: name.trim() });
      await refresh();
      toast.success('Nombre actualizado correctamente');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no puede superar 2 MB'); return; }
    setLogoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      await client.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refresh();
      setLogoFile(null); setPreview(null);
      toast.success('Logo actualizado correctamente');
    } catch (err) { toast.error(err.response?.data?.message || 'Error al subir el logo'); }
    finally { setUploading(false); }
  };

  const handleRemoveLogo = async () => {
    try {
      await client.delete('/settings/logo');
      await refresh();
      toast.success('Logo eliminado');
    } catch { toast.error('Error al eliminar el logo'); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Configuración</h2>
        <p>Personaliza la apariencia de la aplicación</p>
      </div>

      {/* Nombre de institución */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h3>Institución Educativa</h3></div>
        <div className="card-body">
          <form onSubmit={handleSaveName}>
            <div className="form-group">
              <label className="form-label">Nombre de la institución <span className="required">*</span></label>
              <input className="form-control" placeholder="Ej: I.E. Nº 1234 San Martín"
                value={name} onChange={e => setName(e.target.value)} style={{ maxWidth: 480 }} />
              <div className="form-hint">Este nombre aparece en el encabezado y en los reportes impresos.</div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Nombre'}
            </button>
          </form>
        </div>
      </div>

      {/* Logo */}
      <div className="card">
        <div className="card-header"><h3>Logotipo</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Logo actual */}
            <div style={{ textAlign: 'center' }}>
              <div className="text-xs text-muted mb-1" style={{ marginBottom: '.5rem' }}>Logo actual</div>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: 100, width: 100, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.25rem' }} />
              ) : (
                <div style={{ height: 100, width: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: '.8rem', textAlign: 'center', padding: '.5rem' }}>
                  Sin logo
                </div>
              )}
            </div>

            {/* Preview nuevo logo */}
            {preview && (
              <div style={{ textAlign: 'center' }}>
                <div className="text-xs text-muted mb-1" style={{ marginBottom: '.5rem' }}>Vista previa</div>
                <img src={preview} alt="Preview" style={{ height: 100, width: 100, objectFit: 'contain', border: '1px solid var(--primary-light)', borderRadius: 'var(--radius)', padding: '.25rem' }} />
              </div>
            )}

            <div>
              <p style={{ marginBottom: '1rem' }}>Formatos aceptados: JPG, PNG, WebP. Tamaño máximo: 2 MB.</p>
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
                  Seleccionar imagen
                </button>
                <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />
                {logoFile && (
                  <button className="btn btn-primary" onClick={handleUploadLogo} disabled={uploading}>
                    {uploading ? 'Subiendo...' : 'Subir logo'}
                  </button>
                )}
                {logoUrl && !logoFile && (
                  <button className="btn btn-danger" onClick={handleRemoveLogo}>Eliminar logo</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credenciales por defecto */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header"><h3>Credenciales por defecto</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <div className="text-xs fw-600" style={{ color: 'var(--text-muted)', marginBottom: '.5rem', textTransform: 'uppercase' }}>Administrador</div>
              <div><strong>Usuario:</strong> <code>admin</code></div>
              <div style={{ marginTop: '.25rem' }}><strong>Contraseña inicial:</strong> <code>Admin123!</code></div>
              <div className="form-hint" style={{ marginTop: '.5rem' }}>Cambia la contraseña en la sección de Usuarios.</div>
            </div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <div className="text-xs fw-600" style={{ color: 'var(--text-muted)', marginBottom: '.5rem', textTransform: 'uppercase' }}>Docentes (cuenta compartida)</div>
              <div><strong>Usuario:</strong> <code>docentes</code></div>
              <div style={{ marginTop: '.25rem' }}><strong>Contraseña inicial:</strong> <code>Docentes123!</code></div>
              <div className="form-hint" style={{ marginTop: '.5rem' }}>Todos los docentes usan esta misma cuenta.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
