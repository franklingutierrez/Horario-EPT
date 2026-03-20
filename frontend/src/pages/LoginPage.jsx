import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { institutionName, logoUrl } = useSettings();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password);
      navigate(user.role === 'admin' ? '/' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          {logoUrl
            ? <img src={logoUrl} alt="Logo" className="login-logo" />
            : <div className="login-logo-placeholder">{institutionName.charAt(0)}</div>
          }
          <div className="login-institution">{institutionName}</div>
          <div className="login-subtitle">Sistema de Reserva de Laboratorios</div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ingrese su usuario"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required autoFocus autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="Ingrese su contraseña"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '.5rem' }}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          Reserva de ambientes de innovación tecnológica
        </div>
      </div>
    </div>
  );
}
