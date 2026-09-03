import { useState } from "react";

const demo = [
  { folio:1, pieza:"5626 D",  cliente:"Brose",          nombre:"Erick Garcia",      prioridad:"Crítico (<4 Hr)",  cantidad:2, tiempoTotal:60,  tipoDescripcion:"Full",  tipoDescripcionDetalle:"",                                                              fechaIngreso:"21/4/2026, 8:03", fechaFin:"21/4/2026, 9:01"  },
  { folio:2, pieza:"4984",    cliente:"Plastic Omnium", nombre:"Mario Aguilar",     prioridad:"Urgente (<24 Hr)", cantidad:3, tiempoTotal:90,  tipoDescripcion:"Otro",  tipoDescripcionDetalle:"Medir punto A3, B7 y el radio de la cara inferior del clip",    fechaIngreso:"21/4/2026, 9:01", fechaFin:"21/4/2026, 10:36" },
  { folio:3, pieza:"5635 LH", cliente:"Brose",          nombre:"Cesar Minero",      prioridad:"Normal",           cantidad:1, tiempoTotal:90,  tipoDescripcion:"Full",  tipoDescripcionDetalle:"",                                                              fechaIngreso:"20/4/2026, 14:00",fechaFin:"20/4/2026, 15:28" },
  { folio:4, pieza:"5540",    cliente:"Audi",           nombre:"Jorge Martinez",    prioridad:"Urgente (<24 Hr)", cantidad:2, tiempoTotal:90,  tipoDescripcion:"Otro",  tipoDescripcionDetalle:"Verificar diámetro de barreno y planitud de superficie",        fechaIngreso:"20/4/2026, 10:00",fechaFin:"20/4/2026, 11:42" },
  { folio:5, pieza:"5636 RH", cliente:"Brose",          nombre:"Victor Guadarrama", prioridad:"Normal",           cantidad:3, tiempoTotal:270, tipoDescripcion:"Full",  tipoDescripcionDetalle:"",                                                              fechaIngreso:"19/4/2026, 8:00", fechaFin:"19/4/2026, 12:21" },
];

const colorBadge = (p = "") => {
  if (p.includes("Crítico")) return { bg:"#fee2e2", color:"#dc2626" };
  if (p.includes("Urgente")) return { bg:"#fef3c7", color:"#d97706" };
  return { bg:"#dcfce7", color:"#16a34a" };
};

export default function AdminHistorial({
  historial = demo,
  volver    = () => alert("← Panel"),
}) {
  const [busqueda, setBusqueda] = useState("");
  const [sortCol,  setSortCol]  = useState("fechaFin");
  const [sortDir,  setSortDir]  = useState("desc");
  const [hover,    setHover]    = useState(null);

  const filtrados = historial.filter(r =>
    r.pieza?.toLowerCase().includes(busqueda.toLowerCase())   ||
    r.cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.nombre?.toLowerCase().includes(busqueda.toLowerCase())  ||
    String(r.folio).includes(busqueda)
  );

  const ordenados = [...filtrados].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortCol === "fechaFin" || sortCol === "fechaIngreso")
      return mul * (new Date(b[sortCol]) - new Date(a[sortCol]));
    if (["tiempoTotal","folio","cantidad"].includes(sortCol))
      return mul * ((a[sortCol]||0) - (b[sortCol]||0));
    return mul * String(a[sortCol]||"").localeCompare(String(b[sortCol]||""));
  });

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const totalPiezas  = historial.reduce((s,r) => s + (r.cantidad||0), 0);
  const totalMin     = historial.reduce((s,r) => s + (r.tiempoTotal||0), 0);
  const fmtHoras     = (m) => m < 60 ? `${m} min` : `${Math.floor(m/60)} h${m%60 ? " "+(m%60)+"m" : ""}`;

  const cols = [
    { key:"folio",           label:"Folio",            sortable:true  },
    { key:"fechaIngreso",    label:"Ingreso",           sortable:true  },
    { key:"fechaFin",        label:"Fin",               sortable:true  },
    { key:"nombre",          label:"Solicitante",       sortable:true  },
    { key:"pieza",           label:"No. Parte",         sortable:true  },
    { key:"cliente",         label:"Cliente",           sortable:true  },
    { key:"cantidad",        label:"Cant.",             sortable:false },
    { key:"prioridad",       label:"Prioridad",         sortable:false },
    { key:"tipoDescripcion", label:"Tipo medición",     sortable:false },
    { key:"tiempoTotal",     label:"Tiempo Total",      sortable:true  },
  ];

  return (
    <div className="ah-root" style={s.root}>
      <style>{css}</style>

      {/* TOPBAR */}
      <header style={s.topbar}>
        <div style={s.topLeft}>
          <button className="btn-volver" style={s.btnVolver} onClick={volver}>
            ← Panel administrador
          </button>
          <div style={s.divider} />
          <h1 style={s.pageTitle}>Historial de Mediciones</h1>
        </div>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>⌕</span>
          <input
            className="h-search"
            style={s.searchInput}
            placeholder="Buscar folio, pieza, cliente, solicitante…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button style={s.clearBtn} onClick={() => setBusqueda("")}>✕</button>
          )}
        </div>
      </header>

      {/* MÉTRICAS — tira compacta */}
      <section style={s.metrics}>
        {[
          { label:"Mediciones completadas", value: historial.length,   icon:"✓", accent:"#7c3aed" },
          { label:"Piezas medidas",         value: totalPiezas,        icon:"▤", accent:"#16a34a" },
          { label:"Tiempo acumulado",       value: fmtHoras(totalMin), icon:"⏱", accent:"#0891b2" },
        ].map((m, i) => (
          <div key={m.label} style={{ ...s.metricItem, borderLeft: i === 0 ? "none" : "1px solid #ececf4" }}>
            <span style={{ ...s.metricIcon, background:`${m.accent}18`, color:m.accent }}>{m.icon}</span>
            <span style={{ ...s.metricValue, color:m.accent }}>{m.value}</span>
            <span style={s.metricLabel}>{m.label}</span>
          </div>
        ))}
      </section>

      {/* TABLA */}
      <div className="ah-card" style={s.tableWrap}>
        <div style={s.tableHeader}>
          <span style={s.tableTitle}>Registro completo</span>
          <span style={s.tableSub}>
            {filtrados.length !== historial.length
              ? `${filtrados.length} de ${historial.length} registros`
              : `${historial.length} registro${historial.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                {cols.map(c => (
                  <th
                    key={c.key}
                    style={{ ...s.th, cursor: c.sortable ? "pointer" : "default" }}
                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                    className={c.sortable ? "th-sort" : ""}
                  >
                    {c.label}
                    {c.sortable && (
                      <span style={{ marginLeft:4, color: sortCol === c.key ? "#7c3aed" : "#d1d5db" }}>
                        {sortCol === c.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenados.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} style={s.tdEmpty}>
                    {busqueda ? `Sin resultados para "${busqueda}"` : "No hay mediciones finalizadas"}
                  </td>
                </tr>
              ) : (
                ordenados.map((reg, i) => {
                  return (
                    <tr
                      key={i}
                      style={{ ...s.tr, background: hover === i ? "#ede9fe" : (i % 2 ? "#faf9ff" : "#fff") }}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <td style={{ ...s.td, ...s.mono, color:"#9ca3af", fontSize:12 }}>#{reg.folio}</td>
                      <td style={{ ...s.td, fontSize:12, color:"#6b7280", ...s.mono }}>{reg.fechaIngreso}</td>
                      <td style={{ ...s.td, fontSize:12, color:"#6b7280", ...s.mono }}>{reg.fechaFin}</td>
                      <td style={{ ...s.td, color:"#1a1d23", fontWeight:500 }}>{reg.nombre}</td>
                      <td style={{ ...s.td, ...s.mono, fontWeight:700, color:"#1a1d23" }}>{reg.pieza}</td>
                      <td style={{ ...s.td, color:"#4b5563" }}>{reg.cliente}</td>
                      <td style={{ ...s.td, ...s.mono, textAlign:"center" }}>{reg.cantidad}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, ...colorBadge(reg.prioridad) }}>{reg.prioridad?.split(" ")[0]}</span>
                      </td>
                      <td style={s.td}>
                        {reg.tipoDescripcion === "Otro" && reg.tipoDescripcionDetalle ? (
                          <div style={s.otroWrap}>
                            <span style={s.otroBadge}>Otro</span>
                            <span style={s.otroDetalle}>{reg.tipoDescripcionDetalle}</span>
                          </div>
                        ) : (
                          <span style={{ ...s.badge, background:"#eff6ff", color:"#1d6fde" }}>
                            {reg.tipoDescripcion === "Full" ? "Full Layout" : (reg.tipoDescripcion || "—")}
                          </span>
                        )}
                      </td>
                      <td style={{ ...s.td, ...s.mono, color:"#6b7280" }}>{reg.tiempoTotal} min</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {ordenados.length > 0 && (
          <div style={s.tableFooter}>
            <span style={{ fontSize:12, color:"#9ca3af" }}>
              Mostrando {ordenados.length} registro{ordenados.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root:        { minHeight:"100vh", background:"#f0f2f6", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" },
  topbar:      { display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, padding:"14px 28px", background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 55%,#1d6fde 100%)", borderBottom:"none", boxShadow:"0 2px 12px rgba(6,31,74,.35)", position:"sticky", top:0, zIndex:100, flexWrap:"wrap" },
  topLeft:     { display:"flex", alignItems:"center", gap:16 },
  btnVolver:   { display:"flex", alignItems:"center", gap:6, padding:"7px 14px", border:"1px solid rgba(255,255,255,.3)", background:"rgba(255,255,255,.1)", borderRadius:8, fontSize:13, fontWeight:500, color:"rgba(255,255,255,.9)", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" },
  divider:     { width:1, height:24, background:"rgba(255,255,255,.2)" },
  pageTitle:   { fontSize:16, fontWeight:700, color:"#fff", margin:0 },
  searchWrap:  { position:"relative", width:340 },
  searchIcon:  { position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:17, color:"rgba(255,255,255,.5)", pointerEvents:"none" },
  searchInput: { width:"100%", padding:"8px 32px 8px 34px", border:"1px solid rgba(255,255,255,.25)", borderRadius:8, fontSize:13, fontFamily:"inherit", background:"rgba(255,255,255,.12)", color:"#fff", outline:"none", boxSizing:"border-box" },
  clearBtn:    { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,.6)", cursor:"pointer", fontSize:13, padding:2 },
  metrics:     { display:"flex", alignItems:"stretch", gap:0, margin:"18px 28px 0", background:"#fff", border:"1px solid #ececf4", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.05)", overflow:"hidden" },
  metricItem:  { flex:1, display:"flex", alignItems:"center", gap:10, padding:"12px 18px", minWidth:0 },
  metricIcon:  { width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 },
  metricValue: { fontSize:20, fontWeight:800, fontFamily:"'DM Mono',monospace", flexShrink:0 },
  metricLabel: { fontSize:11, textTransform:"uppercase", letterSpacing:".05em", color:"#6b7280", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  tableWrap:   { background:"#fff", border:"1px solid #e2e5ea", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.06)", overflow:"hidden", margin:"14px 28px 28px", borderTop:"3px solid #7c3aed" },
  tableHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #ddd6fe", background:"linear-gradient(135deg,#f5f3ff,#faf5ff)" },
  tableTitle:  { fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#7c3aed" },
  tableSub:    { fontSize:12, color:"#a78bfa" },
  table:       { width:"100%", borderCollapse:"collapse" },
  th:          { padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#7c3aed", borderBottom:"1px solid #ddd6fe", whiteSpace:"nowrap", background:"#f5f3ff", userSelect:"none" },
  tr:          { borderBottom:"1px solid #faf5ff", transition:"background .12s" },
  td:          { padding:"11px 14px", fontSize:13, color:"#1a1d23", verticalAlign:"middle" },
  tdEmpty:     { padding:48, textAlign:"center", color:"#9ca3af", fontSize:13 },
  badge:       { fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:".04em" },
  mono:        { fontFamily:"'DM Mono',monospace" },
  otroWrap:    { display:"flex", flexDirection:"column", gap:4, maxWidth:220 },
  otroBadge:   { fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#fef3c7", color:"#d97706", alignSelf:"flex-start", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:".04em" },
  otroDetalle: { fontSize:12, color:"#374151", lineHeight:1.4, fontStyle:"italic" },
  tableFooter: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderTop:"1px solid #f3f4f6", background:"#fafbfc" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.ah-root { animation:fadeUp .32s cubic-bezier(.2,.8,.4,1); }
.ah-card { transition:box-shadow .22s,transform .22s !important; }
.ah-card:hover { transform:translateY(-2px) !important; box-shadow:0 8px 28px rgba(0,0,0,.11) !important; }
.btn-volver { transition:all .15s !important; }
.btn-volver:hover  { background:rgba(255,255,255,.2) !important; border-color:rgba(255,255,255,.5) !important; }
.btn-volver:active { transform:scale(.95) !important; }
.h-search::placeholder { color:rgba(255,255,255,.4); }
.h-search:focus   { border-color:rgba(255,255,255,.5) !important; background:rgba(255,255,255,.18) !important; }
.th-sort { transition:background .15s,color .15s !important; }
.th-sort:hover    { background:#ede9fe !important; color:#7c3aed !important; }
.metric-card { transition:box-shadow .22s,transform .22s !important; }
.metric-card:hover { transform:translateY(-3px) !important; box-shadow:0 10px 28px rgba(0,0,0,.12) !important; }
`;