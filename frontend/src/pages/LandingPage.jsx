import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo-league-manager.png";

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    ),
    title: "Torneos & Ligas",
    desc: "Crea torneos con formato libre, grupos o knockout. Administra múltiples competiciones simultáneas desde un solo panel.",
    tag: "MULTI-FORMATO",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Standings en Tiempo Real",
    desc: "Tabla de posiciones que se actualiza automáticamente. Puntos, goles, diferencia y racha — al detalle profesional.",
    tag: "TIEMPO REAL",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
    title: "Bracket Visual",
    desc: "Genera brackets de eliminatoria automáticamente. Visualización clara de cruces, resultados y progresión ronda a ronda.",
    tag: "KNOCKOUT",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    title: "OCR + Inteligencia Artificial",
    desc: "Importa resultados directo desde capturas de pantalla. Azure Computer Vision + OpenAI leen el marcador por vos.",
    tag: "IA INTEGRADA",
    highlight: true,
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: "Stats de Jugadores",
    desc: "Métricas individuales, rankings, MVP, goleadores, asistencias y rendimiento competitivo por torneo.",
    tag: "PRÓXIMAMENTE",
    comingSoon: true,
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
    ),
    title: "Página Pública Compartible",
    desc: "Comparte tu torneo con un link único. Vista pública con standings, bracket y resultados — sin login.",
    tag: "PÚBLICO",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Creá tu cuenta",
    desc: "Registro en 30 segundos. Configurá tu primer torneo y empezá a invitar clubes de inmediato.",
  },
  {
    num: "02",
    title: "Añadí equipos",
    desc: "Creá clubes con logo, nombre y jugadores. Organizalos en grupos o formato eliminatorio.",
  },
  {
    num: "03",
    title: "Registrá resultados",
    desc: "Cargá marcadores manualmente o usá la IA para leer capturas de pantalla directamente.",
  },
];

const FAQS = [
  {
    q: "¿Es gratuito usar FC Stats Pro?",
    a: "Sí, durante la fase actual podés registrarte y gestionar torneos sin costo. Más adelante habrá planes premium para features avanzadas.",
  },
  {
    q: "¿Puedo crear más de un torneo?",
    a: "Sí, podés crear y gestionar múltiples torneos simultáneamente. Cada torneo es independiente y tiene sus propias fases, equipos y estadísticas.",
  },
  {
    q: "¿Qué es el OCR con IA?",
    a: "Es una función que lee el marcador desde una captura de pantalla del partido (por ejemplo, de FIFA o EA FC). Usa Azure Computer Vision y OpenAI para extraer los datos automáticamente.",
  },
  {
    q: "¿Puedo compartir el torneo con los participantes?",
    a: "Sí. Cada torneo tiene una URL pública única que podés compartir. Los participantes ven standings, bracket y resultados sin necesidad de login.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "La plataforma usa JWT con expiración, Helmet para headers HTTP, rate limiting y validación estricta en todos los endpoints. Cada admin solo accede a sus propios datos.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: open
          ? "linear-gradient(180deg, rgba(36,255,122,0.06), rgba(13,34,43,.7))"
          : "linear-gradient(180deg, rgba(13,34,43,.6), rgba(6,16,22,.6))",
        border: `1px solid ${open ? "rgba(36,255,122,0.25)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 600,
            fontSize: "0.95rem",
            color: open ? "var(--fifa-neon)" : "var(--fifa-text)",
            transition: "color .2s",
          }}
        >
          {q}
        </span>
        <span
          style={{
            color: "var(--fifa-neon)",
            fontSize: "1.2rem",
            lineHeight: 1,
            flexShrink: 0,
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform .25s",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          className="px-6 pb-5"
          style={{
            color: "var(--fifa-mute)",
            fontFamily: "var(--font-ui)",
            fontSize: "0.9rem",
            lineHeight: 1.7,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#020811", color: "var(--fifa-text)" }}
    >
      <style>{`
        @keyframes logoGlow {
          0%, 100% {
            filter: drop-shadow(0 0 24px rgba(36,255,122,0.5)) drop-shadow(0 0 60px rgba(36,255,122,0.18));
          }
          50% {
            filter: drop-shadow(0 0 48px rgba(36,255,122,0.85)) drop-shadow(0 0 100px rgba(36,255,122,0.35));
          }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes brandPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.82; }
        }
        .hero-logo { animation: logoGlow 3.5s ease-in-out infinite; }
        .hero-brand { animation: brandPulse 4s ease-in-out infinite; }
        .fade-up-1 { animation: fadeUp 0.7s ease both; animation-delay: 0.1s; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.7s ease both; animation-delay: 0.25s; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.7s ease both; animation-delay: 0.4s; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.7s ease both; animation-delay: 0.55s; opacity: 0; }
        .fade-up-5 { animation: fadeUp 0.7s ease both; animation-delay: 0.7s; opacity: 0; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: "rgba(2,8,17,0.88)",
          borderBottom: "1px solid rgba(36,255,122,0.1)",
          boxShadow: "0 1px 0 rgba(36,255,122,0.06), 0 4px 30px rgba(0,0,0,0.4)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="FC Stats Pro"
              className="h-10 w-auto sm:h-12"
              style={{ filter: "drop-shadow(0 0 8px rgba(36,255,122,0.35))" }}
            />
            <span
              style={{
                fontFamily: "var(--font-title)",
                fontSize: "1.05rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--fifa-text)",
              }}
            >
              FC Stats Pro
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "Features", href: "#features" },
              { label: "Cómo funciona", href: "#how" },
              { label: "FAQ", href: "#faq" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold transition-colors"
                style={{
                  color: "var(--fifa-mute)",
                  fontFamily: "var(--font-ui)",
                  letterSpacing: "0.04em",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fifa-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fifa-mute)")}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-5 py-2 text-sm font-semibold transition"
              style={{
                color: "var(--fifa-text)",
                fontFamily: "var(--font-ui)",
                letterSpacing: "0.04em",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(36,255,122,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            >
              Ingresar
            </Link>
            <Link
              to="/register"
              className="rounded-xl px-5 py-2 text-sm font-bold transition"
              style={{
                background: "linear-gradient(135deg, #24ff7a 0%, #1de070 100%)",
                color: "#021a0a",
                fontFamily: "var(--font-ui)",
                letterSpacing: "0.05em",
                boxShadow: "0 0 18px rgba(36,255,122,0.32)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 28px rgba(36,255,122,0.52)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 18px rgba(36,255,122,0.32)")}
            >
              Empezar gratis
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-xl"
            style={{ color: "var(--fifa-text)", background: "rgba(255,255,255,0.06)" }}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden border-t px-5 py-4 space-y-3"
            style={{
              borderColor: "rgba(36,255,122,0.1)",
              background: "rgba(2,8,17,0.96)",
            }}
          >
            {[
              { label: "Features", href: "#features" },
              { label: "Cómo funciona", href: "#how" },
              { label: "FAQ", href: "#faq" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-sm font-semibold"
                style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 text-center rounded-xl py-2 text-sm font-semibold" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "var(--fifa-text)", fontFamily: "var(--font-ui)" }}>
                Ingresar
              </Link>
              <Link to="/register" className="flex-1 text-center rounded-xl py-2 text-sm font-bold" style={{ background: "linear-gradient(135deg,#24ff7a,#1de070)", color: "#021a0a", fontFamily: "var(--font-ui)" }}>
                Empezar gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,17,.5) 0%, rgba(2,8,17,.78) 55%, rgba(2,8,17,1) 100%), url('/images/stadium-tunnel-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Radial glow orbs */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 20%, rgba(36,255,122,0.16) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(54,230,255,0.08) 0%, transparent 40%)",
          }}
        />

        {/* Scan-line texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-24 sm:px-8 text-center">

          {/* ── BRAND LOGO STAMP ── */}
          <div className="fade-up-1 flex flex-col items-center mb-8">
            {/* Glow ring behind logo */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div
                className="absolute rounded-full"
                style={{
                  width: "180px",
                  height: "180px",
                  background: "radial-gradient(circle, rgba(36,255,122,0.18) 0%, transparent 70%)",
                  filter: "blur(18px)",
                }}
              />
              <img
                src={logo}
                alt="FC Stats Pro"
                className="hero-logo relative"
                style={{
                  height: "clamp(110px, 18vw, 160px)",
                  width: "auto",
                }}
              />
            </div>

            {/* Brand name lockup */}
            <div className="hero-brand flex flex-col items-center gap-1">
              <h2
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "clamp(1.9rem, 5.5vw, 3.4rem)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  background: "linear-gradient(90deg, #ffffff 20%, #24ff7a 60%, #36e6ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1,
                }}
              >
                FC Stats Pro
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "rgba(36,255,122,0.7)",
                  fontWeight: 600,
                }}
              >
                Liga Manager Platform
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="fade-up-2 flex items-center justify-center gap-4 mb-8">
            <div style={{ height: "1px", width: "60px", background: "linear-gradient(90deg, transparent, rgba(36,255,122,0.4))" }} />
            <span
              className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{
                background: "rgba(36,255,122,0.08)",
                border: "1px solid rgba(36,255,122,0.25)",
                color: "var(--fifa-neon)",
                fontFamily: "var(--font-ui)",
                letterSpacing: "0.2em",
              }}
            >
              ⚽ Gestión competitiva
            </span>
            <div style={{ height: "1px", width: "60px", background: "linear-gradient(90deg, rgba(36,255,122,0.4), transparent)" }} />
          </div>

          {/* Headline */}
          <h1
            className="fade-up-3 mb-5 leading-[1.05] tracking-tight"
            style={{
              fontFamily: "var(--font-title)",
              fontSize: "clamp(2.2rem, 6vw, 4.4rem)",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            <span style={{ color: "var(--fifa-text)" }}>Gestiona tu liga</span>
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #24ff7a 10%, #36e6ff 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 28px rgba(36,255,122,0.45))",
              }}
            >
              al nivel pro.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="fade-up-3 mx-auto mb-10 max-w-2xl"
            style={{
              color: "var(--fifa-mute)",
              fontFamily: "var(--font-ui)",
              fontSize: "clamp(0.95rem, 2.2vw, 1.12rem)",
              lineHeight: 1.7,
            }}
          >
            Torneos, standings en tiempo real, bracket visual, estadísticas completas e IA para importar resultados — todo desde un panel profesional.
          </p>

          {/* CTAs */}
          <div className="fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto rounded-2xl px-9 py-4 text-base font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, #24ff7a 0%, #1de070 100%)",
                color: "#021a0a",
                fontFamily: "var(--font-ui)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                boxShadow: "0 0 30px rgba(36,255,122,0.4), 0 8px 40px rgba(0,0,0,0.4)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 55px rgba(36,255,122,0.65), 0 8px 40px rgba(0,0,0,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(36,255,122,0.4), 0 8px 40px rgba(0,0,0,0.4)")}
            >
              Empezar gratis →
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto rounded-2xl px-9 py-4 text-base font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "var(--fifa-text)",
                fontFamily: "var(--font-ui)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(36,255,122,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            >
              Ver features
            </a>
          </div>

          {/* Platform pills */}
          <div
            className="fade-up-5 mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
            style={{ color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-ui)", fontSize: "0.77rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            {["Multi-admin", "OCR + IA", "Bracket automático", "Página pública", "100% gratis"].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span style={{ color: "var(--fifa-neon)", fontSize: "0.55rem" }}>◆</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #020811)" }}
        />
      </section>

      {/* ── BRAND CREDIBILITY STRIP ─────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(36,255,122,0.08)",
          borderBottom: "1px solid rgba(36,255,122,0.08)",
          background: "rgba(13,34,43,0.35)",
        }}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "3", label: "Formatos de torneo" },
              { value: "IA", label: "OCR integrado" },
              { value: "∞", label: "Equipos y torneos" },
              { value: "0€", label: "Sin costo de entrada" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  style={{
                    fontFamily: "var(--font-title)",
                    fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                    letterSpacing: "0.06em",
                    background: "linear-gradient(90deg, #24ff7a, #36e6ff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.73rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="relative py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span
              className="inline-block mb-3 text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--fifa-neon)", fontFamily: "var(--font-ui)" }}
            >
              Features
            </span>
            <h2
              className="leading-tight"
              style={{
                fontFamily: "var(--font-title)",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--fifa-text)",
              }}
            >
              Todo lo que necesitás
              <br />
              <span style={{ color: "var(--fifa-neon)" }}>para competir al máximo.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group relative rounded-3xl p-6 flex flex-col gap-4 transition-all overflow-hidden"
                style={{
                  background: f.highlight
                    ? "linear-gradient(135deg, rgba(36,255,122,0.09), rgba(13,34,43,.8))"
                    : "linear-gradient(180deg, rgba(13,34,43,.75), rgba(6,16,22,.75))",
                  border: f.highlight
                    ? "1px solid rgba(36,255,122,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: f.highlight
                    ? "0 0 30px rgba(36,255,122,0.1), inset 0 1px 0 rgba(36,255,122,0.08)"
                    : "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = f.highlight ? "rgba(36,255,122,0.5)" : "rgba(36,255,122,0.2)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(36,255,122,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = f.highlight ? "rgba(36,255,122,0.3)" : "rgba(255,255,255,0.07)";
                  e.currentTarget.style.boxShadow = f.highlight
                    ? "0 0 30px rgba(36,255,122,0.1), inset 0 1px 0 rgba(36,255,122,0.08)"
                    : "inset 0 1px 0 rgba(255,255,255,0.04)";
                }}
              >
                {f.highlight && (
                  <div
                    className="absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      background: "rgba(36,255,122,0.18)",
                      color: "var(--fifa-neon)",
                      border: "1px solid rgba(36,255,122,0.25)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    FLAGSHIP
                  </div>
                )}
                {f.comingSoon && (
                  <div
                    className="absolute top-4 right-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      background: "rgba(250,204,21,.12)",
                      color: "#facc15",
                      border: "1px solid rgba(250,204,21,.22)",
                      fontFamily: "var(--font-ui)",
                      boxShadow: "0 0 12px rgba(250,204,21,.08)",
                    }}
                  >
                    PRÓXIMAMENTE
                  </div>
                )}

                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: f.highlight ? "rgba(36,255,122,0.15)" : "rgba(255,255,255,0.06)",
                    border: f.highlight ? "1px solid rgba(36,255,122,0.25)" : "1px solid rgba(255,255,255,0.08)",
                    color: f.highlight ? "var(--fifa-neon)" : "var(--fifa-text)",
                  }}
                >
                  {f.icon}
                </div>

                <div>
                  <h3
                    className="mb-1.5"
                    style={{
                      fontFamily: "var(--font-title)",
                      fontSize: "1.05rem",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--fifa-text)",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--fifa-mute)",
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.87rem",
                      lineHeight: 1.65,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>

                <div className="mt-auto">
                  <span
                    className="inline-block text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{
                      color: f.highlight ? "var(--fifa-neon)" : "rgba(255,255,255,0.3)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    {f.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section
        id="how"
        className="relative py-24 px-5 sm:px-8"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(36,255,122,0.03) 50%, transparent)",
        }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <span
              className="inline-block mb-3 text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--fifa-neon)", fontFamily: "var(--font-ui)" }}
            >
              Cómo funciona
            </span>
            <h2
              style={{
                fontFamily: "var(--font-title)",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--fifa-text)",
              }}
            >
              En tres pasos, listo.
            </h2>
          </div>

          <div className="relative">
            <div
              className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(36,255,122,0.25), transparent)" }}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(36,255,122,0.12), rgba(13,34,43,.9))",
                      border: "1px solid rgba(36,255,122,0.3)",
                      boxShadow: "0 0 30px rgba(36,255,122,0.12)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-title)",
                        fontSize: "1.5rem",
                        letterSpacing: "0.06em",
                        color: "var(--fifa-neon)",
                      }}
                    >
                      {s.num}
                    </span>
                  </div>
                  <div>
                    <h3
                      className="mb-2"
                      style={{
                        fontFamily: "var(--font-title)",
                        fontSize: "1.1rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--fifa-text)",
                      }}
                    >
                      {s.title}
                    </h3>
                    <p
                      style={{
                        color: "var(--fifa-mute)",
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.9rem",
                        lineHeight: 1.65,
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="py-16 px-5 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div
            className="rounded-3xl px-8 py-16 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(36,255,122,0.1) 0%, rgba(13,34,43,.9) 50%, rgba(54,230,255,0.07) 100%)",
              border: "1px solid rgba(36,255,122,0.2)",
              boxShadow: "0 0 60px rgba(36,255,122,0.08), inset 0 1px 0 rgba(36,255,122,0.12)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(36,255,122,0.12), transparent 60%)" }}
            />
            <div className="relative z-10">
              {/* Mini logo in CTA for brand reinforcement */}
              <img
                src={logo}
                alt="FC Stats Pro"
                className="mx-auto mb-5"
                style={{
                  height: "52px",
                  width: "auto",
                  filter: "drop-shadow(0 0 12px rgba(36,255,122,0.4))",
                  opacity: 0.9,
                }}
              />
              <h2
                className="mb-3"
                style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--fifa-text)",
                }}
              >
                Tu competición,{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #24ff7a, #36e6ff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  profesionalizada.
                </span>
              </h2>
              <p
                className="mx-auto mb-8 max-w-lg"
                style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)", fontSize: "0.95rem", lineHeight: 1.7 }}
              >
                Unite a los torneos que ya usan FC Stats Pro para gestionar sus ligas con calidad de producto comercial.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto rounded-2xl px-8 py-3.5 text-sm font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: "linear-gradient(135deg, #24ff7a, #1de070)",
                    color: "#021a0a",
                    fontFamily: "var(--font-ui)",
                    boxShadow: "0 0 24px rgba(36,255,122,0.35)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 40px rgba(36,255,122,0.55)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 24px rgba(36,255,122,0.35)")}
                >
                  Crear cuenta gratis
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto rounded-2xl px-8 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all"
                  style={{
                    color: "var(--fifa-text)",
                    fontFamily: "var(--font-ui)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(36,255,122,0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                >
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <span
              className="inline-block mb-3 text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--fifa-neon)", fontFamily: "var(--font-ui)" }}
            >
              FAQ
            </span>
            <h2
              style={{
                fontFamily: "var(--font-title)",
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--fifa-text)",
              }}
            >
              Preguntas frecuentes
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer
        className="border-t py-10 px-5 sm:px-8"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="FC Stats Pro"
              className="h-12 w-auto"
              style={{ filter: "drop-shadow(0 0 8px rgba(36,255,122,0.25))", opacity: 0.85 }}
            />
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-title)", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                FC Stats Pro
              </p>
              <p
                className="text-[10px]"
                style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-ui)", letterSpacing: "0.06em" }}
              >
                © {new Date().getFullYear()} · Liga Manager Platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[
              { label: "Términos", to: "/legal/terms" },
              { label: "Privacidad", to: "/legal/privacy" },
              { label: "Aviso legal", to: "/legal/disclaimer" },
              { label: "Ingresar", to: "/login" },
              { label: "Registrarse", to: "/register" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-ui)", letterSpacing: "0.08em", textTransform: "uppercase" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fifa-neon)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
