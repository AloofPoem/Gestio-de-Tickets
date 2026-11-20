import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { menuPorRol } from "../config/menu";
import ToastBienvenida from "../components/ToastBienvenida";
import FlujoTickets from "../components/FlujoTickets";
import { listarTickets } from "../services/tickets.service";

export default function Dashboard() {
  const { usuario, token } = useAuth();
  const [ticketsAnalitica, setTicketsAnalitica] = useState([]);
  const [cargandoAnalitica, setCargandoAnalitica] = useState(true);
  const [errorAnalitica, setErrorAnalitica] = useState("");
  const [recargaAnalitica, setRecargaAnalitica] = useState(0);

  useEffect(() => {
    if (!token) return;

    const controlador = new AbortController();

    async function cargarAnalitica() {
      setCargandoAnalitica(true);
      try {
        const datos = await listarTickets(token, "todos", controlador.signal);
        if (!Array.isArray(datos)) {
          throw new Error("El servidor no devolvió una lista de tickets.");
        }
        if (!controlador.signal.aborted) {
          setTicketsAnalitica(datos);
          setErrorAnalitica("");
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          setErrorAnalitica(
            err instanceof Error ? err.message : "Error de consulta"
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoAnalitica(false);
        }
      }
    }

    cargarAnalitica();
    return () => controlador.abort();
  }, [token, recargaAnalitica]);

  const [mostrarBienvenida, setMostrarBienvenida] = useState(
    () => sessionStorage.getItem("tickio_mostrar_bienvenida") === "1"
  );

  const cerrarBienvenida = useCallback(() => {
    sessionStorage.removeItem("tickio_mostrar_bienvenida");
    setMostrarBienvenida(false);
  }, []);

  const nombre = usuario?.nombre?.split(" ")[0] || "usuario";
  const opciones = menuPorRol(usuario?.rol);
  const modulos = opciones.filter((opcion) => opcion.ruta !== "/dashboard");

  const descripciones = {
    "/usuarios": "Administración de cuentas y permisos.",
    "/tecnicos": "Gestión del personal de soporte.",
    "/categorias": "Clasificación de solicitudes.",
    "/tickets": "Registro y gestión de incidentes.",
    "/seguimientos": "Trazabilidad de las atenciones.",
  };

  // Cálculo de métricas de tickets
  const totalTickets = ticketsAnalitica.length;
  const pendientes = ticketsAnalitica.filter((t) =>
    ["abierto", "asignado", "en_proceso", "reabierto"].includes(t.estado)
  ).length;
  const resueltos = ticketsAnalitica.filter((t) =>
    ["resuelto", "cerrado"].includes(t.estado)
  ).length;

  return (
    <div className="container-fluid">
      {/* ENCABEZADO 50 - 50 */}
      <div className="row align-items-center g-4 mb-4">
        {/* Columna Izquierda: 50% */}
        <div className="col-lg-6">
          <div className="text-secondary small mb-1">
            Inicio / Panel de control
          </div>

          <h1 className="h3 fw-bold mb-2">
            ¡Hola, {nombre}! 👋
          </h1>

          <p className="text-secondary mb-0">
            Bienvenido al centro de gestión de tick.io.
          </p>
        </div>

        {/* Columna Derecha: 50% (Con sombra y padding amplio del CSS) */}
        <div className="col-lg-6">
          <div className="card border-0 rounded-4 h-100">
            <div className="card-body">
              <div className="row align-items-center g-3">
                <div className="col-sm-7">
                  <div className="text-secondary small mb-2">
                    CUENTA AUTENTICADA
                  </div>

                  <h2 className="h5 fw-bold">
                    {[usuario?.nombre, usuario?.apellido]
                      .filter(Boolean)
                      .join(" ")}
                  </h2>

                  <p className="text-secondary mb-2">
                    {usuario?.email}
                  </p>

                  <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis border border-primary-subtle px-3 py-2">
                    {usuario?.rol}
                  </span>
                </div>

                <div className="col-sm-5 text-sm-end">
                  <Link
                    to="/cambiar-password"
                    className="btn btn-outline-primary rounded-3"
                  >
                    Seguridad de mi cuenta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RESUMEN DE TICKETS (Mismo estilo de sombra y padding que Cuenta Autenticada) */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h5 fw-bold mb-0">
          Resumen operativo
        </h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary rounded-3"
          onClick={() => setRecargaAnalitica((n) => n + 1)}
          disabled={cargandoAnalitica}
        >
          {cargandoAnalitica ? "Actualizando..." : "Actualizar métricas"}
        </button>
      </div>

      {errorAnalitica && (
        <div className="alert alert-danger" role="alert">
          {errorAnalitica}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 rounded-4 h-100">
            <div className="card-body">
              <div className="text-secondary small mb-2">
                TICKETS VISIBLES
              </div>
              <div className="h2 fw-bold mb-0">
                {cargandoAnalitica ? "—" : totalTickets}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 rounded-4 h-100">
            <div className="card-body">
              <div className="text-secondary small mb-2">
                EN ATENCIÓN / PENDIENTES
              </div>
              <div className="h2 fw-bold text-primary mb-0">
                {cargandoAnalitica ? "—" : pendientes}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 rounded-4 h-100">
            <div className="card-body">
              <div className="text-secondary small mb-2">
                RESUELTOS / CERRADOS
              </div>
              <div className="h2 fw-bold text-success mb-0">
                {cargandoAnalitica ? "—" : resueltos}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MÓDULOS DISPONIBLES (Tarjetas más ligeras con shadow-sm y p-4) */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h5 fw-bold mb-0">
          Módulos disponibles
        </h2>
        <span className="text-secondary small">
          Según tu rol
        </span>
      </div>

      <div className="row g-3">
        {modulos.map((modulo) => (
          <div
            className="col-12 col-md-6 col-xl-4"
            key={modulo.ruta}
          >
            <Link
              to={modulo.ruta}
              className="text-decoration-none"
            >
              <div className="card tickio-module-card h-100 border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <div className="tickio-module-icon mb-3">
                    {modulo.icono}
                  </div>

                  <h3 className="h6 fw-bold">
                    {modulo.titulo}
                  </h3>

                  <p className="text-secondary small mb-3">
                    {descripciones[modulo.ruta]}
                  </p>

                  <span className="small fw-semibold text-primary">
                    Abrir módulo →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="alert alert-light border mt-4 rounded-3">
        <FlujoTickets />
        Los módulos se conectarán a la API REST de tick.io
        en los siguientes bloques.
      </div>

      {mostrarBienvenida && (
        <ToastBienvenida
          nombre={nombre}
          onCerrar={cerrarBienvenida}
        />
      )}
    </div>
  );
}