const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const makeStorage = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext    = path.extname(file.originalname).toLowerCase();
      const base   = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 40);
      cb(null, `${base}_${Date.now()}${ext}`);
    },
  });
};

// ── Upload de imágenes ───────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../../uploads/imagenes");

const upload = multer({
  storage: makeStorage(UPLOAD_DIR),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (jpg, png, gif, webp, svg)"));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ── Upload de archivos generales (PDF, imágenes, docs, etc.) ─
const ARCHIVOS_DIR = path.join(__dirname, "../../uploads/archivos");

const uploadArchivo = multer({
  storage: makeStorage(ARCHIVOS_DIR),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const permitidos = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp",
                        ".doc", ".docx", ".xls", ".xlsx", ".xlsm", ".csv", ".dwg", ".svg"];
    if (permitidos.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = { upload, uploadArchivo, UPLOAD_DIR, ARCHIVOS_DIR };