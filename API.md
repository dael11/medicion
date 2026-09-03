# API — Sistema de Metrología

Base URL: `https://TU_DOMINIO/api`  (en desarrollo: `http://localhost:4000/api`)

Formato: JSON. Autenticación: `Authorization: Bearer <token>` en los endpoints marcados **🔒**.
El token se obtiene en `POST /auth/login` y dura lo que indique `JWT_EXPIRES_IN` (por defecto 8 h).

---

## Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| POST | `/auth/login` | — | Body `{ username, password }` → `{ token, usuario }`. Límite: 20 intentos / 15 min por IP. |
| GET  | `/auth/me` | 🔒 | Datos del usuario del token. |

## Empleados  (solicitantes)

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| GET    | `/empleados` | — | Lista de empleados. |
| GET    | `/empleados/departamentos` | — | Departamentos usados (para autocompletar). |
| POST   | `/empleados` | 🔒 | `{ nombre, departamento }`. |
| PUT    | `/empleados/:id` | 🔒 | `{ nombre?, departamento?, activo? }` (activo:true reactiva). |
| DELETE | `/empleados/:id` | 🔒 | Baja lógica (`activo=false`). |

## Piezas  (catálogo de No. de parte)

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| GET    | `/piezas` | — | Piezas activas. Incluye `tiempo_medicion` (Full Layout), `tiempos_extra` `{ tipoOtro, razones:{} }`, `archivos[]`. |
| GET    | `/piezas/:id` | — | Una pieza. |
| POST   | `/piezas` | 🔒 | Crea. Campos: `no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, tiempo_medicion, tiempos_extra, archivos`. |
| PUT    | `/piezas/:id` | 🔒 | Actualiza (todos los campos opcionales). |
| DELETE | `/piezas/:id` | 🔒 | Baja lógica. |

## Áreas  (destino de préstamos, administrables)

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| GET    | `/areas` | — | Áreas activas `{ id, nombre, icono, color, orden }`. |
| POST   | `/areas` | 🔒 | `{ nombre, icono?, color? }`. |
| PUT    | `/areas/:id` | 🔒 | `{ nombre?, icono?, color?, activo? }`. |
| DELETE | `/areas/:id` | 🔒 | Baja lógica. |

## Solicitudes de medición

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| GET | `/solicitudes` | 🔒 | Cola activa (pendiente + en proceso), ordenada por prioridad y fecha. |
| GET | `/solicitudes/historial` | 🔒 | Terminadas. Filtros query: `desde, hasta, pieza, cliente`. |
| POST | `/solicitudes` | — | Alta desde la tablet. Campos: `empleado_nombre, no_parte, cliente, tipo_medicion, prioridad, razon, tipo_descripcion, tipo_descripcion_detalle, cantidad, tiempo_por_pieza, tiempo_razon, tiempo_tipo, tiempo_total`. |
| PUT | `/solicitudes/:id/iniciar` | 🔒 | pendiente → en proceso. |
| PUT | `/solicitudes/:id/terminar` | 🔒 | en proceso → terminado. |
| PUT | `/solicitudes/:id/tiempo` | 🔒 | `{ tiempo_transcurrido }` (tick del cronómetro). |

## Dispositivos  (equipos que se prestan)

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| GET    | `/dispositivos` | — | Dispositivos activos. |
| POST   | `/dispositivos` | 🔒 | `{ nombre, descripcion, numero_serie, categoria }`. |
| PUT    | `/dispositivos/:id` | 🔒 | Actualiza. |
| DELETE | `/dispositivos/:id` | 🔒 | Baja lógica. |

## Préstamos

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| GET  | `/prestamos` | 🔒 | Préstamos activos. |
| GET  | `/prestamos/historial` | 🔒 | Devueltos. |
| GET  | `/prestamos/count` | — | `{ total }` de préstamos activos (para el panel). |
| POST | `/prestamos` | — | Alta desde la tablet. `{ empleado_nombre, dispositivo_id, dispositivo_nombre, para_que, fecha_devolucion_estimada }`. |
| PUT  | `/prestamos/:id/devolver` | 🔒 | Marca devuelto. |

## Usuarios  (administradores del sistema)

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| GET    | `/usuarios` | 🔒 | Lista. |
| POST   | `/usuarios` | 🔒 | `{ nombre, username, password }`. |
| PUT    | `/usuarios/:id` | 🔒 | `{ nombre?, username?, password?, activo? }`. |
| DELETE | `/usuarios/:id` | 🔒 | Baja lógica. |

## Archivos

| Método | Ruta | Auth | Descripción |
|---|---|:--:|---|
| POST | `/upload/imagen`  | 🔒 | multipart `imagen`  (jpg, png, gif, webp, svg — máx 20 MB) → `{ url, filename }`. |
| POST | `/upload/archivo` | 🔒 | multipart `archivo` (pdf, xls, xlsx, xlsm, csv, doc, docx, dwg, imágenes — máx 50 MB) → `{ url, filename }`. |

Los archivos se sirven en `GET /uploads/<ruta>` (estático, sin auth).

## Otros

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | `{ ok: true, ts }` — para monitoreo / health checks. |
