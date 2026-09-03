/**
 * Crea las tablas y carga los datos iniciales.
 * Uso:  npm run db:setup
 * Lee la conexión desde el .env (igual que el servidor).
 */
require("dotenv").config();
const fs   = require("fs");
const path = require("path");
const pool = require("../src/db/pool");

const files = [
  path.join(__dirname, "..", "..", "db", "01_schema.sql"),
  path.join(__dirname, "..", "..", "db", "02_datos_iniciales.sql"),
];

(async () => {
  try {
    for (const f of files) {
      if (!fs.existsSync(f)) {
        console.warn("⚠️  No se encontró", f, "— se omite.");
        continue;
      }
      console.log("▶ Ejecutando", path.basename(f), "…");
      const sql = fs.readFileSync(f, "utf8");
      await pool.query(sql);
      console.log("  ✔ OK");
    }
    console.log("\n✅ Base de datos lista.");
    console.log("   Usuario admin por defecto:  milton / admin1234  (CÁMBIALO)");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
})();
