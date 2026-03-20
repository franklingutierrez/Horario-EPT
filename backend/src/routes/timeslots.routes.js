const router = require('express').Router();
const pool   = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/timeslots
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM time_slots ORDER BY sort_order, id');
    res.json(rows.map(ts => ({
      id:         ts.id,
      label:      ts.label,
      startTime:  ts.start_time.slice(0, 5),
      endTime:    ts.end_time.slice(0, 5),
      isBookable: ts.is_bookable === 1,
      sortOrder:  ts.sort_order,
    })));
  } catch (err) { next(err); }
});

// POST /api/timeslots
router.post('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { label, startTime, endTime, isBookable, sortOrder } = req.body;
    if (!label || !startTime || !endTime) {
      return res.status(400).json({ message: 'Etiqueta, hora inicio y hora fin son requeridos' });
    }
    const [result] = await pool.query(
      'INSERT INTO time_slots (label, start_time, end_time, is_bookable, sort_order) VALUES (?, ?, ?, ?, ?)',
      [label.trim(), startTime, endTime, isBookable !== false ? 1 : 0, sortOrder || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Franja horaria creada correctamente' });
  } catch (err) { next(err); }
});

// PUT /api/timeslots/:id
router.put('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { label, startTime, endTime, isBookable, sortOrder } = req.body;
    if (!label || !startTime || !endTime) {
      return res.status(400).json({ message: 'Etiqueta, hora inicio y hora fin son requeridos' });
    }
    await pool.query(
      'UPDATE time_slots SET label=?, start_time=?, end_time=?, is_bookable=?, sort_order=? WHERE id=?',
      [label.trim(), startTime, endTime, isBookable !== false ? 1 : 0, sortOrder || 0, req.params.id]
    );
    res.json({ message: 'Franja horaria actualizada correctamente' });
  } catch (err) { next(err); }
});

// DELETE /api/timeslots/:id
router.delete('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const [reservations] = await pool.query(
      'SELECT COUNT(*) as count FROM reservations WHERE time_slot_id = ?', [req.params.id]
    );
    if (reservations[0].count > 0) {
      return res.status(409).json({ message: 'No se puede eliminar: tiene reservas asociadas' });
    }
    await pool.query('DELETE FROM time_slots WHERE id = ?', [req.params.id]);
    res.json({ message: 'Franja horaria eliminada correctamente' });
  } catch (err) { next(err); }
});

// PATCH /api/timeslots/reorder
router.patch('/reorder', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { order } = req.body; // [{ id: 1, sortOrder: 0 }, ...]
    if (!Array.isArray(order)) return res.status(400).json({ message: 'Se requiere un arreglo de orden' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const item of order) {
        await conn.query('UPDATE time_slots SET sort_order = ? WHERE id = ?', [item.sortOrder, item.id]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    res.json({ message: 'Orden actualizado correctamente' });
  } catch (err) { next(err); }
});

module.exports = router;
