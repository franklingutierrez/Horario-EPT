const router = require('express').Router();
const { exec } = require('child_process');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const uploadBackup = multer({
  dest: backupDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === '.sql');
  },
});

// POST /api/backup/create
router.post('/create', verifyToken, requireAdmin, (req, res, next) => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup_${ts}.sql`;
  const filepath = path.join(backupDir, filename);

  const { DB_HOST, DB_PORT, DB_NAME, DB_USER } = process.env;
  const password = process.env.DB_PASSWORD || '';

  const cmd = `mysqldump --host=${DB_HOST} --port=${DB_PORT || 3306} --user=${DB_USER} --password=${password} --single-transaction --routines --triggers ${DB_NAME} > "${filepath}"`;

  exec(cmd, async (error) => {
    const status = error ? 'failed' : 'success';
    try {
      await pool.query(
        'INSERT INTO backup_log (filename, performed_by, action, status) VALUES (?, ?, ?, ?)',
        [filename, req.user.id, 'backup', status]
      );
    } catch {}

    if (error) {
      console.error('Backup error:', error.message);
      return res.status(500).json({ message: 'Error al crear el respaldo: ' + error.message });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/sql');
    const stream = fs.createReadStream(filepath);
    stream.on('end', () => {
      // Opcional: eliminar después de descargar para ahorrar espacio
    });
    stream.pipe(res);
  });
});

// GET /api/backup/logs
router.get('/logs', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT bl.id, bl.filename, bl.action, bl.status, bl.created_at, u.display_name
      FROM backup_log bl
      JOIN users u ON u.id = bl.performed_by
      ORDER BY bl.created_at DESC
      LIMIT 30
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/backup/files
router.get('/files', verifyToken, requireAdmin, (req, res) => {
  const files = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const stat = fs.statSync(path.join(backupDir, f));
      return { filename: f, size: stat.size, date: stat.mtime };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(files);
});

// GET /api/backup/download/:filename
router.get('/download/:filename', verifyToken, requireAdmin, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(backupDir, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/sql');
  fs.createReadStream(filepath).pipe(res);
});

// POST /api/backup/restore
router.post('/restore', verifyToken, requireAdmin, uploadBackup.single('backup'), (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'Se requiere un archivo .sql válido' });

  const { DB_HOST, DB_PORT, DB_NAME, DB_USER } = process.env;
  const password = process.env.DB_PASSWORD || '';

  const cmd = `mysql --host=${DB_HOST} --port=${DB_PORT || 3306} --user=${DB_USER} --password=${password} ${DB_NAME} < "${req.file.path}"`;

  exec(cmd, async (error) => {
    const status = error ? 'failed' : 'success';
    try {
      await pool.query(
        'INSERT INTO backup_log (filename, performed_by, action, status) VALUES (?, ?, ?, ?)',
        [req.file.originalname, req.user.id, 'restore', status]
      );
    } catch {}

    // Limpiar archivo temporal
    try { fs.unlinkSync(req.file.path); } catch {}

    if (error) {
      console.error('Restore error:', error.message);
      return res.status(500).json({ message: 'Error al restaurar el respaldo: ' + error.message });
    }
    res.json({ message: 'Base de datos restaurada correctamente' });
  });
});

module.exports = router;
