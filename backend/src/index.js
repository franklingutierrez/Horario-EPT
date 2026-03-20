require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const pool     = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes        = require('./routes/auth.routes');
const reservationRoutes = require('./routes/reservations.routes');
const roomRoutes        = require('./routes/rooms.routes');
const timeslotRoutes    = require('./routes/timeslots.routes');
const userRoutes        = require('./routes/users.routes');
const settingsRoutes    = require('./routes/settings.routes');
const backupRoutes      = require('./routes/backup.routes');

const app  = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Archivos estáticos (logos)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth',         authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/rooms',        roomRoutes);
app.use('/api/timeslots',    timeslotRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/settings',     settingsRoutes);
app.use('/api/backup',       backupRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Manejador de errores global
app.use(errorHandler);

// Inicializar usuarios por defecto
async function initDefaults() {
  const conn = await pool.getConnection();
  try {
    // Crear admin por defecto si no existe ninguno
    const [admins] = await conn.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (admins.length === 0) {
      const hash = await bcrypt.hash('Admin123!', 10);
      await conn.query(
        "INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, 'admin', ?)",
        ['admin', hash, 'Administrador']
      );
      console.log('✓ Usuario administrador creado: admin / Admin123!');
    }

    // Crear cuenta compartida de docentes si no existe
    const [teachers] = await conn.query("SELECT id FROM users WHERE username = 'docentes' LIMIT 1");
    if (teachers.length === 0) {
      const hash = await bcrypt.hash('Docentes123!', 10);
      await conn.query(
        "INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, 'teacher', ?)",
        ['docentes', hash, 'Cuenta Docentes']
      );
      console.log('✓ Cuenta docentes creada: docentes / Docentes123!');
    }
  } finally {
    conn.release();
  }
}

// Iniciar servidor con reintentos para esperar la DB
async function startServer() {
  let retries = 15;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('✓ Conexión a MySQL establecida');
      await initDefaults();
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error('✗ No se pudo conectar a MySQL:', err.message);
        process.exit(1);
      }
      console.log(`  Esperando MySQL... (${retries} intentos restantes)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  app.listen(PORT, () => {
    console.log(`✓ Servidor corriendo en puerto ${PORT}`);
  });
}

startServer();
