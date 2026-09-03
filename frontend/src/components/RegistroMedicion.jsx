import { useState, useEffect } from "react";
import { empleadosAPI, piezasAPI, solicitudesAPI } from "../api";

/* ── LISTAS FIJAS (el tiempo se captura al registrar) ───── */
const RAZONES = [
  "Liberación de proceso / serie",
  "PPAP",
  "Reclamación interna / externa",
  "Modificación / Daño herramienta",
  "Programa de validación",
  "Prueba o estudio",
];
const TIPOS = [
  { clave:"Full", etiqueta:"Full Layout" },
  { clave:"Otro", etiqueta:"Otro" },
];

const AZUL     = "#1d6fde";
const AZUL_OSC = "#0a3d8f";
const VERDE    = "#16a34a";

const TIEMPO_MEDICION_DEFAULT = 30; // min/pza si la pieza no tiene tiempo asignado

const prioridadConfig = {
  "Normal":           { color:"#00a651", soft:"#e6f7ee", label:"Normal",   sla:"Sin límite estricto" },
  "Urgente (<24 Hr)": { color:"#d97706", soft:"#fef3c7", label:"Urgente",  sla:"Entrega < 24 hr" },
  "Crítico (<4 Hr)":  { color:"#dc2626", soft:"#fee2e2", label:"Crítico",  sla:"Entrega < 4 hr" },
};

/* ── COMPONENTE ─────────────────────────────────────────── */
export default function RegistroMedicion({
  onRegistrar = (d) => alert(`Registrado: ${d.pieza || "sin pieza"}`),
  onAdmin     = () => {},
  onPrestamo  = () => {},
}) {
  // ── Datos desde API ──
  const [empleados,     setEmpleados]     = useState([]);
  const [piezas,        setPiezas]        = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [errorCarga,    setErrorCarga]    = useState("");
  const [nombre,          setNombre]          = useState("");
  const [tipoMedicion,    setTipoMedicion]    = useState("PR");
  const [pieza,           setPieza]           = useState("");
  const [piezaInput,      setPiezaInput]      = useState("");
  const [piezaOpen,       setPiezaOpen]       = useState(false);
  const [cliente,         setCliente]         = useState("");
  const [descripcion,     setDescripcion]     = useState("");
  const [parteCliente,    setParteCliente]    = useState("");
  const [nivelDWG,        setNivelDWG]        = useState("");
  const [nivelCAD,        setNivelCAD]        = useState("");
  const [tiempoMedicionPieza, setTiempoMedicionPieza] = useState(0);
  const [tiemposExtraPieza,   setTiemposExtraPieza]   = useState({});
  const [cantidad,        setCantidad]        = useState(1);
  const [prioridad,       setPrioridad]       = useState("Normal");
  const [razon,           setRazon]           = useState("");
  const [tipoDescripcion, setTipoDescripcion] = useState("");
  const [tipoDescripcionDetalle, setTipoDescripcionDetalle] = useState("");
  const [imagenActual,    setImagenActual]    = useState("");
  const [mostrarModal,    setMostrarModal]    = useState(false);
  const [enviado,         setEnviado]         = useState(false);

  // ── Cargar empleados y piezas al montar ──
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [listaEmpleados, listaPiezas] = await Promise.all([
          empleadosAPI.getAll(),
          piezasAPI.getAll(),
        ]);
        // Normalizar piezas para que tengan el mismo shape que antes
        setPiezas(listaPiezas.map(p => ({
          id:             p.no_parte,
          cliente:        p.cliente,
          descripcion:    p.descripcion,
          parteCliente:   p.parte_cliente,
          nivelDWG:       p.nivel_dwg,
          nivelCAD:       p.nivel_cad,
          imagen:         p.imagen_url,
          tiempoMedicion: p.tiempo_medicion,
          tiemposExtra:   p.tiempos_extra || {},
          dbId:           p.id,
        })));
        setEmpleados(listaEmpleados.filter(e => e.activo).map(e => e.nombre));
      } catch (err) {
        setErrorCarga("No se pudo conectar con el servidor. Verifica la conexión.");
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);
  const [zoom,        setZoom]        = useState(1);
  const [posicion,    setPosicion]    = useState({ x:0, y:0 });
  const [arrastrando, setArrastrando] = useState(false);
  const [inicioDrag,  setInicioDrag]  = useState({ x:0, y:0 });

  /* helpers */
  const seleccionarPieza = (p) => {
    setPiezaInput(p.id); setPieza(p.id); setCliente(p.cliente);
    setDescripcion(p.descripcion); setParteCliente(p.parteCliente);
    setNivelDWG(p.nivelDWG); setNivelCAD(p.nivelCAD); setImagenActual(p.imagen);
    setTiempoMedicionPieza(Number(p.tiempoMedicion) > 0 ? Number(p.tiempoMedicion) : TIEMPO_MEDICION_DEFAULT);
    setTiemposExtraPieza(p.tiemposExtra || {});
    setPiezaOpen(false);
  };
  const limpiarPieza = () => {
    setPieza(""); setCliente(""); setDescripcion("");
    setParteCliente(""); setNivelDWG(""); setNivelCAD(""); setImagenActual("");
    setTiempoMedicionPieza(0); setTiemposExtraPieza({});
  };

  const elegirRazon = (clave) => setRazon(clave);
  const elegirTipo = (clave) => {
    setTipoDescripcion(clave);
    if (clave !== "Otro") setTipoDescripcionDetalle("");
  };

  const piezasFiltradas = piezaInput.trim()
    ? piezas.filter(p =>
        p.id.toLowerCase().includes(piezaInput.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(piezaInput.toLowerCase()) ||
        p.cliente.toLowerCase().includes(piezaInput.toLowerCase()))
    : piezas;

  const handleZoom = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
    const nz = Math.min(Math.max(0.5, zoom + (-e.deltaY * 0.001)), 6);
    const ratio = nz / zoom;
    setPosicion(prev => ({ x: ox - (ox - prev.x)*ratio, y: oy - (oy - prev.y)*ratio }));
    setZoom(nz);
  };
  const handleMouseDown = (e) => { setArrastrando(true); setInicioDrag({ x:e.clientX-posicion.x, y:e.clientY-posicion.y }); };
  const handleMouseMove = (e) => { if (!arrastrando) return; setPosicion({ x:e.clientX-inicioDrag.x, y:e.clientY-inicioDrag.y }); };
  const handleMouseUp   = ()  => setArrastrando(false);
  const resetVisor      = ()  => { setZoom(1); setPosicion({ x:0, y:0 }); };

  // Tiempos definidos por el admin en la ficha de la pieza
  const tiempoFull   = Number(tiempoMedicionPieza) > 0 ? Number(tiempoMedicionPieza) : 0;
  const tiempoOtro   = Number(tiemposExtraPieza?.tipoOtro) > 0 ? Number(tiemposExtraPieza.tipoOtro) : tiempoFull;
  const tTipo        = !pieza ? 0 : (tipoDescripcion === "Otro" ? tiempoOtro : tiempoFull);
  const tRazon       = (pieza && razon && tiemposExtraPieza?.razones)
    ? Math.max(0, Number(tiemposExtraPieza.razones[razon]) || 0)
    : 0;
  const tiempoUnitario = tTipo + tRazon;
  const tiempoTotal    = tiempoUnitario * Number(cantidad || 1);
  const tipoLabel      = tipoDescripcion === "Otro" ? "Otro" : "Full Layout";
  const pConf          = prioridadConfig[prioridad];

  const handleRegistrar = async () => {
    if (!nombre || !pieza || !razon || !tipoDescripcion) {
      alert("Completa todos los campos requeridos (Nombre, No. Parte, Razón y Tipo de medición).");
      return;
    }
    const piezaObj = piezas.find(p => p.id === pieza);
    try {
      const nueva = await solicitudesAPI.create({
        empleado_nombre:          nombre,
        pieza_id:                 piezaObj?.dbId || null,
        no_parte:                 pieza,
        cliente,
        tipo_medicion:            tipoMedicion,
        prioridad,
        razon,
        tipo_descripcion:         tipoDescripcion,
        tipo_descripcion_detalle: tipoDescripcion === "Otro" ? tipoDescripcionDetalle : "",
        cantidad:                 Number(cantidad),
        tiempo_por_pieza:         tiempoUnitario || TIEMPO_MEDICION_DEFAULT,
        tiempo_razon:             tRazon,
        tiempo_tipo:              tTipo,
        tiempo_total:             (tiempoUnitario || TIEMPO_MEDICION_DEFAULT) * Number(cantidad || 1),
      });
      // Notificar a App.js para que actualice la cola en memoria
      onRegistrar({
        ...nueva,
        tiempoTranscurrido: 0,
        estado: "pendiente",
        // normalizar nombres para el frontend
        folio:           nueva.folio,
        tiempoTotal:     nueva.tiempo_total,
        tipoDescripcion: nueva.tipo_descripcion,
        tipoDescripcionDetalle: nueva.tipo_descripcion_detalle,
      });
      setEnviado(true);
      setTimeout(() => {
        setEnviado(false);
        setNombre(""); setPieza(""); setPiezaInput(""); setCliente(""); setDescripcion("");
        setParteCliente(""); setNivelDWG(""); setNivelCAD(""); setImagenActual("");
        setCantidad(1); setPrioridad("Normal"); setRazon("");
        setTipoDescripcion(""); setTipoMedicion("PR"); setTipoDescripcionDetalle("");
        setTiempoMedicionPieza(0); setTiemposExtraPieza({});
      }, 2000);
    } catch (err) {
      alert("Error al enviar la solicitud: " + err.message);
    }
  };

  /* ── RENDER ─────────────────────────────────────────── */
  if (cargando) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f2f5", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center", color:"#6b7280" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⟳</div>
        <div>Cargando datos…</div>
      </div>
    </div>
  );

  if (errorCarga) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f2f5", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center", color:"#dc2626", maxWidth:360 }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠</div>
        <div style={{ fontWeight:600, marginBottom:8 }}>Error de conexión</div>
        <div style={{ fontSize:13, color:"#6b7280" }}>{errorCarga}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop:16, padding:"8px 20px", background:"#004a99", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>
          Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div className="rm-root" style={s.root}>
      <style>{css}</style>

      {/* ══ HEADER PRINCIPAL ══ */}
      <div style={s.headerPrincipal}>
        <div style={s.headerInner}>

          {/* LOGO */}
          <div style={s.logoWrap}>
            <img src="/Imagen1.png" alt="Logo" style={s.logoImg} />
          </div>

          {/* TÍTULO */}
          <div style={s.headerTexto}>
            <div style={s.headerTitulo} className="rm-header-titulo">REGISTRO DE SOLICITUD DE MEDICIÓN</div>
            <div style={s.headerSub}>Laboratorio de Metrología</div>
          </div>

          {/* DERECHA: tiempo + admin */}
          <div style={s.headerRight}>
            <div style={s.tiempoChip}>
              <span style={s.tiempoChipLabel}>Tiempo estimado</span>
              <span style={{ ...s.tiempoChipVal, color: pConf.color }}>
                {pieza ? `${tiempoTotal} min` : "—"}
              </span>
              <span style={{ ...s.tiempoPriorBadge, background: pConf.soft, color: pConf.color }}>
                {pieza ? `${tiempoUnitario} min/pza · ${cantidad} pza` : pConf.label}
              </span>
            </div>
            <button style={s.adminBtn} className="rm-admin" onClick={onAdmin}>
              Admin
            </button>
          </div>

        </div>
      </div>

      {/* ══ CUERPO ══ */}
      <div style={s.cuerpo} className="rm-cuerpo">

        {/* ─ GRID SUPERIOR ─ */}
        <div style={s.gridSuperior} className="rm-grid2">

          {/* COL IZQUIERDA */}
          <div style={s.colIzq}>

            {/* NOMBRE */}
            <div style={s.fila}>
              <div style={s.filaLabel}>NOMBRE</div>
              <select style={s.filaSelect} className="rm-ctrl" value={nombre} onChange={e => setNombre(e.target.value)}>
                <option value="">— Seleccione —</option>
                {empleados.map((e,i) => <option key={i} value={e}>{e}</option>)}
              </select>
            </div>

            {/* MEDICIÓN DE */}
            <div style={s.bloque}>
              <div style={s.bloqueTitle}>MEDICIÓN DE</div>
              <div style={s.radioRow}>
                {["PR","CP","Fixture","Otro"].map(op => (
                  <label key={op} style={s.radioLabel} className="rm-radio-label">
                    <input
                      type="radio"
                      checked={tipoMedicion === op}
                      onChange={() => setTipoMedicion(op)}
                      style={{ accentColor: AZUL }}
                    />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* NO. PARTE — autocomplete */}
            <div style={{ position:"relative", marginBottom:8 }}>
              <div style={{ ...s.fila, marginBottom:0 }}>
                <div style={s.filaLabel}>No. PARTE</div>
                <input
                  type="text"
                  className="rm-ctrl"
                  style={s.filaSelect}
                  placeholder="Escriba o busque el No. de parte…"
                  value={piezaInput}
                  onChange={e => { setPiezaInput(e.target.value); setPiezaOpen(true); limpiarPieza(); }}
                  onFocus={() => setPiezaOpen(true)}
                  onBlur={() => setTimeout(() => setPiezaOpen(false), 150)}
                  autoComplete="off"
                />
              </div>
              {piezaOpen && piezasFiltradas.length > 0 && (
                <div style={s.autocompleteList}>
                  {piezasFiltradas.map(p => (
                    <div key={p.id} style={s.autocompleteItem} className="rm-ac-item" onMouseDown={() => seleccionarPieza(p)}>
                      <span style={s.acItemId}>{p.id}</span>
                      <span style={s.acItemDesc}>{p.cliente} · {p.descripcion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CAMPOS AUTO */}
            {[
              ["CLIENTE",           cliente],
              ["DESCRIPCIÓN",       descripcion],
              ["No. PARTE CLIENTE", parteCliente],
            ].map(([lbl, val]) => (
              <div key={lbl} style={s.fila}>
                <div style={s.filaLabel}>{lbl}</div>
                <div style={{ ...s.filaReadonly, color: val ? "#1a1d23" : "#aaa" }}>
                  {val || "—"}
                </div>
              </div>
            ))}

            {/* NIVEL DWG / CAD */}
            <div style={s.filaDoble}>
              {[["NIVEL DWG", nivelDWG],["NIVEL CAD", nivelCAD]].map(([lbl, val]) => (
                <div key={lbl} style={{ ...s.fila, flex:1, marginBottom:0 }}>
                  <div style={{ ...s.filaLabel, width:100, flexShrink:0 }}>{lbl}</div>
                  <div style={{ ...s.filaReadonly, color: val ? "#1a1d23" : "#aaa", flex:1 }}>
                    {val || "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* TIEMPO DE MEDICIÓN — calculado desde la ficha de la pieza */}
            <div style={s.fila}>
              <div style={s.filaLabel}>TIEMPO MEDICIÓN</div>
              <div style={{ ...s.filaReadonly, color: pieza ? "#1a1d23" : "#aaa", flexDirection:"column", alignItems:"flex-start", gap:2, padding:"6px 10px" }}>
                {pieza ? (
                  <>
                    <span style={{ fontSize:11, color:"#6b7280" }}>
                      {tipoLabel} {tTipo}{tRazon > 0 ? ` + Razón ${tRazon}` : ""} = <b>{tiempoUnitario} min/pza</b>
                    </span>
                    <span><b>{tiempoTotal} min</b> por {cantidad} pza</span>
                  </>
                ) : "—"}
              </div>
            </div>

            {/* PRIORIDAD */}
            <div style={s.bloque}>
              <div style={s.bloqueTitle}>PRIORIDAD</div>
              <div style={s.priorGrid}>
                {Object.entries(prioridadConfig).map(([key, cfg]) => (
                  <label
                    key={key}
                    style={{
                      ...s.priorCard,
                      borderColor:  prioridad === key ? cfg.color : "#d1d5db",
                      background:   prioridad === key ? cfg.soft  : "#fff",
                    }}
                    className="rm-prior-card"
                  >
                    <input type="radio" checked={prioridad === key} onChange={() => setPrioridad(key)} style={{ accentColor: cfg.color }} />
                    <div>
                      <div style={{ fontWeight:600, color: prioridad === key ? cfg.color : "#1a1d23", fontSize:13 }}>{cfg.label}</div>
                      <div style={{ fontSize:11, color:"#9ca3af" }}>{cfg.sla}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* CANTIDAD */}
            <div style={s.fila}>
              <div style={s.filaLabel}>CANTIDAD</div>
              <div style={s.cantRow}>
                <button style={s.cantBtn} className="rm-cant" onClick={() => setCantidad(c => Math.max(1, Number(c)-1))}>−</button>
                <input
                  type="number" min="1"
                  style={s.cantInput} className="rm-cant-input"
                  value={cantidad}
                  onChange={e => setCantidad(Math.max(1, Number(e.target.value)))}
                />
                <button style={s.cantBtn} className="rm-cant" onClick={() => setCantidad(c => Number(c)+1)}>+</button>
              </div>
            </div>

          </div>

          {/* COL DERECHA — DIBUJO */}
          <div style={s.colDer}>
            <div style={s.areaDibujoLabel}>VISUALIZACIÓN DEL DIBUJO</div>
            <div style={s.areaDibujo}>
              {imagenActual ? (
                <>
                  <img src={imagenActual} alt="Dibujo pieza" style={s.dibujoImg} />
                  <button
                    style={s.expandBtn}
                    className="rm-expand"
                    onClick={() => { setMostrarModal(true); resetVisor(); }}
                  >
                    ⛶ Expandir
                  </button>
                </>
              ) : (
                <div style={s.sinImagen}>
                  <div style={{ fontSize:36, opacity:.2 }}>◫</div>
                  <div style={{ fontSize:13, color:"#aaa", marginTop:8 }}>Seleccione un No. de parte</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ─ HEADER SECUNDARIO ─ */}
        <div style={s.headerSecundario}>DESCRIPCIÓN DE LA MEDICIÓN</div>

        {/* ─ GRID DESCRIPCIÓN ─ */}
        <div style={s.gridDescripcion} className="rm-grid2">

          {/* Razón */}
          <div style={s.bloque}>
            <div style={s.bloqueTitle}>RAZÓN DE LA MEDICIÓN</div>
            <div style={s.razonGrid}>
              {RAZONES.map(r => {
                const extra = pieza && tiemposExtraPieza?.razones ? Number(tiemposExtraPieza.razones[r]) || 0 : 0;
                return (
                  <label key={r} style={{ ...s.razonItem, borderColor: razon === r ? AZUL : "#e2e5ea", background: razon === r ? "#e8f0fb" : "#fff" }} className="rm-razon">
                    <input type="radio" checked={razon === r} onChange={() => elegirRazon(r)} style={{ accentColor: AZUL }} />
                    <span style={{ flex:1, fontSize:13, color: razon === r ? AZUL : "#374151", fontWeight: razon === r ? 600 : 400 }}>{r}</span>
                    {extra > 0 && <span style={s.tiempoTag}>+{extra} min</span>}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tipo de medición */}
          <div style={s.bloque}>
            <div style={s.bloqueTitle}>TIPO DE MEDICIÓN</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {TIPOS.map(t => {
                const mins = !pieza ? null : (t.clave === "Otro" ? tiempoOtro : tiempoFull);
                return (
                  <label key={t.clave} style={{ ...s.tipoItem, borderColor: tipoDescripcion === t.clave ? AZUL : "#e2e5ea", background: tipoDescripcion === t.clave ? "#e8f0fb" : "#fff" }} className="rm-razon">
                    <input type="radio" checked={tipoDescripcion === t.clave} onChange={() => elegirTipo(t.clave)} style={{ accentColor: AZUL }} />
                    <span style={{ flex:1, fontSize:14, fontWeight:600, color: tipoDescripcion === t.clave ? AZUL : "#374151" }}>{t.etiqueta}</span>
                    {mins != null && <span style={s.tiempoTag}>{mins} min</span>}
                  </label>
                );
              })}
              {tipoDescripcion === "Otro" && (
                <textarea
                  className="rm-otro-input"
                  placeholder="Describe los puntos específicos a medir…"
                  value={tipoDescripcionDetalle}
                  onChange={e => setTipoDescripcionDetalle(e.target.value)}
                  style={s.otroTextarea}
                />
              )}
            </div>
          </div>

        </div>

        {/* ─ BOTÓN REGISTRAR ─ */}
        <div style={s.botonesRow} className="rm-botones">
          <button
            style={{ ...s.btnPrestamo }}
            className="rm-prestamo"
            onClick={onPrestamo}
          >
            📦 PRÉSTAMO
          </button>
          <button
            style={{ ...s.btnRegistrar, ...(enviado ? { background: VERDE, boxShadow:"0 2px 8px rgba(0,166,81,.3)" } : {}) }}
            className={enviado ? "" : "rm-registrar"}
            onClick={handleRegistrar}
            disabled={enviado}
          >
            {enviado ? "✓ Solicitud enviada al administrador" : "REGISTRAR SOLICITUD"}
          </button>
        </div>

      </div>

      {/* ══ MODAL VISOR CAD ══ */}
      {mostrarModal && (
        <div style={s.overlay} onClick={() => { setMostrarModal(false); resetVisor(); }}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>

            <div style={s.modalToolbar}>
              <span style={s.modalTitulo}>Visor Técnico · <span style={{ fontFamily:"'DM Mono',monospace" }}>{pieza}</span></span>
              <div style={s.toolbarControls}>
                <button style={s.toolBtn} className="rm-tool" onClick={() => setZoom(z => Math.min(z+0.25,6))}>＋</button>
                <button style={s.toolBtn} className="rm-tool" onClick={() => setZoom(z => Math.max(z-0.25,0.5))}>－</button>
                <button style={s.toolBtn} className="rm-tool" onClick={resetVisor}>⟲ Reset</button>
                <span style={s.zoomLabel}>{Math.round(zoom*100)}%</span>
              </div>
              <button style={s.cerrarBtn} className="rm-cerrar" onClick={() => { setMostrarModal(false); resetVisor(); }}>✕</button>
            </div>

            <div
              style={{ ...s.visorCanvas, cursor: arrastrando ? "grabbing" : "grab" }}
              onWheel={handleZoom}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={resetVisor}
            >
              <img
                src={imagenActual}
                alt="Vista técnica"
                draggable={false}
                style={{
                  position:"absolute", top:"50%", left:"50%",
                  transform:`translate(calc(-50% + ${posicion.x}px), calc(-50% + ${posicion.y}px)) scale(${zoom})`,
                  transformOrigin:"center", userSelect:"none", pointerEvents:"none",
                  maxWidth:"none", transition:"transform 0.04s linear"
                }}
              />
            </div>

            <div style={s.modalFooter}>
              Scroll para zoom · Arrastrar para mover · Doble clic para resetear
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ESTILOS ─────────────────────────────────────────────── */

const s = {
  root: { minHeight:"100vh", background:"#f0f2f5", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" },

  /* header */
  headerPrincipal: { background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 55%,#1d6fde 100%)", borderBottom:"none", boxShadow:"0 2px 12px rgba(6,31,74,.35)" },
  headerInner:     { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 24px", gap:16 },
  logoWrap:        { flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,.15)", borderRadius:15, padding:"8px 12px", border:"1px solid rgba(255,255,255,.2)", height:90, minWidth:80 },
  logoImg:         { height:80, width:"auto", objectFit:"contain" },
  headerTexto:     { flex:1, textAlign:"center" },
  headerTitulo:    { fontSize:18, fontWeight:700, color:"#fff", letterSpacing:".04em" },
  headerSub:       { fontSize:11, color:"rgba(255,255,255,.65)", marginTop:2 },
  headerRight:     { display:"flex", alignItems:"center", gap:12, flexShrink:0 },
  adminBtn:        { padding:"8px 18px", background:"rgba(255,255,255,.15)", color:"#fff", border:"1px solid rgba(255,255,255,.3)", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", letterSpacing:".03em", transition:"all .15s" },
  tiempoChip:      { display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, background:"rgba(255,255,255,.12)", borderRadius:10, padding:"10px 16px", border:"1px solid rgba(255,255,255,.2)" },
  tiempoChipLabel: { fontSize:10, color:"rgba(255,255,255,.7)", textTransform:"uppercase", letterSpacing:".06em" },
  tiempoChipVal:   { fontSize:26, fontWeight:700, fontFamily:"'DM Mono',monospace", lineHeight:1 },
  tiempoPriorBadge:{ fontSize:11, fontWeight:600, padding:"2px 10px", borderRadius:20, fontFamily:"'DM Mono',monospace" },

  /* cuerpo */
  cuerpo:     { background:"#fff", border:"2px solid #bfdbfe", margin:"16px", borderRadius:4, padding:"16px", boxShadow:"0 2px 12px rgba(29,111,222,.1)" },

  /* grid superior */
  gridSuperior: { display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:0 },
  colIzq:       { display:"flex", flexDirection:"column", gap:8 },
  colDer:       { display:"flex", flexDirection:"column" },

  /* filas */
  fila:         { display:"flex", alignItems:"stretch", marginBottom:8, borderRadius:3, overflow:"hidden", border:"1px solid #d1d5db" },
  filaLabel:    { width:"clamp(104px, 24vw, 160px)", flexShrink:0, background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 100%)", color:"#fff", padding:"7px 10px", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", letterSpacing:".02em" },
  filaSelect:   { flex:1, padding:"7px 8px", border:"none", fontSize:13, fontFamily:"inherit", background:"#fff", color:"#1a1d23", outline:"none" },
  filaReadonly: { flex:1, padding:"7px 10px", fontSize:13, background:"#f9fafb", fontFamily:"'DM Mono',monospace", display:"flex", alignItems:"center" },
  filaDoble:    { display:"flex", gap:8, marginBottom:8 },

  /* autocomplete */
  autocompleteList: { position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:`1.5px solid ${AZUL}`, borderTop:"none", borderRadius:"0 0 4px 4px", zIndex:200, boxShadow:"0 8px 24px rgba(0,74,153,.15)", maxHeight:220, overflowY:"auto" },
  autocompleteItem: { display:"flex", flexDirection:"column", gap:2, padding:"8px 10px", cursor:"pointer", borderBottom:"1px solid #f3f4f6" },
  acItemId:         { fontSize:13, fontWeight:700, color:"#1a1d23", fontFamily:"'DM Mono',monospace" },
  acItemDesc:       { fontSize:11, color:"#9ca3af" },

  /* bloque */
  bloque:       { border:`1.5px solid ${AZUL}`, borderRadius:4, padding:"10px 12px", marginBottom:8 },
  bloqueTitle:  { fontSize:11, fontWeight:700, color: AZUL, textTransform:"uppercase", letterSpacing:".07em", marginBottom:10, paddingBottom:6, borderBottom:`1px solid #dbeafe` },
  radioRow:     { display:"flex", gap:20, flexWrap:"wrap" },
  radioLabel:   { display:"flex", alignItems:"center", gap:6, fontSize:13, cursor:"pointer", padding:"4px 0" },

  /* prioridad */
  priorGrid:    { display:"flex", flexDirection:"column", gap:6 },
  priorCard:    { display:"flex", alignItems:"center", gap:10, padding:"8px 12px", border:"1.5px solid", borderRadius:6, cursor:"pointer", transition:"all .15s" },

  /* cantidad */
  cantRow:      { display:"flex", flex:1 },
  cantBtn:      { width:34, background:"#f4f5f7", border:"none", borderRight:"1px solid #e2e5ea", fontSize:16, color:"#4b5563", cursor:"pointer", fontFamily:"inherit", transition:"background .15s" },
  cantInput:    { width:60, border:"none", textAlign:"center", fontSize:15, fontFamily:"'DM Mono',monospace", fontWeight:600, color:"#1a1d23", outline:"none", background:"#fff" },

  /* área dibujo */
  areaDibujoLabel: { background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 100%)", color:"#fff", fontSize:12, fontWeight:700, padding:"6px 10px", textAlign:"center", letterSpacing:".04em", borderRadius:"3px 3px 0 0" },
  areaDibujo:   { flex:1, border:`1.5px solid ${AZUL}`, borderTop:"none", borderRadius:"0 0 4px 4px", background:"#f6f8fb", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", minHeight:280,
    backgroundImage:"linear-gradient(rgba(0,74,153,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,74,153,.04) 1px,transparent 1px)", backgroundSize:"30px 30px" },
  dibujoImg:    { width:"100%", height:"100%", objectFit:"contain", padding:10 },
  expandBtn:    { position:"absolute", bottom:10, right:10, padding:"5px 12px", background:`${AZUL}cc`, color:"#fff", border:"none", borderRadius:5, fontSize:12, cursor:"pointer", fontFamily:"inherit", backdropFilter:"blur(4px)" },
  sinImagen:    { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 },

  /* header secundario */
  headerSecundario: { background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 100%)", color:"#fff", padding:"7px 10px", fontWeight:700, fontSize:13, textAlign:"center", letterSpacing:".04em", margin:"16px 0 12px", borderRadius:3 },

  /* grid descripción */
  gridDescripcion: { display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 },
  razonGrid:    { display:"flex", flexDirection:"column", gap:6 },
  razonItem:    { display:"flex", alignItems:"center", gap:8, padding:"7px 10px", border:"1.5px solid", borderRadius:5, cursor:"pointer", transition:"all .15s" },
  tipoItem:     { display:"flex", alignItems:"center", gap:8, padding:"10px 12px", border:"1.5px solid", borderRadius:5, cursor:"pointer", transition:"all .15s" },
  tiempoTag:    { fontSize:11, fontWeight:700, color:"#4338ca", background:"#eef2ff", borderRadius:20, padding:"1px 8px", fontFamily:"'DM Mono',monospace", flexShrink:0 },
  otroTextarea: { width:"100%", minHeight:80, padding:"9px 11px", border:`1.5px solid ${AZUL}`, borderRadius:5, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#1a1d23", background:"#f8faff", resize:"vertical", outline:"none", lineHeight:1.5, boxSizing:"border-box" },

  /* botón */
  botonesRow:   { display:"flex", justifyContent:"flex-end", gap:12, marginTop:20 },
  btnRegistrar: { padding:"11px 36px", background: AZUL, color:"#fff", border:"none", borderRadius:5, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:".04em", transition:"all .2s", boxShadow:"0 2px 8px rgba(0,74,153,.3)" },
  btnPrestamo:  { padding:"11px 24px", background:"linear-gradient(135deg,#f59e0b 0%,#d97706 100%)", color:"#fff", border:"none", borderRadius:5, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:".04em", transition:"all .2s", boxShadow:"0 2px 8px rgba(217,119,6,.35)" },

  /* modal */
  overlay:      { position:"fixed", inset:0, background:"rgba(10,14,20,.75)", backdropFilter:"blur(5px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" },
  modalBox:     { width:"92vw", maxWidth:1100, height:"88vh", display:"flex", flexDirection:"column", borderRadius:8, overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,.5)", background:"#1b1f27" },
  modalToolbar: { display:"flex", alignItems:"center", gap:14, padding:"0 16px", height:44, background:"linear-gradient(to bottom,#f7f9fc,#e4e8ef)", borderBottom:"1px solid #c7ccd6", flexShrink:0 },
  modalTitulo:  { fontSize:13, fontWeight:600, color:"#2d2f33", flex:1 },
  toolbarControls:{ display:"flex", alignItems:"center", gap:6 },
  toolBtn:      { padding:"4px 10px", background:"#fff", border:"1px solid #c7ccd6", borderRadius:4, fontSize:12, color:"#333", cursor:"pointer", fontFamily:"inherit" },
  zoomLabel:    { fontFamily:"'DM Mono',monospace", fontSize:12, color:"#6b7280", minWidth:40, textAlign:"right" },
  cerrarBtn:    { background:"transparent", border:"none", fontSize:18, cursor:"pointer", color:"#555", padding:"4px 6px" },
  visorCanvas:  { flex:1, position:"relative", overflow:"hidden",
    background:"#f6f8fb",
    backgroundImage:"linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)",
    backgroundSize:"50px 50px" },
  modalFooter:  { padding:"6px 16px", background:"linear-gradient(to bottom,#f7f9fc,#e4e8ef)", borderTop:"1px solid #c7ccd6", fontSize:11, color:"#6b7280", textAlign:"center", flexShrink:0 },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.rm-root { animation:fadeUp .32s cubic-bezier(.2,.8,.4,1); }
.rm-admin { transition:all .15s !important; }
.rm-admin:hover      { background:rgba(255,255,255,.28) !important; border-color:rgba(255,255,255,.5) !important; }
.rm-admin:active     { transform:scale(.95) !important; }
.rm-ctrl:focus       { outline:2px solid #1d6fde; outline-offset:-1px; }
.rm-otro-input:focus { outline:2px solid #1d6fde; outline-offset:-1px; background:#fff !important; }
.rm-otro-input::placeholder { color:#aab2bf; }
.rm-ac-item { transition:background .12s !important; }
.rm-ac-item:hover    { background:#eff6ff !important; }
.rm-radio-label { transition:color .12s !important; }
.rm-radio-label:hover{ color:#1d6fde !important; }
.rm-prior-card { transition:all .15s !important; }
.rm-prior-card:hover { opacity:.85; }
.rm-razon { transition:all .15s !important; }
.rm-razon:hover      { border-color:#1d6fde !important; background:#eff6ff !important; }
.rm-cant { transition:all .15s !important; }
.rm-cant:hover       { background:#dbeafe !important; color:#1d6fde !important; }
.rm-cant:active      { transform:scale(.93) !important; }
.rm-expand { transition:all .15s !important; }
.rm-expand:hover     { background:#0a3d8fcc !important; }
.rm-registrar { transition:all .18s !important; }
.rm-registrar:hover  { background:#1558b0 !important; transform:translateY(-1px); box-shadow:0 4px 16px rgba(29,111,222,.4) !important; }
.rm-registrar:active { transform:scale(.97) !important; }
.rm-prestamo { transition:all .18s !important; }
.rm-prestamo:hover   { filter:brightness(1.07); transform:translateY(-1px); box-shadow:0 6px 18px rgba(217,119,6,.45) !important; }
.rm-prestamo:active  { transform:scale(.97) !important; }
.rm-tool { transition:background .12s !important; }
.rm-tool:hover       { background:#e9edf3 !important; }
.rm-cerrar { transition:color .12s !important; }
.rm-cerrar:hover     { color:#dc2626 !important; }

/* ── Responsive: tablet / pantallas angostas ── */
@media (max-width: 900px) {
  .rm-grid2 { grid-template-columns:1fr !important; }
}
@media (max-width: 640px) {
  .rm-root .rm-header-titulo { font-size:15px !important; }
  .rm-cuerpo { margin:10px !important; padding:12px !important; }
  .rm-botones { flex-direction:column !important; }
  .rm-botones > button { width:100% !important; }
}
`;