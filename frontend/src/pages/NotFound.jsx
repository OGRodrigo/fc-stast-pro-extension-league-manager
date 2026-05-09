import { Link } from "react-router-dom";
import logo from "../assets/logo-league-manager.png";

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12"
      style={{
        backgroundColor: "#060b12",
        backgroundImage:
          "radial-gradient(circle at top left, rgba(36,255,122,.12), transparent 32%), radial-gradient(circle at bottom right, rgba(54,230,255,.08), transparent 35%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,12,.25), rgba(2,6,12,.82))",
        }}
      />

      <div
        className="relative z-10 w-full max-w-2xl rounded-[34px] border p-8 text-center md:p-12"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,22,32,.92), rgba(4,8,14,.96))",
          borderColor: "rgba(36,255,122,.12)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,.02), 0 28px 70px rgba(0,0,0,.55)",
        }}
      >
        <img
          src={logo}
          alt="FC Stats Pro League Manager"
          className="mx-auto h-24 w-auto"
          style={{
            filter: "drop-shadow(0 0 24px rgba(36,255,122,.25))",
          }}
        />

        <p
          className="mt-8 text-sm font-bold uppercase tracking-[0.35em]"
          style={{
            color: "var(--fifa-neon)",
            fontFamily: "var(--font-title)",
          }}
        >
          Error 404
        </p>

        <h1
          className="mt-3 text-4xl font-black uppercase tracking-wide md:text-5xl"
          style={{
            color: "var(--fifa-text)",
            fontFamily: "var(--font-title)",
          }}
        >
          Página no encontrada
        </h1>

        <p
          className="mx-auto mt-4 max-w-lg text-sm leading-7"
          style={{
            color: "var(--fifa-mute)",
          }}
        >
          La ruta que intentas abrir no existe o ya no está disponible. Vuelve
          al panel principal para continuar gestionando tus competiciones.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/dashboard" className="btn-primary">
            Volver al dashboard
          </Link>

          <Link to="/tournaments" className="btn-secondary">
            Ver torneos
          </Link>
        </div>
      </div>
    </div>
  );
}