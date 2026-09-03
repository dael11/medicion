const pool = require("../db/pool");

// Normaliza { tipoOtro, razones:{...} } a enteros >= 0 (descarta lo vacío/0)
function limpiarTiemposExtra(te) {
  if (!te || typeof te !== "object") return {};
  const out = {};
  const otro = Math.round(Number(te.tipoOtro));
  if (Number.isFinite(otro) && otro > 0) out.tipoOtro = otro;
  const raz = {};
  if (te.razones && typeof te.razones === "object") {
    for (const [k, v] of Object.entries(te.razones)) {
      const n = Math.round(Number(v));
      if (Number.isFinite(n) && n > 0) raz[k] = n;
    }
  }
  if (Object.keys(raz).length) out.razones = raz;
  return out;
}

// GET /api/piezas
async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM piezas WHERE activo = true ORDER BY no_parte ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/piezas/:id
async function getOne(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM piezas WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/piezas
async function create(req, res) {
  const { no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, archivos, tiempo_medicion, tiempos_extra } = req.body;
  if (!no_parte || !cliente) return res.status(400).json({ error: "no_parte y cliente requeridos" });
  const tiempo = Number.isFinite(Number(tiempo_medicion)) && Number(tiempo_medicion) > 0 ? Math.round(Number(tiempo_medicion)) : 30;
  try {
    const { rows } = await pool.query(
      `INSERT INTO piezas (no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, archivos, tiempo_medicion, tiempos_extra)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [no_parte.trim(), cliente.trim(), descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url,
       JSON.stringify(archivos || []), tiempo, JSON.stringify(limpiarTiemposExtra(tiempos_extra))]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "No. Parte ya existe" });
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/piezas/:id
async function update(req, res) {
  const { no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, activo, archivos, tiempo_medicion, tiempos_extra } = req.body;
  const tiempo = tiempo_medicion === undefined || tiempo_medicion === null || tiempo_medicion === ""
    ? null
    : (Number.isFinite(Number(tiempo_medicion)) && Number(tiempo_medicion) > 0 ? Math.round(Number(tiempo_medicion)) : null);
  try {
    const { rows } = await pool.query(
      `UPDATE piezas SET
        no_parte        = COALESCE($1, no_parte),
        cliente         = COALESCE($2, cliente),
        descripcion     = COALESCE($3, descripcion),
        parte_cliente   = COALESCE($4, parte_cliente),
        nivel_dwg       = COALESCE($5, nivel_dwg),
        nivel_cad       = COALESCE($6, nivel_cad),
        imagen_url      = COALESCE($7, imagen_url),
        activo          = COALESCE($8, activo),
        archivos        = COALESCE($9, archivos),
        tiempo_medicion = COALESCE($10, tiempo_medicion),
        tiempos_extra   = COALESCE($11, tiempos_extra)
       WHERE id = $12 RETURNING *`,
      [no_parte, cliente, descripcion, parte_cliente, nivel_dwg, nivel_cad, imagen_url, activo,
       archivos !== undefined ? JSON.stringify(archivos) : null,
       tiempo,
       tiempos_extra !== undefined ? JSON.stringify(limpiarTiemposExtra(tiempos_extra)) : null,
       req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/piezas/:id  (soft delete)
async function remove(req, res) {
  try {
    await pool.query("UPDATE piezas SET activo = false WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getOne, create, update, remove };
