const pool = require("../db/pool");

// GET /api/empleados
async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, departamento, activo FROM empleados ORDER BY nombre ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/empleados/departamentos  → lista de departamentos ya usados
async function getDepartamentos(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT departamento FROM empleados WHERE departamento IS NOT NULL AND departamento <> '' ORDER BY departamento ASC"
    );
    res.json(rows.map(r => r.departamento));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/empleados
async function create(req, res) {
  const { nombre, departamento } = req.body;
  if (!nombre) return res.status(400).json({ error: "Nombre requerido" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO empleados (nombre, departamento) VALUES ($1, $2) RETURNING *",
      [nombre.trim(), departamento ? departamento.trim() : null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/empleados/:id
async function update(req, res) {
  const { id } = req.params;
  const { nombre, departamento, activo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE empleados
         SET nombre       = COALESCE($1, nombre),
             departamento = COALESCE($2, departamento),
             activo       = COALESCE($3, activo)
       WHERE id = $4
       RETURNING *`,
      [nombre, departamento, activo, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/empleados/:id  (soft delete)
async function remove(req, res) {
  const { id } = req.params;
  try {
    await pool.query("UPDATE empleados SET activo = false WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getDepartamentos, create, update, remove };
