import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/logo-league-manager.png";

function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-fifa-radial flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(2,6,12,.35), rgba(2,6,12,.88)), url('/images/admin-manager-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 18%, rgba(36,255,122,0.16), transparent 28%), radial-gradient(circle at 80% 70%, rgba(54,230,255,0.10), transparent 30%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src={logo}
            alt="FC Stats Pro League Manager"
            className="mx-auto h-44 w-auto object-contain sm:h-56"
            style={{
              filter:
                "drop-shadow(0 0 26px rgba(36,255,122,0.34)) drop-shadow(0 0 42px rgba(54,230,255,0.12))",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-title)",
              fontSize: "0.72rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--fifa-neon)",
            }}
          >
            League Manager Platform
          </p>

          <p
            className="mx-auto mt-2 max-w-sm text-sm"
            style={{
              color: "var(--fifa-mute)",
              fontFamily: "var(--font-ui)",
            }}
          >
            Gestiona ligas, torneos, clubes y resultados desde un panel
            profesional inspirado en el fútbol competitivo.
          </p>
        </div>

        <div
          className="rounded-3xl p-6 shadow-glow backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
            border: "1px solid rgba(36,255,122,0.18)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.04), 0 24px 70px rgba(0,0,0,0.55)",
          }}
        >
          <div className="mb-5">
            <h1
              style={{
                fontFamily: "var(--font-title)",
                color: "var(--fifa-text)",
                fontSize: "1.75rem",
                lineHeight: 1,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Login
            </h1>

            <p
              className="mt-1 text-sm"
              style={{
                color: "var(--fifa-mute)",
                fontFamily: "var(--font-ui)",
              }}
            >
              Ingresa para administrar tu ecosistema competitivo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <p className="error-msg">{error}</p>}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@ejemplo.com"
                className="input-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="label !mb-0">
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs transition-colors hover:text-green-300"
                  style={{
                    color: "var(--fifa-mute)",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: showPassword ? "var(--fifa-neon)" : "var(--fifa-mute)" }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOpen /> : <EyeOff />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full"
            >
              {loading ? "Ingresando..." : "Ingresar al panel"}
            </button>
          </form>
        </div>

        <p
          className="mt-5 text-center text-sm"
          style={{
            color: "var(--fifa-mute)",
            fontFamily: "var(--font-ui)",
          }}
        >
          ¿Sin cuenta?{" "}
          <Link
            to="/register"
            className="font-semibold text-green-400 transition-colors hover:text-green-300"
          >
            Crear cuenta
          </Link>

          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.18em]"
            style={{
              color: "rgba(255,255,255,.35)",
              fontFamily: "var(--font-ui)",
            }}
          >
            <Link to="/legal/terms" className="transition-colors hover:text-green-400">
              Términos
            </Link>
            <span>·</span>
            <Link to="/legal/privacy" className="transition-colors hover:text-green-400">
              Privacidad
            </Link>
            <span>·</span>
            <Link to="/legal/disclaimer" className="transition-colors hover:text-green-400">
              Aviso legal
            </Link>
          </div>
        </p>
      </div>
    </div>
  );
}
