import { useState, useEffect } from "react";
import { empleadosAPI, dispositivosAPI, prestamosAPI, areasAPI } from "../api";

const AZUL  = "#1d6fde";
const VERDE = "#16a34a";

// Fallback si /api/areas no responde
const AREAS_FALLBACK = [
  { nombre:"Producción",    icono:"⚙",  color:"#d97706" },
  { nombre:"Calidad",       icono:"✔",  color:"#16a34a" },
  { nombre:"Ingeniería",    icono:"📐", color:"#1d6fde" },
  { nombre:"Mantenimiento", icono:"🔧", color:"#7c3aed" },
];
// aclara un hex ~92% hacia blanco para el fondo suave
const soft = (hex) => {
  const n = parseInt((hex || "#6b7280").slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c) => Math.round(c + (255 - c) * 0.88);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
};

export default function RegistroPrestamo({ onVolver = () => {} }) {
  const [empleados,    setEmpleados]    = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [areas,        setAreas]        = useState(AREAS_FALLBACK);
  const [cargando,     setCargando]     = useState(true);

  const [nombre,      setNombre]      = useState("");
  const [disposInput, setDisposInput] = useState("");
  const [disposOpen,  setDisposOpen]  = useState(false);
  const [disposSel,   setDisposSel]   = useState(null);
  const [area,        setArea]        = useState("");
  const [areaOtro,    setAreaOtro]    = useState("");
  const [fechaDev,    setFechaDev]    = useState("");
  const [enviado,     setEnviado]     = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    async function init() {
      try {
        const [e, d, a] = await Promise.all([
          empleadosAPI.getAll(),
          dispositivosAPI.getAll(),
          areasAPI.getAll().catch(() => null),
        ]);
        setEmpleados(e.filter(x => x.activo).map(x => x.nombre));
        setDispositivos(d);
        if (Array.isArray(a) && a.length) setAreas(a);
      } catch { setError("Error al cargar datos"); }
      finally { setCargando(false); }
    }
    init();
  }, []);

  const disposFiltrados = disposInput.trim()
    ? dispositivos.filter(d =>
        d.nombre.toLowerCase().includes(disposInput.toLowerCase()) ||
        (d.categoria||"").toLowerCase().includes(disposInput.toLowerCase()))
    : dispositivos;

  const seleccionarDispositivo = (d) => {
    setDisposInput(d.nombre);
    setDisposSel(d);
    setDisposOpen(false);
  };

  const areaFinal = area === "Otro" ? areaOtro.trim() : area;

  const handleRegistrar = async () => {
    setError("");
    if (!nombre || !disposInput || !area || !fechaDev) {
      setError("Completa todos los campos requeridos.");
      return;
    }
    if (area === "Otro" && !areaOtro.trim()) {
      setError("Escribe el nombre del área.");
      return;
    }
    try {
      await prestamosAPI.create({
        empleado_nombre:           nombre,
        dispositivo_id:            disposSel?.id || "",
        dispositivo_nombre:        disposInput,
        para_que:                  areaFinal,
        fecha_devolucion_estimada: fechaDev,
      });
      setEnviado(true);
      setTimeout(() => {
        setEnviado(false);
        setNombre(""); setDisposInput(""); setDisposSel(null);
        setArea(""); setAreaOtro(""); setFechaDev("");
      }, 2500);
    } catch (e) {
      setError("Error al registrar: " + e.message);
    }
  };

  if (cargando) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"#6b7280" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⟳</div>
        <div>Cargando datos…</div>
      </div>
    </div>
  );

  const cardsAreas = [
    ...areas.map(a => ({ nombre: a.nombre, icono: a.icono || "📍", color: a.color || "#6b7280" })),
    { nombre: "Otro", icono: "➕", color: "#6b7280" },
  ];
  const areaConf = cardsAreas.find(a => a.nombre === area);

  return (
    <div className="rp-root" style={s.root}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logoWrap}>
            <img src="/Imagen1.png" alt="Logo" style={s.logoImg} />
          </div>
          <div style={s.headerTexto}>
            <div style={s.headerTitulo}>REGISTRO DE PRÉSTAMO</div>
            <div style={s.headerSub}>Laboratorio de Metrología</div>
          </div>
          <button style={s.btnVolver} className="rp-volver" onClick={onVolver}>← Volver</button>
        </div>
      </div>

      {/* CUERPO */}
      <div style={s.body}>
        <div style={s.card}>

          {/* SECCIÓN: DATOS */}
          <div style={s.secHeader}>DATOS DEL PRÉSTAMO</div>

          <div style={s.fila}>
            <div style={s.filaLabel}>SOLICITANTE</div>
            <select style={s.filaSelect} className="rp-ctrl" value={nombre} onChange={e => setNombre(e.target.value)}>
              <option value="">— Seleccione —</option>
              {empleados.map((e,i) => <option key={i} value={e}>{e}</option>)}
            </select>
          </div>

          {/* DISPOSITIVO — autocomplete */}
          <div style={{ position:"relative", marginBottom:8 }}>
            <div style={{ ...s.fila, marginBottom:0 }}>
              <div style={s.filaLabel}>DISPOSITIVO</div>
              <input
                type="text"
                className="rp-ctrl"
                style={s.filaSelect}
                placeholder="Busca por nombre o categoría…"
                value={disposInput}
                onChange={e => { setDisposInput(e.target.value); setDisposOpen(true); setDisposSel(null); }}
                onFocus={() => setDisposOpen(true)}
                onBlur={() => setTimeout(() => setDisposOpen(false), 150)}
                autoComplete="off"
              />
            </div>
            {disposOpen && disposFiltrados.length > 0 && (
              <div style={s.autocompleteList}>
                {disposFiltrados.map(d => (
                  <div key={d.id} style={s.autocompleteItem} className="rp-ac-item"
                    onMouseDown={() => seleccionarDispositivo(d)}>
                    <span style={s.acItemNombre}>{d.nombre}</span>
                    <span style={s.acItemSub}>{d.categoria || ""}{d.numero_serie ? ` · S/N: ${d.numero_serie}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={s.fila}>
            <div style={s.filaLabel}>DEVOLUCIÓN EST.</div>
            <input
              type="date"
              className="rp-ctrl"
              style={s.filaSelect}
              value={fechaDev}
              onChange={e => setFechaDev(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* SECCIÓN: ÁREA */}
          <div style={{ ...s.secHeader, marginTop:16 }}>ÁREA DE DESTINO</div>

          <div style={s.areaGrid} className="rp-area-grid">
            {cardsAreas.map(a => {
              const sel = area === a.nombre;
              return (
                <label
                  key={a.nombre}
                  className="rp-area-card"
                  style={{
                    ...s.areaCard,
                    borderColor: sel ? a.color : "#e2e5ea",
                    background:  sel ? soft(a.color) : "#fff",
                    boxShadow:   sel ? `0 0 0 3px ${a.color}22` : "none",
                  }}
                >
                  <input type="radio" checked={sel} onChange={() => { setArea(a.nombre); if (a.nombre !== "Otro") setAreaOtro(""); }} style={{ display:"none" }} />
                  <span style={{ fontSize:22, lineHeight:1 }}>{a.icono}</span>
                  <span style={{ fontSize:13, fontWeight:600, color: sel ? a.color : "#374151", marginTop:4, textAlign:"center" }}>
                    {a.nombre}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Campo de área personalizada */}
          {area === "Otro" && (
            <input
              className="rp-ctrl"
              style={s.otroInput}
              placeholder="Escribe el nombre del área…"
              value={areaOtro}
              autoFocus
              onChange={e => setAreaOtro(e.target.value)}
            />
          )}

          {/* Chip de área seleccionada */}
          {areaFinal && (
            <div style={{ ...s.areaChip, background: soft(areaConf?.color || "#6b7280"), border:`1px solid ${(areaConf?.color || "#6b7280")}44`, color: areaConf?.color || "#6b7280" }}>
              {areaConf?.icono || "📍"} Área seleccionada: <strong>{areaFinal}</strong>
            </div>
          )}

          {error && <div style={s.errorBox}>⚠ {error}</div>}

          <div style={s.botonesRow}>
            <button
              style={{ ...s.btnRegistrar, ...(enviado ? { background:VERDE, boxShadow:"0 2px 8px rgba(22,163,74,.35)" } : {}) }}
              className={enviado ? "" : "rp-registrar"}
              onClick={handleRegistrar}
              disabled={enviado}
            >
              {enviado ? "✓ Préstamo registrado" : "📦 REGISTRAR PRÉSTAMO"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

const s = {
  root:        { minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column",
    background:"radial-gradient(1100px 500px at 50% -8%, #e6eefc 0%, #f0f2f6 60%)" },
  header:      { background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 55%,#1d6fde 100%)", borderBottom:"none", boxShadow:"0 2px 12px rgba(6,31,74,.35)" },
  headerInner: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 24px", gap:16 },
  logoWrap:    { flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,.13)", borderRadius:12, padding:"6px 10px", border:"1px solid rgba(255,255,255,.2)", height:72, minWidth:64 },
  logoImg:     { height:60, width:"auto", objectFit:"contain" },
  headerTexto: { flex:1, textAlign:"center" },
  headerTitulo:{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:".04em" },
  headerSub:   { fontSize:11, color:"rgba(255,255,255,.65)", marginTop:2 },
  btnVolver:   { padding:"8px 16px", background:"rgba(255,255,255,.13)", color:"#fff", border:"1px solid rgba(255,255,255,.3)", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0 },
  body:        { flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 16px" },
  card:        { background:"#fff", border:"1px solid #e2e5ea", borderRadius:14, padding:"26px 30px", width:"100%", maxWidth:640, boxShadow:"0 10px 40px rgba(6,31,74,.10),0 1px 3px rgba(0,0,0,.06)", borderTop:"4px solid #1d6fde" },
  secHeader:   { background:"linear-gradient(135deg,#0a3d8f 0%,#1d6fde 100%)", color:"#fff", padding:"8px 13px", fontWeight:700, fontSize:12, textTransform:"uppercase", letterSpacing:".06em", borderRadius:7, marginBottom:12, boxShadow:"0 2px 8px rgba(29,111,222,.25)" },
  fila:        { display:"flex", alignItems:"stretch", marginBottom:8, borderRadius:8, overflow:"hidden", border:"1.5px solid #dbeafe" },
  filaLabel:   { width:160, flexShrink:0, background:"linear-gradient(135deg,#0a3d8f 0%,#1d6fde 100%)", color:"#fff", padding:"9px 12px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", letterSpacing:".02em" },
  filaSelect:  { flex:1, padding:"9px 10px", border:"none", fontSize:13, fontFamily:"inherit", background:"#fff", color:"#1a1d23", outline:"none" },
  autocompleteList: { position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:`1.5px solid ${AZUL}`, borderTop:"none", borderRadius:"0 0 6px 6px", zIndex:200, boxShadow:"0 8px 24px rgba(29,111,222,.15)", maxHeight:200, overflowY:"auto" },
  autocompleteItem: { display:"flex", flexDirection:"column", gap:2, padding:"9px 12px", cursor:"pointer", borderBottom:"1px solid #f3f4f6" },
  acItemNombre:{ fontSize:13, fontWeight:700, color:"#1a1d23" },
  acItemSub:   { fontSize:11, color:"#9ca3af" },
  areaGrid:    { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 },
  areaCard:    { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, padding:"14px 8px", border:"1.5px solid", borderRadius:10, cursor:"pointer", transition:"all .18s", userSelect:"none", minHeight:78 },
  otroInput:   { width:"100%", padding:"10px 12px", border:`1.5px solid ${AZUL}`, borderRadius:8, fontSize:13, fontFamily:"inherit", color:"#1a1d23", outline:"none", marginBottom:12, background:"#f8faff" },
  areaChip:    { display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, padding:"6px 14px", borderRadius:20, marginBottom:12 },
  errorBox:    { background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#dc2626", marginBottom:12 },
  botonesRow:  { display:"flex", justifyContent:"flex-end", marginTop:8 },
  btnRegistrar:{ padding:"13px 38px", background:"linear-gradient(135deg,#1d6fde 0%,#0a3d8f 100%)", color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:".04em", transition:"all .2s", boxShadow:"0 6px 18px rgba(29,111,222,.35)" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.rp-root { animation:fadeUp .32s cubic-bezier(.2,.8,.4,1); }
.rp-volver { transition:all .15s !important; }
.rp-volver:hover    { background:rgba(255,255,255,.28) !important; border-color:rgba(255,255,255,.5) !important; }
.rp-volver:active   { transform:scale(.95) !important; }
.rp-ctrl:focus      { outline:2px solid #1d6fde; outline-offset:-1px; }
.rp-ac-item { transition:background .12s !important; }
.rp-ac-item:hover   { background:#eff6ff !important; }
.rp-area-card:hover { transform:translateY(-2px) !important; box-shadow:0 6px 16px rgba(29,111,222,.14) !important; }
.rp-registrar { transition:all .18s !important; }
.rp-registrar:hover { filter:brightness(1.08); transform:translateY(-1px); box-shadow:0 10px 24px rgba(29,111,222,.45) !important; }
.rp-registrar:active { transform:scale(.97) !important; }

@media (max-width: 620px) {
  .rp-area-grid { grid-template-columns:repeat(2,1fr) !important; }
}
@media (max-width: 480px) {
  .rp-area-grid { grid-template-columns:repeat(2,1fr) !important; }
}
`;
