# Horario-EPT — Sistema de Reserva de Laboratorios
<img width="1321" height="621" alt="image" src="https://github.com/user-attachments/assets/a68e56c7-0f1c-4bc9-be2b-00a54d0522c1" />

> Aplicación web para gestionar la reserva de ambientes de innovación tecnológica en instituciones educativas secundarias de nivel secundario.

---

## Índice

1. [Descripción](#descripción)
2. [Características](#características)
3. [Stack tecnológico](#stack-tecnológico)
4. [Requisitos previos](#requisitos-previos)
5. [Instalación y despliegue](#instalación-y-despliegue)
6. [Configuración inicial](#configuración-inicial)
7. [Guía de uso](#guía-de-uso)
8. [Estructura del proyecto](#estructura-del-proyecto)
9. [API Reference](#api-reference)
10. [Variables de entorno](#variables-de-entorno)
11. [Gestión de respaldos](#gestión-de-respaldos)
12. [Soporte técnico](#soporte-técnico)

---

## Descripción

**Horario-EPT** reemplaza el tradicional cuaderno físico de reservas por una plataforma web colaborativa, accesible desde cualquier dispositivo (PC, tablet o móvil). Permite que los docentes de una institución educativa reserven horas en los laboratorios de innovación tecnológica de forma organizada, evitando conflictos de horario y facilitando la gestión administrativa.

---

## Características

### Para docentes
- **Horario semanal interactivo** — visualización clara por ambiente con navegación entre semanas
- **Reserva individual o múltiple** — reservar una o varias horas consecutivas en un solo paso
- **Selección de grado y sección** — identifica exactamente qué grupo usará el laboratorio (1ro A, 3ro B, etc.)
- **Disponibilidad en tiempo real** — las celdas ocupadas se bloquean automáticamente al instante
- **Reservas protegidas** — una vez confirmada, solo el administrador puede cancelar una reserva (evita eliminaciones accidentales)

### Para el administrador
- **Panel de administración completo** con acceso protegido
- **Configuración de institución** — nombre y logotipo personalizable
- **Gestión de ambientes** — crear, editar y desactivar laboratorios
- **Gestión de franjas horarias** — configurar horas de clase, recreos y almuerzos
- **Gestión de usuarios** — crear cuentas con rol administrador o docente, cambiar contraseñas
- **Eliminación de reservas** — solo el administrador puede cancelar reservas existentes
- **Reporte semanal imprimible** — membrete institucional + grilla completa en A4 horizontal, con fecha de generación
- **Respaldos de base de datos** — crear y descargar respaldos SQL, restaurar desde archivo

### General
- **Multi-usuario simultáneo** — múltiples docentes pueden usar la app al mismo tiempo
- **Diseño responsivo** — adaptado para PC, tablet y móviles
- **Módulo de soporte técnico** — datos de contacto del desarrollador accesibles desde la barra de navegación
- **Seguridad JWT** — tokens con expiración de 8 horas
- **Zona horaria Perú (UTC-5)**

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite, CSS personalizado |
| Backend | Node.js 20 + Express 4 |
| Base de datos | MySQL 8.0 |
| Servidor web | nginx 1.25 (Alpine) |
| Contenedores | Docker + Docker Compose v2 |
| Autenticación | JSON Web Tokens (JWT) |

---

## Requisitos previos

- **Docker Desktop** v4.x o superior instalado y en ejecución
- **Docker Compose** v2 (incluido en Docker Desktop)
- Puerto **8087** disponible en el servidor/equipo (configurable)
- Conexión a internet solo para la primera construcción (descarga de imágenes Docker)

---

## Instalación y despliegue

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/Horario-EPT.git
cd Horario-EPT
```

### 2. Configurar las variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

Editar `.env` con contraseñas seguras (ver sección [Variables de entorno](#variables-de-entorno)).

### 3. Construir y levantar los contenedores

```bash
docker compose up -d --build
```

> La primera construcción tarda unos minutos mientras descarga las imágenes base. Las siguientes ejecuciones son más rápidas.

### 4. Verificar que los contenedores están corriendo

```bash
docker compose ps
```

Deberías ver tres servicios en estado `running`:

```
NAME                     STATUS
horario_ept_mysql        running (healthy)
horario_ept_backend      running
horario_ept_frontend     running
```

### 5. Acceder a la aplicación

Abrir el navegador en: **http://localhost:8087**

---

## Configuración inicial

Al iniciar por primera vez, el sistema crea automáticamente las cuentas y datos base:

### Credenciales por defecto

| Rol | Usuario | Contraseña inicial |
|-----|---------|-------------------|
| Administrador | `admin` | `Admin123!` |
| Docentes (cuenta compartida) | `docentes` | `Docentes123!` |

> **Seguridad:** Cambia ambas contraseñas desde **Admin → Usuarios** antes de poner en producción.

### Datos precargados

| Dato | Descripción |
|------|-------------|
| 2 ambientes | Laboratorio de Innovación 1 y 2 |
| 11 franjas horarias | De 07:45 a 15:45, incluye recreo y almuerzo |
| Configuración base | Nombre genérico — personalizar en Admin → Configuración |

### Pasos recomendados de configuración

1. Iniciar sesión como `admin`
2. Ir a **Admin → Configuración** y cambiar el nombre de la institución
3. Subir el logotipo institucional (JPG/PNG, máx. 2 MB)
4. Ir a **Admin → Usuarios** y cambiar las contraseñas por defecto
5. Revisar **Admin → Ambientes** y ajustar los nombres de los laboratorios
6. Revisar **Admin → Horarios** y ajustar las franjas según el horario real de la institución
7. Comunicar a los docentes las credenciales de acceso

---

## Guía de uso

### Acceso de docentes

Todos los docentes comparten una única cuenta (`docentes`) que el administrador configura. Este diseño simplifica la gestión — no es necesario crear una cuenta por cada profesor.

### Hacer una reserva

1. Iniciar sesión con las credenciales de docente
2. Seleccionar el ambiente (tab Lab 1 / Lab 2)
3. Navegar a la semana deseada con las flechas `<` `>`
4. Hacer clic en una celda **verde disponible**
5. En el modal que aparece:
   - Seleccionar cuántas **horas consecutivas** reservar (clic en el chip de la última hora deseada)
   - Ingresar nombre del docente, asignatura, grado y sección
   - Confirmar la reserva
6. Las celdas reservadas muestran el nombre del docente, asignatura y grado/sección

### Reserva de horas consecutivas

Al abrir el modal de reserva, el sistema detecta automáticamente las horas disponibles a partir del slot seleccionado. Se muestran como chips clicables:

- El **primer chip** (azul oscuro) siempre está incluido — es la hora de inicio
- Los siguientes chips están disponibles para seleccionar
- La selección es un rango contiguo — clic en cualquier chip para definir hasta dónde reservar
- El sistema se detiene automáticamente en celdas ocupadas o en recreos/almuerzos

### Imprimir el horario semanal

1. Navegar a la semana deseada
2. Seleccionar el ambiente a imprimir
3. Clic en **"Imprimir / Exportar"**
4. Se abre el diálogo de impresión del sistema
5. El documento incluye: membrete institucional (logo + nombre), grilla completa Mon–Vie, franja horaria, fecha de impresión y pie de página

> **Formato:** A4 horizontal (landscape), optimizado para imprimir y pegar en la entrada del laboratorio al inicio de cada semana.

### Cancelar una reserva (solo administrador)

1. Iniciar sesión como administrador
2. En la grilla, pasar el cursor sobre la celda reservada
3. Aparece el botón 🗑 rojo — clic para eliminar con confirmación

> Los docentes ven un candado 🔒 en las reservas pero **no pueden eliminarlas**, lo que evita cancelaciones accidentales.

---

## Estructura del proyecto

```
Horario-EPT/
│
├── docker-compose.yml          # Orquestación de 3 servicios
├── .env                        # Variables de entorno (NO subir a git)
├── .env.example                # Plantilla de variables
│
├── mysql/
│   ├── init/
│   │   └── 01_schema.sql       # Esquema completo + datos iniciales
│   └── conf/
│       └── my.cnf              # Charset UTF8MB4, zona horaria Perú
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Servidor Express + inicialización
│       ├── config/
│       │   └── db.js           # Pool de conexiones MySQL2
│       ├── middleware/
│       │   ├── auth.js         # Verificación JWT + rol admin
│       │   └── errorHandler.js # Manejo global de errores
│       └── routes/
│           ├── auth.routes.js          # Login / me
│           ├── reservations.routes.js  # CRUD reservas + batch
│           ├── rooms.routes.js         # CRUD ambientes
│           ├── timeslots.routes.js     # CRUD franjas horarias
│           ├── users.routes.js         # CRUD usuarios (admin)
│           ├── settings.routes.js      # Config + upload logo
│           └── backup.routes.js        # Respaldo / restauración
│
└── frontend/
    ├── Dockerfile              # Build multietapa: Node → nginx
    ├── nginx.conf              # SPA fallback + proxy /api/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/
        │   └── client.js       # Axios + interceptores JWT
        ├── context/
        │   ├── AuthContext.jsx
        │   └── SettingsContext.jsx
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── SchedulePage.jsx        # Vista principal del horario
        │   └── admin/
        │       ├── AdminLayout.jsx
        │       ├── DashboardPage.jsx
        │       ├── RoomsPage.jsx
        │       ├── TimeSlotsPage.jsx
        │       ├── UsersPage.jsx
        │       ├── SettingsPage.jsx
        │       └── BackupPage.jsx
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.jsx          # Con botón de soporte integrado
        │   │   └── Sidebar.jsx
        │   ├── reservations/
        │   │   └── ReservationModal.jsx # Selector de horas consecutivas
        │   └── common/
        │       ├── Modal.jsx
        │       ├── Toast.jsx
        │       └── ConfirmDialog.jsx
        └── styles/
            ├── global.css              # Sistema de diseño completo
            └── print.css               # Estilos A4 horizontal para impresión
```

---

## API Reference

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <token>
```

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | — | Retorna token JWT + info de usuario |
| `GET`  | `/api/auth/me`    | ✓ | Retorna datos del usuario actual |

### Reservaciones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET`    | `/api/reservations` | ✓ | Horario semanal. Params: `weekStart`, `roomId` |
| `POST`   | `/api/reservations` | ✓ | Crear reserva individual |
| `POST`   | `/api/reservations/batch` | ✓ | Crear múltiples horas consecutivas (transacción) |
| `DELETE` | `/api/reservations/:id` | Admin | Eliminar reserva |
| `GET`    | `/api/reservations/report` | ✓ | Datos para reporte imprimible |

### Ambientes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET`    | `/api/rooms`     | ✓ | Lista de ambientes activos |
| `POST`   | `/api/rooms`     | Admin | Crear ambiente |
| `PUT`    | `/api/rooms/:id` | Admin | Actualizar ambiente |
| `DELETE` | `/api/rooms/:id` | Admin | Desactivar/eliminar ambiente |

### Franjas horarias

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET`    | `/api/timeslots`           | ✓ | Lista de franjas |
| `POST`   | `/api/timeslots`           | Admin | Crear franja |
| `PUT`    | `/api/timeslots/:id`       | Admin | Actualizar franja |
| `DELETE` | `/api/timeslots/:id`       | Admin | Eliminar franja |
| `PATCH`  | `/api/timeslots/reorder`   | Admin | Reordenar franjas |

### Usuarios

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET`    | `/api/users`                  | Admin | Lista de usuarios |
| `POST`   | `/api/users`                  | Admin | Crear usuario |
| `PUT`    | `/api/users/:id`              | Admin | Actualizar datos |
| `PATCH`  | `/api/users/:id/password`     | Admin | Cambiar contraseña |
| `DELETE` | `/api/users/:id`              | Admin | Desactivar usuario |

### Configuración

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET`  | `/api/settings`      | — | Nombre e institución (público) |
| `PUT`  | `/api/settings`      | Admin | Actualizar nombre |
| `POST` | `/api/settings/logo` | Admin | Subir logotipo |
| `DELETE` | `/api/settings/logo` | Admin | Eliminar logotipo |

### Respaldos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/backup/create`          | Admin | Genera y descarga archivo `.sql` |
| `POST` | `/api/backup/restore`         | Admin | Restaura desde archivo `.sql` |
| `GET`  | `/api/backup/logs`            | Admin | Historial de operaciones |
| `GET`  | `/api/backup/files`           | Admin | Archivos de respaldo en servidor |

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```env
# Base de datos MySQL
MYSQL_ROOT_PASSWORD=cambia_esto_root        # Contraseña del usuario root de MySQL
MYSQL_DATABASE=horario_ept                  # Nombre de la base de datos
MYSQL_USER=horario_user                     # Usuario de la aplicación
MYSQL_PASSWORD=cambia_esto_user             # Contraseña del usuario de la aplicación

# Seguridad JWT (usar un string largo y aleatorio)
JWT_SECRET=cambia_esto_por_un_string_muy_largo_y_aleatorio

# Puerto de acceso a la aplicación
APP_PORT=8087                               # Puerto expuesto en el host
```

> **Nunca** subas el archivo `.env` al repositorio. Está incluido en `.gitignore`.

---

## Gestión de respaldos

### Crear un respaldo

1. Iniciar sesión como administrador
2. Ir a **Admin → Respaldos**
3. Clic en **"Crear y Descargar Respaldo"**
4. El archivo `backup_YYYY-MM-DDTHH-MM-SS.sql` se descarga automáticamente

### Restaurar un respaldo

1. Ir a **Admin → Respaldos**
2. Clic en **"Seleccionar archivo .sql"**
3. Elegir el archivo de respaldo
4. Clic en **"Restaurar"** y confirmar la advertencia

> ⚠️ La restauración **sobrescribe todos los datos actuales**. Se recomienda crear un respaldo previo antes de restaurar.

### Comandos Docker para respaldo manual

```bash
# Respaldo manual de la base de datos
docker exec horario_ept_mysql mysqldump \
  -u horario_user -pTU_PASSWORD horario_ept > backup_manual.sql

# Restauración manual
docker exec -i horario_ept_mysql mysql \
  -u horario_user -pTU_PASSWORD horario_ept < backup_manual.sql
```

---

## Comandos útiles de Docker

```bash
# Levantar (primera vez o tras cambios)
docker compose up -d --build

# Levantar sin reconstruir
docker compose up -d

# Ver estado de contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Detener sin borrar datos
docker compose down

# Detener y eliminar todos los datos (reset completo)
docker compose down -v

# Reiniciar un servicio específico
docker compose restart backend
```

---

## Soporte técnico

Para soporte, consultas o mejoras del sistema:

| | |
|--|--|
| **Desarrollador** | Franklin Hiustong Gutierrez Arizaca |
| **Profesión** | Ingeniero de Sistemas |
| **Correo** | fgutierrezarizaca@gmail.com |
| **Celular / WhatsApp** | +51 973 158 561 |
| **Web** | [www.guiratec.com](https://www.guiratec.com) |

> El módulo de soporte también está disponible dentro de la aplicación haciendo clic en el botón **"Soporte"** de la barra de navegación.

---

## Licencia

Este proyecto fue desarrollado a medida para instituciones educativas peruanas.
Todos los derechos reservados © 2026 — Franklin Hiustong Gutierrez Arizaca / [Guiratec](https://www.guiratec.com)
