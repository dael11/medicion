const pool = require("../db/pool");

// GET /api/areas  → áreas activas
async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, icono, color, activo, orden FROM areas WHERE activo = true ORDER BY orden ASC, nombre ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/areas
async function create(req, res) {
  const { nombre, icono, color } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: "Nombre requerido" });
  try {
    const { rows: maxRow } = await pool.query("SELECT COALESCE(MAX(orden),0)+1 AS n FROM areas");
    const { rows } = await pool.query(
      `INSERT INTO areas (nombre, icono, color, orden) VALUES ($1,$2,$3,$4)
       ON CONFLICT (nombre) DO UPDATE SET activo = true
       RETURNING *`,
      [nombre.trim(), (icono || "📍").slice(0, 8), (color || "#6b7280").slice(0, 9), maxRow[0].n]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/areas/:id
async function update(req, res) {
  const { nombre, icono, color, activo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE areas SET
        nombre = COALESCE($1, nombre),
        icono  = COALESCE($2, icono),
        color  = COALESCE($3, color),
        activo = COALESCE($4, activo)
       WHERE id = $5 RETURNING *`,
      [nombre || null, icono || null, color || null, activo ?? null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/areas/:id  (soft delete)
async function remove(req, res) {
  try {
    await pool.query("UPDATE areas SET activo = false WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, create, update, remove };
