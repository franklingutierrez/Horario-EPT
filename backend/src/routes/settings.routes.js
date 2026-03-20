const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// GET /api/settings  (público)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT institution_name, logo_url FROM settings WHERE id = 1');
    res.json(rows[0] || { institution_name: 'Institución Educativa', logo_url: null });
  } catch (err) { next(err); }
});

// PUT /api/settings
router.put('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { institutionName } = req.body;
    if (!institutionName) return res.status(400).json({ message: 'El nombre de la institución es requerido' });

    await pool.query(
      'UPDATE settings SET institution_name = ? WHERE id = 1',
      [institutionName.trim()]
    );
    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (err) { next(err); }
});

// POST /api/settings/logo
router.post('/logo', verifyToken, requireAdmin, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Se requiere una imagen válida (JPG, PNG, WebP)' });

    // Eliminar logo anterior
    const [current] = await pool.query('SELECT logo_url FROM settings WHERE id = 1');
    if (current[0]?.logo_url) {
      const oldFile = path.join(uploadDir, path.basename(current[0].logo_url));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    const logoUrl = `/api/uploads/${req.file.filename}`;
    await pool.query('UPDATE settings SET logo_url = ? WHERE id = 1', [logoUrl]);
    res.json({ logoUrl, message: 'Logo actualizado correctamente' });
  } catch (err) { next(err); }
});

// DELETE /api/settings/logo
router.delete('/logo', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const [current] = await pool.query('SELECT logo_url FROM settings WHERE id = 1');
    if (current[0]?.logo_url) {
      const oldFile = path.join(uploadDir, path.basename(current[0].logo_url));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
    await pool.query('UPDATE settings SET logo_url = NULL WHERE id = 1');
    res.json({ message: 'Logo eliminado correctamente' });
  } catch (err) { next(err); }
});

module.exports = router;
