import { useState, useEffect, useRef } from "react";
import { piezasAPI } from "../api";

const registrosDemo = [
  { folio:1, pieza:"5626 D",  cliente:"Brose",          nombre:"Erick Garcia",   prioridad:"Crítico (<4 Hr)",  tiempoTotal:60,  tiempoTranscurrido:22, estado:"proceso"   },
  { folio:2, pieza:"4984",    cliente:"Plastic Omnium", nombre:"Mario Aguilar",  prioridad:"Urgente (<24 Hr)", tiempoTotal:90,  tiempoTranscurrido:0,  estado:"pendiente" },
  { folio:3, pieza:"5540",    cliente:"Audi",           nombre:"Cesar Minero",   prioridad:"Normal",           tiempoTotal:270, tiempoTranscurrido:0,  estado:"pendiente" },
  { folio:4, pieza:"5636 RH", cliente:"Brose",          nombre:"Jorge Martinez", prioridad:"Urgente (<24 Hr)", tiempoTotal:45,  tiempoTranscurrido:0,  estado:"pendiente" },
];

const colorBadge = (p = "") => {
  if (p.includes("Crítico")) return { bg:"#fee2e2", color:"#dc2626" };
  if (p.includes("Urgente")) return { bg:"#fef3c7", color:"#d97706" };
  return { bg:"#dcfce7", color:"#16a34a" };
};

export default function AdminDashboard({
  volver        = () => {},
  irAMediciones = () => {},
  irAHistorial  = () => {},
  irACatalogo   = () => {},
  irAPrestamos  = () => {},   // ← agregar
  irAInstrucciones = () => {},
  registros     = [],
  prestamosCount = 0,          // ← agregar
}) {
  const [busqueda,        setBusqueda]        = useState("");
  const [piezaEncontrada, setPiezaEncontrada] = useState(null);
  const [visor,           setVisor]           = useState(null);
  const [visorTipo,       setVisorTipo]       = useState("img");
  const [visorLabel,      setVisorLabel]      = useState("");
  const [xlsxHtml,        setXlsxHtml]        = useState("");
  const [xlsxCargando,    setXlsxCargando]    = useState(false);
  const [xlsxHojas,       setXlsxHojas]       = useState([]);
  const [xlsxHojaActual,  setXlsxHojaActual]  = useState(0);
  const xlsxLibRef = useRef(null);

  useEffect(() => {
    if (visorTipo !== "xlsx" || !visor) { setXlsxHtml(""); return; }
    setXlsxCargando(true);
    setXlsxHtml("");
    import("xlsx").then(XLSX => {
      xlsxLibRef.current = XLSX;
      fetch(visor)
        .then(r => r.arrayBuffer())
        .then(buf => {
          const wb = XLSX.read(buf, { type: "array" });
          setXlsxHojas(wb.SheetNames);
          const ws = wb.Sheets[wb.SheetNames[0]];
          setXlsxHojaActual(0);
          setXlsxHtml(XLSX.utils.sheet_to_html(ws, { id: "xlsx-table" }));
        })
        .catch(() => setXlsxHtml("<p>Error al leer el archivo</p>"))
        .finally(() => setXlsxCargando(false));
    });
  }, [visor, visorTipo]);

  const cambiarHoja = (idx) => {
    if (!xlsxLibRef.current || !visor) return;
    setXlsxCargando(true);
    fetch(visor).then(r => r.arrayBuffer()).then(buf => {
      const wb = xlsxLibRef.current.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[idx]];
      setXlsxHojaActual(idx);
      setXlsxHtml(xlsxLibRef.current.utils.sheet_to_html(ws, { id: "xlsx-table" }));
    }).finally(() => setXlsxCargando(false));
  };

  const imprimir = () => {
    const win = window.open("", "_blank");
    if (visorTipo === "img") {
      win.document.write(`<!DOCTYPE html><html><head><title>${visorLabel}</title>
        <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}
        img{max-width:100%;max-height:100vh;object-fit:contain}@media print{body{margin:0}}</style>
        </head><body><img src="${visor}"/></body></html>`);
    } else if (visorTipo === "xlsx") {
      win.document.write(`<!DOCTYPE html><html><head><title>${visorLabel}</title>
        <style>body{font-family:Arial,sans-serif;padding:16px}
        table{border-collapse:collapse;width:100%;font-size:11px}
        td,th{border:1px solid #bbb;padding:4px 8px;text-align:left}
        th{background:#f0f0f0;font-weight:600}
        tr:nth-child(even){background:#f9f9f9}
        @media print{body{padding:0}}</style>
        </head><body>${xlsxHtml}</body></html>`);
    } else {
      win.close();
      window.open(visor, "_blank");
      return;
    }
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };
  const [catalogo,        setCatalogo]        = useState([]);

  useEffect(() => {
    piezasAPI.getAll().then(setCatalogo).catch(() => {});
  }, []);

  const piezaProceso = registros.find(r => r.estado === "proceso");
  const pendientes   = registros.filter(r => r.estado === "pendiente");
  const altaPrior    = registros.filter(r => r.prioridad?.includes("Crítico") || r.prioridad?.includes("Urgente"));
  const pct = piezaProceso ? Math.min(((piezaProceso.tiempoTranscurrido||0)/piezaProceso.tiempoTotal)*100, 100) : 0;

  const buscar = (v) => {
    setBusqueda(v);
    const txt = v.trim().toLowerCase();
    if (!txt) { setPiezaEncontrada(null); return; }
    setPiezaEncontrada(catalogo.find(p => p.no_parte?.toLowerCase().includes(txt)) || null);
  };

  return (
    <div className="ad-root" style={s.root}>
      <style>{css}</style>

      {/* TOPBAR */}
      <header style={s.topbar}>
        <div style={s.brand}>
          <div style={s.logoBadge}>
            <img src="/Imagen1.png" alt="PVL" style={{ height:28, objectFit:"contain", filter:"brightness(0) invert(1)" }} />
          </div>
          <div>
            <div style={s.brandTitle}>LAB. METROLOGÍA</div>
            <div style={s.brandSub}>Ing. Milton Rodríguez</div>
          </div>
        </div>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>⌕</span>
          <input className="db-search" style={s.searchInput} placeholder="Buscar número de parte…"
            value={busqueda} onChange={e => buscar(e.target.value)} />
        </div>
        <button className="db-logout" style={s.logoutBtn} onClick={volver}>⎋ Cerrar sesión</button>
      </header>

      {/* MÉTRICAS */}
      <section style={s.metrics}>
        {[
          { label:"En proceso",         sub:"Pieza que se está midiendo ahora",  value:piezaProceso ? 1 : 0, accent:"#16a34a", bg:"rgba(22,163,74,.07)",  icon:"◉" },
          { label:"Pendientes",         sub:"Piezas esperando turno en la cola", value:pendientes.length,    accent:"#d97706", bg:"rgba(217,119,6,.07)",  icon:"◷" },
          { label:"Alta prioridad",     sub:"Críticos y urgentes en espera",     value:altaPrior.length,     accent:"#dc2626", bg:"rgba(220,38,38,.07)",  icon:"⚡" },
          { label:"Piezas en préstamo", sub:"Dispositivos fuera del lab",        value:prestamosCount,       accent:"#7c3aed", bg:"rgba(124,58,237,.07)", icon:"📦" },
        ].map(m => (
          <div key={m.label} className="metric-card" style={{ ...s.metricCard, background: m.bg, borderColor: m.accent + "30" }}>
            <div style={{ ...s.metricAccentBar, background:`linear-gradient(90deg,${m.accent},${m.accent}44)` }} />
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <div style={{ ...s.metricValue, color: m.accent }}>{m.value}</div>
              <div style={{ fontSize:22, opacity:.25, marginTop:4 }}>{m.icon}</div>
            </div>
            <div style={s.metricLabel}>{m.label}</div>
            <div style={s.metricSub}>{m.sub}</div>
          </div>
        ))}
      </section>

      {/* BODY */}
      <div style={s.body}>

        {/* COL IZQ */}
        <div style={s.colLeft}>

          {/* Medición activa */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span className={piezaProceso ? "dot-pulse" : ""} style={{ ...s.dot, background: piezaProceso ? "#16a34a" : "#9ca3af" }} />
              <span style={s.cardTitle}>Medición en proceso</span>
            </div>
            {piezaProceso ? (
              <div style={s.procesoBody}>
                {[
                  ["No. Parte",    <span style={s.mono}>{piezaProceso.pieza}</span>],
                  ["Cliente",      piezaProceso.cliente],
                  ["Solicitante",  piezaProceso.nombre],
                  ["Tiempo est.",  <span style={s.mono}>{piezaProceso.tiempoTotal} min</span>],
                  ["Transcurrido", <span style={s.mono}>{piezaProceso.tiempoTranscurrido||0} min</span>],
                ].map(([lbl,val]) => (
                  <div key={lbl} style={s.procesoRow}>
                    <span style={s.procesoLabel}>{lbl}</span>
                    <span style={s.procesoVal}>{val}</span>
                  </div>
                ))}
                <div style={s.procesoRow}>
                  <span style={s.procesoLabel}>Prioridad</span>
                  <span style={{ ...s.badge, ...colorBadge(piezaProceso.prioridad) }}>{piezaProceso.prioridad}</span>
                </div>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressFill, width:`${pct}%` }} />
                </div>
                <div style={{ textAlign:"right", fontSize:11, color:"#9ca3af", marginTop:2 }}>{Math.round(pct)}% completado</div>
              </div>
            ) : (
              <div style={s.vacioCont}>
                <div style={{ fontSize:28, opacity:.3 }}>◎</div>
                <p style={{ fontSize:13, color:"#9ca3af" }}>Sin mediciones activas</p>
              </div>
            )}
          </div>

          {/* Cola */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={{ ...s.dot, background:"#d97706" }} />
              <span style={s.cardTitle}>Cola de espera</span>
              <span style={s.badgeCount}>{pendientes.length}</span>
            </div>
            <div style={{ maxHeight:220, overflowY:"auto" }}>
              {pendientes.length === 0
                ? <p style={{ padding:24, textAlign:"center", color:"#9ca3af", fontSize:13 }}>Sin pendientes</p>
                : pendientes.map((r,i) => (
                  <div key={i} className="cola-item" style={s.colaItem}>
                    <span style={{ ...s.mono, fontSize:11, color:"#9ca3af", width:28 }}>#{r.folio}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ ...s.mono, fontSize:13, fontWeight:500, color:"#1a1d23" }}>{r.pieza}</div>
                      <div style={{ fontSize:11, color:"#6b7280" }}>{r.cliente}</div>
                    </div>
                    <span style={{ ...s.badge, ...colorBadge(r.prioridad), fontSize:10 }}>{r.prioridad?.split(" ")[0]}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* COL DER */}
        <div style={s.colRight}>

          {/* Módulos */}
          <div style={s.modulesGrid}>
            {[
              { icon:"▤", title:"Mediciones",            sub:"Planificación y cola activa",    fn:irAMediciones, active:true,  color:"#1d6fde", bg:"#eff6ff", border:"#bfdbfe" },
              { icon:"◷", title:"Historial",              sub:"Registro de piezas finalizadas", fn:irAHistorial,  active:true,  color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
              { icon:"⊞", title:"Catálogo",               sub:"Piezas y empleados",             fn:irACatalogo,   active:true,  color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
              { icon:"📐",title:"Instrucciones de Trab.", sub:"Exceles y PDF por No. de parte",  fn:irAInstrucciones, active:true, color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc" },
              { icon:"📦", title:"Préstamos",             sub:"Control de dispositivos",        fn:irAPrestamos,  active:true,  color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
            ].map(m => (
              <div key={m.title}
                className={m.active ? "module-card" : ""}
                style={{ ...s.moduleCard, ...(m.active ? {} : { opacity:.45, cursor:"not-allowed" }) }}
                onClick={m.active && m.fn ? () => m.fn() : undefined}
              >
                <div style={{ ...s.moduleIcon, background:m.bg, border:`1px solid ${m.border}`, color:m.color }}>
                  {m.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ ...s.moduleTitle, color: m.active ? "#1a1d23" : "#9ca3af" }}>{m.title}</div>
                  <div style={s.moduleSub}>{m.sub}</div>
                </div>
                <span style={{ fontSize:16, color: m.active ? m.color : "#d1d5db", fontWeight:700 }}>{m.active ? "→" : "—"}</span>
              </div>
            ))}
          </div>

          {/* Búsqueda */}
          {piezaEncontrada && (() => {
            const archivos = piezaEncontrada.archivos || [];
            const getArch = (cat) => archivos.find(a => a.categoria === cat);
            const getTipo = (arch) => {
              if (!arch) return "img";
              const mime = arch.tipo || "";
              const url  = arch.url  || "";
              if (mime.includes("pdf") || url.match(/\.pdf$/i)) return "pdf";
              if (mime.includes("sheet") || mime.includes("excel") || url.match(/\.xlsx?$/i)) return "xlsx";
              return "img";
            };
            const botones = [
              piezaEncontrada.imagen_url && { lbl:"Dibujo",      icon:"🖼", url: piezaEncontrada.imagen_url,        tipo:"img" },
              getArch("dispositivo")     && { lbl:"Dispositivo", icon:"🔧", url: getArch("dispositivo").url, tipo: getTipo(getArch("dispositivo")) },
              getArch("instruccion")     && { lbl:"Instrucción", icon:"📄", url: getArch("instruccion").url, tipo: getTipo(getArch("instruccion"))  },
              getArch("reporte")         && { lbl:"Reporte",     icon:"📊", url: getArch("reporte").url,     tipo: getTipo(getArch("reporte"))      },
            ].filter(Boolean);
            return (
              <div style={{ ...s.card, animation:"slideIn .25s ease" }}>
                <div style={s.cardHeader}>
                  <span style={{ ...s.dot, background:"#1d6fde" }} />
                  <span style={s.cardTitle}>Pieza encontrada</span>
                </div>
                <div style={{ padding:"14px 18px 6px", display:"flex", alignItems:"baseline", gap:10 }}>
                  <span style={{ ...s.mono, fontSize:22, fontWeight:700, color:"#1d6fde" }}>{piezaEncontrada.no_parte}</span>
                  <span style={{ fontSize:13, color:"#6b7280", fontWeight:500 }}>{piezaEncontrada.cliente}</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding:"8px 18px 16px" }}>
                  {botones.length > 0 ? botones.map(({ lbl, icon, url, tipo }) => (
                    <button key={lbl} className="pieza-btn" style={s.piezaBtn}
                      onClick={() => { setVisor(url); setVisorTipo(tipo); setVisorLabel(`${icon} ${lbl}`); }}>
                      <span style={{ fontSize:15 }}>{icon}</span>
                      <span>{lbl}</span>
                    </button>
                  )) : (
                    <span style={{ fontSize:12, color:"#9ca3af" }}>Sin documentos adjuntos</span>
                  )}
                </div>
              </div>
            );
          })()}
          {busqueda && !piezaEncontrada && (
            <div style={{ ...s.card, animation:"slideIn .2s ease" }}>
              <div style={s.noMatch}>
                <span style={{ fontSize:24, opacity:.35 }}>🔍</span>
                <span style={{ fontSize:13, color:"#6b7280" }}>
                  No se encontró ningún No. de parte con "<strong>{busqueda}</strong>"
                </span>
              </div>
            </div>
          )}

          {/* Estado por defecto: explorar catálogo */}
          {!busqueda && (
            <div style={{ ...s.card, animation:"slideIn .25s ease" }}>
              <div style={s.cardHeader}>
                <span style={{ ...s.dot, background:"#1d6fde" }} />
                <span style={s.cardTitle}>Explorar catálogo</span>
                <span style={s.badgeCount}>{catalogo.length}</span>
              </div>
              {catalogo.length === 0 ? (
                <p style={{ padding:"18px", fontSize:13, color:"#9ca3af", textAlign:"center" }}>Cargando catálogo…</p>
              ) : (
                <>
                  <div style={s.explorarHint}>
                    Elige un No. de parte para ver su dibujo y documentos, o escríbelo en el buscador de arriba.
                  </div>
                  <div style={s.explorarList}>
                    {[...catalogo]
                      .filter(p => p.activo !== false)
                      .sort((a, b) => (a.no_parte || "").localeCompare(b.no_parte || "", "es", { numeric:true, sensitivity:"base" }))
                      .map(p => {
                        const nDocs = (p.archivos || []).length + (p.imagen_url ? 1 : 0);
                        return (
                          <button key={p.id} className="db-explorar-item" style={s.explorarItem}
                            onClick={() => buscar(p.no_parte)}>
                            <span style={s.explorarNo}>{p.no_parte}</span>
                            <span style={s.explorarInfo}>
                              <span style={s.explorarCliente}>{p.cliente}</span>
                              {p.descripcion && <span style={s.explorarDesc}>{p.descripcion}</span>}
                            </span>
                            <span style={s.explorarMeta}>
                              <span style={s.explorarPill}>📎 {nDocs}</span>
                              <span style={s.explorarPill}>⏱ {p.tiempo_medicion ?? 30}m</span>
                            </span>
                            <span className="exp-arrow" style={s.explorarArrow}>→</span>
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VISOR */}
      {visor && (
        <div style={s.overlay} onClick={() => setVisor(null)}>
          <div style={s.visorBox} onClick={e => e.stopPropagation()}>

            {/* Header del visor */}
            <div style={s.visorHeader}>
              <div style={s.visorHeaderLeft}>
                <div style={s.visorIconWrap}>
                  {visorTipo === "pdf" ? "📄" : visorTipo === "xlsx" ? "📊" : "🖼"}
                </div>
                <div>
                  <div style={s.visorTitle}>{visorLabel}</div>
                  <div style={s.visorSubtitle}>
                    {visorTipo === "pdf" ? "Documento PDF" : visorTipo === "xlsx" ? "Hoja de cálculo Excel" : "Imagen"}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <button className="visor-print" style={s.visorPrint} onClick={imprimir}>🖨 Imprimir</button>
                <a href={visor} download target="_blank" rel="noreferrer" style={s.visorDownload}>↓ Descargar</a>
                <button className="visor-close" style={s.visorClose} onClick={() => setVisor(null)}>✕</button>
              </div>
            </div>

            {/* Selector de hojas (solo Excel con más de 1 hoja) */}
            {visorTipo === "xlsx" && xlsxHojas.length > 1 && (
              <div style={s.visorHojas}>
                {xlsxHojas.map((h, i) => (
                  <button key={h} style={{ ...s.visorHojaBtn, ...(i === xlsxHojaActual ? s.visorHojaBtnActive : {}) }}
                    onClick={() => cambiarHoja(i)}>{h}</button>
                ))}
              </div>
            )}

            {/* Contenido */}
            <div style={s.visorContent}>
              {visorTipo === "pdf" && (
                <iframe src={visor} title={visorLabel} style={s.visorIframe} />
              )}
              {visorTipo === "img" && (
                <div style={s.visorImgWrap}>
                  <img src={visor} alt={visorLabel} style={s.visorImg} />
                </div>
              )}
              {visorTipo === "xlsx" && (
                <div style={s.visorXlsxWrap}>
                  {xlsxCargando ? (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, color:"#9ca3af" }}>
                      <div style={{ fontSize:32 }}>📊</div>
                      <div style={{ fontSize:13 }}>Cargando hoja de cálculo…</div>
                    </div>
                  ) : (
                    <div style={s.visorXlsxInner} dangerouslySetInnerHTML={{ __html: xlsxHtml }} />
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root:      { minHeight:"100vh", background:"#f0f2f6", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" },
  topbar:    { display:"flex", alignItems:"center", gap:16, padding:"12px 28px", background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 55%,#1d6fde 100%)", borderBottom:"none", boxShadow:"0 2px 12px rgba(6,31,74,.35)", position:"sticky", top:0, zIndex:100 },
  brand:     { display:"flex", alignItems:"center", gap:12, flexShrink:0 },
  logoBadge: { width:42, height:42, borderRadius:10, background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.25)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" },
  brandTitle:{ fontSize:13, fontWeight:700, letterSpacing:".08em", color:"#fff", textTransform:"uppercase" },
  brandSub:  { fontSize:11, color:"rgba(255,255,255,.55)" },
  searchWrap:{ flex:1, position:"relative", maxWidth:420, margin:"0 auto" },
  searchIcon:{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:18, color:"rgba(255,255,255,.5)", pointerEvents:"none" },
  searchInput:{ width:"100%", padding:"9px 14px 9px 36px", border:"1px solid rgba(255,255,255,.2)", borderRadius:8, fontSize:14, fontFamily:"inherit", background:"rgba(255,255,255,.12)", color:"#fff", outline:"none", boxSizing:"border-box", backdropFilter:"blur(4px)" },
  logoutBtn: { display:"flex", alignItems:"center", gap:6, padding:"8px 16px", border:"1px solid rgba(255,255,255,.25)", background:"rgba(255,255,255,.1)", borderRadius:8, fontSize:13, fontWeight:500, color:"rgba(255,255,255,.85)", cursor:"pointer", flexShrink:0, fontFamily:"inherit" },
  metrics:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, padding:"20px 28px 0" },
  metricCard:{ border:"1px solid transparent", borderRadius:12, padding:"0 20px 16px", boxShadow:"0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06)", position:"relative", overflow:"hidden" },
  metricAccentBar:{ height:4, margin:"0 -20px 14px", borderRadius:0 },
  metricValue:{ display:"block", fontSize:38, fontWeight:700, lineHeight:1, fontFamily:"'DM Mono',monospace", marginBottom:4 },
  metricLabel:{ fontSize:12, textTransform:"uppercase", letterSpacing:".06em", color:"#374151", fontWeight:600 },
  metricSub:  { fontSize:11, color:"#9ca3af", marginTop:4, lineHeight:1.3 },
  body:      { display:"grid", gridTemplateColumns:"340px 1fr", gap:14, padding:"14px 28px 28px", flex:1 },
  colLeft:   { display:"flex", flexDirection:"column", gap:14 },
  colRight:  { display:"flex", flexDirection:"column", gap:14 },
  card:      { background:"#fff", border:"1px solid #e2e5ea", borderRadius:10, boxShadow:"0 1px 3px rgba(0,0,0,.07),0 4px 12px rgba(0,0,0,.04)", overflow:"hidden" },
  cardHeader:{ display:"flex", alignItems:"center", gap:8, padding:"14px 18px", borderBottom:"1px solid #1d6fde55", background:"linear-gradient(135deg,#1d6fde 0%,#2563eb 100%)" },
  cardTitle: { fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#fff", flex:1 },
  dot:       { width:8, height:8, borderRadius:"50%", flexShrink:0 },
  badgeCount:{ background:"rgba(255,255,255,.2)", color:"#fff", fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:20, fontFamily:"'DM Mono',monospace", border:"1px solid rgba(255,255,255,.3)" },
  procesoBody:{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 },
  procesoRow:{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 },
  procesoLabel:{ fontSize:12, color:"#6b7280", fontWeight:500, textTransform:"uppercase", letterSpacing:".04em", flexShrink:0 },
  procesoVal:{ fontSize:13, fontWeight:500, color:"#1a1d23", textAlign:"right" },
  vacioCont: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:32, color:"#9ca3af" },
  progressTrack:{ height:4, background:"#e2e5ea", borderRadius:2, overflow:"hidden", marginTop:4 },
  progressFill: { height:"100%", background:"linear-gradient(90deg,#1d6fde,#5b9cf6)", borderRadius:2, transition:"width .6s ease", minWidth:4 },
  colaItem:  { display:"flex", alignItems:"center", gap:10, padding:"9px 18px", borderBottom:"1px solid #f3f4f6", transition:"background .15s" },
  modulesGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  moduleCard:{ background:"#fff", border:"1px solid #e2e5ea", borderRadius:10, padding:"18px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", transition:"all .2s", boxShadow:"0 1px 3px rgba(0,0,0,.07),0 4px 12px rgba(0,0,0,.04)" },
  moduleIcon:{ fontSize:22, width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", background:"#f4f5f7", borderRadius:8, flexShrink:0, border:"1px solid #e2e5ea" },
  moduleTitle:{ fontSize:14, fontWeight:600, color:"#1a1d23", marginBottom:2 },
  moduleSub: { fontSize:12, color:"#6b7280" },
  badge:     { fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:".04em" },
  mono:      { fontFamily:"'DM Mono',monospace" },
  piezaBtn:  { display:"flex", alignItems:"center", gap:7, padding:"8px 16px", border:"1.5px solid #e2e5ea", background:"#f9fafb", borderRadius:8, fontSize:13, fontWeight:500, color:"#1a1d23", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
  noMatch:      { display:"flex", alignItems:"center", gap:12, padding:"18px 20px" },
  explorarHint: { fontSize:12, color:"#94a3b8", lineHeight:1.5, padding:"12px 18px 10px", borderBottom:"1px solid #f1f5f9" },
  explorarList: { maxHeight:360, overflowY:"auto" },
  explorarItem: { width:"100%", display:"flex", alignItems:"center", gap:12, padding:"11px 18px", background:"none", border:"none", borderBottom:"1px solid #f3f4f6", cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"background .14s" },
  explorarNo:   { fontFamily:"'DM Mono',monospace", fontSize:14, fontWeight:700, color:"#1d6fde", minWidth:64, flexShrink:0 },
  explorarInfo: { flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:1 },
  explorarCliente:{ fontSize:12, fontWeight:600, color:"#374151" },
  explorarDesc: { fontSize:11, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  explorarMeta: { display:"flex", gap:6, flexShrink:0 },
  explorarPill: { fontSize:10, fontWeight:600, color:"#64748b", background:"#f1f5f9", borderRadius:20, padding:"2px 8px", fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap" },
  explorarArrow:{ fontSize:14, color:"#cbd5e1", fontWeight:700, flexShrink:0 },
  overlay:   { position:"fixed", inset:0, background:"rgba(10,14,26,.72)", backdropFilter:"blur(6px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  visorBox:  { background:"#fff", borderRadius:14, boxShadow:"0 24px 80px rgba(0,0,0,.35)", width:"90vw", maxWidth:1100, maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column" },
  visorHeader:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #e2e5ea", background:"linear-gradient(to bottom,#fafbfc,#f7f8fa)", flexShrink:0 },
  visorHeaderLeft:{ display:"flex", alignItems:"center", gap:12 },
  visorIconWrap:{ width:40, height:40, borderRadius:9, background:"#eff6ff", border:"1px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 },
  visorTitle:{ fontSize:15, fontWeight:700, color:"#1a1d23" },
  visorSubtitle:{ fontSize:11, color:"#9ca3af", marginTop:2 },
  visorPrint:  { display:"flex", alignItems:"center", gap:5, padding:"7px 14px", background:"#f4f5f7", color:"#1a1d23", border:"1.5px solid #e2e5ea", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
  visorDownload:{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", background:"#1d6fde", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", textDecoration:"none", fontFamily:"'DM Sans',sans-serif" },
  visorClose:{ width:34, height:34, border:"1.5px solid #e2e5ea", background:"#fff", borderRadius:8, fontSize:15, color:"#6b7280", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 },
  visorHojas:{ display:"flex", gap:6, padding:"8px 20px", background:"#f7f8fa", borderBottom:"1px solid #e2e5ea", flexShrink:0 },
  visorHojaBtn:{ padding:"4px 14px", border:"1.5px solid #e2e5ea", borderRadius:6, fontSize:12, fontWeight:500, cursor:"pointer", background:"#fff", color:"#6b7280", fontFamily:"inherit" },
  visorHojaBtnActive:{ background:"#1d6fde", color:"#fff", borderColor:"#1d6fde" },
  visorContent:{ flex:1, overflow:"hidden", display:"flex", background:"#f0f2f5", minHeight:0 },
  visorIframe:{ width:"100%", height:"100%", border:"none", minHeight:"75vh" },
  visorImgWrap:{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"radial-gradient(circle at center,#e8ecf2 0%,#d8dde6 100%)" },
  visorImg:  { maxWidth:"100%", maxHeight:"75vh", objectFit:"contain", borderRadius:8, boxShadow:"0 8px 32px rgba(0,0,0,.22)" },
  visorXlsxWrap:{ flex:1, overflow:"auto", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" },
  visorXlsxInner:{ minWidth:"100%", padding:"16px 24px" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)} 70%{box-shadow:0 0 0 6px rgba(22,163,74,0)} 100%{box-shadow:0 0 0 0 rgba(22,163,74,0)} }
@keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
.ad-root { animation:fadeUp .32s cubic-bezier(.2,.8,.4,1); }
.dot-pulse { animation:pulse 2s infinite; }
.db-search::placeholder { color:rgba(255,255,255,.4); }
.db-search:focus { border-color:rgba(255,255,255,.5) !important; background:rgba(255,255,255,.18) !important; box-shadow:0 0 0 3px rgba(255,255,255,.1) !important; }
.db-logout { transition:all .15s !important; }
.db-logout:hover { background:rgba(220,38,38,.2) !important; border-color:rgba(220,38,38,.4) !important; color:#fca5a5 !important; }
.db-logout:active { transform:scale(.95) !important; }
.metric-card { transition:box-shadow .22s,transform .22s !important; }
.metric-card:hover { transform:translateY(-3px) !important; box-shadow:0 10px 32px rgba(0,0,0,.13) !important; }
.metric-card:active { transform:translateY(-1px) scale(.99) !important; }
.module-card { transition:box-shadow .2s,transform .2s !important; }
.module-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.12) !important; transform:translateY(-2px) !important; }
.module-card:active { transform:translateY(0) scale(.98) !important; }
.cola-item { transition:background .15s !important; }
.cola-item:hover { background:#f0f4ff !important; }
.pieza-btn { transition:all .15s !important; }
.pieza-btn:hover { border-color:#1d6fde !important; background:#eff6ff !important; color:#1d6fde !important; }
.pieza-btn:active { transform:scale(.96) !important; }
.db-explorar-item:hover { background:#f0f4ff !important; }
.db-explorar-item:hover .exp-arrow { color:#1d6fde !important; }
.db-explorar-item:active { background:#e0e9ff !important; }
.visor-close { transition:all .15s !important; }
.visor-close:hover { background:#fee2e2 !important; border-color:#dc2626 !important; color:#dc2626 !important; }
.visor-download { transition:background .15s !important; }
.visor-download:hover { background:#1558b0 !important; }
.visor-print { transition:background .15s !important; }
.visor-print:hover { background:#e2e5ea !important; }
#xlsx-table { border-collapse:collapse; width:100%; font-size:12px; font-family:'DM Sans',sans-serif; }
#xlsx-table td, #xlsx-table th { border:1px solid #d1d5db; padding:5px 10px; text-align:left; white-space:nowrap; }
#xlsx-table tr:first-child td, #xlsx-table tr:first-child th { background:#f0f4fa; font-weight:600; color:#1a1d23; position:sticky; top:0; }
#xlsx-table tr:nth-child(even) { background:#f9fafb; }
#xlsx-table tr:hover { background:#eff6ff; }
`;