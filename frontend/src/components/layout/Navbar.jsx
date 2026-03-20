import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const SUPPORT = {
  name:       'Franklin Hiustong Gutierrez Arizaca',
  profession: 'Ingeniero de Sistemas',
  email:      'fgutierrezarizaca@gmail.com',
  phone:      '+51 973 158 561',
  web:        'www.guiratec.com',
  webUrl:     'https://www.guiratec.com',
};

function SupportModal({ onClose }) {
  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm support-modal" role="dialog" aria-modal="true">
        {/* Cabecera con degradado */}
        <div className="support-modal-header">
          <div className="support-avatar">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <div className="support-name">{SUPPORT.name}</div>
            <div className="support-profession">{SUPPORT.profession}</div>
          </div>
          <button className="support-close-btn" onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Datos de contacto */}
        <div className="support-modal-body">
          <div className="support-section-title">Información de contacto</div>

          <a href={`mailto:${SUPPORT.email}`} className="support-contact-row">
            <span className="support-contact-icon support-icon-email">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <div>
              <div className="support-contact-label">Correo electrónico</div>
              <div className="support-contact-value">{SUPPORT.email}</div>
            </div>
          </a>

          <a href={`tel:${SUPPORT.phone.replace(/\s/g,'')}`} className="support-contact-row">
            <span className="support-contact-icon support-icon-phone">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.38 2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.07-1.07a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </span>
            <div>
              <div className="support-contact-label">Celular / WhatsApp</div>
              <div className="support-contact-value">{SUPPORT.phone}</div>
            </div>
          </a>

          <a href={SUPPORT.webUrl} target="_blank" rel="noopener noreferrer" className="support-contact-row">
            <span className="support-contact-icon support-icon-web">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </span>
            <div>
              <div className="support-contact-label">Sitio web</div>
              <div className="support-contact-value">{SUPPORT.web}</div>
            </div>
          </a>
        </div>

        <div className="support-modal-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          Para reportar problemas o solicitar asistencia técnica
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Navbar({ title }) {
  const { user, logout, isAdmin } = useAuth();
  const { institutionName, logoUrl } = useSettings();
  const navigate = useNavigate();
  const [supportOpen, setSupportOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          {logoUrl
            ? <img src={logoUrl} alt="Logo" className="navbar-logo" />
            : <div className="navbar-logo-placeholder">{institutionName.charAt(0)}</div>
          }
          <div>
            <div className="navbar-title">{institutionName}</div>
            {title && <div className="navbar-subtitle">{title}</div>}
          </div>
        </Link>

        <div className="navbar-actions">
          {isAdmin && (
            <Link to="/admin" className="btn btn-secondary btn-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="hide-mobile">Administración</span>
            </Link>
          )}

          <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.375rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="hide-mobile">{user?.displayName}</span>
          </div>

          {/* Botón de Soporte */}
          <button
            className="btn btn-ghost btn-sm support-btn"
            onClick={() => setSupportOpen(true)}
            title="Soporte técnico"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="hide-mobile">Soporte</span>
          </button>

          <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Cerrar sesión">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            <span className="hide-mobile">Salir</span>
          </button>
        </div>
      </nav>

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}
