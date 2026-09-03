import { useState, useEffect, useRef, useCallback } from "react";
import Login            from "./components/Login";
import RegistroMedicion from "./components/RegistroMedicion";
import RegistroPrestamo from "./components/RegistroPrestamo";
import AdminDashboard   from "./components/AdminDashboard";
import AdminMediciones  from "./components/AdminMediciones";
import AdminHistorial   from "./components/AdminHistorial";
import AdminCatalogo    from "./components/AdminCatalogo";
import AdminPrestamos   from "./components/AdminPrestamos";
import AdminInstrucciones from "./components/AdminInstrucciones";
import { authAPI, solicitudesAPI, prestamosAPI } from "./api";

export default function App() {

  const [registros,        setRegistros]        = useState([]);
  const [historial,        setHistorial]        = useState([]);
  const [prestamosCount,   setPrestamosCount]   = useState(0);
  const [vista,            setVista]            = useState("registro");
  const [adminAutenticado, setAdminAutenticado] = useState(false);
  const [usuarioAdmin,     setUsuarioAdmin]     = useState(null);
  const [loginError,       setLoginError]       = useState("");
  const relojRef = useRef(null);

  const normalizar = (r) => ({
    ...r,
    folio:                  r.folio,
    nombre:                 r.empleado_nombre,
    pieza:                  r.no_parte,
    tipoDescripcion:        r.tipo_descripcion,
    tipoDescripcionDetalle: r.tipo_descripcion_detalle,
    tiempoTotal:            r.tiempo_total,
    tiempoPorPieza:         r.tiempo_por_pieza,
    tiempoRazon:            r.tiempo_razon || 0,
    tiempoTipo:             r.tiempo_tipo || 0,
    tiempoTranscurrido:     r.tiempo_transcurrido || 0,
    fechaIngreso:           r.fecha_ingreso ? new Date(r.fecha_ingreso).toLocaleString() : "",
    fechaFin:               r.fecha_fin     ? new Date(r.fecha_fin).toLocaleString()     : "",
  });

  const cargarCola = useCallback(async () => {
    try {
      const data = await solicitudesAPI.getCola();
      const normalizados = data.map(normalizar);
      setRegistros(normalizados);
      const hayProceso   = data.some(r => r.estado === "proceso");
      const hayPendiente = data.find(r => r.estado === "pendiente");
      if (!hayProceso && hayPendiente) {
        await solicitudesAPI.iniciar(hayPendiente.id);
        const data2 = await solicitudesAPI.getCola();
        setRegistros(data2.map(normalizar));
      }
    } catch (err) {
      console.error("Error cargando cola:", err.message);
    }
  }, []);

  const cargarHistorial = useCallback(async () => {
    try {
      const data = await solicitudesAPI.getHistorial();
      setHistorial(data.map(normalizar));
    } catch (err) {
      console.error("Error cargando historial:", err.message);
    }
  }, []);

  const cargarPrestamosCount = useCallback(async () => {
    try {
      const { total } = await prestamosAPI.getCount();
      setPrestamosCount(total);
    } catch {}
  }, []);

  useEffect(() => {
    relojRef.current = setInterval(async () => {
      setRegistros(prev => {
        const enProceso = prev.find(r => r.estado === "proceso");
        if (!enProceso) return prev;
        const nuevos = prev.map(r =>
          r.estado === "proceso"
            ? { ...r, tiempoTranscurrido: (r.tiempoTranscurrido || 0) + 1 }
            : r
        );
        solicitudesAPI.actualizarTiempo(
          enProceso.id,
          (enProceso.tiempoTranscurrido || 0) + 1
        ).catch(() => {});
        return nuevos;
      });
    }, 60000);
    return () => clearInterval(relojRef.current);
  }, []);

  useEffect(() => {
    if (!adminAutenticado) return;
    cargarCola();
    cargarPrestamosCount();
    const intervalo = setInterval(() => {
      cargarCola();
      cargarPrestamosCount();
    }, 30000);
    return () => clearInterval(intervalo);
  }, [adminAutenticado, cargarCola, cargarPrestamosCount]);

  useEffect(() => {
    if (vista === "historial") cargarHistorial();
  }, [vista, cargarHistorial]);

  const manejarLogin = async (usuario, password) => {
    setLoginError("");
    try {
      const { token, usuario: user } = await authAPI.login(usuario, password);
      localStorage.setItem("metro_token", token);
      setUsuarioAdmin(user);
      setAdminAutenticado(true);
      setVista("admin");
    } catch (err) {
      setLoginError(err.message);
      return false;
    }
  };

  const manejarLogout = () => {
    localStorage.removeItem("metro_token");
    setAdminAutenticado(false);
    setUsuarioAdmin(null);
    setRegistros([]);
    setHistorial([]);
    setVista("registro");
  };

  const agregarRegistro = async () => {
    if (adminAutenticado) await cargarCola();
  };

  const terminarMedicion = async (index) => {
    const reg = registros[index];
    if (!reg) return;
    try {
      await solicitudesAPI.terminar(reg.id);
      await cargarCola();
    } catch (err) {
      alert("Error al terminar la medición: " + err.message);
    }
  };

  return (
    <div>

      {vista === "registro" && (
        <RegistroMedicion
          onRegistrar={agregarRegistro}
          onAdmin={() => setVista("login")}
          onPrestamo={() => setVista("prestamo")}
        />
      )}

      {vista === "prestamo" && (
        <RegistroPrestamo onVolver={() => setVista("registro")} />
      )}

      {vista === "login" && (
        <Login
          onLogin={manejarLogin}
          volver={() => setVista("registro")}
          errorExterno={loginError}
        />
      )}

      {vista === "admin" && adminAutenticado && (
        <AdminDashboard
          volver={manejarLogout}
          irAMediciones={() => setVista("mediciones")}
          irAHistorial={() => setVista("historial")}
          irACatalogo={() => setVista("catalogo")}
          irAPrestamos={() => setVista("prestamos")}
          irAInstrucciones={() => setVista("instrucciones")}
          registros={registros}
          prestamosCount={prestamosCount}
          usuario={usuarioAdmin}
          onRefresh={cargarCola}
        />
      )}

      {vista === "mediciones" && (
        <AdminMediciones
          registros={registros}
          terminarMedicion={terminarMedicion}
          volver={() => setVista("admin")}
          onRefresh={cargarCola}
        />
      )}

      {vista === "historial" && (
        <AdminHistorial
          historial={historial}
          volver={() => setVista("admin")}
        />
      )}

      {vista === "catalogo" && (
        <AdminCatalogo volver={() => setVista("admin")} />
      )}

      {vista === "instrucciones" && (
        <AdminInstrucciones volver={() => setVista("admin")} />
      )}

      {vista === "prestamos" && (
        <AdminPrestamos volver={() => setVista("admin")} />
      )}

    </div>
  );
}