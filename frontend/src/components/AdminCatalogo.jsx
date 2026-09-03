import { useState, useEffect, useRef, Fragment } from "react";
import { piezasAPI, empleadosAPI, uploadAPI } from "../api";

const AZUL = "#1d6fde";
const DEPARTAMENTOS_BASE = ["Calidad", "Producción", "Mantenimiento", "Ingeniería"];
const RAZONES = [
  "Liberación de proceso / serie",
  "PPAP",
  "Reclamación interna / externa",
  "Modificación / Daño herramienta",
  "Programa de validación",
  "Prueba o estudio",
];

export default function AdminCatalogo({ volver = () => {} }) {
  const [tab,       setTab]       = useState("piezas");
  const [piezas,    setPiezas]    = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState(DEPARTAMENTOS_BASE);
  const [buscarPieza,  setBuscarPieza]  = useState("");
  const [ordenPiezas,  setOrdenPiezas]  = useState("no_parte"); // "no_parte" | "cliente"
  const [cargando,  setCargando]  = useState(true);
  const [modal,     setModal]     = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState("");
  const [subiendo,  setSubiendo]  = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [subiendoCategoria, setSubiendoCategoria] = useState(null);
  const fileRef        = useRef();
  const dispositivoRef = useRef();
  const instruccionRef = useRef();
  const reporteRef     = useRef();

  const cargarPiezas    = async () => { const d = await piezasAPI.getAll();   setPiezas(d); };
  const cargarEmpleados = async () => {
    const d = await empleadosAPI.getAll();
    setEmpleados(d);
    const usados = d.map(e => e.departamento).filter(Boolean);
    setDepartamentos([...new Set([...DEPARTAMENTOS_BASE, ...usados])].sort((a, b) => a.localeCompare(b)));
  };

  useEffect(() => {
    async function init() {
      try { await Promise.all([cargarPiezas(), cargarEmpleados()]); }
      catch { setError("Error al cargar datos"); }
      finally { setCargando(false); }
    }
    init();
  }, []);

  const nuevoTiemposExtra = (te) => ({
    tipoOtro: te?.tipoOtro ?? "",
    razones: { ...(te?.razones || {}) },
  });
  const abrirNuevaPieza = () => {
    setPreview(null); setError("");
    setModal({ tipo:"pieza", data:{ no_parte:"", cliente:"", descripcion:"", parte_cliente:"", nivel_dwg:"", nivel_cad:"", imagen_url:"", archivos: [], tiempo_medicion: 30, tiempos_extra: nuevoTiemposExtra() } });
  };
  const abrirEditarPieza = (p) => {
    setPreview(p.imagen_url || null); setError("");
    setModal({ tipo:"pieza", data:{ ...p, archivos: p.archivos || [], tiempos_extra: nuevoTiemposExtra(p.tiempos_extra) } });
  };
  const abrirNuevoEmpleado = () => { setError(""); setModal({ tipo:"empleado", data:{ nombre:"", departamento:"" }, deptoNuevo:false }); };
  const abrirEditarEmpleado = (e) => { setError(""); setModal({ tipo:"empleado", data:{ ...e, departamento: e.departamento || "" }, deptoNuevo:false }); };

  const cambiar = (campo, valor) =>
    setModal(m => ({ ...m, data:{ ...m.data, [campo]: valor } }));

  const cambiarTipoOtro = (valor) =>
    setModal(m => ({ ...m, data:{ ...m.data, tiempos_extra:{ ...m.data.tiempos_extra, tipoOtro: valor } } }));
  const cambiarRazonExtra = (razon, valor) =>
    setModal(m => ({ ...m, data:{ ...m.data, tiempos_extra:{ ...m.data.tiempos_extra, razones:{ ...m.data.tiempos_extra.razones, [razon]: valor } } } }));

  const handleImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSubiendo(true);
    try {
      const { url } = await uploadAPI.imagen(file);
      const fullUrl = `${process.env.REACT_APP_API_URL?.replace("/api","") || "http://localhost:4000"}${url}`;
      cambiar("imagen_url", fullUrl);
    } catch (err) {
      setError("Error al subir imagen: " + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const getArchivoByCategoria = (cat) =>
    (modal?.data?.archivos || []).find(a => a.categoria === cat);

  const handleArchivoCategoria = async (e, categoria, ref) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendoCategoria(categoria);
    try {
      const { url } = await uploadAPI.archivo(file);
      const fullUrl = `${process.env.REACT_APP_API_URL?.replace("/api","") || "http://localhost:4000"}${url}`;
      const nuevoArchivo = { nombre: file.name, url: fullUrl, tipo: file.type, categoria };
      const sinEstaCategoria = (modal.data.archivos || []).filter(a => a.categoria !== categoria);
      cambiar("archivos", [...sinEstaCategoria, nuevoArchivo]);
    } catch (err) {
      setError("Error al subir archivo: " + err.message);
    } finally {
      setSubiendoCategoria(null);
      if (ref?.current) ref.current.value = "";
    }
  };

  const handleEliminarArchivoCategoria = (categoria) => {
    cambiar("archivos", (modal.data.archivos || []).filter(a => a.categoria !== categoria));
  };

  const guardar = async () => {
    setGuardando(true); setError("");
    try {
      if (modal.tipo === "pieza") {
        const t = Number(modal.data.tiempo_medicion);
        if (!Number.isFinite(t) || t <= 0) { setError("El tiempo de Full Layout debe ser un número mayor a 0"); setGuardando(false); return; }
        const te = modal.data.tiempos_extra || {};
        const otro = Math.round(Number(te.tipoOtro));
        const razonesLimpio = {};
        Object.entries(te.razones || {}).forEach(([k, v]) => {
          const n = Math.round(Number(v));
          if (Number.isFinite(n) && n > 0) razonesLimpio[k] = n;
        });
        const payload = {
          ...modal.data,
          tiempo_medicion: Math.round(t),
          tiempos_extra: {
            ...(Number.isFinite(otro) && otro > 0 ? { tipoOtro: otro } : {}),
            ...(Object.keys(razonesLimpio).length ? { razones: razonesLimpio } : {}),
          },
        };
        modal.data.id ? await piezasAPI.update(modal.data.id, payload) : await piezasAPI.create(payload);
        await cargarPiezas();
      } else {
        const nombre = (modal.data.nombre || "").trim();
        const departamento = (modal.data.departamento || "").trim();
        if (!nombre) { setError("El nombre es obligatorio"); setGuardando(false); return; }
        const payload = { nombre, departamento };
        modal.data.id ? await empleadosAPI.update(modal.data.id, payload) : await empleadosAPI.create(payload);
        await cargarEmpleados();
      }
      setModal(null);
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  };

  const desactivar = async (tipo, id) => {
    if (!window.confirm("¿Desactivar este registro?")) return;
    try {
      tipo === "pieza" ? await piezasAPI.remove(id) : await empleadosAPI.remove(id);
      tipo === "pieza" ? await cargarPiezas() : await cargarEmpleados();
    } catch (e) { alert("Error: " + e.message); }
  };

  const activar = async (tipo, id) => {
    try {
      tipo === "pieza" ? await piezasAPI.update(id, { activo: true }) : await empleadosAPI.update(id, { activo: true });
      tipo === "pieza" ? await cargarPiezas() : await cargarEmpleados();
    } catch (e) { alert("Error: " + e.message); }
  };

  // ── Piezas: filtro por buscador + orden (siempre ascendente) ──
  const q = buscarPieza.trim().toLowerCase();
  const piezasVista = piezas
    .filter(p => {
      if (!q) return true;
      return (p.no_parte || "").toLowerCase().includes(q)
          || (p.cliente || "").toLowerCase().includes(q)
          || (p.descripcion || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (ordenPiezas === "cliente") {
        const c = (a.cliente || "").localeCompare(b.cliente || "", "es", { sensitivity: "base" });
        if (c !== 0) return c;
      }
      return (a.no_parte || "").localeCompare(b.no_parte || "", "es", { numeric: true, sensitivity: "base" });
    });

  if (cargando) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"#6b7280" }}>
      Cargando catálogo…
    </div>
  );

  return (
    <div className="cat-root" style={s.root}>
      <style>{css}</style>

      <header style={s.topbar}>
        <div style={s.topLeft}>
          <button className="cat-volver" style={s.btnVolver} onClick={volver}>← Panel administrador</button>
          <div style={s.divider} />
          <h1 style={s.pageTitle}>Catálogo</h1>
        </div>
        <button className="cat-add" style={s.btnAdd}
          onClick={tab === "piezas" ? abrirNuevaPieza : abrirNuevoEmpleado}>
          + {tab === "piezas" ? "Nueva pieza" : "Nuevo empleado"}
        </button>
      </header>

      <div style={s.tabsWrap}>
        {[["piezas","🔩 Piezas", piezas.length],["empleados","👤 Empleados", empleados.length]].map(([key,lbl,cnt]) => (
          <button key={key} style={{ ...s.tab, ...(tab===key ? s.tabActive : {}) }} onClick={() => setTab(key)}>
            {lbl} <span style={{ ...s.tabBadge, ...(tab===key ? s.tabBadgeActive : {}) }}>{cnt}</span>
          </button>
        ))}
      </div>

      <div style={s.body}>
        {tab === "piezas" && (
          piezas.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🔩</div>
              <div style={s.emptyTitle}>Sin piezas registradas</div>
              <div style={s.emptySub}>Agrega la primera pieza al catálogo</div>
              <button className="cat-add" style={{ ...s.btnAdd, marginTop:16 }} onClick={abrirNuevaPieza}>+ Nueva pieza</button>
            </div>
          ) : (
            <>
              <div style={s.toolbar}>
                <div style={s.searchWrap}>
                  <span style={s.searchIcon}>⌕</span>
                  <input
                    className="cat-input"
                    style={s.searchInput}
                    placeholder="Buscar por No. de parte, cliente o descripción…"
                    value={buscarPieza}
                    onChange={e => setBuscarPieza(e.target.value)}
                  />
                  {buscarPieza && <button style={s.searchClear} onClick={() => setBuscarPieza("")}>✕</button>}
                </div>
                <div style={s.sortWrap}>
                  <span style={s.sortLabel}>Ordenar por</span>
                  <button
                    className="cat-sort"
                    style={{ ...s.sortBtn, ...(ordenPiezas === "no_parte" ? s.sortBtnActive : {}) }}
                    onClick={() => setOrdenPiezas("no_parte")}
                  >
                    N° de parte ↑
                  </button>
                  <button
                    className="cat-sort"
                    style={{ ...s.sortBtn, ...(ordenPiezas === "cliente" ? s.sortBtnActive : {}) }}
                    onClick={() => setOrdenPiezas("cliente")}
                  >
                    Cliente A–Z
                  </button>
                </div>
              </div>

              {piezasVista.length === 0 ? (
                <div style={s.noResults}>
                  <div style={{ fontSize:32, opacity:.3 }}>🔍</div>
                  <div style={{ marginTop:8 }}>Ninguna pieza coincide con “{buscarPieza}”.</div>
                </div>
              ) : (
                <div style={s.grid}>
                  {piezasVista.map((p, i) => {
                    const prev = piezasVista[i - 1];
                    const mostrarHeader = ordenPiezas === "cliente" && (!prev || prev.cliente !== p.cliente);
                    return (
                      <Fragment key={p.id}>
                        {mostrarHeader && (
                          <div style={s.clienteHeader}>
                            <span style={s.clienteHeaderName}>{p.cliente || "Sin cliente"}</span>
                            <span style={s.clienteHeaderCount}>
                              {piezasVista.filter(x => x.cliente === p.cliente).length}
                            </span>
                          </div>
                        )}
                        <div className="cat-card" style={{ ...s.card, opacity: p.activo ? 1 : 0.5 }}>
                          <div style={s.cardImg}>
                            {p.imagen_url
                              ? <img className="cat-card-img" src={p.imagen_url} alt={p.no_parte} style={{ width:"100%", height:"100%", objectFit:"contain", padding:10 }} />
                              : <div style={s.cardImgPlaceholder}>📐</div>
                            }
                            <span style={s.cardImgTag}>{p.no_parte}</span>
                            {!p.activo && <div style={s.inactiveBadge}>Inactiva</div>}
                          </div>
                          <div style={s.cardBody}>
                            <div style={s.cardNoParte}>{p.no_parte}</div>
                            <span style={s.cardCliente}>{p.cliente}</span>
                            <div style={s.cardDesc}>{p.descripcion}</div>
                            <div style={s.cardMeta}>
                              <span style={s.metaItem}><span style={s.metaLabel}>DWG</span> {p.nivel_dwg || "—"}</span>
                              <span style={s.metaItem}><span style={s.metaLabel}>CAD</span> {p.nivel_cad || "—"}</span>
                            </div>
                            <div style={s.cardTiempo}>
                              ⏱ Full {p.tiempo_medicion ?? 30}
                              {Number(p.tiempos_extra?.tipoOtro) > 0 ? ` · Otro ${p.tiempos_extra.tipoOtro}` : ""}
                              {p.tiempos_extra?.razones && Object.keys(p.tiempos_extra.razones).length
                                ? ` · +${Object.keys(p.tiempos_extra.razones).length} razón(es)` : ""}
                            </div>
                            <div style={s.cardActions}>
                              <button className="cat-edit" style={s.btnEdit} onClick={() => abrirEditarPieza(p)}>Editar</button>
                              {p.activo && <button className="cat-del" style={s.btnDel} onClick={() => desactivar("pieza", p.id)}>Desactivar</button>}
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              )}
            </>
          )
        )}

        {tab === "empleados" && (
          empleados.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>👤</div>
              <div style={s.emptyTitle}>Sin empleados registrados</div>
              <button className="cat-add" style={{ ...s.btnAdd, marginTop:16 }} onClick={abrirNuevoEmpleado}>+ Nuevo empleado</button>
            </div>
          ) : (
            <div style={s.empGrid}>
              {empleados.map(e => (
                <div key={e.id} className="cat-card" style={{ ...s.empCard, opacity: e.activo ? 1 : 0.55 }}>
                  <div style={s.empAvatar}>{e.nombre.charAt(0).toUpperCase()}</div>
                  <div style={s.empInfo}>
                    <div style={s.empNombre}>{e.nombre}</div>
                    <div style={s.empTags}>
                      {e.departamento
                        ? <span style={s.empDepto}>{e.departamento}</span>
                        : <span style={s.empDeptoVacio}>Sin departamento</span>}
                      <span style={{ ...s.empBadge, background: e.activo ? "#dcfce7" : "#fee2e2", color: e.activo ? "#16a34a" : "#dc2626" }}>
                        {e.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                  <div style={s.empActions}>
                    <button className="cat-edit" style={s.btnEdit} onClick={() => abrirEditarEmpleado(e)}>Editar</button>
                    {e.activo
                      ? <button className="cat-del" style={s.btnDel} onClick={() => desactivar("empleado", e.id)}>Desactivar</button>
                      : <button className="cat-act" style={s.btnAct} onClick={() => activar("empleado", e.id)}>Activar</button>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={s.modalTitle}>{modal.data.id ? "Editar" : "Nueva"} {modal.tipo === "pieza" ? "pieza" : "empleado"}</div>
                <div style={s.modalSub}>{modal.tipo === "pieza" ? "Completa los datos del No. de Parte" : "Nombre y departamento del empleado"}</div>
              </div>
              <button style={s.btnCerrar} onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={s.modalBody}>
              {modal.tipo === "pieza" ? (
                <div style={s.modalGrid}>
                  <div style={s.modalImgCol}>
                    <div style={s.imgUploadArea} onClick={() => fileRef.current.click()}>
                      {subiendo ? (
                        <div style={s.imgPlaceholder}><div style={{ fontSize:24 }}>⟳</div><div style={{ fontSize:12, marginTop:8 }}>Subiendo…</div></div>
                      ) : preview ? (
                        <img src={preview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"contain", padding:8 }} />
                      ) : (
                        <div style={s.imgPlaceholder}>
                          <div style={{ fontSize:36, marginBottom:8 }}>📐</div>
                          <div style={{ fontSize:12, color:"#9ca3af" }}>Clic para subir imagen</div>
                          <div style={{ fontSize:11, color:"#c4c9d4", marginTop:4 }}>JPG, PNG, SVG — máx 20MB</div>
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImagen} />
                    <button className="cat-img-btn" style={s.btnImgChange} onClick={() => fileRef.current.click()}>
                      {preview ? "Cambiar imagen" : "Subir imagen"}
                    </button>
                  </div>
                  <div style={s.modalFieldsCol}>
                    {[
                      ["no_parte",      "No. Parte *"],
                      ["cliente",       "Cliente *"],
                      ["descripcion",   "Descripción"],
                      ["parte_cliente", "No. Parte Cliente"],
                      ["nivel_dwg",     "Nivel DWG"],
                      ["nivel_cad",     "Nivel CAD"],
                    ].map(([campo, lbl]) => (
                      <div key={campo} style={s.fieldWrap}>
                        <label style={s.label}>{lbl}</label>
                        <input
                          className="cat-input"
                          style={s.input}
                          value={modal.data[campo] || ""}
                          onChange={e => cambiar(campo, e.target.value)}
                          disabled={campo === "no_parte" && !!modal.data.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={s.fieldWrap}>
                    <label style={s.label}>Nombre completo *</label>
                    <input
                      className="cat-input"
                      style={{ ...s.input, fontSize:15 }}
                      placeholder="Ej. Juan García"
                      value={modal.data.nombre || ""}
                      onChange={e => cambiar("nombre", e.target.value)}
                    />
                  </div>

                  <div style={s.fieldWrap}>
                    <label style={s.label}>Departamento</label>
                    {modal.deptoNuevo ? (
                      <div style={{ display:"flex", gap:8 }}>
                        <input
                          className="cat-input"
                          style={{ ...s.input, fontSize:15, flex:1 }}
                          placeholder="Nombre del nuevo departamento"
                          autoFocus
                          value={modal.data.departamento || ""}
                          onChange={e => cambiar("departamento", e.target.value)}
                        />
                        <button
                          type="button"
                          style={s.btnCancelar}
                          onClick={() => setModal(m => ({ ...m, deptoNuevo:false, data:{ ...m.data, departamento:"" } }))}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <select
                        className="cat-input"
                        style={{ ...s.input, fontSize:15, cursor:"pointer" }}
                        value={modal.data.departamento || ""}
                        onChange={e => {
                          if (e.target.value === "__nuevo__") {
                            setModal(m => ({ ...m, deptoNuevo:true, data:{ ...m.data, departamento:"" } }));
                          } else {
                            cambiar("departamento", e.target.value);
                          }
                        }}
                      >
                        <option value="">— Sin departamento —</option>
                        {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                        <option value="__nuevo__">＋ Agregar departamento…</option>
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN DE TIEMPOS - SOLO PARA PIEZAS */}
              {modal.tipo === "pieza" && (
                <div style={s.archivosSection}>
                  <div style={s.archivosSectionTitle}>⏱ Tiempos de esta pieza</div>
                  <p style={s.fieldHint}>
                    El total al registrar una solicitud es <b>(tiempo del tipo + tiempo de la razón elegida) × cantidad</b>.
                    Deja en blanco lo que no aplique.
                  </p>
                  <div style={s.tiemposGrid}>
                    <div style={s.tiempoCell}>
                      <label style={s.tiempoCellLbl}>Full Layout</label>
                      <input className="cat-input" style={s.tiempoCellInput} type="number" min="1" placeholder="Ej. 30"
                        value={modal.data.tiempo_medicion ?? ""}
                        onChange={e => cambiar("tiempo_medicion", e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div style={s.tiempoCell}>
                      <label style={s.tiempoCellLbl}>Otro (tipo)</label>
                      <input className="cat-input" style={s.tiempoCellInput} type="number" min="0" placeholder="= Full Layout"
                        value={modal.data.tiempos_extra?.tipoOtro ?? ""}
                        onChange={e => cambiarTipoOtro(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                  </div>
                  <div style={{ ...s.tiempoCellLbl, marginTop:12, marginBottom:6 }}>Minutos extra por razón (opcional)</div>
                  <div style={s.tiemposGrid}>
                    {RAZONES.map(r => (
                      <div key={r} style={s.tiempoCell}>
                        <label style={s.tiempoCellLbl} title={r}>{r}</label>
                        <input className="cat-input" style={s.tiempoCellInput} type="number" min="0" placeholder="0"
                          value={modal.data.tiempos_extra?.razones?.[r] ?? ""}
                          onChange={e => cambiarRazonExtra(r, e.target.value === "" ? "" : Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN DE ARCHIVOS - SOLO PARA PIEZAS */}
              {modal.tipo === "pieza" && (
                <div style={s.archivosSection}>
                  <div style={s.archivosSectionTitle}>📎 Documentos de la Pieza</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                    {[
                      { cat:"dispositivo", icon:"🔧", label:"Dispositivo", ref: dispositivoRef },
                      { cat:"instruccion", icon:"📄", label:"Instrucción", ref: instruccionRef },
                      { cat:"reporte",     icon:"📊", label:"Reporte",     ref: reporteRef     },
                    ].map(({ cat, icon, label, ref }) => {
                      const arch = getArchivoByCategoria(cat);
                      const cargando = subiendoCategoria === cat;
                      return (
                        <div key={cat} style={s.catSlot}>
                          <div style={s.catSlotLabel}>{icon} {label}</div>
                          {cargando ? (
                            <div style={{ textAlign:"center", padding:"10px 0", color:"#9ca3af", fontSize:12 }}>⟳ Subiendo…</div>
                          ) : arch ? (
                            <div style={s.catSlotFile}>
                              <span style={s.catSlotFileName} title={arch.nombre}>{arch.nombre}</span>
                              <button style={s.catSlotDel} onClick={() => handleEliminarArchivoCategoria(cat)}>✕</button>
                            </div>
                          ) : (
                            <button style={s.catSlotBtn} onClick={() => ref.current.click()}>+ Subir</button>
                          )}
                          <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.dwg" style={{ display:"none" }}
                            onChange={e => handleArchivoCategoria(e, cat, ref)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {error && <div style={s.errorBox}>⚠ {error}</div>}
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnCancelar} onClick={() => setModal(null)}>Cancelar</button>
              <button className="cat-guardar" style={{ ...s.btnGuardar, opacity: guardando ? .7 : 1 }} onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root:        { minHeight:"100vh", background:"#f0f2f6", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" },
  topbar:      { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", background:"linear-gradient(135deg,#061f4a 0%,#0a3d8f 55%,#1d6fde 100%)", borderBottom:"none", boxShadow:"0 2px 12px rgba(6,31,74,.35)", position:"sticky", top:0, zIndex:100 },
  topLeft:     { display:"flex", alignItems:"center", gap:16 },
  btnVolver:   { padding:"7px 14px", border:"1px solid rgba(255,255,255,.3)", background:"rgba(255,255,255,.1)", borderRadius:8, fontSize:13, fontWeight:500, color:"rgba(255,255,255,.9)", cursor:"pointer", fontFamily:"inherit" },
  divider:     { width:1, height:24, background:"rgba(255,255,255,.2)" },
  pageTitle:   { fontSize:16, fontWeight:700, color:"#fff", margin:0 },
  btnAdd:      { padding:"9px 20px", background:"rgba(255,255,255,.95)", color:AZUL, border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(0,0,0,.2)" },
  tabsWrap:    { display:"flex", padding:"0 28px", background:"#fff", borderBottom:"1px solid #e2e5ea" },
  tab:         { padding:"12px 20px", background:"none", border:"none", borderBottom:"2px solid transparent", fontSize:14, fontWeight:500, color:"#6b7280", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 },
  tabActive:   { borderBottom:`2px solid ${AZUL}`, color:AZUL, fontWeight:600 },
  tabBadge:    { fontSize:11, background:"#f3f4f6", color:"#6b7280", padding:"1px 8px", borderRadius:20, fontFamily:"'DM Mono',monospace" },
  tabBadgeActive:{ background:"#dbeafe", color:AZUL },
  body:        { padding:"24px 28px", flex:1 },
  toolbar:     { display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom:18, flexWrap:"wrap" },
  searchWrap:  { position:"relative", flex:1, minWidth:240, maxWidth:460, display:"flex", alignItems:"center" },
  searchIcon:  { position:"absolute", left:12, fontSize:16, color:"#9ca3af", pointerEvents:"none" },
  searchInput: { width:"100%", padding:"10px 34px 10px 34px", border:"1.5px solid #e2e5ea", borderRadius:10, fontSize:13, fontFamily:"inherit", color:"#1a1d23", outline:"none", background:"#fff" },
  searchClear: { position:"absolute", right:8, width:22, height:22, borderRadius:"50%", border:"none", background:"#eef2f7", color:"#6b7280", fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  sortWrap:    { display:"flex", alignItems:"center", gap:8 },
  sortLabel:   { fontSize:12, fontWeight:600, color:"#9ca3af" },
  sortBtn:     { padding:"8px 14px", border:"1.5px solid #e2e5ea", background:"#fff", color:"#4b5563", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
  sortBtnActive:{ border:"1.5px solid #1d6fde", background:"#eff6ff", color:AZUL, boxShadow:"0 0 0 3px rgba(29,111,222,.08)" },
  noResults:   { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:220, color:"#9ca3af", fontSize:14 },
  clienteHeader:{ gridColumn:"1 / -1", display:"flex", alignItems:"center", gap:10, margin:"6px 0 -2px", paddingBottom:8, borderBottom:"2px solid #dbeafe" },
  clienteHeaderName:{ fontSize:14, fontWeight:700, color:"#0a3d8f", letterSpacing:".01em" },
  clienteHeaderCount:{ fontSize:11, fontWeight:700, color:AZUL, background:"#dbeafe", borderRadius:20, padding:"1px 9px", fontFamily:"'DM Mono',monospace" },
  grid:        { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(248px, 1fr))", gap:18 },
  card:        { background:"#fff", borderRadius:14, border:"1px solid #e2e5ea", borderTop:"3px solid #1d6fde", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.06)", transition:"box-shadow .2s,transform .2s", display:"flex", flexDirection:"column" },
  cardImg:     { height:158, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
    background:"radial-gradient(120% 90% at 15% 10%, #ffffff 0%, #eaf1ff 45%, #dfeaff 75%, #d6e4ff 100%)",
    backgroundImage:"radial-gradient(120% 90% at 15% 10%, rgba(255,255,255,.9) 0%, rgba(234,241,255,.6) 45%, rgba(214,228,255,.5) 100%), linear-gradient(rgba(29,111,222,.07) 1px,transparent 1px), linear-gradient(90deg,rgba(29,111,222,.07) 1px,transparent 1px)",
    backgroundSize:"100% 100%, 22px 22px, 22px 22px" },
  cardImgPlaceholder:{ fontSize:44, color:"#a9c2f0" },
  cardImgTag:  { position:"absolute", left:8, top:8, background:"rgba(10,61,143,.92)", color:"#fff", fontSize:10, fontWeight:700, letterSpacing:".03em", padding:"3px 9px", borderRadius:20, fontFamily:"'DM Mono',monospace", boxShadow:"0 2px 6px rgba(10,61,143,.35)" },
  inactiveBadge:{ position:"absolute", top:8, right:8, background:"#fee2e2", color:"#dc2626", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 },
  cardBody:    { padding:"14px 16px", flex:1, display:"flex", flexDirection:"column", gap:4 },
  cardNoParte: { fontSize:16, fontWeight:700, color:"#1a1d23", fontFamily:"'DM Mono',monospace" },
  cardCliente: { fontSize:11, fontWeight:700, color:AZUL, background:"#eff6ff", border:"1px solid #dbeafe", borderRadius:20, padding:"2px 10px", alignSelf:"flex-start", marginTop:2 },
  cardDesc:    { fontSize:12, color:"#6b7280", lineHeight:1.4, flex:1, marginTop:6 },
  cardMeta:    { display:"flex", gap:12, marginTop:8 },
  metaItem:    { fontSize:11, color:"#9ca3af", display:"flex", gap:4 },
  metaLabel:   { fontWeight:600, color:"#6b7280" },
  cardActions: { display:"flex", gap:8, marginTop:12, paddingTop:10, borderTop:"1px solid #f3f4f6" },
  empGrid:     { display:"flex", flexDirection:"column", gap:8, maxWidth:600 },
  empCard:     { background:"#fff", borderRadius:10, border:"1px solid #e2e5ea", padding:"14px 16px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 1px 3px rgba(0,0,0,.05)" },
  empAvatar:   { width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#1d6fde,#0047b3)", color:"#fff", fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  empInfo:     { flex:1, display:"flex", flexDirection:"column", gap:5 },
  empNombre:   { fontSize:14, fontWeight:600, color:"#1a1d23" },
  empTags:     { display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" },
  empDepto:    { fontSize:11, fontWeight:600, padding:"1px 8px", borderRadius:20, background:"#eef2ff", color:"#4338ca" },
  empDeptoVacio:{ fontSize:11, fontWeight:500, padding:"1px 8px", borderRadius:20, background:"#f3f4f6", color:"#9ca3af" },
  empBadge:    { fontSize:11, fontWeight:600, padding:"1px 8px", borderRadius:20 },
  empActions:  { display:"flex", gap:6 },
  btnEdit:     { padding:"5px 12px", background:"#eff6ff", color:AZUL, border:"1px solid #bfdbfe", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
  btnDel:      { padding:"5px 12px", background:"#fee2e2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
  btnAct:      { padding:"5px 12px", background:"#dcfce7", color:"#16a34a", border:"1px solid #86efac", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
  empty:       { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, gap:8 },
  emptyIcon:   { fontSize:48, opacity:.3 },
  emptyTitle:  { fontSize:16, fontWeight:600, color:"#6b7280" },
  emptySub:    { fontSize:13, color:"#9ca3af" },
  overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  modalBox:    { background:"#fff", borderRadius:14, width:"100%", maxWidth:720, boxShadow:"0 24px 80px rgba(0,0,0,.25)", display:"flex", flexDirection:"column", maxHeight:"92vh" },
  modalHeader: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"22px 24px 16px", borderBottom:"1px solid #f3f4f6" },
  modalTitle:  { fontSize:17, fontWeight:700, color:"#1a1d23" },
  modalSub:    { fontSize:12, color:"#9ca3af", marginTop:3 },
  btnCerrar:   { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#9ca3af", padding:4, flexShrink:0 },
  modalBody:   { padding:"20px 24px", overflowY:"auto", flex:1 },
  modalGrid:   { display:"grid", gridTemplateColumns:"210px 1fr", gap:20 },
  modalImgCol: { display:"flex", flexDirection:"column", gap:10 },
  imgUploadArea:{ height:195, border:"2px dashed #d1d5db", borderRadius:10, background:"#f9fafb", cursor:"pointer", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" },
  imgPlaceholder:{ display:"flex", flexDirection:"column", alignItems:"center", color:"#9ca3af" },
  btnImgChange:{ padding:"7px 0", background:"#f4f5f7", border:"1px solid #e2e5ea", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", color:"#4b5563", textAlign:"center" },
  modalFieldsCol:{ display:"flex", flexDirection:"column", gap:12 },
   fieldWrap:   { display:"flex", flexDirection:"column", gap:5 },
  label:       { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".05em" },
  fieldHint:   { fontSize:11, color:"#9ca3af", marginTop:2, lineHeight:1.4 },
  tiemposGrid: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:8 },
  tiempoCell:  { display:"flex", flexDirection:"column", gap:4, minWidth:0 },
  tiempoCellLbl:{ fontSize:11, fontWeight:600, color:"#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  tiempoCellInput:{ padding:"7px 8px", border:"1.5px solid #e2e5ea", borderRadius:7, fontSize:13, fontFamily:"'DM Mono',monospace", fontWeight:600, color:"#1a1d23", outline:"none", width:"100%" },
  cardTiempo:  { marginTop:6, fontSize:11, fontWeight:600, color:"#4338ca", background:"#eef2ff", borderRadius:20, padding:"2px 10px", alignSelf:"flex-start", fontFamily:"'DM Mono',monospace" },
  input:       { padding:"9px 12px", border:"1.5px solid #e2e5ea", borderRadius:7, fontSize:13, fontFamily:"inherit", color:"#1a1d23", outline:"none" },
  errorBox:    { background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:7, padding:"9px 12px", fontSize:13, color:"#dc2626", marginTop:8 },
  archivosSection:    { marginTop:16, paddingTop:16, borderTop:"1px solid #e2e5ea" },
  archivosSectionTitle:{ fontSize:13, fontWeight:700, color:"#1a1d23", marginBottom:10 },
  catSlot:     { border:"1.5px dashed #e2e5ea", borderRadius:8, padding:12, background:"#f9fafb", display:"flex", flexDirection:"column", gap:8 },
  catSlotLabel:{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".04em" },
  catSlotFile: { display:"flex", alignItems:"center", gap:6, background:"#eff6ff", borderRadius:6, padding:"6px 8px" },
  catSlotFileName:{ fontSize:11, color:"#1a1d23", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  catSlotDel:  { background:"#fee2e2", border:"none", color:"#dc2626", borderRadius:4, padding:"2px 6px", cursor:"pointer", fontSize:11, fontWeight:600, flexShrink:0 },
  catSlotBtn:  { width:"100%", padding:"7px 0", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, fontSize:12, fontWeight:600, color:AZUL, cursor:"pointer", fontFamily:"inherit" },
  modalFooter: { display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:"1px solid #f3f4f6" },
  btnCancelar: { padding:"9px 18px", background:"#f4f5f7", color:"#6b7280", border:"1px solid #e2e5ea", borderRadius:7, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  btnGuardar:  { padding:"9px 24px", background:AZUL, color:"#fff", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing:border-box; margin:0; padding:0; }
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.cat-root { animation:fadeUp .32s cubic-bezier(.2,.8,.4,1); }
.cat-volver { transition:all .15s !important; }
.cat-volver:hover  { background:rgba(255,255,255,.2) !important; border-color:rgba(255,255,255,.5) !important; }
.cat-volver:active { transform:scale(.95) !important; }
.cat-add { transition:all .18s !important; }
.cat-add:hover     { background:#f0f7ff !important; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.15) !important; }
.cat-add:active    { transform:scale(.96) !important; }
.cat-card { transition:box-shadow .22s,transform .22s !important; }
.cat-card:hover    { box-shadow:0 10px 28px rgba(29,111,222,.18) !important; transform:translateY(-3px) !important; border-top-color:#0a3d8f !important; }
.cat-card-img { transition:transform .3s ease !important; }
.cat-card:hover .cat-card-img { transform:scale(1.05) !important; }
.cat-sort:hover { border-color:#bfdbfe !important; background:#f7fbff !important; }
.cat-edit { transition:all .15s !important; }
.cat-edit:hover    { background:#dbeafe !important; }
.cat-edit:active   { transform:scale(.96) !important; }
.cat-del  { transition:all .15s !important; }
.cat-del:hover     { background:#fecaca !important; }
.cat-del:active    { transform:scale(.96) !important; }
.cat-act  { transition:all .15s !important; }
.cat-act:hover     { background:#bbf7d0 !important; }
.cat-act:active    { transform:scale(.96) !important; }
.cat-guardar { transition:all .15s !important; }
.cat-guardar:hover { background:#1558b0 !important; }
.cat-guardar:active { transform:scale(.97) !important; }
.cat-img-btn { transition:all .15s !important; }
.cat-img-btn:hover { background:#e2e5ea !important; }
.cat-input:focus   { border-color:#1d6fde !important; box-shadow:0 0 0 3px rgba(29,111,222,.1) !important; }
`;