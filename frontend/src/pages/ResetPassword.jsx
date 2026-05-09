import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/index";
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

function ShieldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fifa-neon)" }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  function toggleShow(field) {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await authApi.resetPassword(token, form.password);
      setDone(true);
      toast.success("Contraseña restablecida correctamente.");
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      setError(err.response?.data?.message || "El enlace es inválido o ha expirado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10"
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
            "radial-gradient(circle at 50% 18%, rgba(36,255,122,0.14), transparent 28%), radial-gradient(circle at 80% 70%, rgba(54,230,255,0.08), transparent 30%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src={logo}
            alt="FC Stats Pro League Manager"
            className="mx-auto h-36 w-auto object-contain sm:h-44"
            style={{
              filter:
                "drop-shadow(0 0 26px rgba(36,255,122,0.30)) drop-shadow(0 0 42px rgba(54,230,255,0.10))",
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
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
        </div>

        <div
          className="rounded-3xl p-6 shadow-glow backdrop-blur-xl"
          style={{
            background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
            border: "1px solid rgba(36,255,122,0.18)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 70px rgba(0,0,0,0.55)",
          }}
        >
          {!done ? (
            <>
              <div className="mb-5">
                <h1
                  style={{
                    fontFamily: "var(--font-title)",
                    color: "var(--fifa-text)",
                    fontSize: "1.55rem",
                    lineHeight: 1,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Nueva contraseña
                </h1>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
                >
                  Elige una contraseña segura de al menos 6 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && <p className="error-msg">{error}</p>}

                <div>
                  <label htmlFor="password" className="label">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={show.password ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="input-field pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow("password")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: show.password ? "var(--fifa-neon)" : "var(--fifa-mute)" }}
                      tabIndex={-1}
                      aria-label={show.password ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {show.password ? <EyeOpen /> : <EyeOff />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm" className="label">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      name="confirm"
                      type={show.confirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={form.confirm}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="input-field pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow("confirm")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: show.confirm ? "var(--fifa-neon)" : "var(--fifa-mute)" }}
                      tabIndex={-1}
                      aria-label={show.confirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {show.confirm ? <EyeOpen /> : <EyeOff />}
                    </button>
                  </div>
                </div>

                {form.confirm && form.password !== form.confirm && (
                  <p
                    className="text-xs"
                    style={{ color: "#ff4d6d", fontFamily: "var(--font-ui)" }}
                  >
                    Las contraseñas no coinciden.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-2 w-full"
                >
                  {loading ? "Guardando..." : "Restablecer contraseña"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4">
                <ShieldIcon />
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-title)",
                  color: "var(--fifa-text)",
                  fontSize: "1.3rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Contraseña actualizada
              </h2>
              <p
                className="mt-3 text-sm"
                style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
              >
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          )}
        </div>

        {!done && (
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-green-300"
              style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
            >
              <ArrowLeftIcon />
              Volver al inicio de sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
