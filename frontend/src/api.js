const BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

async function request(method, path, body = null, auth = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("metro_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error en el servidor");
  return data;
}

export const authAPI = {
  login: (username, password) => request("POST", "/auth/login", { username, password }),
  me:    ()                   => request("GET",  "/auth/me", null, true),
};

export const empleadosAPI = {
  getAll:          ()      => request("GET",    "/empleados"),
  getDepartamentos:()      => request("GET",    "/empleados/departamentos"),
  create:  (data)          => request("POST",   "/empleados", data, true),
  update:  (id, data)      => request("PUT",    `/empleados/${id}`, data, true),
  remove:  (id)            => request("DELETE", `/empleados/${id}`, null, true),
};

export const piezasAPI = {
  getAll:  ()           => request("GET",    "/piezas"),
  getOne:  (id)         => request("GET",    `/piezas/${id}`),
  create:  (data)       => request("POST",   "/piezas", data, true),
  update:  (id, data)   => request("PUT",    `/piezas/${id}`, data, true),
  remove:  (id)         => request("DELETE", `/piezas/${id}`, null, true),
};

export const solicitudesAPI = {
  getCola:      ()      => request("GET",  "/solicitudes",            null, true),
  getHistorial: (q={})  => {
    const params = new URLSearchParams(q).toString();
    return request("GET", `/solicitudes/historial${params ? "?"+params : ""}`, null, true);
  },
  create:           (data)     => request("POST", "/solicitudes", data),
  iniciar:          (id)       => request("PUT",  `/solicitudes/${id}/iniciar`,  null, true),
  terminar:         (id)       => request("PUT",  `/solicitudes/${id}/terminar`, null, true),
  actualizarTiempo: (id, mins) => request("PUT",  `/solicitudes/${id}/tiempo`, { tiempo_transcurrido: mins }, true),
};

export const usuariosAPI = {
  getAll:  ()           => request("GET",    "/usuarios",          null, true),
  create:  (data)       => request("POST",   "/usuarios", data,    true),
  update:  (id, data)   => request("PUT",    `/usuarios/${id}`, data, true),
  remove:  (id)         => request("DELETE", `/usuarios/${id}`,    null, true),
};

export const uploadAPI = {
  imagen: async (file) => {
    const token = localStorage.getItem("metro_token");
    const form  = new FormData();
    form.append("imagen", file);
    const res = await fetch(`${BASE}/upload/imagen`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir imagen");
    return data;
  },
  archivo: async (file) => {
    const token = localStorage.getItem("metro_token");
    const form  = new FormData();
    form.append("archivo", file);
    const res = await fetch(`${BASE}/upload/archivo`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir archivo");
    return data;
  }
};

export const dispositivosAPI = {
  getAll:  ()           => request("GET",    "/dispositivos"),
  create:  (data)       => request("POST",   "/dispositivos", data, true),
  update:  (id, data)   => request("PUT",    `/dispositivos/${id}`, data, true),
  remove:  (id)         => request("DELETE", `/dispositivos/${id}`, null, true),
};

export const prestamosAPI = {
  getActivos:   ()     => request("GET",  "/prestamos",           null, true),
  getHistorial: ()     => request("GET",  "/prestamos/historial", null, true),
  getCount:     ()     => request("GET",  "/prestamos/count"),
  create:       (data) => request("POST", "/prestamos", data),
  devolver:     (id)   => request("PUT",  `/prestamos/${id}/devolver`, null, true),
};

export const areasAPI = {
  getAll:  ()           => request("GET",    "/areas"),
  create:  (data)       => request("POST",   "/areas", data, true),
  update:  (id, data)   => request("PUT",    `/areas/${id}`, data, true),
  remove:  (id)         => request("DELETE", `/areas/${id}`, null, true),
};