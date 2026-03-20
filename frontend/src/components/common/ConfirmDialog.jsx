import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar', loading }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || '¿Está seguro?'}
      size="modal-sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmText}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text)' }}>{message || 'Esta acción no se puede deshacer.'}</p>
    </Modal>
  );
}
