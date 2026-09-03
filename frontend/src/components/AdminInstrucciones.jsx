import { useState, useEffect, useRef } from "react";
import { piezasAPI, uploadAPI } from "../api";

const TEAL = "#0891b2";
const CATEGORIA = "instruccion_trabajo";
const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:4000/api").replace("/api", "");
const ACCEPT = ".xlsx,.xls,.pdf,.csv";

const tipoArchivo = (a = {}) => {
  const u = (a.url || "").toLowerCase();
  const t = (a.tipo || "").toLowerCase();
  if (u.endsWith(".pdf") || t.includes("pdf")) return { icon: "📕", label: "PDF", color: "#dc2626" };
  if (/\.(xlsx|xls|csv)$/.test(u) || t.includes("sheet") || t.includes("excel") || t.includes("csv"))
    return { icon: "📊", label: "Excel", color: "#16a34a" };
  return { icon: "📄", label: "Archivo", color: "#6b7280" };
};

export default function AdminInstrucciones({ volver = () => {} }) {
  const [piezas,    setPiezas]    = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [buscar,    setBuscar]    = useState("");
  const [subiendoId, setSubiendoId] = useState(null);
  const [error,     setError]     = useState("");
  const fileRef   = useRef();
  const targetRef = useRef(null);

  const cargar = async () => {
    const d = await piezasAPI.getAll();
    setPiezas(d);
  };

  useEffect(() => {
    (async () => {
      try { await cargar(); }
      catch { setError("No se pudieron cargar las piezas"); }
      finally { setCargando(false); }
    })();
  }, []);

  const instrucciones = (p) => (p.archivos || []).filter(a => a.categoria === CATEGORIA);

  const pedirArchivo = (pieza) => {
    setError("");
    targetRef.current = pieza;
    fileRef.current.value = "";
    fileRef.current.click();
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    const pieza = targetRef.current;
    if (!file || !pieza) return;
    setSubiendoId(pieza.id);
    setError("");
    try {
      const { url } = await uploadAPI.archivo(file);
      const nuevo = {
        nombre: file.name,
        url: `${API_ORIGIN}${url}`,
        tipo: file.type,
        categoria: CATEGORIA,
        fecha: new Date().toISOString(),
      };
      const archivos = [...(pieza.archivos || []), nuevo];
      await piezasAPI.update(pieza.id, { archivos });
      await cargar();
    } catch (err) {
      setError(`Error al subir "${file.name}": ${err.message}`);
    } finally {
      setSubiendoId(null);
      targetRef.current = null;
    }
  };

  const eliminar = async (pieza, archivo) => {
    if (!window.confirm(`¿Quitar "${archivo.nombre}" de ${pieza.no_parte}?`)) return;
    try {
      const archivos = (pieza.archivos || []).filter(a => a !== archivo && a.url !== archivo.url);
      await piezasAPI.update(pieza.id, { archivos });
      await cargar();
    } catch (err) { alert("Error: " + err.message); }
  };

  const q = buscar.trim().toLowerCase();
  const lista = piezas
    .filter(p => p.activo !== false)
    .filter(p => !q
      || (p.no_parte || "").toLowerCase().includes(q)
      || (p.cliente  || "").toLowerCase().includes(q)
      || (p.descripcion || "").toLowerCase().includes(q))
    .sort((a, b) => (a.no_parte || "").localeCompare(b.no_parte || "", "es", { numeric: true, sensitivity: "base" }));

  const totalArchivos = piezas.reduce((s, p) => s + instrucciones(p).length, 0);
  const conInstr      = piezas.filter(p => instrucciones(p).length > 0).length;

  if (cargando) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"#6b7280" }}>
      Cargando instrucciones…
    </div>
  );

  return (
    <div className="ai-root" style={s.root}>
      <style>{css}</style>
      <input ref={fileRef} type="file" accept={ACCEPT} style={{ display:"none" }} onChange={onFile} />

      {/* TOPBAR */}
      <header style={s.topbar}>
        <div style={s.topLeft}>
          <button className="ai-volver" style={s.btnVolver} onClick={volver}>← Panel administrador</button>
          <div style={s.divider} />
          <h1 style={s.pageTitle}>Instrucciones de Trabajo</h1>
        </div>
        <div style={s.topStats}>
          <div className="ai-stat" style={s.statChip}>
            <span style={{ ...s.statIcon, background:"#cffafe" }}>▤</span>
            <span style={s.statTxt}>
              <span style={{ ...s.statNum, color:TEAL }}>{lista.length}</span>
              <span style={s.statLbl}>Piezas</span>
            </span>
          </div>
          <div className="ai-stat" style={s.statChip}>
            <span style={{ ...s.statIcon, background:"#dcfce7" }}>✓</span>
            <span style={s.statTxt}>
              <span style={{ ...s.statNum, color:"#16a34a" }}>{conInstr}</span>
              <span style={s.statLbl}>Con archivos</span>
            </span>
          </div>
          <div className="ai-stat" style={s.statChip}>
            <span style={{ ...s.statIcon, background:"#e0e7ff" }}>📎</span>
            <span style={s.statTxt}>
              <span style={{ ...s.statNum, color:"#4338ca" }}>{totalArchivos}</span>
              <span style={s.statLbl}>Archivos</span>
            </span>
          </div>
        </div>
      </header>

      <div style={s.body}>
        <div style={s.toolbar}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>⌕</span>
            <input
              className="ai-input" style={s.searchInput}
              placeholder="Buscar por No. de parte, cliente o descripción…"
              value={buscar} onChange={e => setBuscar(e.target.value)}
            />
            {buscar && <button style={s.searchClear} onClick={() => setBuscar("")}>✕</button>}
          </div>
          <span style={s.hint}>Sube Excel (.xlsx / .xls / .csv) y PDF por cada No. de parte.</span>
        </div>

        {error && <div style={s.errorBox}>⚠ {error}</div>}

        {lista.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize:44, opacity:.3 }}>📐</div>
            <div style={{ marginTop:8, fontSize:15, fontWeight:600, color:"#6b7280" }}>
              {q ? `Ninguna pieza coincide con “${buscar}”` : "Sin piezas en el catálogo"}
            </div>
          </div>
        ) : (
          <div style={s.grid}>
            {lista.map(p => {
              const files = instrucciones(p);
              const subiendo = subiendoId === p.id;
              return (
                <div key={p.id} className="ai-card" style={s.card}>
                  <div style={s.cardHead}>
                    <div style={{ minWidth:0 }}>
                      <div style={s.cardNoParte}>{p.no_parte}</div>
                      <div style={s.cardCliente}>{p.cliente}</div>
                    </div>
                    <span style={{ ...s.countPill, background: files.length ? "#cffafe" : "#f1f5f9", color: files.length ? "#0e7490" : "#94a3b8" }}>
                      {files.length} {files.length === 1 ? "archivo" : "archivos"}
                    </span>
                  </div>

                  <div style={s.fileList}>
                    {files.length === 0 && !subiendo && (
                      <div style={s.sinArchivos}>Sin instrucciones cargadas</div>
                    )}
                    {files.map((a, idx) => {
                      const t = tipoArchivo(a);
                      return (
                        <div key={a.url || idx} style={s.fileRow}>
                          <span style={{ ...s.fileIcon, color:t.color }}>{t.icon}</span>
                          <a href={a.url} target="_blank" rel="noreferrer" style={s.fileName} title={a.nombre}>{a.nombre}</a>
                          <span style={{ ...s.fileTag, color:t.color, borderColor:`${t.color}44` }}>{t.label}</span>
                          <button className="ai-del" style={s.fileDel} title="Quitar" onClick={() => eliminar(p, a)}>✕</button>
                        </div>
                      );
                    })}
                    {subiendo && <div style={s.subiendo}>⟳ Subiendo archivo…</div>}
                  </div>

                  <button className="ai-upload" style={s.btnUpload} disabled={subiendo} onClick={() => pedirArchivo(p)}>
                    ＋ Subir Excel / PDF
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root:       { minHeight:"100vh", background:"#f0f2f6", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" },
  topbar:     { display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, padding:"14px 28px", background:"linear-gradient(135deg,#083344 0%,#0e7490 55%,#06b6d4 100%)", boxShadow:"0 2px 12px rgba(8,51,68,.35)", position:"sticky", top:0, zIndex:100, flexWrap:"wrap" },
  topLeft:    { display:"flex", alignItems:"center", gap:16 },
  btnVolver:  { padding:"7px 14px", border:"1px solid rgba(255,255,255,.3)", background:"rgba(255,255,255,.1)", borderRadius:8, fontSize:13, fontWeight:500, color:"rgba(255,255,255,.9)", cursor:"pointer", fontFamily:"inherit" },
  divider:    { width:1, height:24, background:"rgba(255,255,255,.2)" },
  pageTitle:  { fontSize:16, fontWeight:700, color:"#fff", margin:0 },
  topStats:   { display:"flex", gap:10 },
  statChip:   { display:"flex", alignItems:"center", gap:10, background:"#fff", borderRadius:12, padding:"7px 14px 7px 8px", boxShadow:"0 6px 18px rgba(8,51,68,.3)" },
  statIcon:   { width:30, height:30, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 },
  statTxt:    { display:"flex", flexDirection:"column", lineHeight:1.05 },
  statNum:    { fontSize:19, fontWeight:800, fontFamily:"'DM Mono',monospace" },
  statLbl:    { fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#94a3b8" },
  body:       { padding:"22px 28px 28px", flex:1 },
  toolbar:    { display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom:16, flexWrap:"wrap" },
  searchWrap: { position:"relative", flex:1, minWidth:240, maxWidth:460, display:"flex", alignItems:"center" },
  searchIcon: { position:"absolute", left:12, fontSize:16, color:"#9ca3af", pointerEvents:"none" },
  searchInput:{ width:"100%", padding:"10px 34px", border:"1.5px solid #e2e5ea", borderRadius:10, fontSize:13, fontFamily:"inherit", color:"#1a1d23", outline:"none", background:"#fff" },
  searchClear:{ position:"absolute", right:8, width:22, height:22, borderRadius:"50%", border:"none", background:"#eef2f7", color:"#6b7280", fontSize:11, cursor:"pointer" },
  hint:       { fontSize:12, color:"#94a3b8", fontWeight:500 },
  errorBox:   { background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:8, padding:"9px 14px", fontSize:13, color:"#dc2626", marginBottom:14 },
  empty:      { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:260 },
  grid:       { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 },
  card:       { background:"#fff", border:"1px solid #e2e5ea", borderTop:"3px solid #06b6d4", borderRadius:14, padding:16, display:"flex", flexDirection:"column", gap:12, boxShadow:"0 1px 3px rgba(0,0,0,.06)", transition:"box-shadow .2s,transform .2s" },
  cardHead:   { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 },
  cardNoParte:{ fontSize:16, fontWeight:800, color:"#1a1d23", fontFamily:"'DM Mono',monospace" },
  cardCliente:{ fontSize:11, fontWeight:700, color:TEAL, background:"#ecfeff", border:"1px solid #a5f3fc", borderRadius:20, padding:"2px 10px", display:"inline-block", marginTop:4 },
  countPill:  { fontSize:10, fontWeight:700, borderRadius:20, padding:"3px 10px", fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap", flexShrink:0 },
  fileList:   { display:"flex", flexDirection:"column", gap:6, minHeight:44 },
  sinArchivos:{ fontSize:12, color:"#9ca3af", fontStyle:"italic", padding:"10px 0" },
  fileRow:    { display:"flex", alignItems:"center", gap:8, background:"#f8fafc", border:"1px solid #eef2f7", borderRadius:8, padding:"7px 9px" },
  fileIcon:   { fontSize:15, flexShrink:0 },
  fileName:   { flex:1, minWidth:0, fontSize:12, fontWeight:600, color:"#0f172a", textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  fileTag:    { fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:".04em", border:"1px solid", borderRadius:6, padding:"1px 6px", flexShrink:0 },
  fileDel:    { width:22, height:22, borderRadius:6, border:"none", background:"#fee2e2", color:"#dc2626", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 },
  subiendo:   { fontSize:12, color:TEAL, fontWeight:600, padding:"8px 0" },
  btnUpload:  { padding:"9px 0", background:"#ecfeff", color:"#0e7490", border:"1.5px solid #a5f3fc", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.ai-root { animation:fadeUp .32s cubic-bezier(.2,.8,.4,1); }
.ai-volver { transition:all .15s !important; }
.ai-volver:hover  { background:rgba(255,255,255,.2) !important; border-color:rgba(255,255,255,.5) !important; }
.ai-volver:active { transform:scale(.95) !important; }
.ai-stat { transition:transform .18s,box-shadow .18s !important; cursor:default; }
.ai-stat:hover { transform:translateY(-2px) !important; box-shadow:0 10px 24px rgba(8,51,68,.4) !important; }
.ai-card { transition:box-shadow .22s,transform .22s !important; }
.ai-card:hover { transform:translateY(-3px) !important; box-shadow:0 10px 26px rgba(6,182,212,.18) !important; border-top-color:#0e7490 !important; }
.ai-upload { transition:all .15s !important; }
.ai-upload:hover:not(:disabled) { background:#cffafe !important; }
.ai-upload:disabled { opacity:.55; cursor:default; }
.ai-del { transition:background .15s !important; }
.ai-del:hover { background:#fecaca !important; }
.ai-input:focus { border-color:#06b6d4 !important; box-shadow:0 0 0 3px rgba(6,182,212,.12) !important; }
.ai-card a.fileName:hover, .ai-card a:hover { text-decoration:underline !important; }
`;
