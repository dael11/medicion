const pool   = require("../db/pool");
const bcrypt = require("bcryptjs");

// GET /api/usuarios
async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, username, activo, created_at FROM usuarios ORDER BY nombre ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/usuarios
async function create(req, res) {
  const { nombre, username, password } = req.body;
  if (!nombre || !username || !password)
    return res.status(400).json({ error: "nombre, username y password requeridos" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO usuarios (nombre, username, password_hash) VALUES ($1,$2,$3) RETURNING id, nombre, username, activo",
      [nombre.trim(), username.trim(), hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Username ya existe" });
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/usuarios/:id
async function update(req, res) {
  const { nombre, password, activo } = req.body;
  try {
    let hash = null;
    if (password) hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `UPDATE usuarios SET
        nombre        = COALESCE($1, nombre),
        password_hash = COALESCE($2, password_hash),
        activo        = COALESCE($3, activo)
       WHERE id = $4
       RETURNING id, nombre, username, activo`,
      [nombre || null, hash, activo ?? null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/usuarios/:id (soft delete)
async function remove(req, res) {
  try {
    await pool.query("UPDATE usuarios SET activo = false WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, create, update, remove };
