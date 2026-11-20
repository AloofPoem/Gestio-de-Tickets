import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { menuPorRol } from "../config/menu";

export default function Sidebar({ abierto, cerrar }) {
  const { usuario } = useAuth();
  const opciones = menuPorRol(usuario?.rol);
  const botonCerrarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;

    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") cerrar();
    };

    const overflowPrevio = document.body.style.overflow;

    document.addEventListener("keydown", alPresionarTecla);
    document.body.style.overflow = "hidden";
    botonCerrarRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, cerrar]);

  return (
    <>
      <div
        className={`tickio-overlay ${abierto ? "visible" : ""}`}
        onClick={cerrar}
        aria-hidden="true"
      />

      <aside
        id="tickio-menu-lateral"
        className={`tickio-sidebar ${abierto ? "abierto" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        inert={!abierto}
      >
        <div className="tickio-sidebar-brand">
          <span className="tickio-brand-icon">N</span>
          <div>
            <strong>NEXDESK</strong>
            <small>Sistema de soporte</small>
          </div>

          <button
            ref={botonCerrarRef}
            type="button"
            className="btn-close ms-auto"
            data-bs-theme="dark"
            onClick={cerrar}
            aria-label="Cerrar menú"
          />
        </div>

        <div className="tickio-sidebar-label">MENÚ PRINCIPAL</div>

        <nav className="tickio-sidebar-nav" aria-label="Navegación principal">
          {opciones.map((opcion) => (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              onClick={cerrar}
              className={({ isActive }) =>
                `tickio-nav-link ${isActive ? "activo" : ""}`
              }
            >
              <span className="tickio-nav-icon">{opcion.icono}</span>
              <span>{opcion.titulo}</span>
            </NavLink>
          ))}
        </nav>

        <div className="tickio-sidebar-footer">
          <span className="tickio-online-dot" />
          Sistema de soporte
          <small>Helpdesk Organizacional para empresas</small>
        </div>
      </aside>
    </>
  );
}