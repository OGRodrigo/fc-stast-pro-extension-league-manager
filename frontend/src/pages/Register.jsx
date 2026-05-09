import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/logo-league-manager.png";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    if (!acceptedLegal) {
  setError(
    "Debes aceptar los términos y política de privacidad."
  );

  setLoading(false);
  return;
}



    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la cuenta.");
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
      {/* Glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 18%, rgba(36,255,122,0.16), transparent 28%), radial-gradient(circle at 80% 70%, rgba(54,230,255,0.10), transparent 30%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Branding */}
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
            Crea tu cuenta y comienza a administrar ligas, torneos y clubes
            desde una plataforma inspirada en el fútbol competitivo.
          </p>
        </div>

        {/* Register Card */}
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
              Crear Cuenta
            </h1>

            <p
              className="mt-1 text-sm"
              style={{
                color: "var(--fifa-mute)",
                fontFamily: "var(--font-ui)",
              }}
            >
              Configura tu cuenta de administrador para comenzar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <p className="error-msg">{error}</p>}

            <div>
              <label htmlFor="name" className="label">
                Nombre
              </label>

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Tu nombre"
                className="input-field"
              />
            </div>

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
              <label htmlFor="password" className="label">
                Contraseña
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="input-field"
              />
            </div>

<div
  className="rounded-2xl border p-4"
  style={{
    borderColor: "rgba(36,255,122,.10)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01))",
  }}
>
  <label className="flex cursor-pointer items-start gap-3">
    <input
      type="checkbox"
      checked={acceptedLegal}
      onChange={(e) =>
        setAcceptedLegal(e.target.checked)
      }
      className="mt-1 h-4 w-4 rounded border-green-500 bg-transparent"
    />

    <span
      className="text-xs leading-6"
      style={{
        color: "var(--fifa-mute)",
      }}
    >
      Acepto los{" "}
      <Link
        to="/legal/terms"
        className="text-green-400 hover:text-green-300"
      >
        términos y condiciones
      </Link>{" "}
      y la{" "}
      <Link
        to="/legal/privacy"
        className="text-cyan-400 hover:text-cyan-300"
      >
        política de privacidad
      </Link>
      .
    </span>
  </label>
</div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">
  <p
    className="text-sm"
    style={{
      color: "var(--fifa-mute)",
      fontFamily: "var(--font-ui)",
    }}
  >
    ¿Ya tienes cuenta?{" "}
    
    <Link
      to="/login"
      className="font-semibold text-green-400 transition-colors hover:text-green-300"
    >
      Iniciar sesión
    </Link>
  </p>

  <div
    className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.18em]"
    style={{
      color: "rgba(255,255,255,.35)",
      fontFamily: "var(--font-ui)",
    }}
  >
    <Link
      to="/legal/terms"
      className="transition-colors hover:text-green-400"
    >
      Términos
    </Link>

    <span>·</span>

    <Link
      to="/legal/privacy"
      className="transition-colors hover:text-green-400"
    >
      Privacidad
    </Link>

    <span>·</span>

    <Link
      to="/legal/disclaimer"
      className="transition-colors hover:text-green-400"
    >
      Aviso legal
    </Link>
  </div>
</div>
      </div>
    </div>
  );
}