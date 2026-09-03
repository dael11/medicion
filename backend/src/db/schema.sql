-- ============================================
-- SCHEMA - Laboratorio de Metrología
-- ============================================

-- Extensión para UUID (opcional pero recomendado)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USUARIOS (admins del sistema) ──────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  username     VARCHAR(50)  NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  activo       BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── EMPLEADOS (los que solicitan mediciones) ───────────
CREATE TABLE IF NOT EXISTS empleados (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  departamento VARCHAR(50),
  activo       BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
-- Migración para instalaciones existentes:
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS departamento VARCHAR(50);

-- ── PIEZAS (catálogo de No. Parte) ─────────────────────
CREATE TABLE IF NOT EXISTS piezas (
  id               SERIAL PRIMARY KEY,
  no_parte         VARCHAR(50)  NOT NULL UNIQUE,
  cliente          VARCHAR(100) NOT NULL,
  descripcion      TEXT,
  parte_cliente    VARCHAR(100),
  nivel_dwg        VARCHAR(50),
  nivel_cad        VARCHAR(50),
  imagen_url       TEXT,
  archivos         JSONB        DEFAULT '[]'::jsonb,
  tiempo_medicion  INTEGER      NOT NULL DEFAULT 30,   -- minutos Full Layout (base) de la pieza
  tiempos_extra    JSONB        DEFAULT '{}'::jsonb,   -- { tipoOtro:int, razones:{ "<texto>":int } } — los define el admin al dar de alta la pieza
  activo           BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);
-- Migración para instalaciones existentes:
ALTER TABLE piezas ADD COLUMN IF NOT EXISTS archivos        JSONB   DEFAULT '[]'::jsonb;
ALTER TABLE piezas ADD COLUMN IF NOT EXISTS tiempo_medicion INTEGER NOT NULL DEFAULT 30;
ALTER TABLE piezas ADD COLUMN IF NOT EXISTS tiempos_extra   JSONB   DEFAULT '{}'::jsonb;

-- ── SOLICITUDES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS solicitudes (
  id                        SERIAL PRIMARY KEY,
  folio                     INTEGER      NOT NULL,
  empleado_id               INTEGER      REFERENCES empleados(id),
  empleado_nombre           VARCHAR(100) NOT NULL,
  pieza_id                  INTEGER      REFERENCES piezas(id),
  no_parte                  VARCHAR(50)  NOT NULL,
  cliente                   VARCHAR(100),
  tipo_medicion             VARCHAR(20)  NOT NULL,   -- PR, CP, Fixture, Otro
  prioridad                 VARCHAR(30)  NOT NULL,   -- Normal, Urgente, Crítico
  razon                     TEXT         NOT NULL,
  tipo_descripcion          VARCHAR(20)  NOT NULL,   -- Full, Otro
  tipo_descripcion_detalle  TEXT,
  cantidad                  INTEGER      NOT NULL DEFAULT 1,
  tiempo_por_pieza          INTEGER      NOT NULL,   -- minutos (pieza + tipo + razón)
  tiempo_razon              INTEGER      NOT NULL DEFAULT 0,  -- minutos que aporta la razón
  tiempo_tipo               INTEGER      NOT NULL DEFAULT 0,  -- minutos que aporta el tipo de medición
  tiempo_total              INTEGER      NOT NULL,   -- minutos
  tiempo_transcurrido       INTEGER      NOT NULL DEFAULT 0,
  estado                    VARCHAR(20)  NOT NULL DEFAULT 'pendiente', -- pendiente, proceso, terminado
  hora_inicio               TIMESTAMP,
  fecha_ingreso             TIMESTAMP    NOT NULL DEFAULT NOW(),
  fecha_fin                 TIMESTAMP,
  created_at                TIMESTAMP    NOT NULL DEFAULT NOW()
);
-- Migración para instalaciones existentes:
-- tiempo_razon / tiempo_tipo: minutos que el usuario captura al registrar la solicitud
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS tiempo_razon INTEGER NOT NULL DEFAULT 0;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS tiempo_tipo  INTEGER NOT NULL DEFAULT 0;

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado     ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_folio      ON solicitudes(folio);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha      ON solicitudes(fecha_ingreso);

-- ── ÁREAS (destino de préstamos, administrables) ───────
CREATE TABLE IF NOT EXISTS areas (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  icono  VARCHAR(8)  DEFAULT '📍',
  color  VARCHAR(9)  DEFAULT '#6b7280',
  activo BOOLEAN     NOT NULL DEFAULT true,
  orden  INTEGER     NOT NULL DEFAULT 0
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Usuario admin por defecto (password: admin1234)
-- El hash se genera con bcrypt rounds=10
INSERT INTO usuarios (nombre, username, password_hash)
VALUES ('Milton Rodriguez', 'milton', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- Empleados iniciales
INSERT INTO empleados (nombre, departamento) VALUES
  ('Angeles Alonso','Calidad'),('Erick Garcia','Producción'),('Cesar Minero','Calidad'),('Gustavo Alba','Ingeniería'),
  ('Mario Aguilar','Producción'),('Javier Hernandez','Mantenimiento'),('Jorge Martinez','Ingeniería'),('Antonio Vazquez','Producción'),
  ('Julio Sanchez','Calidad'),('Ricardo Frias','Mantenimiento'),('Victor Guadarrama','Producción'),('Milton Rodriguez','Calidad')
ON CONFLICT DO NOTHING;

-- Piezas iniciales
INSERT INTO piezas (no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, tiempo_medicion) VALUES
  ('5626 D', 'Brose',          'MD RD Armrest Substrate Injected RRH', '425502201XXX (5A01226)', 'N / 07.07.2023', '0', '/imagenes/5626.png', 30),
  ('4984',   'Plastic Omnium', 'TSBM Single Line Clip',                '7321527AA',              'A / 23.10.2017', '0', '/imagenes/4984.png', 30),
  ('5540',   'Audi',           'Cover',                                 '8MA.953.518',            '9',              '3', '/imagenes/5540.png', 30)
ON CONFLICT (no_parte) DO NOTHING;

-- Áreas iniciales
INSERT INTO areas (nombre, icono, color, orden) VALUES
  ('Producción','⚙','#d97706',1),('Calidad','✔','#16a34a',2),
  ('Ingeniería','📐','#1d6fde',3),('Mantenimiento','🔧','#7c3aed',4)
ON CONFLICT (nombre) DO NOTHING;
