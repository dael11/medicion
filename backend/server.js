require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const helmet  = require("helmet");
const rateLimit = require("express-rate-limit");
const routes  = require("./src/routes/index");

const app  = express();
const PORT = process.env.PORT || 4000;

app.disable("x-powered-by");
if (process.env.TRUST_PROXY) app.set("trust proxy", 1); // detrás de nginx / load balancer

// ── SEGURIDAD ───────────────────────────────────────────
app.use(helmet({
  // El frontend y las imágenes se sirven desde el mismo origen
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// En producción se recomienda fijar FRONTEND_URL al dominio real.
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "2mb" }));

// Límite de intentos de login (anti fuerza bruta)
app.use("/api/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera unos minutos." },
}));

// ── ARCHIVOS SUBIDOS (imágenes, PDF, Excel) ─────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API ─────────────────────────────────────────────────
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => res.json({ ok: true, ts: new Date() }));

// ── FRONTEND (build de React) ───────────────────────────
// Si existe ../frontend/build, este mismo servidor sirve la app web.
// Así solo hace falta exponer 1 puerto / 1 dominio.
const FRONT_DIR = process.env.FRONTEND_DIR
  || path.join(__dirname, "..", "frontend", "build");

if (fs.existsSync(FRONT_DIR)) {
  app.use(express.static(FRONT_DIR));
  // Cualquier ruta que no sea /api ni /uploads devuelve index.html (SPA)
  app.get(/^\/(?!api|uploads|health).*/, (req, res) => {
    res.sendFile(path.join(FRONT_DIR, "index.html"));
  });
  console.log(`🌐 Sirviendo frontend desde: ${FRONT_DIR}`);
} else {
  console.log("ℹ️  Sin build de frontend (modo solo-API). Genera 'frontend/build' con: npm run build");
}

// 404 (solo llega aquí si no hubo frontend)
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Error handler global
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err.message);
  res.status(500).json({ error: "Error interno del servidor" });
});

// ── ARRANQUE ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}`);
});
