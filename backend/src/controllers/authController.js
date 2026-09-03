const pool    = require("../db/pool");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");

// POST /api/auth/login
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM usuarios WHERE username = $1 AND activo = true",
      [username]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const usuario = rows[0];
    const valido  = await bcrypt.compare(password, usuario.password_hash);
    if (!valido)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, username: usuario.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, username: usuario.username }
    });
  } catch (err) {
    console.error("Error login:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ usuario: req.usuario });
}

module.exports = { login, me };
