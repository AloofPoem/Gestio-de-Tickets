import { useCallback, useEffect, useMemo, useState } from "react";

import ModalNuevoUsuario from "../components/ModalNuevoUsuario";
import CredencialTemporal from "../components/CredencialTemporal";
import ModalEditarUsuario from "../components/ModalEditarUsuario";
import ModalEstadoUsuario from "../components/ModalEstadoUsuario";
import ModalRestablecerPassword from "../components/ModalRestablecerPassword";

import { useAuth } from "../hooks/useAuth";

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  restablecerPasswordUsuario,
} from "../services/usuarios.service";

function extraerUsuarios(datos) {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.usuarios)) return datos.usuarios;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.data?.usuarios)) return datos.data.usuarios;

  throw new Error(
    "El formato de respuesta de /api/usuarios no coincide con los formatos admitidos."
  );
}

function obtenerNombre(usuario) {
  return (
    [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") ||
    usuario.nombre_completo ||
    "Sin nombre"
  );
}

function obtenerRol(usuario) {
  return usuario.rol?.nombre || usuario.rol || "Sin rol";
}

function obtenerEstado(usuario) {
  if (usuario.activo === true) return "activo";
  if (usuario.activo === false) return "inactivo";
  return "desconocido";
}

export default function Usuarios() {
  const { token, usuario: usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [recarga, setRecarga] = useState(0);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState("");
  const [credencialCreada, setCredencialCreada] = useState(null);

  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [usuarioEstado, setUsuarioEstado] = useState(null);

  const [procesando, setProcesando] = useState(false);
  const [errorOperacion, setErrorOperacion] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const [usuarioRestablecer, setUsuarioRestablecer] = useState(null);
  const [restableciendo, setRestableciendo] = useState(false);
  const [errorRestablecimiento, setErrorRestablecimiento] = useState("");

  useEffect(() => {
    const controlador = new AbortController();

    async function cargar() {
      try {
        const datos = await listarUsuarios(token, controlador.signal);
        const lista = extraerUsuarios(datos);

        if (!controlador.signal.aborted) {
          setUsuarios(lista);
          setError("");
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible consultar los usuarios."
          );
          setUsuarios([]);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargar();
    return () => controlador.abort();
  }, [token, recarga]);

  useEffect(() => {
    if (!mensajeExito) return;
    const temporizador = setTimeout(() => setMensajeExito(""), 4000);
    return () => clearTimeout(temporizador);
  }, [mensajeExito]);

  const actualizar = useCallback(() => {
    setCargando(true);
    setRecarga((valor) => valor + 1);
  }, []);

  async function registrarUsuario(datosFormulario) {
    if (guardando) return;
    setGuardando(true);
    setErrorRegistro("");

    try {
      const resultado = await crearUsuario(token, datosFormulario);
      if (!resultado?.usuario || !resultado?.credencialTemporal) {
        throw new Error("La respuesta del backend no contiene la información esperada.");
      }
      setModalNuevo(false);
      setCredencialCreada(resultado);
      actualizar();
    } catch (err) {
      setErrorRegistro(
        err instanceof Error ? err.message : "No fue posible registrar el usuario."
      );
    } finally {
      setGuardando(false);
    }
  }

  function abrirEdicion(usuario) {
    setErrorOperacion("");
    setMensajeExito("");
    setUsuarioEditar(usuario);
  }

  function abrirCambioEstado(usuario) {
    setErrorOperacion("");
    setMensajeExito("");
    setUsuarioEstado(usuario);
  }

  async function guardarEdicion(datosFormulario) {
    if (!usuarioEditar || procesando) return;
    setProcesando(true);
    setErrorOperacion("");

    try {
      await actualizarUsuario(token, usuarioEditar.id, datosFormulario);
      setUsuarioEditar(null);
      setMensajeExito("Datos del usuario actualizados correctamente.");
      actualizar();
    } catch (err) {
      setErrorOperacion(
        err instanceof Error ? err.message : "No se pudo actualizar el usuario."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarCambioEstado() {
    if (!usuarioEstado || procesando) return;
    setProcesando(true);
    setErrorOperacion("");

    const nuevoEstado = !usuarioEstado.activo;

    try {
      await cambiarEstadoUsuario(token, usuarioEstado.id, nuevoEstado);
      setUsuarioEstado(null);
      setMensajeExito(
        nuevoEstado
          ? "Cuenta reactivada correctamente."
          : "Cuenta desactivada correctamente."
      );
      actualizar();
    } catch (err) {
      setErrorOperacion(
        err instanceof Error ? err.message : "No se pudo cambiar el estado."
      );
    } finally {
      setProcesando(false);
    }
  }

  function abrirRestablecimiento(usuario) {
    setErrorRestablecimiento("");
    setUsuarioRestablecer(usuario);
  }

  async function confirmarRestablecimiento() {
    if (!usuarioRestablecer || restableciendo) return;
    setRestableciendo(true);
    setErrorRestablecimiento("");

    try {
      const resultado = await restablecerPasswordUsuario(token, usuarioRestablecer.id);
      if (!resultado?.usuario || !resultado?.credencialTemporal) {
        throw new Error("El servidor no devolvió la credencial esperada.");
      }
      setUsuarioRestablecer(null);
      setCredencialCreada(resultado);
      actualizar();
    } catch (err) {
      setErrorRestablecimiento(
        err instanceof Error ? err.message : "No fue posible restablecer la contraseña."
      );
    } finally {
      setRestableciendo(false);
    }
  }

  const roles = useMemo(() => {
    return [...new Set(usuarios.map(obtenerRol))].sort();
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const contenido = [
        obtenerNombre(usuario),
        usuario.email,
        usuario.tipo_documento,
        usuario.numero_documento,
        obtenerRol(usuario),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        contenido.includes(texto) &&
        (filtroRol === "todos" || obtenerRol(usuario) === filtroRol) &&
        (filtroEstado === "todos" || obtenerEstado(usuario) === filtroEstado)
      );
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  return (
    <div className="container-fluid">
      {/* ENCABEZADO */}
      <div className="mb-4">
        <div className="text-secondary small mb-1">
          Inicio / Administración / Usuarios
        </div>

        <h1 className="h3 fw-bold mb-1">
          Gestión de usuarios
        </h1>

        <p className="text-secondary mb-0">
          Consulta, filtra y administra las cuentas registradas en tick.io.
        </p>
      </div>

      {mensajeExito && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="status"
        >
          {mensajeExito}
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar mensaje"
            onClick={() => setMensajeExito("")}
          />
        </div>
      )}

      {/* INDICADORES */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 rounded-4">
            <div className="card-body">
              <div className="text-secondary small">Usuarios recibidos</div>
              <div className="fs-3 fw-bold">{usuarios.length}</div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 rounded-4">
            <div className="card-body">
              <div className="text-secondary small">Resultados filtrados</div>
              <div className="fs-3 fw-bold">{usuariosFiltrados.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* DIRECTORIO DE USUARIOS */}
      <div className="card border-0 rounded-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h2 className="h5 fw-bold mb-0">Directorio de usuarios</h2>

            <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis border border-primary-subtle px-3 py-2">
              Rol actual: {obtenerRol(usuarioActual || {})}
            </span>
          </div>

          {/* BÚSQUEDA Y FILTROS */}
          <div className="row g-2 mb-3">
            <div className="col-lg-6">
              <input
                type="search"
                className="form-control"
                placeholder="Buscar por nombre, correo o documento..."
                aria-label="Buscar usuarios"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-lg-3">
              <select
                className="form-select"
                aria-label="Filtrar por rol"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="todos">Todos los roles</option>
                {roles.map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-3">
              <select
                className="form-select"
                aria-label="Filtrar por estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
                <option value="desconocido">Estado no informado</option>
              </select>
            </div>
          </div>

          {/* BOTONES JUSTO ANTES DE LA TABLA */}
          <div className="d-flex justify-content-end align-items-center flex-wrap gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3"
              onClick={actualizar}
              disabled={cargando}
            >
              {cargando ? "Consultando..." : "↻ Actualizar listado"}
            </button>

            <button
              type="button"
              className="btn btn-primary rounded-3"
              onClick={() => {
                setErrorRegistro("");
                setModalNuevo(true);
              }}
            >
              + Nuevo usuario
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <strong>Error al consultar usuarios.</strong>
              <div>{error}</div>
            </div>
          )}

          {/* TABLA */}
          {cargando ? (
            <div className="text-center py-5" role="status">
              <div className="spinner-border text-primary mb-3" />
              <p className="text-secondary mb-0">
                Consultando usuarios en la API REST...
              </p>
            </div>
          ) : !error && (
            <div className="table-responsive tickio-table-wrapper">
              <table className="table table-hover align-middle tickio-table mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">ID</th>
                    <th>Usuario</th>
                    <th>Documento</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th className="text-end pe-4">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="ps-4 text-secondary fw-medium">
                        #{usuario.id}
                      </td>

                      <td className="fw-semibold">
                        {obtenerNombre(usuario)}
                      </td>

                      <td>
                        {usuario.numero_documento ? (
                          <div>
                            <span className="fw-medium">
                              {usuario.numero_documento}
                            </span>
                            <div className="small text-secondary">
                              {usuario.tipo_documento || "Sin tipo"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>

                      <td className="text-secondary">
                        {usuario.email || "—"}
                      </td>

                      <td>
                        <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis border border-primary-subtle px-3 py-2">
                          {obtenerRol(usuario)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge rounded-pill px-3 py-2 ${
                            obtenerEstado(usuario) === "activo"
                              ? "bg-success-subtle text-success-emphasis border border-success-subtle"
                              : obtenerEstado(usuario) === "inactivo"
                                ? "bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle"
                                : "bg-body-secondary text-body border"
                          }`}
                        >
                          {obtenerEstado(usuario)}
                        </span>
                      </td>

                      <td className="text-end pe-4">
                        {(() => {
                          const rolActual = obtenerRol(usuarioActual || {});
                          const rolObjetivo = obtenerRol(usuario);

                          const puedeAdministrar =
                            rolActual === "superadmin" ||
                            (rolActual === "admin" &&
                              !["admin", "superadmin"].includes(rolObjetivo));

                          const esCuentaPropia =
                            usuarioActual?.id != null &&
                            String(usuario.id) === String(usuarioActual.id);

                          const puedeRestablecer =
                            !esCuentaPropia &&
                            rolObjetivo !== "superadmin" &&
                            (rolActual === "superadmin" ||
                              (rolActual === "admin" &&
                                ["tecnico", "usuario"].includes(rolObjetivo)));

                          if (!puedeAdministrar) {
                            return (
                              <span className="text-secondary small">
                                Sin permisos
                              </span>
                            );
                          }

                          return (
                            <div className="d-inline-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary rounded-3"
                                onClick={() => abrirEdicion(usuario)}
                              >
                                Editar
                              </button>

                              <div className="dropdown">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary rounded-3"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-label="Más opciones"
                                >
                                  ⋮
                                </button>

                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                  <li>
                                    <button
                                      type="button"
                                      className={`dropdown-item ${
                                        usuario.activo
                                          ? "text-danger"
                                          : "text-success"
                                      }`}
                                      onClick={() => abrirCambioEstado(usuario)}
                                      disabled={
                                        (esCuentaPropia && usuario.activo) ||
                                        typeof usuario.activo !== "boolean"
                                      }
                                    >
                                      {usuario.activo
                                        ? "Desactivar cuenta"
                                        : "Reactivar cuenta"}
                                    </button>
                                  </li>

                                  {puedeRestablecer && (
                                    <li>
                                      <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() =>
                                          abrirRestablecimiento(usuario)
                                        }
                                        disabled={!usuario.activo}
                                      >
                                        Restablecer clave
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}

                  {usuariosFiltrados.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-secondary py-5"
                      >
                        No se encontraron usuarios con esos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ModalNuevoUsuario
        abierto={modalNuevo}
        rolActual={obtenerRol(usuarioActual || {})}
        guardando={guardando}
        error={errorRegistro}
        onGuardar={registrarUsuario}
        onCerrar={() => {
          if (!guardando) {
            setModalNuevo(false);
            setErrorRegistro("");
          }
        }}
      />

      <CredencialTemporal
        resultado={credencialCreada}
        onCerrar={() => setCredencialCreada(null)}
      />

      {usuarioEditar && (
        <ModalEditarUsuario
          key={usuarioEditar.id}
          usuario={usuarioEditar}
          guardando={procesando}
          error={errorOperacion}
          onGuardar={guardarEdicion}
          onCerrar={() => {
            if (!procesando) {
              setUsuarioEditar(null);
              setErrorOperacion("");
            }
          }}
        />
      )}

      {usuarioEstado && (
        <ModalEstadoUsuario
          usuario={usuarioEstado}
          guardando={procesando}
          error={errorOperacion}
          onConfirmar={confirmarCambioEstado}
          onCerrar={() => {
            if (!procesando) {
              setUsuarioEstado(null);
              setErrorOperacion("");
            }
          }}
        />
      )}

      {usuarioRestablecer && (
        <ModalRestablecerPassword
          usuario={usuarioRestablecer}
          procesando={restableciendo}
          error={errorRestablecimiento}
          onConfirmar={confirmarRestablecimiento}
          onCerrar={() => {
            if (!restableciendo) {
              setUsuarioRestablecer(null);
              setErrorRestablecimiento("");
            }
          }}
        />
      )}
    </div>
  );
} 