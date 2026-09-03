const express = require("express");
const path    = require("path");
const auth    = require("../middleware/auth");
const { upload, uploadArchivo } = require("../middleware/upload");

const authCtrl         = require("../controllers/authController");
const empleadosCtrl    = require("../controllers/empleadosController");
const piezasCtrl       = require("../controllers/piezasController");
const solicitudesCtrl  = require("../controllers/solicitudesController");
const usuariosCtrl     = require("../controllers/usuariosController");
const dispositivosCtrl = require("../controllers/dispositivosController");
const prestamosCtrl    = require("../controllers/prestamosController");
const areasCtrl        = require("../controllers/areasController");

const router = express.Router();

// ── UPLOAD ──────────────────────────────────────────────────
router.post("/upload/imagen", auth, upload.single("imagen"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
  const url = `/uploads/imagenes/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

router.post("/upload/archivo", auth, uploadArchivo.single("archivo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
  const url = `/uploads/archivos/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// ── AUTH ────────────────────────────────────────────────────
router.post("/auth/login", authCtrl.login);
router.get ("/auth/me",    auth, authCtrl.me);

// ── EMPLEADOS ───────────────────────────────────────────────
router.get   ("/empleados",               empleadosCtrl.getAll);
router.get   ("/empleados/departamentos",  empleadosCtrl.getDepartamentos);
router.post  ("/empleados",      auth, empleadosCtrl.create);
router.put   ("/empleados/:id",  auth, empleadosCtrl.update);
router.delete("/empleados/:id",  auth, empleadosCtrl.remove);

// ── PIEZAS ──────────────────────────────────────────────────
router.get   ("/piezas",      piezasCtrl.getAll);
router.get   ("/piezas/:id",  piezasCtrl.getOne);
router.post  ("/piezas",      auth, piezasCtrl.create);
router.put   ("/piezas/:id",  auth, piezasCtrl.update);
router.delete("/piezas/:id",  auth, piezasCtrl.remove);

// ── SOLICITUDES ─────────────────────────────────────────────
router.get ("/solicitudes",              auth, solicitudesCtrl.getCola);
router.get ("/solicitudes/historial",    auth, solicitudesCtrl.getHistorial);
router.post("/solicitudes",                    solicitudesCtrl.create);
router.put ("/solicitudes/:id/iniciar",  auth, solicitudesCtrl.iniciar);
router.put ("/solicitudes/:id/terminar", auth, solicitudesCtrl.terminar);
router.put ("/solicitudes/:id/tiempo",   auth, solicitudesCtrl.actualizarTiempo);

// ── DISPOSITIVOS ────────────────────────────────────────────
router.get   ("/dispositivos",      dispositivosCtrl.getAll);
router.post  ("/dispositivos",      auth, dispositivosCtrl.create);
router.put   ("/dispositivos/:id",  auth, dispositivosCtrl.update);
router.delete("/dispositivos/:id",  auth, dispositivosCtrl.remove);

// ── ÁREAS (destino de préstamos) ───────────────────────────
router.get   ("/areas",      areasCtrl.getAll);
router.post  ("/areas",      auth, areasCtrl.create);
router.put   ("/areas/:id",  auth, areasCtrl.update);
router.delete("/areas/:id",  auth, areasCtrl.remove);

// ── PRÉSTAMOS ───────────────────────────────────────────────
router.get ("/prestamos",              auth, prestamosCtrl.getActivos);
router.get ("/prestamos/historial",    auth, prestamosCtrl.getHistorial);
router.get ("/prestamos/count",              prestamosCtrl.getCount);
router.post("/prestamos",                    prestamosCtrl.create);
router.put ("/prestamos/:id/devolver", auth, prestamosCtrl.devolver);

// ── USUARIOS ────────────────────────────────────────────────
router.get   ("/usuarios",      auth, usuariosCtrl.getAll);
router.post  ("/usuarios",      auth, usuariosCtrl.create);
router.put   ("/usuarios/:id",  auth, usuariosCtrl.update);
router.delete("/usuarios/:id",  auth, usuariosCtrl.remove);

module.exports = router;