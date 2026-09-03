# Sistema de Laboratorio de Metrología

Aplicación web para el laboratorio de metrología: registro de solicitudes de
medición desde tablet, cola y planificación, historial, catálogo de piezas y
empleados, instrucciones de trabajo (Excel/PDF por No. de parte) y control de
préstamos de dispositivos.

- **Frontend:** React (Create React App).
- **Backend:** Node.js + Express.
- **Base de datos:** PostgreSQL.
- **Instalable** como app (PWA) en tablets iOS/Android.

## Puesta en marcha rápida (Docker)

```bash
cp .env.example .env      # y edita DB_PASSWORD, JWT_SECRET, FRONTEND_URL
docker compose up -d --build
```
App en `http://SERVIDOR:4000` — pon un reverse proxy con HTTPS delante.

## Documentación

| Archivo | Contenido |
|---|---|
| [`INSTALACION.md`](INSTALACION.md) | Instalación paso a paso (Docker y manual), HTTPS, PWA, seguridad, backups, cómo seguir haciendo cambios. |
| [`API.md`](API.md) | Referencia de todos los endpoints de la API. |
| `db/01_schema.sql` | Estructura de la base de datos. |
| `db/02_datos_iniciales.sql` | Datos iniciales (usuario admin, catálogos base). |

## Acceso por defecto

Panel admin: usuario **`demo`** / contraseña **`Demo1234!`** — **cámbialo tras instalar.**
