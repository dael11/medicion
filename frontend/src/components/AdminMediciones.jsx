import { useState } from "react";

const demo = [
  { folio:1, pieza:"5626 D",  cliente:"Brose",          nombre:"Erick Garcia",   prioridad:"Crítico (<4 Hr)",  tiempoTotal:60,  tiempoTranscurrido:22, estado:"proceso",   fechaIngreso:"21/4/2026, 8:03", razon:"Liberación de proceso / serie", cantidad:2, tipoDescripcion:"Full",  tipoDescripcionDetalle:"" },
  { folio:2, pieza:"4984",    cliente:"Plastic Omnium", nombre:"Mario Aguilar",  prioridad:"Urgente (<24 Hr)", tiempoTotal:90,  tiempoTranscurrido:0,  estado:"pendiente", fechaIngreso:"21/4/2026, 8:15", razon:"PPAP",                          cantidad:3, tipoDescripcion:"Otro",  tipoDescripcionDetalle:"Medir punto A3, B7 y el radio de la cara inferior del clip" },
  { folio:3, pieza:"5540",    cliente:"Audi",           nombre:"Cesar Minero",   prioridad:"Normal",           tiempoTotal:270, tiempoTranscurrido:0,  estado:"pendiente", fechaIngreso:"21/4/2026, 9:00", razon:"Programa de validación",        cantidad:3, tipoDescripcion:"Full",  tipoDescripcionDetalle:"" },
  { folio:4, pieza:"5636 RH", cliente:"Brose",          nombre:"Jorge Martinez", prioridad:"Urgente (<24 Hr)", tiempoTotal:45,  tiempoTranscurrido:0,  estado:"pendiente", fechaIngreso:"21/4/2026, 9:20", razon:"Reclamación interna / externa",  cantidad:1, tipoDescripcion:"Otro",  tipoDescripcionDetalle:"Verificar diámetro de barreno y planitud de superficie de montaje" },
];

const colorBadge = (p = "") => {
  if (p.includes("Crítico")) return { bg:"#fee2e2", color:"#dc2626" };
  if (p.includes("Urgente")) return { bg:"#fef3c7", color:"#d97706" };
  return { bg:"#dcfce7", color:"#16a34a" };
};

const accentGantt = (p = "", estado) => {
  if (estado === "proceso") return "#1d6fde";
  if (p.includes("Crítico")) return "#dc2626";
  if (p.includes("Urgente")) return "#d97706";
  return "#94a3b8";
};

// oscurece un hex para el gradiente de la barra
const darken = (hex, amt = 24) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 255) - amt);
  const b = Math.max(0, (n & 255) - amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const hhmm = (m = 0) => {
  m = Math.round(m);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};

export default function AdminMediciones({
  registros        = demo,
  terminarMedicion = (i) => {},
  volver           = () => {},
  onRefresh        = () => {},
}) {
  const [hover, setHover] = useState(null);

  const enProceso  = registros.find(r => r.estado === "proceso");
  const pendientes = registros.filter(r => r.estado === "pendiente");

  const pct = enProceso
    ? Math.min(((enProceso.tiempoTranscurrido||0) / enProceso.tiempoTotal) * 100, 100)
    : 0;

  // Cronograma en cascada: cada medición arranca cuando termina la anterior
  const ganttOrden = [...registros].sort(
    (a, b) => (b.estado === "proceso" ? 1 : 0) - (a.estado === "proceso" ? 1 : 0)
  );
  let _acc = 0;
  const ganttRows = ganttOrden.map(r => {
    const start = _acc;
    const dur = r.tiempoTotal || 0;
    _acc += dur;
    return { ...r, _start: start, _dur: dur };
  });
  const totalCola = _acc;
  const maxEje    = Math.max(60, Math.ceil(totalCola / 60) * 60);
  const pasoEje   = maxEje <= 240 ? 60 : maxEje <= 720 ? 120 : maxEje <= 1440 ? 180 : 360;
  const ticksEje  = [];
  for (let t = 0; t <= maxEje; t += pasoEje) ticksEje.push(t);

  return (
    <div className="am-root" style={s.root}>
      <style>{css}</style>

      {/* TOPBAR */}
      <header style={s.topbar}>
        <div style={s.topLeft}>
          <button className="btn-volver" style={s.btnVolver} onClick={volver}>← Panel administrador</button>
          <div style={s.divider} />
          <h1 style={s.pageTitle}>Planificación de Mediciones</h1>
        </div>
        <div style={s.topStats}>
          {[
            { label:"En proceso", value: enProceso ? 1 : 0, icon:"▶", num:"#1d6fde", bg:"#dbeafe" },
            { label:"Pendientes", value: pendientes.length,  icon:"◷", num:"#d97706", bg:"#fef3c7" },
            { label:"Total",      value: registros.length,   icon:"▤", num:"#0a3d8f", bg:"#e0e7ff" },
          ].map(st => (
            <div key={st.label} className="am-stat" style={s.statChip}>
              <span style={{ ...s.statIcon, background: st.bg, color: st.num }}>{st.icon}</span>
              <span style={s.statTxt}>
                <span style={{ ...s.statNum, color: st.num }}>{st.value}</span>
                <span style={s.statLbl}>{st.label}</span>
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* CUERPO */}
      <div style={s.body}>

        {/* TABLA */}
        <div className="am-card" style={s.tableWrap}>
          <div style={s.tableHeader}>
            <span style={s.tableTitle}>Cola de mediciones</span>
            <span style={s.tableSub}>{registros.length} registro{registros.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Folio","Estado","No. Parte","Cliente","Solicitante","Prioridad","Cant.","Tiempo est.","Razón","Tipo medición","Acción"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr><td colSpan="11" style={s.tdEmpty}>Sin mediciones registradas</td></tr>
                ) : (
                  registros.map((reg, i) => (
                    <tr
                      key={i}
                      style={{
                        ...s.tr,
                        background: reg.estado === "proceso" ? "#dbeafe" : (hover === i ? "#eff6ff" : "#fff"),
                        borderLeft: reg.estado === "proceso" ? "3px solid #1d6fde" : "3px solid transparent",
                      }}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <td style={{ ...s.td, ...s.mono, color:"#9ca3af", fontSize:12 }}>#{reg.folio}</td>
                      <td style={s.td}>
                        <span style={{
                          ...s.estadoBadge,
                          background: reg.estado === "proceso" ? "#dbeafe" : "#f3f4f6",
                          color:      reg.estado === "proceso" ? "#1d6fde" : "#6b7280",
                        }}>
                          {reg.estado === "proceso" ? "● En proceso" : "○ Pendiente"}
                        </span>
                      </td>
                      <td style={{ ...s.td, ...s.mono, fontWeight:600, color:"#1a1d23" }}>{reg.pieza}</td>
                      <td style={{ ...s.td, color:"#4b5563" }}>{reg.cliente}</td>
                      <td style={{ ...s.td, color:"#4b5563" }}>{reg.nombre}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, ...colorBadge(reg.prioridad) }}>{reg.prioridad}</span>
                      </td>
                      <td style={{ ...s.td, ...s.mono, textAlign:"center" }}>{reg.cantidad}</td>
                      <td style={{ ...s.td, ...s.mono, color:"#4b5563" }}>
                        {reg.tiempoTotal} min
                        {reg.tiempoPorPieza ? <span style={{ color:"#9ca3af", fontSize:11 }}> ({reg.tiempoPorPieza}/pza)</span> : null}
                        {(reg.tiempoTipo > 0 || reg.tiempoRazon > 0) && (
                          <div style={{ color:"#9ca3af", fontSize:10, marginTop:2 }}>
                            tipo {reg.tiempoTipo || 0}{reg.tiempoRazon > 0 ? ` · razón +${reg.tiempoRazon}` : ""}
                          </div>
                        )}
                      </td>
                      <td style={{ ...s.td, color:"#6b7280", fontSize:12 }}>{reg.razon || "—"}</td>
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
                      <td style={s.td}>
                        {reg.estado === "proceso" ? (
                          <button className="btn-terminar" style={s.btnTerminar} onClick={async () => {
                            await terminarMedicion(i);
                            await onRefresh();
                          }}>
                            ✓ Terminar
                          </button>
                        ) : (
                          <span style={{ color:"#d1d5db", fontSize:12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRONOGRAMA (GANTT) */}
        <div className="am-card" style={s.ganttWrap}>
          <div style={s.tableHeader}>
            <span style={s.tableTitle}>Cronograma estimado</span>
            <span style={s.tableSub}>
              {registros.length === 0 ? "Sin mediciones en cola" : `Cola completa ≈ ${hhmm(totalCola)}`}
            </span>
          </div>

          {registros.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"#9ca3af", fontSize:13 }}>Sin mediciones</div>
          ) : (
            <div style={s.ganttBody}>
              {/* eje */}
              <div style={s.ganttAxis}>
                {ticksEje.map(t => (
                  <div key={t} style={{ ...s.ganttTick, left:`${(t / maxEje) * 100}%` }}>
                    <div style={s.ganttTickLine} />
                    <span style={s.ganttTickLabel}>{t === 0 ? "0" : t % 60 === 0 ? `${t / 60}h` : `${t}m`}</span>
                  </div>
                ))}
              </div>

              {/* filas */}
              {ganttRows.map((reg, i) => {
                const color   = accentGantt(reg.prioridad, reg.estado);
                const startPct = (reg._start / maxEje) * 100;
                const durPct   = (reg._dur / maxEje) * 100;
                const progPct  = reg.estado === "proceso"
                  ? Math.min(((reg.tiempoTranscurrido || 0) / (reg._dur || 1)) * 100, 100)
                  : 0;
                const gridPct = (pasoEje / maxEje) * 100;
                const labelTxt = `${hhmm(reg._dur)}${reg.estado === "proceso" ? ` · ${Math.round(progPct)}%` : ""}`;
                const labelDentro = startPct + durPct > 76;  // muy a la derecha → etiqueta dentro de la barra
                return (
                  <div key={reg.folio ?? i} className="am-gantt-row" style={s.ganttRow}>
                    <div style={s.ganttLabel}>
                      <span style={{ ...s.mono, fontSize:10, color:"#9ca3af" }}>#{reg.folio}</span>
                      <span style={{ ...s.mono, fontSize:12, fontWeight:700, color:"#1a1d23" }}>{reg.pieza}</span>
                      <span style={{ fontSize:10, color:"#9ca3af", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:100 }}>{reg.nombre}</span>
                    </div>
                    <div style={{ ...s.ganttTrack, backgroundImage:`repeating-linear-gradient(90deg, transparent, transparent calc(${gridPct}% - 1px), #e9eef5 calc(${gridPct}% - 1px), #e9eef5 ${gridPct}%)` }}>
                      <div
                        className={reg.estado === "proceso" ? "am-gantt-bar am-gantt-live" : "am-gantt-bar"}
                        style={{
                          ...s.ganttBar,
                          left:`${startPct}%`,
                          width:`${Math.max(durPct, 0.6)}%`,
                          background:`linear-gradient(180deg, ${color} 0%, ${darken(color, 34)} 100%)`,
                          boxShadow:`inset 0 1px 0 rgba(255,255,255,.28), 0 3px 9px ${color}44`,
                        }}
                      >
                        {reg.estado === "proceso" && (
                          <div style={{ ...s.ganttProgress, width:`${progPct}%` }} />
                        )}
                        {labelDentro && (
                          <span style={s.ganttBarLabelIn}>{labelTxt}</span>
                        )}
                      </div>
                      {!labelDentro && (
                        <span style={{ ...s.ganttBarLabel, left:`calc(${startPct + durPct}% + 8px)`, color:darken(color, 55) }}>
                          {labelTxt}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={s.ganttLegend}>
            {[
              { color:"#1d6fde", label:"En proceso" },
              { color:"#dc2626", label:"Crítico" },
              { color:"#d97706", label:"Urgente" },
              { color:"#94a3b8", label:"Normal" },
            ].map(l => (
              <div key={l.label} style={s.legendItem}>
                <div style={{ ...s.legendDot, background:l.color }} />
                <span style={s.legendLabel}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root:        { minHeight:"100vh", background:"#f0f2f6", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" },
  topbar:      { display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, padding:"14px 28px", background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 55%,#1d6fde 100%)", borderBottom:"none", boxShadow:"0 2px 12px rgba(6,31,74,.35)", position:"sticky", top:0, zIndex:100 },
  topLeft:     { display:"flex", alignItems:"center", gap:16 },
  btnVolver:   { display:"flex", alignItems:"center", gap:6, padding:"7px 14px", border:"1px solid rgba(255,255,255,.3)", background:"rgba(255,255,255,.1)", borderRadius:8, fontSize:13, fontWeight:500, color:"rgba(255,255,255,.9)", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" },
  divider:     { width:1, height:24, background:"rgba(255,255,255,.2)" },
  pageTitle:   { fontSize:16, fontWeight:700, color:"#fff", margin:0 },
  topStats:    { display:"flex", gap:10 },
  statChip:    { display:"flex", alignItems:"center", gap:10, background:"#fff", borderRadius:12, padding:"7px 14px 7px 8px", boxShadow:"0 6px 18px rgba(6,31,74,.30)" },
  statIcon:    { width:30, height:30, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 },
  statTxt:     { display:"flex", flexDirection:"column", lineHeight:1.05 },
  statNum:     { fontSize:19, fontWeight:800, fontFamily:"'DM Mono',monospace" },
  statLbl:     { fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#94a3b8" },
  body:        { display:"flex", flexDirection:"column", gap:14, padding:"20px 28px 28px" },
  tableWrap:   { background:"#fff", border:"1px solid #e2e5ea", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.06)", overflow:"hidden", borderTop:"3px solid #1d6fde" },
  tableHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #1d6fde55", background:"linear-gradient(135deg,#1d6fde 0%,#2563eb 100%)" },
  tableTitle:  { fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#fff" },
  tableSub:    { fontSize:12, color:"rgba(255,255,255,.65)" },
  table:       { width:"100%", borderCollapse:"collapse" },
  th:          { padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#1d6fde", borderBottom:"1px solid #bfdbfe", whiteSpace:"nowrap", background:"#eff6ff" },
  tr:          { transition:"background .15s", borderBottom:"1px solid #f0f4ff" },
  td:          { padding:"11px 14px", fontSize:13, color:"#1a1d23", verticalAlign:"middle" },
  tdEmpty:     { padding:40, textAlign:"center", color:"#9ca3af", fontSize:13 },
  badge:       { fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:".04em" },
  estadoBadge: { fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap" },
  btnTerminar: { padding:"6px 14px", background:"#16a34a", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" },
  mono:        { fontFamily:"'DM Mono',monospace" },
  otroWrap:    { display:"flex", flexDirection:"column", gap:4, maxWidth:220 },
  otroBadge:   { fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#fef3c7", color:"#d97706", alignSelf:"flex-start", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:".04em" },
  otroDetalle: { fontSize:12, color:"#374151", lineHeight:1.4, fontStyle:"italic" },
  ganttWrap:   { background:"#fff", border:"1px solid #e2e5ea", borderTop:"3px solid #1d6fde", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.06)", overflow:"hidden" },
  ganttBody:   { padding:"18px 22px 12px" },
  ganttAxis:   { position:"relative", height:22, marginLeft:116, marginBottom:10 },
  ganttTick:   { position:"absolute", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center" },
  ganttTickLine:  { width:1, height:7, background:"#cbd5e1" },
  ganttTickLabel: { fontSize:10, color:"#94a3b8", marginTop:3, fontFamily:"'DM Mono',monospace" },
  ganttRow:    { display:"flex", alignItems:"center", gap:12, marginBottom:9 },
  ganttLabel:  { width:104, flexShrink:0, display:"flex", flexDirection:"column", gap:0, textAlign:"right", alignItems:"flex-end" },
  ganttTrack:  { flex:1, position:"relative", height:30, background:"#f8fafc", border:"1px solid #eef2f7", borderRadius:8 },
  ganttBar:    { position:"absolute", top:3, height:24, borderRadius:7, overflow:"hidden", minWidth:6, transition:"width .5s ease,left .5s ease" },
  ganttProgress:  { position:"absolute", top:0, left:0, height:"100%", background:"rgba(255,255,255,.42)", borderRight:"2px solid rgba(255,255,255,.95)", transition:"width .6s ease" },
  ganttBarLabel:  { position:"absolute", top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:700, whiteSpace:"nowrap", fontFamily:"'DM Mono',monospace" },
  ganttBarLabelIn:{ position:"absolute", top:"50%", right:8, transform:"translateY(-50%)", fontSize:11, fontWeight:700, whiteSpace:"nowrap", fontFamily:"'DM Mono',monospace", color:"#fff", textShadow:"0 1px 2px rgba(0,0,0,.35)", zIndex:1 },
  ganttLegend: { display:"flex", gap:18, padding:"12px 22px 16px", borderTop:"1px solid #f1f5f9" },
  legendItem:  { display:"flex", alignItems:"center", gap:6 },
  legendDot:   { width:10, height:10, borderRadius:3 },
  legendLabel: { fontSize:11, color:"#6b7280", fontWeight:600 },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.am-root { animation:fadeUp .32s cubic-bezier(.2,.8,.4,1); }
.am-card { transition:box-shadow .22s,transform .22s !important; }
.am-card:hover { transform:translateY(-2px) !important; box-shadow:0 8px 28px rgba(0,0,0,.11) !important; }
.am-stat { transition:transform .18s,box-shadow .18s !important; cursor:default; }
.am-stat:hover { transform:translateY(-2px) !important; box-shadow:0 10px 24px rgba(6,31,74,.4) !important; }
.btn-volver { transition:all .15s !important; }
.btn-volver:hover   { background:rgba(255,255,255,.2) !important; border-color:rgba(255,255,255,.5) !important; }
.btn-volver:active  { transform:scale(.95) !important; }
.btn-terminar { transition:all .15s !important; }
.btn-terminar:hover { background:#15803d !important; box-shadow:0 4px 12px rgba(21,128,61,.3) !important; }
.btn-terminar:active { transform:scale(.96) !important; }
@keyframes ganttIn { from { transform:scaleX(0); opacity:.2 } to { transform:scaleX(1); opacity:1 } }
.am-gantt-bar { transform-origin:left center; animation:ganttIn .5s cubic-bezier(.2,.8,.4,1); }
.am-gantt-row:hover .am-gantt-bar { filter:brightness(1.08); }
@keyframes livePulse {
  0%,100% { box-shadow:inset 0 1px 0 rgba(255,255,255,.28), 0 0 0 0 rgba(29,111,222,.45); }
  50%     { box-shadow:inset 0 1px 0 rgba(255,255,255,.28), 0 0 0 7px rgba(29,111,222,0); }
}
.am-gantt-live { animation:ganttIn .5s cubic-bezier(.2,.8,.4,1), livePulse 2s ease-in-out infinite .5s; }
`;