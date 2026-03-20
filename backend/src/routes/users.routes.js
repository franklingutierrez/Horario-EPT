const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/users
router.get('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, display_name, is_active, created_at FROM users ORDER BY role, display_name'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/users
router.post('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { username, password, role, displayName } = req.body;
    if (!username || !password || !role || !displayName) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
      [username.trim().toLowerCase(), hash, role, displayName.trim()]
    );
    res.status(201).json({ id: result.insertId, message: 'Usuario creado correctamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un usuario con ese nombre de usuario' });
    }
    next(err);
  }
});

// PUT /api/users/:id
router.put('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { displayName, role, isActive } = req.body;
    if (!displayName || !role) {
      return res.status(400).json({ message: 'Nombre y rol son requeridos' });
    }

    // No desactivar el último admin
    if (isActive === false || isActive === 0) {
      const [admins] = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1 AND id != ?",
        [req.params.id]
      );
      const [currentUser] = await pool.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
      if (currentUser[0]?.role === 'admin' && admins[0].count === 0) {
        return res.status(400).json({ message: 'No se puede desactivar el único administrador activo' });
      }
    }

    await pool.query(
      'UPDATE users SET display_name=?, role=?, is_active=? WHERE id=?',
      [displayName.trim(), role, isActive !== false ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/password
router.patch('/:id/password', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'No puede eliminar su propia cuenta' });
    }
    const [admins] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1 AND id != ?",
      [req.params.id]
    );
    const [currentUser] = await pool.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
    if (currentUser[0]?.role === 'admin' && admins[0].count === 0) {
      return res.status(400).json({ message: 'No se puede eliminar el único administrador' });
    }

    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (err) { next(err); }
});

module.exports = router;
