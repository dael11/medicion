import { useState, useEffect } from "react";

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }

.login-input:focus {
  border-color: #1d6fde !important;
  box-shadow: 0 0 0 3px rgba(29,111,222,.18) !important;
  background: #fff !important;
}
.login-input::placeholder { color: #b0b7c3; }
.btn-ingresar:hover  { background: #1250a8 !important; box-shadow: 0 6px 24px rgba(29,111,222,.5) !important; }
.btn-ingresar:active { transform: scale(.99); }
.btn-volver:hover    { color: rgba(255,255,255,.9) !important; }

@keyframes fadeUp {
  from { opacity:0; transform: translateY(20px); }
  to   { opacity:1; transform: translateY(0); }
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-7px); }
  40%,80% { transform: translateX(7px); }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes float {
  0%,100% { transform: translateY(0) scale(1); }
  50%     { transform: translateY(-14px) scale(1.03); }
}
@keyframes pulse-ring {
  0%   { transform: scale(.9); opacity:.6; }
  100% { transform: scale(1.6); opacity:0; }
}
.shake { animation: shake .4s ease; }
.spin  { display:inline-block; animation: spin .8s linear infinite; }

.deco-blob {
  position:absolute; border-radius:50%;
  background: rgba(255,255,255,.06);
  pointer-events:none;
}
`;

export default function Login({
  onLogin      = () => {},
  volver       = () => {},
  errorExterno = "",
}) {
  const [usuario,  setUsuario]  = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [shaking,  setShaking]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (errorExterno) { setError(errorExterno); triggerShake(); setLoading(false); }
  }, [errorExterno]);

  const handleLogin = async () => {
    if (!usuario || !password) { setError("Completa todos los campos"); triggerShake(); return; }
    setLoading(true); setError("");
    const result = await onLogin(usuario, password);
    if (result !== false) setLoading(false);
  };

  const triggerShake = () => { setShaking(true); setTimeout(() => setShaking(false), 400); };
  const handleKey    = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* ── FONDO DECORATIVO ── */}
      <div className="deco-blob" style={{ width:600, height:600, top:"-180px",  left:"-160px"  }} />
      <div className="deco-blob" style={{ width:400, height:400, bottom:"-120px",right:"-100px" }} />
      <div className="deco-blob" style={{ width:200, height:200, top:"40%",     left:"65%"     }} />
      <div style={s.gridOverlay} />

      {/* ── CONTENIDO CENTRADO ── */}
      <div style={s.center}>

        {/* LOGO */}
        <div style={s.logoOuter}>
          <div style={s.logoPulse} />
          <div style={s.logoCard}>
            <img src="/Imagen1.png" alt="Groupe Plastivaloire" style={s.logoImg} />
          </div>
        </div>

        {/* Separador + badge */}
        <div style={s.badgeRow}>
          <div style={s.badgeLine} />
          <span style={s.badge}>Sistema de Metrología</span>
          <div style={s.badgeLine} />
        </div>

        <h1 style={s.title}>Laboratorio de Metrología</h1>

        {/* ── CARD LOGIN ── */}
        <div className={shaking ? "shake" : ""} style={s.card}>

          <div style={s.cardHeader}>
            <div style={s.cardIconWrap}>🔐</div>
            <div>
              <div style={s.cardTitle}>Acceso administrativo</div>
              <div style={s.cardSub}>Ingresa tus credenciales</div>
            </div>
          </div>

          {/* Usuario */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Usuario</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input className="login-input" style={s.input} type="text"
                placeholder="Nombre de usuario" value={usuario} autoComplete="username"
                onChange={e => { setUsuario(e.target.value); setError(""); }}
                onKeyDown={handleKey} />
            </div>
          </div>

          {/* Contraseña */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Contraseña</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input className="login-input" style={s.input}
                type={showPass ? "text" : "password"} placeholder="••••••••"
                value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKey} />
              <button style={s.eyeBtn} onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Botón */}
          <button className="btn-ingresar"
            style={{ ...s.btnIngresar, opacity: loading ? .75 : 1 }}
            onClick={handleLogin} disabled={loading}>
            {loading
              ? <span className="spin" style={{ fontSize:18 }}>⟳</span>
              : <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Ingresar
                </>
            }
          </button>
        </div>

        {/* Volver */}
        <button className="btn-volver" style={s.btnVolver} onClick={volver}>
          ← Volver al registro de medición
        </button>

        {/* Copyright */}
        <div style={s.footer}>© 2026 Groupe Plastivaloire America Inc.</div>
      </div>
    </div>
  );
}

const AZUL_DEEP = "#061f4a";
const AZUL_DARK = "#0a3d8f";
const AZUL      = "#1d6fde";

const s = {
  root: {
    minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
    fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden",
    background:`linear-gradient(135deg, ${AZUL_DEEP} 0%, ${AZUL_DARK} 55%, ${AZUL} 100%)`,
  },

  gridOverlay: {
    position:"absolute", inset:0, zIndex:0,
    backgroundImage:"linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
    backgroundSize:"48px 48px",
    pointerEvents:"none",
  },

  center: {
    position:"relative", zIndex:1,
    display:"flex", flexDirection:"column", alignItems:"center",
    width:"100%", maxWidth:460, padding:"32px 20px 28px",
    animation:"fadeUp .45s ease",
  },

  /* Logo */
  logoOuter: { position:"relative", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"center" },
  logoPulse: {
    position:"absolute", inset:-12, borderRadius:24,
    border:"1.5px solid rgba(255,255,255,.2)",
    animation:"pulse-ring 2.8s ease-out infinite",
  },
  logoCard: {
    background:"rgba(255,255,255,.97)",
    borderRadius:18, padding:"20px 36px",
    boxShadow:"0 12px 48px rgba(0,0,0,.35), 0 2px 8px rgba(0,0,0,.2)",
    display:"flex", alignItems:"center", justifyContent:"center",
  },
  logoImg: { height:72, objectFit:"contain", display:"block" },

  /* Badge */
  badgeRow: { display:"flex", alignItems:"center", gap:10, marginBottom:8 },
  badgeLine:{ flex:1, height:1, width:40, background:"rgba(255,255,255,.25)" },
  badge: {
    fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase",
    color:"rgba(255,255,255,.7)", whiteSpace:"nowrap",
  },

  title: {
    fontSize:22, fontWeight:700, color:"#fff", marginBottom:24,
    textAlign:"center", letterSpacing:".01em",
  },

  /* Card formulario */
  card: {
    width:"100%", background:"#fff", borderRadius:16,
    border:"1px solid rgba(255,255,255,.15)", borderTop:"4px solid #1d6fde",
    boxShadow:"0 12px 40px rgba(6,31,74,.35), 0 2px 8px rgba(0,0,0,.15)",
    padding:"28px 32px 24px", marginBottom:14,
  },

  cardHeader: { display:"flex", alignItems:"center", gap:12, marginBottom:22, paddingBottom:18, borderBottom:"1px solid #f3f4f6" },
  cardIconWrap:{ width:40, height:40, borderRadius:10, background:"#eff6ff", border:"1.5px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 },
  cardTitle: { fontSize:15, fontWeight:700, color:"#1a1d23" },
  cardSub:   { fontSize:12, color:"#9ca3af", marginTop:1 },

  fieldWrap: { marginBottom:16 },
  label:     { display:"block", fontSize:11, fontWeight:700, color:"#4b5563", textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 },
  inputWrap: { position:"relative" },
  inputIcon: { position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", display:"flex" },
  input:     {
    width:"100%", padding:"10px 38px 10px 36px", border:"1.5px solid #e2e5ea",
    borderRadius:8, fontSize:14, fontFamily:"inherit", background:"#f9fafb",
    color:"#1a1d23", outline:"none", boxSizing:"border-box",
    transition:"border-color .2s,box-shadow .2s,background .2s",
  },
  eyeBtn: { position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center" },

  errorBox: {
    display:"flex", alignItems:"center", gap:8, background:"#fef2f2",
    border:"1px solid #fecaca", borderRadius:8, padding:"9px 12px",
    fontSize:13, color:"#dc2626", marginBottom:16,
  },

  btnIngresar: {
    width:"100%", padding:"12px", background:AZUL, color:"#fff", border:"none",
    borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
    transition:"all .2s", boxShadow:`0 4px 16px rgba(29,111,222,.35)`,
    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
  },

  btnVolver: {
    background:"none", border:"none", color:"rgba(255,255,255,.5)",
    fontSize:13, cursor:"pointer", fontFamily:"inherit",
    transition:"color .2s", padding:"4px 0",
  },

  footer: { marginTop:20, fontSize:11, color:"rgba(255,255,255,.3)", textAlign:"center" },
};
