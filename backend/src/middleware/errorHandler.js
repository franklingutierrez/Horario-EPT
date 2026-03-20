const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message || err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Este horario ya está reservado' });
  }

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ message });
};

module.exports = errorHandler;
