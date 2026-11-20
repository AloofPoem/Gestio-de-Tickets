import { useCallback, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import NavbarPrincipal from "../components/NavbarPrincipal";

export default function MainLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const disparadorRef = useRef(null);

  const abrirMenu = useCallback(() => setMenuAbierto(true), []);

  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
    disparadorRef.current?.focus();
  }, []);

  return (
    <div className="tickio-app">
      <Sidebar abierto={menuAbierto} cerrar={cerrarMenu} />

      <div className="tickio-main">
        <NavbarPrincipal
          abrirMenu={abrirMenu}
          menuAbierto={menuAbierto}
          disparadorRef={disparadorRef}
        />

        <main className="tickio-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}