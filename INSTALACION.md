# Instalación y puesta en producción — Sistema de Metrología

Este paquete contiene **todo** lo necesario para instalar el sistema en un servidor
o dominio propio.

```
metrologia-entrega/
├── frontend/          App web (React). En producción se compila a HTML/JS estáticos.
├── backend/           API (Node.js + Express). También sirve el frontend ya compilado.
├── db/                Scripts SQL: 01_schema.sql (tablas) + 02_datos_iniciales.sql (datos).
├── Dockerfile         Imagen única: compila el frontend y arranca el backend.
├── docker-compose.yml PostgreSQL + la app, listo para "docker compose up".
├── .env.example       Variables a configurar (copiar a .env).
├── API.md             Referencia de todos los endpoints.
└── INSTALACION.md     Este archivo.
```

## 1. Cómo funciona (arquitectura)

```
   Tablet (piso de planta)                 Servidor / dominio                 PC del metrólogo
 ┌───────────────────────┐            ┌──────────────────────────┐          ┌──────────────────┐
 │  App web instalada     │  HTTPS    │  Node/Express  ──────────┐│  lee     │  Navegador        │
 │  (Registro de medición │ ───────►  │  API  +  frontend        ││ ◄──────  │  panel admin      │
 │   y de préstamo)       │           │            │             ││          │  (mismo dominio)  │
 └───────────────────────┘           │        PostgreSQL ◄───────┘│          └──────────────────┘
                                     └──────────────────────────┘
```

- La **tablet** abre `https://tu-dominio` y usa las pantallas públicas
  (Registro de solicitud de medición / Registro de préstamo). Al enviar, los datos
  viajan por HTTPS a la API y quedan guardados en PostgreSQL.
- El **metrólogo** entra a `https://tu-dominio` → botón **Admin**, inicia sesión y ve
  en tiempo real la cola de mediciones, el historial, catálogo, préstamos, etc.
- Es la **misma aplicación y la misma base de datos**: la tablet escribe, la PC del
  metrólogo lee. No hay que instalar nada en la PC del metrólogo (solo un navegador).

## 2. Requisitos

- Un servidor Linux (o Windows) con **Docker** y **Docker Compose**, ó
- Node.js **18+** y PostgreSQL **14+** si prefieres instalación manual.
- Un dominio o subdominio apuntando al servidor (p. ej. `metrologia.tuempresa.com`).
- HTTPS (imprescindible para que la app se pueda **instalar** en tablets y celulares).

---

## 3. Opción A — Docker (recomendada)

Es la forma más rápida y reproducible.

```bash
# 1) Copia el paquete al servidor y entra en la carpeta
cd metrologia-entrega

# 2) Configura las variables
cp .env.example .env
nano .env          # cambia DB_PASSWORD, JWT_SECRET y FRONTEND_URL

#    genera un JWT_SECRET fuerte:
#    openssl rand -base64 48

# 3) Arranca (compila el frontend, crea la BD y carga datos la primera vez)
docker compose up -d --build

# 4) Verifica
curl http://localhost:4000/health        # -> {"ok":true,...}
docker compose logs -f app
```

La app queda escuchando en el puerto `APP_PORT` (4000 por defecto).
Detrás debe ir un **reverse proxy con HTTPS** (ver sección 5).

**Actualizar** a una versión nueva del código:

```bash
docker compose up -d --build      # reconstruye; la BD y los archivos se conservan
```

Los datos viven en volúmenes Docker (`db_data`, `uploads`) y **no** se borran al reconstruir.

---

## 4. Opción B — Instalación manual (VPS con Node + PostgreSQL)

### 4.1 Base de datos

```bash
sudo -u postgres psql
CREATE DATABASE metrologia;
CREATE USER metrologia_app WITH PASSWORD 'una_contraseña_fuerte';
GRANT ALL PRIVILEGES ON DATABASE metrologia TO metrologia_app;
\q

# cargar estructura + datos iniciales
psql -U metrologia_app -d metrologia -f db/01_schema.sql
psql -U metrologia_app -d metrologia -f db/02_datos_iniciales.sql
```

### 4.2 Backend

```bash
cd backend
cp .env.example .env
nano .env                    # PORT, DB_*, JWT_SECRET, FRONTEND_URL
npm install --omit=dev
```

### 4.3 Frontend (compilar)

```bash
cd ../frontend
npm install
npm run build                # usa .env.production (REACT_APP_API_URL=/api)
```

Esto genera `frontend/build/`. El backend lo detecta automáticamente y lo sirve.

### 4.4 Arrancar como servicio

`npm start` dentro de `backend/` funciona, pero para producción usa **pm2** o systemd:

```bash
npm install -g pm2
cd backend && pm2 start server.js --name metrologia
pm2 save && pm2 startup       # arranque automático al reiniciar el servidor
```

---

## 5. HTTPS / reverse proxy (Nginx)

Ejemplo de bloque Nginx (con certificado de Let's Encrypt / certbot):

```nginx
server {
    server_name metrologia.tuempresa.com;

    client_max_body_size 60M;        # permite subir Excel/PDF grandes

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    # ssl_certificate / ssl_certificate_key -> los pone certbot
}
```

En `.env` pon `FRONTEND_URL=https://metrologia.tuempresa.com` y `TRUST_PROXY=1`.

---

## 6. Instalar la app en la tablet (iOS / Android)

La app es una **PWA**: se instala desde el navegador, sin tiendas.

**Android (Chrome):**
1. Abre `https://tu-dominio`.
2. Menú ⋮ → **Instalar aplicación** / **Agregar a pantalla de inicio**.
3. Queda como un ícono más, a pantalla completa.

**iPad / iPhone (Safari):**
1. Abre `https://tu-dominio`.
2. Botón **Compartir** → **Agregar a inicio**.

> Requiere HTTPS válido. En `http://` o con certificado inválido no aparece la opción de instalar.

---

## 7. Seguridad — lista de verificación

- [ ] **Cambiar la contraseña del admin.** Usuario por defecto: `demo` / `Demo1234!`.
      Entra al panel → (o crea un usuario nuevo con `POST /api/usuarios` y desactiva el viejo).
- [ ] **`JWT_SECRET`** largo y aleatorio en `.env` (nunca el de ejemplo).
- [ ] **`FRONTEND_URL`** con tu dominio exacto (no dejar `*`).
- [ ] Servir **solo por HTTPS** (reverse proxy + certificado).
- [ ] Usuario de PostgreSQL dedicado y con contraseña fuerte (no `postgres`/`1234`).
- [ ] No exponer el puerto 5432 de PostgreSQL a Internet (solo local / red interna).
- [ ] Copias de seguridad de la BD (sección 8).

Ya viene incluido: cabeceras de seguridad (`helmet`), límite de intentos de login
(20 / 15 min por IP), contraseñas con `bcrypt`, sesiones con JWT firmado y caducidad.

---

## 8. Copias de seguridad

**Base de datos:**
```bash
# Docker
docker compose exec db pg_dump -U metrologia_app metrologia > backup_$(date +%F).sql
# Manual
pg_dump -U metrologia_app metrologia > backup_$(date +%F).sql
```

**Archivos subidos** (imágenes de piezas, PDF/Excel de instrucciones):
- Docker: volumen `uploads` → `docker run --rm -v metrologia-entrega_uploads:/u -v $PWD:/b alpine tar czf /b/uploads_$(date +%F).tgz -C /u .`
- Manual: carpeta `backend/uploads/`.

Recomendado: un cron diario que haga ambos y los copie a otro disco / nube.

---

## 9. Mantenimiento y cambios futuros

**Sí se pueden seguir haciendo cambios** después de instalar. El flujo normal es:

1. Se modifica el código (en `frontend/src/...` o `backend/src/...`).
2. **Frontend:** `npm run build` otra vez  ·  **Docker:** `docker compose up -d --build`.
3. **Backend:** reiniciar el proceso (`pm2 restart metrologia` o `docker compose up -d`).
4. La base de datos y los archivos subidos **se conservan**.

Cambios de estructura de BD (nuevas columnas/tablas): se agregan como
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` — el sistema ya usa ese patrón y no
rompe datos existentes.

Para desarrollo local (hacer cambios y probarlos):
```bash
# terminal 1
cd backend && npm install && npm run dev      # API en :4000
# terminal 2
cd frontend && npm install && npm start       # web en :3000
```

---

## 10. Datos iniciales que trae el paquete

- **1 usuario admin:** `demo` / `Demo1234!`  → **cámbialo**.
- Empleados, piezas de ejemplo, dispositivos y las 4 áreas base
  (Producción, Calidad, Ingeniería, Mantenimiento).

Todo eso es editable desde el panel (Catálogo, Préstamos → Áreas, etc.).
Si prefieres empezar en blanco, edita `db/02_datos_iniciales.sql` antes de instalar
y deja solo el `INSERT` del usuario admin.
