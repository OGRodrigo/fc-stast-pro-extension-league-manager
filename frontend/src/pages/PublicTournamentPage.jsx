// frontend/src/pages/PublicTournamentPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { publicApi } from "../api";
import ClubAvatar from "../components/ui/ClubAvatar";

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMAT_LABELS = { league: "Liga", cup: "Copa", mixed: "Liga + Playoffs" };
const TYPE_LABELS   = { league: "Liga", tournament: "Torneo" };
const STATUS_LABELS = { active: "Activo", draft: "Borrador", finished: "Finalizado" };
const STATUS_COLORS = {
  active:   "rgba(36,255,122,.9)",
  draft:    "#facc15",
  finished: "rgba(255,255,255,.55)",
};
const POS_COLORS = ["text-yellow-400", "text-gray-300", "text-orange-400"];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicTournamentPage() {
  const { slug } = useParams();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("Resumen");

  useEffect(() => {
    publicApi
      .getTournamentBySlug(slug)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => {
        if (err.response?.status === 404)
          setError("Este torneo no está disponible públicamente.");
        else
          setError("Error cargando el torneo. Intenta nuevamente.");
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message={error} />;

  const { tournament, clubs, table, recentMatches, allMatches, summary } = data;

  const TABS = tournament.format === "cup"
    ? ["Resumen", "Partidos", "Equipos", "Estadísticas"]
    : ["Resumen", "Tabla de posiciones", "Partidos", "Equipos", "Estadísticas"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--fifa-bg)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          position:           "relative",
          backgroundImage:    "url(/images/stadium.png)",
          backgroundSize:     "cover",
          backgroundPosition: "center 55%",
          backgroundRepeat:   "no-repeat",
        }}
      >
        {/* Horizontal overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(4,8,14,.95) 0%, rgba(4,8,14,.72) 52%, rgba(4,8,14,.28) 100%)",
        }} />
        {/* Bottom-to-top fade into bg */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, var(--fifa-bg) 0%, rgba(4,8,14,.62) 28%, transparent 68%)",
        }} />

        <div
          className="max-w-6xl mx-auto w-full px-4 sm:px-6"
          style={{ position: "relative", zIndex: 1, paddingTop: "4rem", paddingBottom: "4.5rem" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-8">

            {/* Left: logo + info */}
            <div className="flex items-start gap-5 min-w-0 flex-1">
              {/* Tournament badge */}
              <div style={{
                flexShrink: 0, width: "80px", height: "80px",
                borderRadius: "18px",
                border: "2px solid rgba(36,255,122,.28)",
                backgroundColor: "rgba(36,255,122,.07)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 0 0 1px rgba(36,255,122,.06), 0 8px 36px rgba(0,0,0,.65)",
              }}>
                {tournament.logo ? (
                  <img
                    src={tournament.logo}
                    alt={tournament.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{
                    fontFamily: "var(--font-title)", fontSize: "2rem",
                    fontWeight: 900, textTransform: "uppercase", color: "var(--fifa-neon)",
                  }}>
                    {tournament.name.slice(0, 2)}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <Badge color="var(--fifa-neon)">{TYPE_LABELS[tournament.type] ?? tournament.type}</Badge>
                  <Badge color={STATUS_COLORS[tournament.status] ?? "rgba(255,255,255,.5)"}>
                    {STATUS_LABELS[tournament.status] ?? tournament.status}
                  </Badge>
                  <Badge color="rgba(54,230,255,.8)">{FORMAT_LABELS[tournament.format] ?? tournament.format}</Badge>
                </div>

                {/* Title */}
                <h1 style={{
                  fontFamily: "var(--font-title)",
                  fontSize: "clamp(2rem, 5.5vw, 3.5rem)",
                  color: "#fff", lineHeight: 1, letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  textShadow: "0 2px 24px rgba(0,0,0,.9), 0 0 60px rgba(0,0,0,.6)",
                }}>
                  {tournament.name}
                </h1>

                {/* Meta */}
                <p className="mt-2.5 text-sm" style={{ color: "rgba(255,255,255,.68)" }}>
                  Temporada {tournament.season}
                  &nbsp;·&nbsp;{summary.totalClubs}/{tournament.maxClubs} equipos
                  &nbsp;·&nbsp;{FORMAT_LABELS[tournament.format] ?? tournament.format}
                </p>
                <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,.30)" }}>
                  Organizado por Admin
                </p>

                {tournament.hasPlayoffs && tournament.format !== "cup" && (
                  <div
                    className="inline-flex items-center gap-1.5 mt-3 text-xs px-2.5 py-1 rounded-lg border"
                    style={{
                      color: "var(--fifa-neon)",
                      borderColor: "rgba(36,255,122,.22)",
                      backgroundColor: "rgba(36,255,122,.07)",
                    }}
                  >
                    <TrophyIcon />
                    Top {tournament.playoffTeams} clasifican a playoffs
                  </div>
                )}
              </div>
            </div>

            {/* Right: jornada card */}
            <JornadaCard summary={summary} allMatches={allMatches} />
          </div>
        </div>
      </section>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div
        className="sticky"
        style={{
          top: "56px", zIndex: 40,
          backgroundColor: "rgba(4,8,14,.97)",
          borderBottom: "1px solid var(--fifa-line)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          className="max-w-6xl mx-auto px-4 sm:px-6 flex overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "Resumen"             && <ResumenTab tournament={tournament} table={table} recentMatches={recentMatches} />}
        {activeTab === "Tabla de posiciones" && <TablaTab table={table} playoffTeams={tournament.hasPlayoffs ? tournament.playoffTeams : 0} />}
        {activeTab === "Partidos"            && <PartidosTab matches={allMatches} />}
        {activeTab === "Equipos"             && <EquiposTab clubs={clubs} table={table} />}
        {activeTab === "Estadísticas"        && <EstadisticasTab table={table} allMatches={allMatches} />}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <PublicFooter />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrophyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Inicio",    href: "/" },
  { label: "Torneos",   href: "#" },
  { label: "Acerca de", href: "#" },
];

function NavLink({ href, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? "#fff" : "var(--fifa-mute)",
        transition: "color .18s",
        textDecoration: "none",
        fontSize: "13px", fontWeight: 500,
        letterSpacing: ".01em", padding: "4px 2px",
        position: "relative",
      }}
    >
      {children}
      {hovered && (
        <span style={{
          position: "absolute", bottom: "-2px", left: 0, right: 0,
          height: "1px", background: "var(--fifa-neon)",
          boxShadow: "0 0 6px var(--fifa-neon)", borderRadius: "1px",
        }} />
      )}
    </a>
  );
}

function FollowButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "12px", fontWeight: 600, padding: "6px 14px",
        borderRadius: "8px", border: "1px solid",
        borderColor:     hovered ? "var(--fifa-neon)" : "rgba(36,255,122,.35)",
        color:           hovered ? "#fff" : "var(--fifa-neon)",
        backgroundColor: hovered ? "rgba(36,255,122,.14)" : "rgba(36,255,122,.06)",
        boxShadow:       hovered ? "0 0 12px rgba(36,255,122,.25), 0 0 28px rgba(36,255,122,.10)" : "none",
        cursor: "pointer", transition: "all .18s",
        letterSpacing: ".01em", whiteSpace: "nowrap",
      }}
    >
      <StarIcon />
      Seguir torneo
    </button>
  );
}

function AdminButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to="/login"
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        fontSize: "12px", fontWeight: 500, padding: "6px 12px",
        borderRadius: "8px", border: "1px solid",
        borderColor:     hovered ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.10)",
        color:           hovered ? "#fff" : "var(--fifa-mute)",
        backgroundColor: hovered ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.03)",
        textDecoration: "none", transition: "all .18s", whiteSpace: "nowrap",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <LockIcon />
      Admin
    </Link>
  );
}

function PublicHeader() {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      backgroundColor: "rgba(4,8,14,.88)",
      borderBottom: "1px solid var(--fifa-line)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    }}>
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6"
        style={{ height: "56px", display: "flex", alignItems: "center" }}
      >
        {/* Branding */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--fifa-neon) 0%, rgba(36,255,122,.65) 100%)",
            boxShadow: "0 0 10px rgba(36,255,122,.35)", flexShrink: 0,
          }}>
            <span style={{
              color: "#000", fontWeight: 900, fontSize: "11px",
              lineHeight: 1, fontFamily: "var(--font-title)", letterSpacing: ".5px",
            }}>FC</span>
          </div>
          <div style={{ lineHeight: 1 }}>
            <p style={{
              fontFamily: "var(--font-title)", fontSize: "15px", fontWeight: 700,
              letterSpacing: "2px", textTransform: "uppercase",
              color: "var(--fifa-neon)", lineHeight: 1,
              textShadow: "0 0 8px rgba(36,255,122,.35)",
            }}>FC STATS PRO</p>
            <p style={{
              fontSize: "9px", fontWeight: 500, letterSpacing: "1.5px",
              textTransform: "uppercase", color: "rgba(255,255,255,.35)",
              lineHeight: 1, marginTop: "2px",
            }}>League Manager</p>
          </div>
        </a>

        {/* Separator */}
        <div
          style={{ width: "1px", height: "20px", backgroundColor: "var(--fifa-line)", margin: "0 20px", flexShrink: 0 }}
          className="hidden sm:block"
        />

        {/* Nav */}
        <nav className="hidden md:flex items-center" style={{ gap: "20px", flex: 1 }}>
          {NAV_LINKS.map((l) => <NavLink key={l.label} href={l.href}>{l.label}</NavLink>)}
        </nav>

        {/* Actions */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <FollowButton />
          <AdminButton />
        </div>
      </div>
    </header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function PublicFooter() {
  return (
    <footer style={{
      marginTop: "5rem",
      borderTop: "1px solid var(--fifa-line)",
      backgroundColor: "rgba(4,8,14,.7)",
    }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          {/* Branding */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, var(--fifa-neon) 0%, rgba(36,255,122,.6) 100%)",
              boxShadow: "0 0 10px rgba(36,255,122,.22)",
            }}>
              <span style={{ color: "#000", fontWeight: 900, fontSize: "12px", fontFamily: "var(--font-title)" }}>FC</span>
            </div>
            <div style={{ lineHeight: 1 }}>
              <p style={{
                fontFamily: "var(--font-title)", fontSize: "14px", fontWeight: 700,
                letterSpacing: "2px", textTransform: "uppercase",
                color: "var(--fifa-neon)", lineHeight: 1,
                textShadow: "0 0 8px rgba(36,255,122,.22)",
              }}>FC STATS PRO</p>
              <p style={{
                fontSize: "9px", letterSpacing: "1.2px", textTransform: "uppercase",
                color: "rgba(255,255,255,.28)", lineHeight: 1, marginTop: "3px",
              }}>League Manager</p>
            </div>
          </a>

          {/* Description */}
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,.22)", textAlign: "center" }}>
            Página pública del torneo · FC Stats Pro League Manager
          </p>

          {/* Admin */}
          <Link
            to="/login"
            style={{ fontSize: "12px", color: "rgba(255,255,255,.22)", textDecoration: "none", transition: "color .18s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fifa-mute)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.22)")}
          >
            Panel de administración →
          </Link>
        </div>

        {/* Bottom row */}
        <div
          className="mt-8 pt-5 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}
        >
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,.14)" }}>
            © {new Date().getFullYear()} FC Stats Pro · Todos los derechos reservados
          </p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,.14)" }}>
            Vista pública
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Badge({ color, children }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
      style={{ color, borderColor: `${color}44`, backgroundColor: `${color}14` }}
    >
      {children}
    </span>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(36,255,122,.07) 0%, rgba(36,255,122,.02) 100%)",
      border: "1px solid rgba(36,255,122,.13)",
      borderRadius: "16px", padding: "20px",
      boxShadow: "0 0 0 1px rgba(36,255,122,.04), 0 8px 24px rgba(0,0,0,.3)",
    }}>
      <p style={{
        fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "1.2px", color: "var(--fifa-mute)", marginBottom: "8px",
      }}>{label}</p>
      <p style={{
        fontFamily: "var(--font-title)", fontSize: "2.5rem", fontWeight: 900,
        color: "var(--fifa-neon)", lineHeight: 1, letterSpacing: ".5px",
      }}>{value}</p>
    </div>
  );
}

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(13,34,43,.92), rgba(6,16,22,.92))",
      border: "1px solid var(--fifa-line)",
      borderRadius: "16px", overflow: "hidden",
      boxShadow: "0 0 0 1px rgba(36,255,122,.05), 0 12px 30px rgba(0,0,0,.4)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, right }) {
  return (
    <div style={{
      padding: "14px 20px",
      borderBottom: "1px solid var(--fifa-line)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      backgroundColor: "rgba(0,0,0,.18)",
    }}>
      <p style={{
        fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "1.2px", color: "var(--fifa-mute)",
      }}>{title}</p>
      {right}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
      <span style={{
        display: "block", width: "3px", height: "14px", borderRadius: "2px",
        background: "var(--fifa-neon)", boxShadow: "0 0 6px var(--fifa-neon)",
        flexShrink: 0,
      }} />
      <p style={{
        fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "1.3px", color: "var(--fifa-mute)",
      }}>{children}</p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.02)",
      border: "1px solid var(--fifa-line)",
      borderRadius: "16px", padding: "44px 20px", textAlign: "center",
    }}>
      <p style={{ fontSize: "13px", color: "var(--fifa-mute)" }}>{message}</p>
    </div>
  );
}

// ─── Match row ────────────────────────────────────────────────────────────────

function MatchRow({ match }) {
  const isPlayed  = match.status === "played";
  const date      = new Date(match.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  const homeLabel = match.homeClub?.abbr || match.homeClub?.name || "—";
  const awayLabel = match.awayClub?.abbr || match.awayClub?.name || "—";
  const homeFull  = match.homeClub?.name || "—";
  const awayFull  = match.awayClub?.name || "—";

  return (
    <div
      className="flex items-center gap-3 border-b last:border-0"
      style={{
        padding: "12px 20px",
        borderColor: "rgba(255,255,255,.04)",
        borderLeft: isPlayed ? "2px solid rgba(36,255,122,.22)" : "2px solid transparent",
        backgroundColor: "transparent",
        transition: "background-color .15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <span style={{
        fontSize: "10px", color: "var(--fifa-mute)",
        minWidth: "36px", fontVariantNumeric: "tabular-nums", flexShrink: 0,
      }}>{date}</span>

      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        {/* Home */}
        <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
          <span className="text-sm font-semibold text-gray-200 truncate hidden sm:block" title={homeFull}>{homeFull}</span>
          <span className="text-sm font-bold text-white sm:hidden">{homeLabel}</span>
        </div>

        {/* Score */}
        <span style={{
          fontFamily: "var(--font-title)", fontSize: "1rem", fontWeight: 900,
          fontVariantNumeric: "tabular-nums", flexShrink: 0,
          padding: "3px 12px", borderRadius: "6px",
          minWidth: "60px", textAlign: "center",
          color:           isPlayed ? "var(--fifa-neon)" : "rgba(255,255,255,.28)",
          backgroundColor: isPlayed ? "rgba(36,255,122,.08)" : "rgba(255,255,255,.04)",
          border:          isPlayed ? "1px solid rgba(36,255,122,.15)" : "1px solid rgba(255,255,255,.06)",
        }}>
          {isPlayed ? `${match.scoreHome} – ${match.scoreAway}` : "vs"}
        </span>

        {/* Away */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-200 truncate hidden sm:block" title={awayFull}>{awayFull}</span>
          <span className="text-sm font-bold text-white sm:hidden">{awayLabel}</span>
        </div>
      </div>

      {!isPlayed && (
        <span style={{
          fontSize: "9px", textTransform: "uppercase", letterSpacing: ".8px",
          color: "rgba(255,255,255,.2)", flexShrink: 0,
        }}>Prog.</span>
      )}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "15px 16px",
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        letterSpacing: ".01em",
        color:  active ? "#fff" : hovered ? "var(--fifa-neon)" : "rgba(255,255,255,.38)",
        background: "none",
        border: "none",
        borderBottom: `2px solid ${active ? "var(--fifa-neon)" : "transparent"}`,
        marginBottom: "-1px",
        boxShadow: active ? "0 2px 10px rgba(36,255,122,.18)" : "none",
        textShadow: active ? "0 0 10px rgba(36,255,122,.28)" : "none",
        cursor: "pointer",
        transition: "all .15s",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// ─── Resumen tab ──────────────────────────────────────────────────────────────

function ResumenTab({ table, recentMatches }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Tabla de posiciones */}
      <GlassCard>
        <CardHeader title="Tabla de posiciones" />
        {table.length === 0 ? (
          <div className="p-5">
            <EmptyState message="Aún no hay partidos jugados para calcular la tabla." />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,.28)" }}>
                  <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider text-gray-500 w-8">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-gray-500">Equipo</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider text-gray-500">PJ</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider text-gray-500">DG</th>
                  <th
                    className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold"
                    style={{ color: "var(--fifa-neon)" }}
                  >PTS</th>
                </tr>
              </thead>
              <tbody>
                {table.slice(0, 6).map((row, i) => (
                  <tr
                    key={String(row.club.id)}
                    className="border-t"
                    style={{ borderColor: "rgba(255,255,255,.04)", backgroundColor: "transparent", transition: "background-color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${POS_COLORS[i] ?? "text-gray-600"}`}>{i + 1}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <ClubAvatar name={row.club.name} logo={row.club.logo} small />
                        <span className="text-white font-medium truncate">{row.club.name}</span>
                        {row.club.abbr && (
                          <span className="text-[10px] font-bold hidden sm:inline" style={{ color: "var(--fifa-neon)" }}>{row.club.abbr}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400 tabular-nums">{row.played}</td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      <span className={row.goalDifference > 0 ? "text-green-400" : row.goalDifference < 0 ? "text-red-400" : "text-gray-500"}>
                        {row.goalDifference > 0 ? "+" : ""}{row.goalDifference}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      <span style={{ fontFamily: "var(--font-title)", fontSize: "1.05rem", fontWeight: 900, color: "#fff" }}>
                        {row.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {table.length > 6 && (
              <p className="text-center text-xs py-3 border-t" style={{ borderColor: "rgba(255,255,255,.05)", color: "var(--fifa-mute)" }}>
                +{table.length - 6} equipos más · ver tab Tabla
              </p>
            )}
          </>
        )}
      </GlassCard>

      {/* Últimos resultados */}
      <GlassCard>
        <CardHeader title="Últimos resultados" />
        {recentMatches.length === 0 ? (
          <div className="p-5">
            <EmptyState message="Aún no hay partidos jugados." />
          </div>
        ) : (
          recentMatches.map((match) => <MatchRow key={match._id} match={match} />)
        )}
      </GlassCard>
    </div>
  );
}

// ─── Tabla tab ────────────────────────────────────────────────────────────────

function TablaTab({ table, playoffTeams }) {
  if (table.length === 0) {
    return <EmptyState message="No hay datos de tabla. Registra partidos jugados para verla aquí." />;
  }

  return (
    <GlassCard>
      <CardHeader
        title="Clasificación"
        right={
          playoffTeams > 0 ? (
            <span style={{
              fontSize: "10px", padding: "3px 8px", borderRadius: "6px",
              color: "var(--fifa-neon)", backgroundColor: "rgba(36,255,122,.08)",
              border: "1px solid rgba(36,255,122,.15)",
            }}>
              Top {playoffTeams} → playoffs
            </span>
          ) : null
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr style={{ backgroundColor: "rgba(0,0,0,.28)" }}>
              {[
                { label: "#",      center: false },
                { label: "Equipo", center: false },
                { label: "PJ",     center: true },
                { label: "G",      center: true },
                { label: "E",      center: true },
                { label: "P",      center: true },
                { label: "GF",     center: true },
                { label: "GC",     center: true },
                { label: "DG",     center: true },
                { label: "PTS",    center: true, highlight: true },
              ].map(({ label, center, highlight }) => (
                <th
                  key={label}
                  className={`px-3 py-2.5 text-[10px] uppercase tracking-wider ${center ? "text-center" : "text-left"}`}
                  style={{ color: highlight ? "var(--fifa-neon)" : "#6b7280", fontWeight: highlight ? 700 : 600 }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => {
              const isPlayoff     = playoffTeams > 0 && index < playoffTeams;
              const isLastPlayoff = isPlayoff && index === playoffTeams - 1;
              return (
                <tr
                  key={String(row.club.id)}
                  className="border-t"
                  style={{
                    borderColor:  "rgba(255,255,255,.04)",
                    backgroundColor: "transparent",
                    borderLeft:   isPlayoff ? "2px solid rgba(36,255,122,.35)" : "2px solid transparent",
                    borderBottom: isLastPlayoff ? "1px solid rgba(36,255,122,.18)" : undefined,
                    transition:   "background-color .15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isPlayoff ? "rgba(36,255,122,.05)" : "rgba(255,255,255,.025)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="px-3 py-3">
                    <span className={`font-bold text-sm ${POS_COLORS[index] ?? "text-gray-600"}`}>{index + 1}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ClubAvatar name={row.club.name} logo={row.club.logo} small />
                      <span className="text-white font-medium">{row.club.name}</span>
                      {row.club.abbr && (
                        <span className="text-[10px] font-bold" style={{ color: "var(--fifa-neon)" }}>{row.club.abbr}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-400 tabular-nums">{row.played}</td>
                  <td className="px-3 py-3 text-center text-green-400 tabular-nums">{row.wins}</td>
                  <td className="px-3 py-3 text-center text-gray-400 tabular-nums">{row.draws}</td>
                  <td className="px-3 py-3 text-center text-red-400 tabular-nums">{row.losses}</td>
                  <td className="px-3 py-3 text-center text-gray-300 tabular-nums">{row.goalsFor}</td>
                  <td className="px-3 py-3 text-center text-gray-300 tabular-nums">{row.goalsAgainst}</td>
                  <td className="px-3 py-3 text-center tabular-nums">
                    <span className={row.goalDifference > 0 ? "text-green-400" : row.goalDifference < 0 ? "text-red-400" : "text-gray-400"}>
                      {row.goalDifference > 0 ? "+" : ""}{row.goalDifference}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums">
                    <span style={{ fontFamily: "var(--font-title)", fontSize: "1.1rem", fontWeight: 900, color: "#fff" }}>
                      {row.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

// ─── Partidos tab ─────────────────────────────────────────────────────────────

function PartidosTab({ matches }) {
  const [filter, setFilter] = useState("all");

  if (matches.length === 0) {
    return <EmptyState message="No hay partidos registrados todavía." />;
  }

  const filtered = filter === "all" ? matches : matches.filter((m) => m.status === filter);

  const roundMap     = {};
  const otherMatches = [];
  filtered.forEach((m) => {
    if (m.phase === "league") {
      const r = m.round || 1;
      if (!roundMap[r]) roundMap[r] = [];
      roundMap[r].push(m);
    } else {
      otherMatches.push(m);
    }
  });

  const sortedRounds = Object.keys(roundMap).sort((a, b) => Number(a) - Number(b));
  const showRounds   = sortedRounds.length > 1;

  const playedCount    = matches.filter((m) => m.status === "played").length;
  const scheduledCount = matches.filter((m) => m.status === "scheduled").length;
  const FILTERS = [
    { key: "all",       label: "Todos",      count: matches.length },
    { key: "played",    label: "Jugados",     count: playedCount },
    { key: "scheduled", label: "Programados", count: scheduledCount },
  ];

  return (
    <div className="space-y-5">

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              fontSize: "12px", fontWeight: 500, padding: "6px 12px",
              borderRadius: "8px", border: "1px solid", cursor: "pointer", transition: "all .15s",
              ...(filter === f.key
                ? { color: "var(--fifa-neon)", borderColor: "rgba(36,255,122,.30)", backgroundColor: "rgba(36,255,122,.08)" }
                : { color: "var(--fifa-mute)", borderColor: "var(--fifa-line)", backgroundColor: "rgba(255,255,255,.02)" }
              ),
            }}
          >
            {f.label}
            <span style={{
              marginLeft: "6px", borderRadius: "4px", padding: "1px 5px", fontSize: "10px",
              backgroundColor: filter === f.key ? "rgba(36,255,122,.15)" : "rgba(255,255,255,.06)",
              color: filter === f.key ? "var(--fifa-neon)" : "var(--fifa-mute)",
            }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState message="No hay partidos para este filtro." />}

      {/* League rounds */}
      {showRounds
        ? sortedRounds.map((r) => {
            const group = roundMap[r];
            if (!group?.length) return null;
            const played = group.filter((m) => m.status === "played").length;
            return (
              <GlassCard key={r}>
                <CardHeader
                  title={`Jornada ${r}`}
                  right={
                    <span style={{
                      fontSize: "10px", padding: "2px 7px", borderRadius: "4px",
                      backgroundColor: "rgba(255,255,255,.05)", color: "var(--fifa-mute)",
                    }}>
                      {played}/{group.length} jugados
                    </span>
                  }
                />
                {group.map((m) => <MatchRow key={m._id} match={m} />)}
              </GlassCard>
            );
          })
        : filtered.filter((m) => m.phase === "league").length > 0 && (
            <GlassCard>
              {filtered.filter((m) => m.phase === "league").map((m) => <MatchRow key={m._id} match={m} />)}
            </GlassCard>
          )
      }

      {/* Cup / playoff matches */}
      {otherMatches.length > 0 && (
        <GlassCard>
          <CardHeader title="Copa / Playoffs" />
          {otherMatches.map((m) => <MatchRow key={m._id} match={m} />)}
        </GlassCard>
      )}
    </div>
  );
}

// ─── Equipos tab ──────────────────────────────────────────────────────────────

function EquiposTab({ clubs, table }) {
  const tableMap = new Map(table.map((r) => [String(r.club.id), r]));

  if (clubs.length === 0) {
    return <EmptyState message="No hay equipos registrados en este torneo." />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clubs.map((club) => {
        const row = tableMap.get(club._id.toString());
        return (
          <div
            key={club._id}
            style={{
              background: "linear-gradient(180deg, rgba(13,34,43,.92), rgba(6,16,22,.92))",
              border: "1px solid var(--fifa-line)",
              borderRadius: "16px", padding: "20px",
              boxShadow: "0 0 0 1px rgba(36,255,122,.04), 0 8px 24px rgba(0,0,0,.35)",
              transition: "border-color .18s, box-shadow .18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(36,255,122,.22)";
              e.currentTarget.style.boxShadow   = "0 0 0 1px rgba(36,255,122,.10), 0 12px 32px rgba(0,0,0,.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--fifa-line)";
              e.currentTarget.style.boxShadow   = "0 0 0 1px rgba(36,255,122,.04), 0 8px 24px rgba(0,0,0,.35)";
            }}
          >
            {/* Club header */}
            <div className="flex items-center gap-3 mb-4">
              <ClubAvatar name={club.name} logo={club.logo} />
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm truncate">{club.name}</p>
                {club.abbr && (
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--fifa-neon)", fontFamily: "var(--font-title)", letterSpacing: ".5px" }}>
                    {club.abbr}
                  </p>
                )}
                {club.country && (
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,.28)", marginTop: "1px" }}>{club.country}</p>
                )}
              </div>
              {row && (
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: ".8px", color: "var(--fifa-mute)", marginBottom: "2px" }}>PTS</p>
                  <p style={{ fontFamily: "var(--font-title)", fontSize: "1.6rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                    {row.points}
                  </p>
                </div>
              )}
            </div>

            {/* Mini stats */}
            {row ? (
              <div className="grid grid-cols-4 gap-1 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,.06)" }}>
                {[
                  { label: "PJ", value: row.played, color: "rgba(255,255,255,.7)" },
                  { label: "G",  value: row.wins,   color: "#4ade80" },
                  { label: "E",  value: row.draws,  color: "rgba(255,255,255,.4)" },
                  { label: "P",  value: row.losses, color: "#f87171" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: ".8px", color: "rgba(255,255,255,.28)", marginBottom: "3px" }}>
                      {label}
                    </p>
                    <p style={{ fontFamily: "var(--font-title)", fontSize: "1rem", fontWeight: 700, color, lineHeight: 1 }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{
                fontSize: "11px", textAlign: "center", color: "rgba(255,255,255,.2)",
                paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,.06)", marginTop: "4px",
              }}>Sin partidos</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Estadísticas tab ─────────────────────────────────────────────────────────

function EstadisticasTab({ table, allMatches }) {
  const played     = allMatches.filter((m) => m.status === "played");
  const totalGoals = played.reduce((s, m) => s + (m.scoreHome ?? 0) + (m.scoreAway ?? 0), 0);
  const avgGoals   = played.length > 0 ? (totalGoals / played.length).toFixed(1) : "—";
  const maxGoals   = played.reduce((max, m) => {
    const t = (m.scoreHome ?? 0) + (m.scoreAway ?? 0);
    return t > max ? t : max;
  }, 0);

  const byGoalsFor     = [...table].sort((a, b) => b.goalsFor     - a.goalsFor).slice(0, 5);
  const byGoalsAgainst = [...table].sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 5);
  const byWins         = [...table].sort((a, b) => b.wins         - a.wins).slice(0, 5);

  if (table.length === 0) return <EmptyState message="Sin datos estadísticos todavía." />;

  return (
    <div className="space-y-8">

      {/* Summary cards */}
      <div>
        <SectionTitle>Resumen del torneo</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Goles totales"        value={totalGoals} />
          <SummaryCard label="Promedio / partido"   value={avgGoals} />
          <SummaryCard label="Récord en un partido" value={maxGoals > 0 ? maxGoals : "—"} />
        </div>
      </div>

      {/* Rankings */}
      <div>
        <SectionTitle>Rankings</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatRankTable title="Más goles marcados"    rows={byGoalsFor}     valueKey="goalsFor"     unit="GF" />
          <StatRankTable title="Menos goles recibidos" rows={byGoalsAgainst} valueKey="goalsAgainst" unit="GC" />
          <StatRankTable title="Más victorias"         rows={byWins}         valueKey="wins"         unit="G"  />
        </div>
      </div>
    </div>
  );
}

function StatRankTable({ title, rows, valueKey, unit }) {
  return (
    <div>
      <p style={{
        fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "1px", color: "var(--fifa-mute)", marginBottom: "10px",
      }}>{title}</p>
      {rows.length === 0 ? (
        <EmptyState message="Sin datos." />
      ) : (
        <GlassCard>
          {rows.map((row, i) => (
            <div
              key={String(row.club.id)}
              className="flex items-center gap-3 border-b last:border-0"
              style={{ padding: "12px 16px", borderColor: "rgba(255,255,255,.04)" }}
            >
              <span className={`font-bold text-sm w-5 shrink-0 ${POS_COLORS[i] ?? "text-gray-600"}`}>{i + 1}</span>
              <ClubAvatar name={row.club.name} logo={row.club.logo} small />
              <span className="text-white text-sm font-medium flex-1 truncate min-w-0">{row.club.name}</span>
              <span style={{
                fontFamily: "var(--font-title)", fontSize: "1.2rem", fontWeight: 900,
                color: "var(--fifa-neon)", flexShrink: 0, fontVariantNumeric: "tabular-nums",
              }}>
                {row[valueKey]}
              </span>
              <span style={{
                fontSize: "9px", textTransform: "uppercase", color: "var(--fifa-mute)",
                width: "18px", textAlign: "right", flexShrink: 0,
              }}>{unit}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

// ─── Jornada card ─────────────────────────────────────────────────────────────

function JornadaCard({ summary, allMatches }) {
  const nextMatch = (allMatches ?? [])
    .filter((m) => m.status === "scheduled" && m.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const nextDate = nextMatch
    ? new Date(nextMatch.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
    : null;

  return (
    <div style={{
      flexShrink: 0, minWidth: "200px",
      borderRadius: "16px",
      border: "1px solid rgba(36,255,122,.20)",
      backgroundColor: "rgba(0,0,0,.55)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      padding: "20px",
      boxShadow: "0 0 0 1px rgba(36,255,122,.07), 0 8px 32px rgba(0,0,0,.65)",
    }}>
      <p style={{
        fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "1.5px", color: "var(--fifa-mute)", marginBottom: "6px",
      }}>Jornada actual</p>

      <p style={{
        fontFamily: "var(--font-title)", fontSize: "3.2rem", fontWeight: 900,
        color: "var(--fifa-neon)", lineHeight: 1,
        textShadow: "0 0 22px rgba(36,255,122,.45)",
      }}>
        {summary.currentRound || "—"}
      </p>

      <div style={{
        marginTop: "16px", paddingTop: "14px",
        borderTop: "1px solid rgba(255,255,255,.07)",
        display: "flex", flexDirection: "column", gap: "9px",
      }}>
        <div className="flex items-center justify-between gap-6">
          <span style={{ fontSize: "11px", color: "var(--fifa-mute)" }}>Partidos jugados</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            {summary.playedMatches}
          </span>
        </div>
        {nextDate && (
          <div className="flex items-center justify-between gap-6">
            <span style={{ fontSize: "11px", color: "var(--fifa-mute)" }}>Próxima fecha</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--fifa-neon)" }}>{nextDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading / Error screens ──────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "var(--fifa-bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px",
          border: "2px solid rgba(36,255,122,.15)",
          borderTop: "2px solid var(--fifa-neon)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          margin: "0 auto 18px",
        }} />
        <p style={{
          fontFamily: "var(--font-title)", fontSize: "12px",
          letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--fifa-mute)",
        }}>Cargando torneo...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "var(--fifa-bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <p style={{
        fontFamily: "var(--font-title)", fontSize: "6rem",
        color: "var(--fifa-neon)", lineHeight: 1,
        textShadow: "0 0 40px rgba(36,255,122,.3)",
      }}>404</p>
      <p style={{ color: "#fff", fontSize: "16px", fontWeight: 600, marginTop: "16px", textAlign: "center" }}>
        {message || "Torneo no encontrado"}
      </p>
      <p style={{ color: "var(--fifa-mute)", fontSize: "13px", marginTop: "8px", textAlign: "center" }}>
        Este torneo es privado o no existe.
      </p>
      <Link
        to="/login"
        style={{ marginTop: "28px", fontSize: "12px", color: "rgba(255,255,255,.28)", textDecoration: "none", transition: "color .18s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fifa-mute)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.28)")}
      >
        Ir al inicio →
      </Link>
    </div>
  );
}
