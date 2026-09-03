const { Pool } = require("pg");
require("dotenv").config();

// Admite dos formas de configurar la BD:
//  1) DATABASE_URL=postgres://usuario:pass@host:5432/metrologia   (típico en la nube)
//  2) DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD         (servidor propio)
const useUrl = !!process.env.DATABASE_URL;

// SSL: actívalo con DB_SSL=true (requerido por muchos Postgres en la nube)
const ssl = String(process.env.DB_SSL).toLowerCase() === "true"
  ? { rejectUnauthorized: false }
  : false;

const pool = useUrl
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl })
  : new Pool({
      host:     process.env.DB_HOST || "localhost",
      port:     process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "metrologia",
      user:     process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      ssl,
    });

pool.on("connect", () => {
  console.log("✅ Conectado a PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Error en pool de PostgreSQL:", err.message);
});

module.exports = pool;
