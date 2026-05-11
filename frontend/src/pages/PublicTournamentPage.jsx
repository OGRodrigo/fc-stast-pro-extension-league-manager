// frontend/src/pages/PublicTournamentPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { publicApi } from "../api";
import ClubAvatar from "../components/ui/ClubAvatar";
import ProBracket from "../components/ProBracket";
import LoadingScreenUI from "../components/ui/LoadingScreen";
import TournamentShareModal from "../components/share/TournamentShareModal";
import logo from "../assets/logo-league-manager.png";

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

const SOCIAL_LINKS = {
  instagram: "https://instagram.com/",
  discord:   "https://discord.gg/",
  x:         "https://x.com/",
  tiktok:    "https://tiktok.com/",
};

const NAV_LINKS = [
  { label: "Inicio",    href: "/" },
  { label: "Acerca de", href: "/#features" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicTournamentPage() {
  const { slug } = useParams();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("Resumen");
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const handleMatchClick = (match) => setSelectedMatch(match);

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

  if (loading) return <LoadingScreenUI text="Cargando torneo" />;
  if (error || !data) return <ErrorScreen message={error} />;

  const { tournament, clubs, table, recentMatches, allMatches, summary } = data;

  const TABS = tournament.format === "cup"
    ? ["Resumen", "Bracket", "Partidos", "Equipos", "Estadísticas"]
    : tournament.format === "mixed" && tournament.hasPlayoffs
    ? ["Resumen", "Tabla de posiciones", "Playoffs", "Partidos", "Equipos", "Estadísticas"]
    : tournament.format === "mixed"
    ? ["Resumen", "Tabla de posiciones", "Partidos", "Equipos", "Estadísticas"]
    : ["Resumen", "Tabla de posiciones", "Partidos", "Equipos", "Estadísticas"];

  const shareUrl = `${window.location.origin}/public/tournaments/${tournament.publicSlug}`;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--fifa-bg)" }}>
      <Helmet>
        <title>{tournament.name} — FC Stats Pro</title>
        <meta property="og:title" content={`${tournament.name} — Temporada ${tournament.season}`} />
        <meta property="og:description" content={`${summary.totalClubs} equipos · ${FORMAT_LABELS[tournament.format] ?? tournament.format} · Sigue tabla, bracket y resultados`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        {tournament.logo && <meta property="og:image" content={tournament.logo} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${tournament.name} — FC Stats Pro`} />
        <meta name="twitter:description" content={`${summary.totalClubs} equipos · ${FORMAT_LABELS[tournament.format] ?? tournament.format}`} />
        {tournament.logo && <meta name="twitter:image" content={tournament.logo} />}
      </Helmet>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
        style={{
          position:           "relative",
          backgroundImage:    "url(/images/stadium.png)",
          backgroundSize:     "cover",
          backgroundPosition: "center 66%",
          backgroundRepeat:   "no-repeat",
        }}
      >
        {/* Horizontal overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(4,8,14,.95) 0%, rgba(4,8,14,.72) 30%, rgba(4,8,14,.28) 40%)",
        }} />
        {/* Bottom-to-top fade into bg */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, var(--fifa-bg) 0%, rgba(22, 36, 63, 0.62) 0%, transparent 15%)",
        }} />

        <div
          className="max-w-6xl mx-auto w-full px-4 sm:px-6"
          className="pt-10 pb-12 sm:pt-16 sm:pb-[4.5rem]"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-6 sm:gap-8">

            {/* Left: logo + info */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Tournament badge */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0" style={{
                borderRadius: "22px",
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

                {/* Powered by */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <img src={logo} alt="" style={{ width: "13px", height: "13px", objectFit: "contain", opacity: 0.4 }} />
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,.22)", letterSpacing: ".04em", textTransform: "uppercase" }}>
                    Powered by FC Stats Pro League Manager
                  </span>
                </div>

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

            {/* Right: jornada card + share */}
            <div className="flex flex-col items-stretch sm:items-end gap-3 sm:gap-3.5 w-full sm:w-auto">
              <JornadaCard summary={summary} allMatches={allMatches} />
              <button
                onClick={() => setShareOpen(true)}
                className="w-full sm:w-auto justify-center"
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  fontSize: "12px", fontWeight: 600, padding: "9px 16px",
                  borderRadius: "10px", border: "1px solid",
                  borderColor: "rgba(36,255,122,.3)",
                  color: "#24ff7a",
                  backgroundColor: "rgba(36,255,122,.08)",
                  boxShadow: "0 0 14px rgba(36,255,122,.12)",
                  cursor: "pointer", transition: "all .18s",
                  whiteSpace: "nowrap",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(36,255,122,.6)";
                  e.currentTarget.style.backgroundColor = "rgba(36,255,122,.14)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(36,255,122,.25)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(36,255,122,.3)";
                  e.currentTarget.style.backgroundColor = "rgba(36,255,122,.08)";
                  e.currentTarget.style.boxShadow = "0 0 14px rgba(36,255,122,.12)";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Compartir torneo
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <TournamentShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        tournament={tournament}
        table={table}
      />

      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailOverlay
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
          />
        )}
      </AnimatePresence>

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
      <div
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,6,12,.45), rgba(2,6,12,.65)), url('/images/stadium-tunnel-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="max-w-6xl mx-auto px-4 sm:px-6 py-8"
          >
            {activeTab === "Resumen"             && <ResumenTab tournament={tournament} table={table} recentMatches={recentMatches} onMatchClick={handleMatchClick} />}
            {activeTab === "Tabla de posiciones" && <TablaTab table={table} playoffTeams={tournament.hasPlayoffs ? tournament.playoffTeams : 0} />}
            {activeTab === "Bracket"             && <BracketPublicTab allMatches={allMatches} format={tournament.format} slug={tournament.publicSlug} />}
            {activeTab === "Playoffs"            && <BracketPublicTab allMatches={allMatches} format={tournament.format} slug={tournament.publicSlug} />}
            {activeTab === "Partidos"            && <PartidosTab matches={allMatches} onMatchClick={handleMatchClick} />}
            {activeTab === "Equipos"             && <EquiposTab clubs={clubs} table={table} />}
            {activeTab === "Estadísticas"        && <EstadisticasTab table={table} allMatches={allMatches} />}
          </motion.div>
        </AnimatePresence>
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

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.834 19.834 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.07 13.07 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.841L1.254 2.25H8.08l4.257 5.628 5.907-5.628zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.27 8.27 0 0 0 4.83 1.56V6.85a4.85 4.85 0 0 1-1.06-.16z"/>
    </svg>
  );
}

// ─── Social link ──────────────────────────────────────────────────────────────

function SocialLink({ href, label, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "28px", height: "28px", borderRadius: "7px",
        border: "1px solid",
        borderColor: hovered ? "rgba(36,255,122,.38)" : "rgba(255,255,255,.08)",
        color: hovered ? "var(--fifa-neon)" : "rgba(255,255,255,.38)",
        backgroundColor: hovered ? "rgba(36,255,122,.08)" : "transparent",
        textDecoration: "none",
        transition: "all .18s",
        boxShadow: hovered ? "0 0 10px rgba(36,255,122,.18)" : "none",
        flexShrink: 0,
      }}
    >
      {children}
    </a>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

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




function PublicHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(4,8,14,.88)",
        borderBottom: "1px solid var(--fifa-line)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6"
        style={{ height: "56px", display: "flex", alignItems: "center" }}
      >
        {/* Branding */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0px", textDecoration: "none", flexShrink: 0 }}>
          <img
  src={logo}
  alt="FC Stats Pro League Manager"
  style={{
    height: "58px",
    width: "auto",
    objectFit: "contain",
    display: "block",
    filter: "drop-shadow(0 0 14px rgba(36,255,122,.22))",
  }}
/>
          
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

        {/* Social links — large screens only */}
        <div className="hidden lg:flex items-center" style={{ gap: "7px", marginRight: "16px" }}>
          <SocialLink href={SOCIAL_LINKS.instagram} label="Instagram"><InstagramIcon /></SocialLink>
          <SocialLink href={SOCIAL_LINKS.discord} label="Discord"><DiscordIcon /></SocialLink>
          <SocialLink href={SOCIAL_LINKS.x} label="X / Twitter"><XIcon /></SocialLink>
          <SocialLink href={SOCIAL_LINKS.tiktok} label="TikTok"><TikTokIcon /></SocialLink>
        </div>

        
      </div>
    </motion.header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function PublicFooter() {
  return (
    <footer style={{
      marginTop: "5rem",
      borderTop: "1px solid var(--fifa-line)",
      backgroundColor: "rgba(4,8,14,.88)",
    }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">

        {/* Main row */}
        <div className="flex flex-col sm:flex-col items-start sm:items-center justify-between gap-6">

          {/* Branding */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <img
  src={logo}
  alt="FC Stats Pro League Manager"
  style={{
    height: "98px",
    width: "auto",
    objectFit: "contain",
    display: "block",
    filter: "drop-shadow(0 0 14px rgba(36,255,122,.22))",
  }}
/>
          
          </a>

          {/* Description */}
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,.28)", textAlign: "center", maxWidth: "260px", lineHeight: 1.6 }}>
            Tournament platform para ligas y torneos locales · FC Stats Pro League Manager
          </p>

          {/* Social + Admin */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <SocialLink href={SOCIAL_LINKS.instagram} label="Instagram"><InstagramIcon /></SocialLink>
              <SocialLink href={SOCIAL_LINKS.discord} label="Discord"><DiscordIcon /></SocialLink>
              <SocialLink href={SOCIAL_LINKS.x} label="X / Twitter"><XIcon /></SocialLink>
              <SocialLink href={SOCIAL_LINKS.tiktok} label="TikTok"><TikTokIcon /></SocialLink>
            </div>
            <Link
              to="/login"
              style={{ fontSize: "12px", color: "rgba(255,255,255,.22)", textDecoration: "none", transition: "color .18s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fifa-mute)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.22)")}
            >
          
            </Link>
          </div>
        </div>

        {/* Legal links row */}
        <div
          className="mt-6 pt-5 flex flex-wrap items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}
        >
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { label: "Términos de uso",               href: "/legal/terms" },
              { label: "Privacidad",                    href: "/legal/privacy" },
              { label: "Descargo de responsabilidad",   href: "/legal/disclaimer" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                style={{
                  fontSize: "11px", color: "rgba(255,255,255,.22)",
                  textDecoration: "none", transition: "color .18s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fifa-mute)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.22)")}
              >
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,.14)" }}>
            © {new Date().getFullYear()} FC Stats Pro · Todos los derechos reservados
          </p>
        </div>

        {/* Disclaimer */}
        <p style={{
          marginTop: "10px",
          fontSize: "9.5px", color: "rgba(255,255,255,.1)",
          lineHeight: 1.65, maxWidth: "600px",
        }}>
          FC Stats Pro League Manager no está afiliado ni es respaldado por Electronic Arts Inc., EA SPORTS, EA SPORTS FC™ ni ninguna de sus subsidiarias. Todos los nombres de marcas pertenecen a sus respectivos propietarios.
        </p>
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

function MatchRow({ match, onClick }) {
  const isPlayed  = match.status === "played";
  const date      = new Date(match.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  const homeLabel = match.homeClub?.abbr || match.homeClub?.name || "—";
  const awayLabel = match.awayClub?.abbr || match.awayClub?.name || "—";
  const homeFull  = match.homeClub?.name || "—";
  const awayFull  = match.awayClub?.name || "—";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-3 border-b last:border-0"
      onClick={() => isPlayed && onClick?.(match)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "12px 20px",
        borderColor: "rgba(255,255,255,.04)",
        borderLeft: isPlayed ? "2px solid rgba(36,255,122,.22)" : "2px solid transparent",
        backgroundColor: isPlayed && hovered ? "rgba(36,255,122,.04)" : "transparent",
        cursor: isPlayed ? "pointer" : "default",
        transition: "background-color .15s",
      }}
    >
      <span style={{
        fontSize: "10px", color: "var(--fifa-mute)",
        minWidth: "36px", fontVariantNumeric: "tabular-nums", flexShrink: 0,
      }}>{date}</span>

      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-sm font-semibold text-gray-200 truncate hidden sm:block" title={homeFull}>{homeFull}</span>
          <span className="text-sm font-bold text-white sm:hidden">{homeLabel}</span>
          <ClubAvatar name={match.homeClub?.name} logo={match.homeClub?.logo} small />
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
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ClubAvatar name={match.awayClub?.name} logo={match.awayClub?.logo} small />
          <span className="text-sm font-semibold text-gray-200 truncate hidden sm:block" title={awayFull}>{awayFull}</span>
          <span className="text-sm font-bold text-white sm:hidden">{awayLabel}</span>
        </div>
      </div>

      {isPlayed ? (
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={hovered ? "var(--fifa-neon)" : "rgba(255,255,255,.2)"}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: "stroke .15s" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      ) : (
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

const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

function ResumenTab({ table, recentMatches, onMatchClick }) {
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      initial="hidden"
      animate="visible"
    >
      {/* Tabla de posiciones */}
      <motion.div variants={cardVariants}>
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
                        <div className="flex items-center gap-2.5">
                          <ClubAvatar name={row.club.name} logo={row.club.logo} medium />
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
      </motion.div>

      {/* Últimos resultados */}
      <motion.div variants={cardVariants}>
        <GlassCard>
          <CardHeader title="Últimos resultados" />
          {recentMatches.length === 0 ? (
            <div className="p-5">
              <EmptyState message="Aún no hay partidos jugados." />
            </div>
          ) : (
            recentMatches.map((match) => <MatchRow key={match._id} match={match} onClick={onMatchClick} />)
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
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
                    <div className="flex items-center gap-2.5">
                      <ClubAvatar name={row.club.name} logo={row.club.logo} medium />
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

function PartidosTab({ matches, onMatchClick }) {
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
                {group.map((m) => <MatchRow key={m._id} match={m} onClick={onMatchClick} />)}
              </GlassCard>
            );
          })
        : filtered.filter((m) => m.phase === "league").length > 0 && (
            <GlassCard>
              {filtered.filter((m) => m.phase === "league").map((m) => <MatchRow key={m._id} match={m} onClick={onMatchClick} />)}
            </GlassCard>
          )
      }

      {/* Cup / playoff matches */}
      {otherMatches.length > 0 && (
        <GlassCard>
          <CardHeader title="Copa / Playoffs" />
          {otherMatches.map((m) => <MatchRow key={m._id} match={m} onClick={onMatchClick} />)}
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
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      initial="hidden"
      animate="visible"
    >
      {clubs.map((club) => {
        const row = tableMap.get(club._id.toString());
        return (
          <motion.div
            key={club._id}
            variants={cardVariants}
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
              <ClubAvatar name={club.name} logo={club.logo} large />
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
          </motion.div>
        );
      })}
    </motion.div>
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
              <ClubAvatar name={row.club.name} logo={row.club.logo} medium />
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

// ─── Bracket public tab ───────────────────────────────────────────────────────

function BracketPublicTab({ allMatches, format, slug }) {
  const bracketMatches = allMatches.filter((m) =>
    format === "cup" ? m.phase === "cup" : m.phase === "playoff"
  );

  const label = format === "cup" ? "Cuadro de torneo" : "Bracket de playoffs";

  return (
    <div>
      <SectionTitle>{label}</SectionTitle>
      {bracketMatches.length === 0 ? (
        <EmptyState message="El bracket no ha sido generado aún." />
      ) : (
        <div style={{ marginTop: "8px" }}>
          <ProBracket matches={bracketMatches} slug={slug} />
        </div>
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
    <div className="w-full sm:w-auto" style={{
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

// ─── Match Detail Overlay ─────────────────────────────────────────────────────

function MatchDetailOverlay({ match, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const s       = match.clubStats || {};
  const hasStats = Object.values(s).some((v) => v > 0);

  const dateStr = new Date(match.date).toLocaleDateString("es-ES", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const phaseLabel =
    match.phase === "league"  ? `Jornada ${match.round}` :
    match.phase === "cup"     ? "Copa" :
    match.phase === "playoff" ? "Playoff" : "";

  const homeWon = match.scoreHome > match.scoreAway;
  const awayWon = match.scoreAway > match.scoreHome;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        backgroundColor: "rgba(2,5,10,.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        style={{ maxWidth: "820px", margin: "0 auto", padding: "0 16px 80px" }}
      >
        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 0 12px",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          marginBottom: "36px",
        }}>
          <button
            onClick={onClose}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "13px", fontWeight: 500, color: "var(--fifa-mute)",
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 10px", borderRadius: "8px",
              transition: "color .15s, background .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fifa-mute)"; e.currentTarget.style.background = "none"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </button>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "var(--fifa-neon)" }}>
              {phaseLabel}
            </span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,.32)", textTransform: "capitalize" }}>
              {dateStr}
            </span>
            {match.stadium && (
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,.2)" }}>
                {match.stadium}
              </span>
            )}
          </div>

          <div style={{ width: "70px" }} />
        </div>

        {/* ── Score hero ────────────────────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center", gap: "20px",
          marginBottom: "44px",
        }}>
          {/* Home */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <ClubAvatar name={match.homeClub?.name} logo={match.homeClub?.logo} xlarge />
            <p style={{
              fontFamily: "var(--font-title)", fontSize: "clamp(1rem, 3vw, 1.4rem)",
              fontWeight: 800, textAlign: "center", textTransform: "uppercase",
              letterSpacing: ".5px",
              color: homeWon ? "#fff" : "rgba(255,255,255,.5)",
            }}>
              {match.homeClub?.name || "Local"}
            </p>
            {homeWon && (
              <span style={{
                fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
                color: "var(--fifa-neon)", border: "1px solid rgba(36,255,122,.3)",
                backgroundColor: "rgba(36,255,122,.08)", borderRadius: "5px", padding: "2px 7px",
              }}>GANADOR</span>
            )}
          </div>

          {/* Score */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "linear-gradient(135deg, rgba(36,255,122,.1), rgba(36,255,122,.04))",
              border: "1px solid rgba(36,255,122,.18)",
              borderRadius: "20px", padding: "10px 28px",
              boxShadow: "0 0 40px rgba(36,255,122,.12), 0 8px 32px rgba(0,0,0,.5)",
            }}>
              <span style={{
                fontFamily: "var(--font-title)", fontSize: "clamp(3rem, 8vw, 5rem)",
                fontWeight: 900, color: "#fff", lineHeight: 1,
                textShadow: "0 0 30px rgba(36,255,122,.3)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {match.scoreHome}
              </span>
              <span style={{
                fontFamily: "var(--font-title)", fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 900, color: "rgba(36,255,122,.5)", lineHeight: 1, margin: "0 6px",
              }}>–</span>
              <span style={{
                fontFamily: "var(--font-title)", fontSize: "clamp(3rem, 8vw, 5rem)",
                fontWeight: 900, color: "#fff", lineHeight: 1,
                textShadow: "0 0 30px rgba(54,230,255,.2)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {match.scoreAway}
              </span>
            </div>
            <span style={{
              fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "2px", color: "rgba(255,255,255,.25)",
            }}>Tiempo reglamentario</span>
          </div>

          {/* Away */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <ClubAvatar name={match.awayClub?.name} logo={match.awayClub?.logo} xlarge />
            <p style={{
              fontFamily: "var(--font-title)", fontSize: "clamp(1rem, 3vw, 1.4rem)",
              fontWeight: 800, textAlign: "center", textTransform: "uppercase",
              letterSpacing: ".5px",
              color: awayWon ? "#fff" : "rgba(255,255,255,.5)",
            }}>
              {match.awayClub?.name || "Visitante"}
            </p>
            {awayWon && (
              <span style={{
                fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
                color: "var(--fifa-neon)", border: "1px solid rgba(36,255,122,.3)",
                backgroundColor: "rgba(36,255,122,.08)", borderRadius: "5px", padding: "2px 7px",
              }}>GANADOR</span>
            )}
          </div>
        </div>

        {/* ── Stats section ─────────────────────────────────────────────── */}
        {hasStats ? (
          <div style={{
            background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.88))",
            border: "1px solid var(--fifa-line)",
            borderRadius: "20px", overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(36,255,122,.04), 0 16px 40px rgba(0,0,0,.4)",
          }}>
            <div style={{
              padding: "14px 24px",
              borderBottom: "1px solid var(--fifa-line)",
              backgroundColor: "rgba(0,0,0,.2)",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{
                display: "block", width: "3px", height: "14px", borderRadius: "2px",
                background: "var(--fifa-neon)", boxShadow: "0 0 6px var(--fifa-neon)", flexShrink: 0,
              }} />
              <p style={{
                fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "1.3px", color: "var(--fifa-mute)",
              }}>Estadísticas del partido</p>
            </div>

            <div style={{ padding: "8px 0" }}>
              {s.possessionHome + s.possessionAway > 0 && (
                <MatchStatRow
                  label="Posesión"
                  homeVal={s.possessionHome} awayVal={s.possessionAway}
                  unit="%" isBar barColor="var(--fifa-neon)"
                />
              )}
              {s.shotsHome + s.shotsAway > 0 && (
                <MatchStatRow label="Tiros totales" homeVal={s.shotsHome} awayVal={s.shotsAway} />
              )}
              {s.shotsOnTargetHome + s.shotsOnTargetAway > 0 && (
                <MatchStatRow label="Tiros a puerta" homeVal={s.shotsOnTargetHome} awayVal={s.shotsOnTargetAway} />
              )}
              {s.passesHome + s.passesAway > 0 && (
                <MatchStatRow label="Pases" homeVal={s.passesHome} awayVal={s.passesAway} />
              )}
              {s.passesCompletedHome + s.passesCompletedAway > 0 && (
                <MatchStatRow label="Pases completados" homeVal={s.passesCompletedHome} awayVal={s.passesCompletedAway} />
              )}
              {s.tacklesHome + s.tacklesAway > 0 && (
                <MatchStatRow label="Entradas" homeVal={s.tacklesHome} awayVal={s.tacklesAway} />
              )}
              {s.recoveriesHome + s.recoveriesAway > 0 && (
                <MatchStatRow label="Recuperaciones" homeVal={s.recoveriesHome} awayVal={s.recoveriesAway} />
              )}
              {s.cornersHome + s.cornersAway > 0 && (
                <MatchStatRow label="Córners" homeVal={s.cornersHome} awayVal={s.cornersAway} />
              )}
              {s.foulsHome + s.foulsAway > 0 && (
                <MatchStatRow label="Faltas" homeVal={s.foulsHome} awayVal={s.foulsAway} invertBar />
              )}
              {s.yellowCardsHome + s.yellowCardsAway > 0 && (
                <MatchStatRow
                  label="Tarjetas amarillas"
                  homeVal={s.yellowCardsHome} awayVal={s.yellowCardsAway}
                  barColor="#facc15" invertBar
                />
              )}
              {s.redCardsHome + s.redCardsAway > 0 && (
                <MatchStatRow
                  label="Tarjetas rojas"
                  homeVal={s.redCardsHome} awayVal={s.redCardsAway}
                  barColor="#ef4444" invertBar
                />
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,.02)", border: "1px solid var(--fifa-line)",
            borderRadius: "16px", padding: "44px 20px", textAlign: "center",
          }}>
            <p style={{ fontSize: "13px", color: "var(--fifa-mute)" }}>
              Este partido no tiene estadísticas detalladas registradas.
            </p>
          </div>
        )}

        {/* Source badge */}
        {match.source === "ai" && (
          <div style={{
            marginTop: "16px", display: "flex", justifyContent: "center",
          }}>
            <span style={{
              fontSize: "10px", fontWeight: 600, letterSpacing: ".5px",
              color: "rgba(54,230,255,.6)", border: "1px solid rgba(54,230,255,.18)",
              backgroundColor: "rgba(54,230,255,.06)", borderRadius: "7px", padding: "4px 10px",
            }}>
              ✦ Importado por IA / OCR
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function MatchStatRow({ label, homeVal, awayVal, unit = "", isBar, barColor = "var(--fifa-neon)", invertBar }) {
  const total = (homeVal || 0) + (awayVal || 0);
  const homeRatio = total > 0 ? (homeVal || 0) / total : 0.5;
  const awayRatio = 1 - homeRatio;

  const homeStronger = invertBar ? homeVal <= awayVal : homeVal >= awayVal;
  const awayStronger = invertBar ? awayVal <= homeVal : awayVal >= homeVal;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 180px 1fr",
      alignItems: "center", gap: "12px",
      padding: "13px 24px",
      borderBottom: "1px solid rgba(255,255,255,.03)",
    }}>
      {/* Home value */}
      <div style={{ textAlign: "right" }}>
        <span style={{
          fontFamily: "var(--font-title)", fontSize: "1.4rem", fontWeight: 900,
          color: homeStronger ? "#fff" : "rgba(255,255,255,.45)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {homeVal || 0}{unit}
        </span>
      </div>

      {/* Center: label + bar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: ".9px", color: "rgba(255,255,255,.35)",
          whiteSpace: "nowrap",
        }}>{label}</span>
        <div style={{
          width: "100%", height: isBar ? "7px" : "4px",
          borderRadius: "4px", overflow: "hidden",
          backgroundColor: "rgba(255,255,255,.05)",
          display: "flex",
        }}>
          <div style={{
            width: `${homeRatio * 100}%`,
            backgroundColor: barColor,
            opacity: 0.85,
            borderRadius: "4px 0 0 4px",
            transition: "width .4s ease",
          }} />
          <div style={{
            flex: 1,
            backgroundColor: "rgba(54,230,255,.55)",
            opacity: 0.75,
            borderRadius: "0 4px 4px 0",
          }} />
        </div>
      </div>

      {/* Away value */}
      <div style={{ textAlign: "left" }}>
        <span style={{
          fontFamily: "var(--font-title)", fontSize: "1.4rem", fontWeight: 900,
          color: awayStronger ? "#fff" : "rgba(255,255,255,.45)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {awayVal || 0}{unit}
        </span>
      </div>
    </div>
  );
}
