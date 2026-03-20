const router = require('express').Router();
const pool   = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/reservations?weekStart=YYYY-MM-DD&roomId=1
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { weekStart, roomId } = req.query;

    // Calcular lunes y viernes de la semana
    let startDate;
    if (weekStart) {
      startDate = new Date(weekStart + 'T00:00:00');
    } else {
      startDate = new Date();
      const day = startDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startDate.setDate(startDate.getDate() + diff);
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // viernes

    const fmt = (d) => d.toISOString().split('T')[0];

    let roomQuery = 'SELECT id, name, description, capacity FROM rooms WHERE is_active = 1 ORDER BY sort_order, id';
    const [rooms] = await pool.query(roomQuery);

    let resQuery = `
      SELECT r.id, r.room_id, r.time_slot_id, r.reservation_date,
             r.teacher_name, r.subject, r.grade, r.section, r.notes, r.created_by
      FROM reservations r
      WHERE r.reservation_date BETWEEN ? AND ?
    `;
    const params = [fmt(startDate), fmt(endDate)];
    if (roomId) {
      resQuery += ' AND r.room_id = ?';
      params.push(parseInt(roomId));
    }

    const [reservations] = await pool.query(resQuery, params);

    const [timeslots] = await pool.query(
      'SELECT id, label, start_time, end_time, is_bookable, sort_order FROM time_slots ORDER BY sort_order, id'
    );

    // Construir mapa de reservas: room_id -> date -> slot_id -> reservation
    const schedule = {};
    for (const res of reservations) {
      const roomKey = res.room_id;
      const dateKey = fmt(new Date(res.reservation_date));
      const slotKey = res.time_slot_id;
      if (!schedule[roomKey]) schedule[roomKey] = {};
      if (!schedule[roomKey][dateKey]) schedule[roomKey][dateKey] = {};
      schedule[roomKey][dateKey][slotKey] = {
        id:          res.id,
        teacherName: res.teacher_name,
        subject:     res.subject,
        grade:       res.grade,
        section:     res.section,
        notes:       res.notes,
        createdBy:   res.created_by,
      };
    }

    // Generar días de la semana (lunes a viernes)
    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(fmt(d));
    }

    res.json({
      weekStart: fmt(startDate),
      weekEnd:   fmt(endDate),
      days,
      timeslots: timeslots.map(ts => ({
        id:         ts.id,
        label:      ts.label,
        startTime:  ts.start_time.slice(0, 5),
        endTime:    ts.end_time.slice(0, 5),
        isBookable: ts.is_bookable === 1,
      })),
      rooms: rooms.map(room => ({
        ...room,
        schedule: schedule[room.id] || {},
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reservations
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { roomId, timeSlotId, reservationDate, teacherName, subject, grade, section, notes } = req.body;

    if (!roomId || !timeSlotId || !reservationDate || !teacherName || !subject || !grade || !section) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben estar completos' });
    }

    // Verificar que la fecha no es fin de semana
    const dayOfWeek = new Date(reservationDate + 'T00:00:00').getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ message: 'No se pueden hacer reservas en fines de semana' });
    }

    // Verificar que la franja es reservable
    const [slots] = await pool.query('SELECT is_bookable FROM time_slots WHERE id = ?', [timeSlotId]);
    if (!slots.length || !slots[0].is_bookable) {
      return res.status(400).json({ message: 'Esta franja horaria no está disponible para reservar' });
    }

    // Verificar disponibilidad
    const [existing] = await pool.query(
      'SELECT id FROM reservations WHERE room_id = ? AND time_slot_id = ? AND reservation_date = ?',
      [roomId, timeSlotId, reservationDate]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Este horario ya está reservado por otro docente' });
    }

    const [result] = await pool.query(
      `INSERT INTO reservations (room_id, time_slot_id, reservation_date, teacher_name, subject, grade, section, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomId, timeSlotId, reservationDate, teacherName.trim(), subject.trim(), grade.trim(), section.trim(), notes?.trim() || null, req.user.id]
    );

    res.status(201).json({ id: result.insertId, message: 'Reserva creada exitosamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Este horario ya está reservado por otro docente' });
    }
    next(err);
  }
});

// POST /api/reservations/batch  — reserva múltiples franjas consecutivas en una transacción
router.post('/batch', verifyToken, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { roomId, timeSlotIds, reservationDate, teacherName, subject, grade, section, notes } = req.body;

    if (!roomId || !Array.isArray(timeSlotIds) || !timeSlotIds.length ||
        !reservationDate || !teacherName || !subject || !grade || !section) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben estar completos' });
    }

    // Verificar que la fecha no es fin de semana
    const dayOfWeek = new Date(reservationDate + 'T00:00:00').getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ message: 'No se pueden hacer reservas en fines de semana' });
    }

    // Verificar que todas las franjas existen y son reservables
    const placeholders = timeSlotIds.map(() => '?').join(',');
    const [slots] = await conn.query(
      `SELECT id, label, is_bookable FROM time_slots WHERE id IN (${placeholders})`,
      timeSlotIds
    );
    if (slots.length !== timeSlotIds.length) {
      return res.status(400).json({ message: 'Una o más franjas horarias no existen' });
    }
    const notBookable = slots.find(s => !s.is_bookable);
    if (notBookable) {
      return res.status(400).json({ message: `La franja "${notBookable.label}" no está disponible para reservar` });
    }

    // Verificar que ninguna de las franjas ya está ocupada
    const [existing] = await conn.query(
      `SELECT ts.label FROM reservations r
       JOIN time_slots ts ON ts.id = r.time_slot_id
       WHERE r.room_id = ? AND r.reservation_date = ? AND r.time_slot_id IN (${placeholders})`,
      [roomId, reservationDate, ...timeSlotIds]
    );
    if (existing.length > 0) {
      const taken = existing.map(e => e.label).join(', ');
      return res.status(409).json({
        message: `Los siguientes horarios ya están reservados: ${taken}`
      });
    }

    // Insertar todas las reservas en una transacción atómica
    await conn.beginTransaction();
    const insertedIds = [];
    for (const slotId of timeSlotIds) {
      const [result] = await conn.query(
        `INSERT INTO reservations (room_id, time_slot_id, reservation_date, teacher_name, subject, grade, section, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [roomId, slotId, reservationDate, teacherName.trim(), subject.trim(), grade.trim(), section.trim(), notes?.trim() || null, req.user.id]
      );
      insertedIds.push(result.insertId);
    }
    await conn.commit();

    res.status(201).json({
      ids: insertedIds,
      count: insertedIds.length,
      message: `${insertedIds.length} reserva(s) creadas exitosamente`
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Uno o más horarios ya están reservados por otro docente' });
    }
    next(err);
  } finally {
    conn.release();
  }
});

// DELETE /api/reservations/:id
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo el administrador puede eliminar reservas' });
    }

    const [rows] = await pool.query('SELECT id FROM reservations WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    await pool.query('DELETE FROM reservations WHERE id = ?', [id]);
    res.json({ message: 'Reserva eliminada correctamente' });
  } catch (err) {
    next(err);
  }
});

// GET /api/reservations/report?weekStart=YYYY-MM-DD&roomId=1
router.get('/report', verifyToken, async (req, res, next) => {
  try {
    const { weekStart, roomId } = req.query;

    let startDate;
    if (weekStart) {
      startDate = new Date(weekStart + 'T00:00:00');
    } else {
      startDate = new Date();
      const day = startDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startDate.setDate(startDate.getDate() + diff);
    }
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4);

    const fmt = (d) => d.toISOString().split('T')[0];

    const [settings] = await pool.query('SELECT institution_name, logo_url FROM settings WHERE id = 1');
    const [timeslots] = await pool.query('SELECT * FROM time_slots ORDER BY sort_order');
    let roomQuery = 'SELECT * FROM rooms WHERE is_active = 1 ORDER BY sort_order';
    const [rooms] = await pool.query(roomQuery);

    let selectedRooms = rooms;
    if (roomId) selectedRooms = rooms.filter(r => r.id === parseInt(roomId));

    const [reservations] = await pool.query(
      `SELECT r.*, ro.name as room_name, ts.label as slot_label, ts.start_time, ts.end_time
       FROM reservations r
       JOIN rooms ro ON ro.id = r.room_id
       JOIN time_slots ts ON ts.id = r.time_slot_id
       WHERE r.reservation_date BETWEEN ? AND ?
       ${roomId ? 'AND r.room_id = ?' : ''}
       ORDER BY ro.sort_order, r.reservation_date, ts.sort_order`,
      roomId ? [fmt(startDate), fmt(endDate), parseInt(roomId)] : [fmt(startDate), fmt(endDate)]
    );

    res.json({
      institution: settings[0] || { institution_name: 'Institución Educativa', logo_url: null },
      weekStart:   fmt(startDate),
      weekEnd:     fmt(endDate),
      rooms:       selectedRooms,
      timeslots,
      reservations,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
