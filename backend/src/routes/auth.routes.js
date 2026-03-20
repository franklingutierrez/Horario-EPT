const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, password_hash, role, display_name, is_active FROM users WHERE username = ? LIMIT 1',
      [username.trim().toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(401).json({ message: 'Cuenta desactivada. Contacte al administrador' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, displayName: user.display_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, displayName: user.display_name }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
