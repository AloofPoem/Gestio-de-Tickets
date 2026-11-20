import { useCallback, useEffect, useState } from "react";

const CLAVE_TEMA = "tickio_theme";
const CONSULTA_OSCURO = "(prefers-color-scheme: dark)";

// Preferencia guardada por el usuario ("light" | "dark" | null)
function leerTemaGuardado() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return guardado === "light" || guardado === "dark" ? guardado : null;
  } catch {
    return null;
  }
}

// Preferencia del sistema operativo
function leerTemaSistema() {
  return window.matchMedia(CONSULTA_OSCURO).matches ? "dark" : "light";
}

export function useTheme() {
  // null = el usuario aún no eligió, se sigue al sistema
  const [preferencia, setPreferencia] = useState(leerTemaGuardado);
  const [temaSistema, setTemaSistema] = useState(leerTemaSistema);

  const tema = preferencia ?? temaSistema;

  // Reacciona si el usuario cambia el tema del SO con la app abierta
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_OSCURO);
    const alCambiar = (evento) =>
      setTemaSistema(evento.matches ? "dark" : "light");

    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  // Aplica el atributo nativo de Bootstrap sobre <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", tema);
  }, [tema]);

  const toggleTheme = useCallback(() => {
    const nuevoTema = tema === "dark" ? "light" : "dark";

    setPreferencia(nuevoTema);

    try {
      localStorage.setItem(CLAVE_TEMA, nuevoTema);
    } catch {
      // Sin localStorage el tema sigue funcionando en memoria
    }
  }, [tema]);

  return { tema, esOscuro: tema === "dark", toggleTheme };
}