const pool = require("../db/pool");

// GET /api/solicitudes  → cola activa (pendiente + proceso)
async function getCola(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM solicitudes
       WHERE estado IN ('pendiente','proceso')
       ORDER BY
         CASE prioridad
           WHEN 'Crítico (<4 Hr)'  THEN 1
           WHEN 'Urgente (<24 Hr)' THEN 2
           ELSE 3
         END,
         fecha_ingreso ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/solicitudes/historial  → terminadas
async function getHistorial(req, res) {
  const { desde, hasta, pieza, cliente } = req.query;
  try {
    let query  = "SELECT * FROM solicitudes WHERE estado = 'terminado'";
    const vals = [];
    let i = 1;
    if (desde)   { query += ` AND fecha_ingreso >= $${i++}`;  vals.push(desde); }
    if (hasta)   { query += ` AND fecha_ingreso <= $${i++}`;  vals.push(hasta); }
    if (pieza)   { query += ` AND no_parte ILIKE $${i++}`;    vals.push(`%${pieza}%`); }
    if (cliente) { query += ` AND cliente   ILIKE $${i++}`;   vals.push(`%${cliente}%`); }
    query += " ORDER BY fecha_fin DESC";

    const { rows } = await pool.query(query, vals);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/solicitudes  → nueva solicitud desde el registro
async function create(req, res) {
  const {
    empleado_id, empleado_nombre, pieza_id, no_parte, cliente,
    tipo_medicion, prioridad, razon,
    tipo_descripcion, tipo_descripcion_detalle,
    cantidad, tiempo_por_pieza, tiempo_total,
    tiempo_razon, tiempo_tipo
  } = req.body;

  if (!empleado_nombre || !no_parte || !prioridad || !razon || !tipo_descripcion)
    return res.status(400).json({ error: "Faltan campos requeridos" });

  const tRazon = Number.isFinite(Number(tiempo_razon)) ? Math.max(0, Math.round(Number(tiempo_razon))) : 0;
  const tTipo  = Number.isFinite(Number(tiempo_tipo))  ? Math.max(0, Math.round(Number(tiempo_tipo)))  : 0;

  try {
    // Folio = max folio actual + 1
    const { rows: folioRow } = await pool.query(
      "SELECT COALESCE(MAX(folio), 0) + 1 AS siguiente FROM solicitudes"
    );
    const folio = folioRow[0].siguiente;

    const { rows } = await pool.query(
      `INSERT INTO solicitudes
         (folio, empleado_id, empleado_nombre, pieza_id, no_parte, cliente,
          tipo_medicion, prioridad, razon,
          tipo_descripcion, tipo_descripcion_detalle,
          cantidad, tiempo_por_pieza, tiempo_razon, tiempo_tipo, tiempo_total, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pendiente')
       RETURNING *`,
      [folio, empleado_id||null, empleado_nombre, pieza_id||null, no_parte, cliente,
       tipo_medicion, prioridad, razon,
       tipo_descripcion, tipo_descripcion_detalle||null,
       cantidad, tiempo_por_pieza, tRazon, tTipo, tiempo_total]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/solicitudes/:id/iniciar  → pasar a proceso
async function iniciar(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE solicitudes
       SET estado = 'proceso', hora_inicio = NOW()
       WHERE id = $1 AND estado = 'pendiente'
       RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No encontrada o ya en proceso" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/solicitudes/:id/terminar  → marcar como terminada
async function terminar(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE solicitudes
       SET estado = 'terminado', fecha_fin = NOW(),
           tiempo_transcurrido = EXTRACT(EPOCH FROM (NOW() - hora_inicio)) / 60
       WHERE id = $1 AND estado = 'proceso'
       RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No encontrada o no está en proceso" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/solicitudes/:id/tiempo  → actualizar tiempo transcurrido (tick del reloj)
async function actualizarTiempo(req, res) {
  const { tiempo_transcurrido } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE solicitudes SET tiempo_transcurrido = $1
       WHERE id = $2 AND estado = 'proceso' RETURNING id, tiempo_transcurrido`,
      [tiempo_transcurrido, req.params.id]
    );
    res.json(rows[0] || { ok: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCola, getHistorial, create, iniciar, terminar, actualizarTiempo };
