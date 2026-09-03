# Backend — Laboratorio de Metrología

## Requisitos
- Node.js 18+
- PostgreSQL 14+

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus datos de PostgreSQL y un JWT_SECRET seguro

# 3. Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE metrologia;"

# 4. Ejecutar el schema (crea tablas + datos iniciales)
psql -U postgres -d metrologia -f src/db/schema.sql

# 5. Arrancar el servidor
npm run dev        # desarrollo (con nodemon)
npm start          # producción
```

## Variables de entorno (.env)

| Variable        | Descripción                              | Ejemplo              |
|-----------------|------------------------------------------|----------------------|
| PORT            | Puerto del servidor                      | 4000                 |
| DB_HOST         | Host de PostgreSQL                       | localhost            |
| DB_PORT         | Puerto de PostgreSQL                     | 5432                 |
| DB_NAME         | Nombre de la base de datos               | metrologia           |
| DB_USER         | Usuario de PostgreSQL                    | postgres             |
| DB_PASSWORD     | Contraseña de PostgreSQL                 | tu_password          |
| JWT_SECRET      | Clave secreta para firmar tokens         | clave_larga_segura   |
| JWT_EXPIRES_IN  | Duración del token                       | 8h                   |
| FRONTEND_URL    | URL del frontend para CORS               | http://localhost:3000|

## Endpoints principales

### Auth
| Método | Ruta            | Auth | Descripción          |
|--------|-----------------|------|----------------------|
| POST   | /api/auth/login | No   | Login, retorna token |
| GET    | /api/auth/me    | Sí   | Info del usuario     |

### Empleados
| Método | Ruta                  | Auth | Descripción        |
|--------|-----------------------|------|--------------------|
| GET    | /api/empleados        | No   | Lista de empleados |
| POST   | /api/empleados        | Sí   | Crear empleado     |
| PUT    | /api/empleados/:id    | Sí   | Editar empleado    |
| DELETE | /api/empleados/:id    | Sí   | Desactivar         |

### Piezas
| Método | Ruta              | Auth | Descripción      |
|--------|-------------------|------|------------------|
| GET    | /api/piezas       | No   | Catálogo piezas  |
| POST   | /api/piezas       | Sí   | Crear pieza      |
| PUT    | /api/piezas/:id   | Sí   | Editar pieza     |
| DELETE | /api/piezas/:id   | Sí   | Desactivar       |

### Solicitudes
| Método | Ruta                          | Auth | Descripción            |
|--------|-------------------------------|------|------------------------|
| GET    | /api/solicitudes              | Sí   | Cola activa            |
| POST   | /api/solicitudes              | No   | Nueva solicitud        |
| PUT    | /api/solicitudes/:id/iniciar  | Sí   | Pasar a proceso        |
| PUT    | /api/solicitudes/:id/terminar | Sí   | Marcar como terminada  |
| GET    | /api/solicitudes/historial    | Sí   | Historial completadas  |

### Usuarios admin
| Método | Ruta               | Auth | Descripción      |
|--------|--------------------|------|------------------|
| GET    | /api/usuarios      | Sí   | Lista usuarios   |
| POST   | /api/usuarios      | Sí   | Crear usuario    |
| PUT    | /api/usuarios/:id  | Sí   | Editar usuario   |
| DELETE | /api/usuarios/:id  | Sí   | Desactivar       |

## Usuario por defecto
- **Username:** milton  
- **Password:** admin1234  
- ⚠️ Cámbialo inmediatamente en producción
