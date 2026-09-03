const pool = require("../db/pool");

// GET /api/prestamos  → activos
async function getActivos(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM prestamos WHERE estado = 'activo' ORDER BY fecha_salida DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/prestamos/historial  → devueltos
async function getHistorial(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM prestamos WHERE estado = 'devuelto' ORDER BY fecha_devolucion_real DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/prestamos/count  → cuántos activos (para el KPI)
async function getCount(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*) as total FROM prestamos WHERE estado = 'activo'"
    );
    res.json({ total: parseInt(rows[0].total) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/prestamos  → nuevo préstamo (público)
async function create(req, res) {
  const { empleado_nombre, dispositivo_id, dispositivo_nombre, para_que, fecha_devolucion_estimada } = req.body;
  if (!empleado_nombre || !dispositivo_nombre || !para_que || !fecha_devolucion_estimada)
    return res.status(400).json({ error: "Faltan campos requeridos" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO prestamos (empleado_nombre, dispositivo_id, dispositivo_nombre, para_que, fecha_devolucion_estimada)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [empleado_nombre, dispositivo_id||null, dispositivo_nombre, para_que, fecha_devolucion_estimada]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/prestamos/:id/devolver  → marcar como devuelto
async function devolver(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE prestamos SET estado = 'devuelto', fecha_devolucion_real = NOW()
       WHERE id = $1 AND estado = 'activo' RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No encontrado o ya devuelto" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getActivos, getHistorial, getCount, create, devolver };