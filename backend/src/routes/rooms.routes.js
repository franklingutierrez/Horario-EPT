const router = require('express').Router();
const pool   = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/rooms
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, capacity, is_active, sort_order FROM rooms ORDER BY sort_order, id'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/rooms
router.post('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, capacity, sortOrder } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre del ambiente es requerido' });

    const [result] = await pool.query(
      'INSERT INTO rooms (name, description, capacity, sort_order) VALUES (?, ?, ?, ?)',
      [name.trim(), description?.trim() || null, capacity || null, sortOrder || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Ambiente creado correctamente' });
  } catch (err) { next(err); }
});

// PUT /api/rooms/:id
router.put('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, capacity, isActive, sortOrder } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre del ambiente es requerido' });

    await pool.query(
      'UPDATE rooms SET name=?, description=?, capacity=?, is_active=?, sort_order=? WHERE id=?',
      [name.trim(), description?.trim() || null, capacity || null, isActive !== false ? 1 : 0, sortOrder || 0, req.params.id]
    );
    res.json({ message: 'Ambiente actualizado correctamente' });
  } catch (err) { next(err); }
});

// DELETE /api/rooms/:id
router.delete('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const [reservations] = await pool.query(
      'SELECT COUNT(*) as count FROM reservations WHERE room_id = ?', [req.params.id]
    );
    if (reservations[0].count > 0) {
      // Soft delete
      await pool.query('UPDATE rooms SET is_active = 0 WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Ambiente desactivado (tiene reservas asociadas)' });
    }
    await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ambiente eliminado correctamente' });
  } catch (err) { next(err); }
});

module.exports = router;
