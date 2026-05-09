import { Link } from "react-router-dom";
import logo from "../../assets/logo-league-manager.png";

export default function LegalLayout({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="min-h-screen bg-fifa-radial text-white">
      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            to="/"
            className="inline-flex flex-col items-center"
          >
            <img
              src={logo}
              alt="FC Stats Pro League Manager"
              className="h-24 w-auto"
              style={{
                filter:
                  "drop-shadow(0 0 24px rgba(36,255,122,.25))",
              }}
            />
          </Link>

          <h1
            className="mt-8 text-4xl font-black uppercase tracking-wide"
            style={{
              fontFamily: "var(--font-title)",
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="mx-auto mt-4 max-w-2xl text-sm leading-7"
              style={{
                color: "var(--fifa-mute)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div
          className="rounded-[32px] border p-8 md:p-12"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,22,32,.92), rgba(4,8,14,.96))",
            borderColor: "rgba(36,255,122,.12)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,.02), 0 24px 60px rgba(0,0,0,.45)",
          }}
        >
          <div className="legal-content space-y-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.2em]"
          style={{
            color: "rgba(255,255,255,.38)",
          }}
        >
          <Link to="/legal/terms">Términos</Link>

          <Link to="/legal/privacy">
            Privacidad
          </Link>

          <Link to="/legal/disclaimer">
            Aviso legal
          </Link>
        </div>
      </div>
    </div>
  );
}