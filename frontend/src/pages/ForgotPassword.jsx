import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/index";
import logo from "../assets/logo-league-manager.png";

function CheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fifa-neon)" }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Ingresa tu dirección de email.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.data.devResetUrl) setDevUrl(res.data.devResetUrl);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error procesando la solicitud.");
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
          {!sent ? (
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
                  Recuperar acceso
                </h1>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
                >
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && <p className="error-msg">{error}</p>}

                <div>
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="admin@ejemplo.com"
                      className="input-field pl-10"
                    />
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--fifa-mute)" }}
                    >
                      <MailIcon />
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-2 w-full"
                >
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4">
                <CheckIcon />
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
                Revisa tu email
              </h2>
              <p
                className="mt-3 text-sm leading-relaxed max-w-xs"
                style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
              >
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña. El enlace expira en <strong style={{ color: "var(--fifa-text)" }}>1 hora</strong>.
              </p>
              <p
                className="mt-2 text-xs"
                style={{ color: "rgba(255,255,255,.28)", fontFamily: "var(--font-ui)" }}
              >
                No olvides revisar tu carpeta de spam.
              </p>

              {devUrl && (
                <div
                  className="mt-5 w-full rounded-xl p-3 text-left"
                  style={{
                    background: "rgba(36,255,122,0.06)",
                    border: "1px solid rgba(36,255,122,0.20)",
                  }}
                >
                
                </div>
              )}
            </div>
          )}
        </div>

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
      </div>
    </div>
  );
}
