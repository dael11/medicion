const pool = require("../db/pool");

// GET /api/dispositivos
async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM dispositivos WHERE activo = true ORDER BY nombre ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/dispositivos
async function create(req, res) {
  const { nombre, descripcion, numero_serie, categoria } = req.body;
  if (!nombre) return res.status(400).json({ error: "Nombre requerido" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO dispositivos (nombre, descripcion, numero_serie, categoria)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [nombre.trim(), descripcion||null, numero_serie||null, categoria||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/dispositivos/:id
async function update(req, res) {
  const { nombre, descripcion, numero_serie, categoria, activo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE dispositivos SET
        nombre       = COALESCE($1, nombre),
        descripcion  = COALESCE($2, descripcion),
        numero_serie = COALESCE($3, numero_serie),
        categoria    = COALESCE($4, categoria),
        activo       = COALESCE($5, activo)
       WHERE id = $6 RETURNING *`,
      [nombre||null, descripcion||null, numero_serie||null, categoria||null, activo??null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/dispositivos/:id (soft delete)
async function remove(req, res) {
  try {
    await pool.query("UPDATE dispositivos SET activo = false WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, create, update, remove };