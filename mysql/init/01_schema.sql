-- ============================================================
--  Horario-EPT — Schema de base de datos
--  Ejecutado automáticamente al crear el contenedor MySQL
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Configuración de la institución
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id               INT          NOT NULL DEFAULT 1,
  institution_name VARCHAR(200) NOT NULL DEFAULT 'Institución Educativa',
  logo_url         VARCHAR(500)          DEFAULT NULL,
  work_days        VARCHAR(20)  NOT NULL DEFAULT '1,2,3,4,5',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO settings (id, institution_name) VALUES (1, 'Institución Educativa');

-- ------------------------------------------------------------
-- Usuarios del sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT          NOT NULL AUTO_INCREMENT,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','teacher') NOT NULL DEFAULT 'teacher',
  display_name  VARCHAR(200) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Ambientes / Laboratorios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id          INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(500)          DEFAULT NULL,
  capacity    INT                   DEFAULT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO rooms (id, name, description, capacity, sort_order) VALUES
  (1, 'Laboratorio de Innovación 1', 'Primer laboratorio de cómputo e innovación', 30, 1),
  (2, 'Laboratorio de Innovación 2', 'Segundo laboratorio de cómputo e innovación', 30, 2);

-- ------------------------------------------------------------
-- Franjas horarias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_slots (
  id          INT         NOT NULL AUTO_INCREMENT,
  label       VARCHAR(50) NOT NULL,
  start_time  TIME        NOT NULL,
  end_time    TIME        NOT NULL,
  is_bookable TINYINT(1)  NOT NULL DEFAULT 1,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_time_range (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO time_slots (id, label, start_time, end_time, is_bookable, sort_order) VALUES
  (1,  '1ra Hora',  '07:45:00', '08:30:00', 1,  1),
  (2,  '2da Hora',  '08:30:00', '09:15:00', 1,  2),
  (3,  '3ra Hora',  '09:15:00', '10:00:00', 1,  3),
  (4,  'Recreo',    '10:00:00', '10:15:00', 0,  4),
  (5,  '4ta Hora',  '10:15:00', '11:00:00', 1,  5),
  (6,  '5ta Hora',  '11:00:00', '11:45:00', 1,  6),
  (7,  '6ta Hora',  '11:45:00', '12:30:00', 1,  7),
  (8,  'Almuerzo',  '12:30:00', '13:30:00', 0,  8),
  (9,  '7ma Hora',  '13:30:00', '14:15:00', 1,  9),
  (10, '8va Hora',  '14:15:00', '15:00:00', 1, 10),
  (11, '9na Hora',  '15:00:00', '15:45:00', 1, 11);

-- ------------------------------------------------------------
-- Reservaciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id               INT          NOT NULL AUTO_INCREMENT,
  room_id          INT          NOT NULL,
  time_slot_id     INT          NOT NULL,
  reservation_date DATE         NOT NULL,
  teacher_name     VARCHAR(200) NOT NULL,
  subject          VARCHAR(200) NOT NULL,
  grade            VARCHAR(50)  NOT NULL,
  section          VARCHAR(10)  NOT NULL DEFAULT '',
  notes            TEXT                  DEFAULT NULL,
  created_by       INT          NOT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reservation (room_id, time_slot_id, reservation_date),
  KEY idx_date         (reservation_date),
  KEY idx_room_date    (room_id, reservation_date),
  CONSTRAINT fk_res_room      FOREIGN KEY (room_id)      REFERENCES rooms(id)       ON DELETE CASCADE,
  CONSTRAINT fk_res_slot      FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)  ON DELETE CASCADE,
  CONSTRAINT fk_res_user      FOREIGN KEY (created_by)   REFERENCES users(id)       ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Registro de respaldos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backup_log (
  id           INT          NOT NULL AUTO_INCREMENT,
  filename     VARCHAR(255) NOT NULL,
  performed_by INT          NOT NULL,
  action       ENUM('backup','restore') NOT NULL,
  status       ENUM('success','failed') NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_backup_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
