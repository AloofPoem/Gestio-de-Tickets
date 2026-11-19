import { useTheme } from "../hooks/useThem";

export default function ThemeToggle({ className = "" }) {
  const { esOscuro, toggleTheme } = useTheme();

  const etiqueta = esOscuro
    ? "Cambiar a modo claro"
    : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      className={`btn btn-outline-secondary ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={etiqueta}
      title={etiqueta}
    >
      <span aria-hidden="true">{esOscuro ? "☀️" : "🌙"}</span>
    </button>
  );
}