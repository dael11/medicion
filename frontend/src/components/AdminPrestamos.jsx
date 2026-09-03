import { useState, useEffect } from "react";
import { prestamosAPI, areasAPI } from "../api";

const AZUL = "#1d6fde";
const COLORES_AREA = ["#d97706", "#16a34a", "#1d6fde", "#7c3aed", "#dc2626", "#0891b2", "#db2777", "#65a30d"];

export default function AdminPrestamos({ volver = () => {} }) {
  const [tab,       setTab]       = useState("activos");
  const [activos,   setActivos]   = useState([]);
  const [historial, setHistorial] = useState([]);
  const [areas,     setAreas]     = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [hover,     setHover]     = useState(null);
  const [nuevaArea, setNuevaArea] = useState({ nombre: "", icono: "📍", color: COLORES_AREA[0] });
  const [guardandoArea, setGuardandoArea] = useState(false);
  const [areaError, setAreaError] = useState("");

  const cargarActivos   = async () => { const d = await prestamosAPI.getActivos();   setActivos(d); };
  const cargarHistorial = async () => { const d = await prestamosAPI.getHistorial();  setHistorial(d); };
  const cargarAreas     = async () => { const d = await areasAPI.getAll();            setAreas(d); };

  useEffect(() => {
    async function init() {
      try { await Promise.all([cargarActivos(), cargarHistorial(), cargarAreas().catch(() => {})]); }
      catch (e) { console.error(e); }
      finally { setCargando(false); }
    }
    init();
  }, []);

  const agregarArea = async () => {
    const nombre = nuevaArea.nombre.trim();
    if (!nombre) { setAreaError("Escribe el nombre del área."); return; }
    setGuardandoArea(true); setAreaError("");
    try {
      await areasAPI.create({ nombre, icono: nuevaArea.icono || "📍", color: nuevaArea.color });
      setNuevaArea({ nombre: "", icono: "📍", color: COLORES_AREA[0] });
      await cargarAreas();
    } catch (e) { setAreaError(e.message); }
    finally { setGuardandoArea(false); }
  };

  const quitarArea = async (a) => {
    if (!window.confirm(`¿Quitar el área "${a.nombre}"?`)) return;
    try { await areasAPI.remove(a.id); await cargarAreas(); }
    catch (e) { alert("Error: " + e.message); }
  };

  const devolver = async (id) => {
    if (!window.confirm("¿Marcar como devuelto?")) return;
    try {
      await prestamosAPI.devolver(id);
      await Promise.all([cargarActivos(), cargarHistorial()]);
    } catch (e) { alert("Error: " + e.message); }
  };

  const fmt = (fecha) => fecha ? new Date(fecha).toLocaleString("es-MX", { dateStyle:"short", timeStyle:"short" }) : "—";
  const fmtFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString("es-MX") : "—";

  const vencido = (fechaEst) => {
    if (!fechaEst) return false;
    return new Date(fechaEst) < new Date();
  };

  if (cargando) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"#6b7280" }}>
      Cargando préstamos…
    </div>
  );

  return (
    <div className="ap-root" style={s.root}>
      <style>{css}</style>

      {/* TOPBAR */}
      <header style={s.topbar}>
        <div style={s.topLeft}>
          <button className="ap-volver" style={s.btnVolver} onClick={volver}>← Panel administrador</button>
          <div style={s.divider} />
          <h1 style={s.pageTitle}>Préstamos</h1>
        </div>
        <div style={s.topStats}>
          <div className="ap-stat" style={s.statChip}>
            <span style={{ ...s.statIcon, background:"#dbeafe" }}>📦</span>
            <span style={s.statTxt}>
              <span style={{ ...s.statNum, color:AZUL }}>{activos.length}</span>
              <span style={s.statLbl}>Activos</span>
            </span>
          </div>
          <div className="ap-stat" style={s.statChip}>
            <span style={{ ...s.statIcon, background:"#dcfce7" }}>✓</span>
            <span style={s.statTxt}>
              <span style={{ ...s.statNum, color:"#16a34a" }}>{historial.length}</span>
              <span style={s.statLbl}>Devueltos</span>
            </span>
          </div>
          {activos.filter(a => vencido(a.fecha_devolucion_estimada)).length > 0 && (
            <div className="ap-stat" style={s.statChip}>
              <span style={{ ...s.statIcon, background:"#fee2e2" }}>⚠</span>
              <span style={s.statTxt}>
                <span style={{ ...s.statNum, color:"#dc2626" }}>
                  {activos.filter(a => vencido(a.fecha_devolucion_estimada)).length}
                </span>
                <span style={s.statLbl}>Vencidos</span>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* TABS */}
      <div style={s.tabsWrap}>
        {[["activos","Activos", activos.length],["historial","Historial", historial.length],["areas","Áreas", areas.length]].map(([key,lbl,cnt]) => (
          <button key={key} className="ap-tab" style={{ ...s.tab, ...(tab===key ? s.tabActive : {}) }} onClick={() => setTab(key)}>
            {lbl} <span style={{ ...s.tabBadge, ...(tab===key ? s.tabBadgeActive : {}) }}>{cnt}</span>
          </button>
        ))}
      </div>

      {/* BODY */}
      <div style={s.body}>

        {/* ACTIVOS */}
        {tab === "activos" && (
          activos.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📦</div>
              <div style={s.emptyTitle}>Sin préstamos activos</div>
              <div style={s.emptySub}>Todos los dispositivos están en el laboratorio</div>
            </div>
          ) : (
            <div className="ap-card" style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Solicitante","Dispositivo","Para qué","Salida","Devolución est.","Estado","Acción"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activos.map((p,i) => {
                    const venc = vencido(p.fecha_devolucion_estimada);
                    return (
                      <tr key={p.id} style={{ ...s.tr, background: hover===i ? "#fffbeb" : "#fff" }}
                        onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                        <td style={{ ...s.td, fontWeight:500 }}>{p.empleado_nombre}</td>
                        <td style={{ ...s.td, fontWeight:700, color:"#1a1d23" }}>{p.dispositivo_nombre}</td>
                        <td style={{ ...s.td, color:"#6b7280", fontSize:12, maxWidth:200 }}>{p.para_que}</td>
                        <td style={{ ...s.td, fontSize:12, color:"#6b7280", fontFamily:"'DM Mono',monospace" }}>{fmt(p.fecha_salida)}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: venc ? "#fee2e2" : "#f0fdf4", color: venc ? "#dc2626" : "#16a34a", fontWeight:600 }}>
                            {venc ? "⚠ " : ""}{fmtFecha(p.fecha_devolucion_estimada)}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background:"#dbeafe", color:AZUL }}>Activo</span>
                        </td>
                        <td style={s.td}>
                          <button className="ap-devolver" style={s.btnDevolver}
                            onClick={() => devolver(p.id)}>
                            ✓ Devuelto
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* HISTORIAL */}
        {tab === "historial" && (
          historial.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📋</div>
              <div style={s.emptyTitle}>Sin historial aún</div>
            </div>
          ) : (
            <div className="ap-card" style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Solicitante","Dispositivo","Para qué","Salida","Dev. estimada","Dev. real"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historial.map((p,i) => (
                    <tr key={p.id}
                      onMouseEnter={() => setHover(`h${i}`)} onMouseLeave={() => setHover(null)}
                      style={{ ...s.tr, background: hover===`h${i}` ? "#fffbeb" : "#fff" }}>
                      <td style={{ ...s.td, fontWeight:500 }}>{p.empleado_nombre}</td>
                      <td style={{ ...s.td, fontWeight:700 }}>{p.dispositivo_nombre}</td>
                      <td style={{ ...s.td, color:"#6b7280", fontSize:12 }}>{p.para_que}</td>
                      <td style={{ ...s.td, fontSize:12, color:"#6b7280", fontFamily:"'DM Mono',monospace" }}>{fmt(p.fecha_salida)}</td>
                      <td style={{ ...s.td, fontSize:12, color:"#6b7280" }}>{fmtFecha(p.fecha_devolucion_estimada)}</td>
                      <td style={{ ...s.td, fontSize:12, color:"#16a34a", fontFamily:"'DM Mono',monospace" }}>{fmt(p.fecha_devolucion_real)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ÁREAS */}
        {tab === "areas" && (
          <div style={s.areasWrap} className="ap-areas-wrap">
            <div className="ap-card" style={s.areasPanel}>
              <div style={s.areasPanelHead}>Áreas de destino registradas</div>
              {areas.length === 0 ? (
                <p style={{ padding:"18px", fontSize:13, color:"#9ca3af" }}>Aún no hay áreas. Agrega la primera abajo.</p>
              ) : (
                <div style={s.areasList}>
                  {areas.map(a => (
                    <div key={a.id} style={s.areaRow}>
                      <span style={{ ...s.areaBadge, background: (a.color || "#6b7280") + "1c", color: a.color || "#6b7280" }}>
                        <span style={{ fontSize:15 }}>{a.icono || "📍"}</span> {a.nombre}
                      </span>
                      <button className="ap-area-del" style={s.areaDel} onClick={() => quitarArea(a)}>Quitar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ap-card" style={s.areasPanel}>
              <div style={s.areasPanelHead}>Dar de alta un área nueva</div>
              <div style={s.areaForm}>
                <div style={s.areaFormRow}>
                  <label style={s.areaFormLbl}>Nombre</label>
                  <input className="ap-input" style={s.areaInput} placeholder="Ej. Laboratorio, Almacén, Logística…"
                    value={nuevaArea.nombre}
                    onChange={e => setNuevaArea(v => ({ ...v, nombre: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && agregarArea()} />
                </div>
                <div style={s.areaFormRow}>
                  <label style={s.areaFormLbl}>Icono</label>
                  <input className="ap-input" style={{ ...s.areaInput, width:70, textAlign:"center" }} maxLength={3}
                    value={nuevaArea.icono}
                    onChange={e => setNuevaArea(v => ({ ...v, icono: e.target.value }))} />
                </div>
                <div style={s.areaFormRow}>
                  <label style={s.areaFormLbl}>Color</label>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {COLORES_AREA.map(c => (
                      <button key={c} onClick={() => setNuevaArea(v => ({ ...v, color: c }))}
                        style={{ ...s.colorDot, background:c, outline: nuevaArea.color === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset:2 }} />
                    ))}
                  </div>
                </div>
                {areaError && <div style={s.areaErr}>⚠ {areaError}</div>}
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <button className="ap-devolver" style={{ ...s.btnDevolver, background:"#dbeafe", color:AZUL, borderColor:"#93c5fd", opacity: guardandoArea ? .6 : 1 }}
                    onClick={agregarArea} disabled={guardandoArea}>
                    {guardandoArea ? "Guardando…" : "＋ Agregar área"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root:       { minHeight:"100vh", background:"#f0f2f6", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" },
  topbar:     { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 55%,#1d6fde 100%)", borderBottom:"none", boxShadow:"0 2px 12px rgba(6,31,74,.35)", position:"sticky", top:0, zIndex:100 },
  topLeft:    { display:"flex", alignItems:"center", gap:16 },
  btnVolver:  { padding:"7px 14px", border:"1px solid rgba(255,255,255,.3)", background:"rgba(255,255,255,.1)", borderRadius:8, fontSize:13, fontWeight:500, color:"rgba(255,255,255,.9)", cursor:"pointer", fontFamily:"inherit" },
  divider:    { width:1, height:24, background:"rgba(255,255,255,.2)" },
  pageTitle:  { fontSize:16, fontWeight:700, color:"#fff", margin:0 },
  topStats:   { display:"flex", gap:10 },
  statChip:   { display:"flex", alignItems:"center", gap:10, background:"#fff", borderRadius:12, padding:"7px 14px 7px 8px", boxShadow:"0 6px 18px rgba(6,31,74,.30)" },
  statIcon:   { width:30, height:30, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 },
  statTxt:    { display:"flex", flexDirection:"column", lineHeight:1.05 },
  statNum:    { fontSize:19, fontWeight:800, fontFamily:"'DM Mono',monospace" },
  statLbl:    { fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#94a3b8" },
  tabsWrap:   { display:"flex", padding:"0 28px", background:"#fff", borderBottom:"1px solid #e2e5ea" },
  tab:        { padding:"12px 20px", background:"none", border:"none", borderBottom:"2px solid transparent", fontSize:14, fontWeight:500, color:"#6b7280", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 },
  tabActive:  { borderBottom:`2px solid ${AZUL}`, color:AZUL, fontWeight:600 },
  tabBadge:   { fontSize:11, background:"#f3f4f6", color:"#6b7280", padding:"1px 8px", borderRadius:20, fontFamily:"'DM Mono',monospace" },
  tabBadgeActive:{ background:"#dbeafe", color:AZUL },
  body:       { padding:"20px 28px", flex:1 },
  tableWrap:  { background:"#fff", border:"1px solid #e2e5ea", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.06)", borderTop:"3px solid #d97706" },
  table:      { width:"100%", borderCollapse:"collapse" },
  th:         { padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#b45309", borderBottom:"1px solid #fde68a", background:"#fffbeb", whiteSpace:"nowrap" },
  tr:         { borderBottom:"1px solid #fef9ec", transition:"background .12s" },
  td:         { padding:"11px 14px", fontSize:13, color:"#1a1d23", verticalAlign:"middle" },
  badge:      { fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, display:"inline-block" },
  btnDevolver:{ padding:"5px 14px", background:"#dcfce7", color:"#16a34a", border:"1px solid #86efac", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
  empty:      { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:250, gap:8 },
  emptyIcon:  { fontSize:48, opacity:.3 },
  emptyTitle: { fontSize:16, fontWeight:600, color:"#6b7280" },
  emptySub:   { fontSize:13, color:"#9ca3af" },
  areasWrap:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:900 },
  areasPanel: { background:"#fff", border:"1px solid #e2e5ea", borderTop:"3px solid #d97706", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.06),0 4px 14px rgba(0,0,0,.05)" },
  areasPanelHead:{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#b45309", background:"#fffbeb", padding:"12px 16px", borderBottom:"1px solid #fde68a" },
  areasList:  { display:"flex", flexDirection:"column" },
  areaRow:    { display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"10px 16px", borderBottom:"1px solid #f3f4f6" },
  areaBadge:  { display:"inline-flex", alignItems:"center", gap:7, fontSize:13, fontWeight:700, padding:"5px 12px", borderRadius:20 },
  areaDel:    { padding:"5px 12px", background:"#fee2e2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
  areaForm:   { padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 },
  areaFormRow:{ display:"flex", alignItems:"center", gap:12 },
  areaFormLbl:{ fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".04em", width:60, flexShrink:0 },
  areaInput:  { flex:1, padding:"9px 11px", border:"1.5px solid #e2e5ea", borderRadius:8, fontSize:13, fontFamily:"inherit", color:"#1a1d23", outline:"none" },
  colorDot:   { width:22, height:22, borderRadius:"50%", border:"none", cursor:"pointer", padding:0 },
  areaErr:    { fontSize:12, color:"#dc2626", background:"#fee2e2", borderRadius:6, padding:"7px 10px" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.ap-root { animation:fadeUp .32s cubic-bezier(.2,.8,.4,1); }
.ap-card { transition:box-shadow .22s,transform .22s !important; }
.ap-card:hover { transform:translateY(-2px) !important; box-shadow:0 8px 28px rgba(0,0,0,.11) !important; }
.ap-stat { transition:transform .18s,box-shadow .18s !important; cursor:default; }
.ap-stat:hover { transform:translateY(-2px) !important; box-shadow:0 10px 24px rgba(6,31,74,.4) !important; }
.ap-tab { transition:color .15s,border-color .15s !important; }
.ap-volver { transition:all .15s !important; }
.ap-volver:hover   { background:rgba(255,255,255,.2) !important; border-color:rgba(255,255,255,.5) !important; }
.ap-volver:active  { transform:scale(.95) !important; }
.ap-devolver { transition:all .15s !important; }
.ap-devolver:hover { filter:brightness(.97); box-shadow:0 4px 12px rgba(0,0,0,.12) !important; }
.ap-devolver:active { transform:scale(.96) !important; }
.ap-input:focus { border-color:#1d6fde !important; box-shadow:0 0 0 3px rgba(29,111,222,.12) !important; }
.ap-area-del { transition:all .15s !important; }
.ap-area-del:hover { background:#fecaca !important; }
@media (max-width: 760px) { .ap-areas-wrap { grid-template-columns:1fr !important; } }
`;