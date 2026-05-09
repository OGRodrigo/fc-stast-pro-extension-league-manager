import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { tournamentsApi, clubsApi } from "../api";
import SkeletonCard from "../components/ui/SkeletonCard";
import { heroItem, staggerGrid, statItem, cardItem } from "../utils/motionVariants";

const TYPE_LABELS = { league: "Liga", tournament: "Torneo" };
const TYPE_BADGE  = { league: "badge-league", tournament: "badge-tournament" };
const STATUS_LABELS = { active: "Activo", draft: "Borrador", finished: "Finalizado" };
const STATUS_BADGE  = { active: "badge-active", draft: "badge-draft", finished: "badge-finished" };

export default function Dashboard() {
  const { admin } = useAuth();
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tournamentsApi.getAll(), clubsApi.getAll()])
      .then(([tRes, cRes]) => {
        setTournaments(tRes.data.tournaments ?? []);
        setClubs(cRes.data.clubs ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCount = tournaments.filter((t) => t.status === "active").length;

  return (
    <div className="space-y-8">

      {/* Hero Header */}
      <motion.div
        variants={heroItem}
        initial="initial"
        animate="animate"
        className="relative overflow-hidden rounded-3xl p-7 md:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(10,24,34,.95), rgba(6,16,22,.92))",
          border: "1px solid rgba(36,255,122,0.12)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 20px 60px rgba(0,0,0,.45)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(36,255,122,.12), transparent 30%), radial-gradient(circle at right, rgba(54,230,255,.10), transparent 25%)",
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p
              className="mb-2"
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "var(--fifa-neon)",
                fontFamily: "var(--font-title)",
              }}
            >
              FC Stats Pro
            </p>

            <h1
              style={{
                fontSize: "2.2rem",
                lineHeight: 1,
                fontWeight: 800,
                color: "white",
                fontFamily: "var(--font-title)",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Bienvenido, {admin?.name}
            </h1>

            <p
              className="mt-2 max-w-xl"
              style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
            >
              Administra ligas, torneos y clubes desde una plataforma inspirada en
              el fútbol competitivo y el análisis deportivo moderno.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/tournaments")} className="btn-primary">
              <PlusIcon />
              Nueva liga
            </button>
            <button onClick={() => navigate("/clubs")} className="btn-secondary">
              <PlusIcon />
              Nuevo club
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerGrid}
        initial="initial"
        animate="animate"
        className="grid grid-cols-3 gap-4"
      >
        <motion.div variants={statItem}>
          <StatCard label="Torneos totales" value={loading ? "—" : tournaments.length} icon={<TrophyStatIcon />} />
        </motion.div>
        <motion.div variants={statItem}>
          <StatCard label="Ligas activas" value={loading ? "—" : activeCount} accent icon={<BoltStatIcon />} />
        </motion.div>
        <motion.div variants={statItem}>
          <StatCard label="Clubes registrados" value={loading ? "—" : clubs.length} icon={<ShieldStatIcon />} />
        </motion.div>
      </motion.div>

      {/* Tournaments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title">Ligas y torneos</p>
          {tournaments.length > 4 && (
            <button
              onClick={() => navigate("/tournaments")}
              className="text-xs text-green-500 hover:text-green-400 transition-colors"
            >
              Ver todos →
            </button>
          )}
        </div>

        {loading ? (
          <GridSkeleton />
        ) : tournaments.length === 0 ? (
          <EmptyCard
            msg="Aún no tienes ligas ni torneos"
            cta="Crear primera liga"
            onCta={() => navigate("/tournaments")}
          />
        ) : (
          <motion.div
            variants={staggerGrid}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {tournaments.slice(0, 6).map((t) => (
              <motion.div key={t._id} variants={cardItem}>
                <TournamentCard
                  tournament={t}
                  onClick={() => navigate(`/tournaments/${t._id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5 h-full"
      style={{
        background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
        border: `1px solid ${accent ? "rgba(36,255,122,0.18)" : "rgba(36,255,122,0.10)"}`,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 12px 34px rgba(0,0,0,.35)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: accent
            ? "linear-gradient(90deg, #24ff7a, rgba(36,255,122,0))"
            : "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
            {label}
          </p>
          <p
            className={`text-3xl font-bold tabular-nums ${accent ? "text-green-400" : "text-white"}`}
            style={{ fontFamily: "var(--font-title)", letterSpacing: "0.02em" }}
          >
            {value}
          </p>
        </div>

        {icon && (
          <div
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl mt-1"
            style={{
              background: accent ? "rgba(36,255,122,0.10)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${accent ? "rgba(36,255,122,0.20)" : "rgba(255,255,255,0.06)"}`,
              color: accent ? "var(--fifa-neon)" : "var(--fifa-mute)",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_ACCENT = {
  active: "#24ff7a",
  draft: "rgba(156,163,175,0.5)",
  finished: "#36e6ff",
};

function TournamentCard({ tournament, onClick }) {
  const accentColor = STATUS_ACCENT[tournament.status] ?? STATUS_ACCENT.draft;

  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-3xl p-5 text-left w-full group transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
        border: "1px solid rgba(36,255,122,0.08)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 12px 30px rgba(0,0,0,.35)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#111d30")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
    >
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accentColor }} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className={TYPE_BADGE[tournament.type] ?? "badge-tournament"}>
            {TYPE_LABELS[tournament.type] ?? tournament.type}
          </span>
          <span className={STATUS_BADGE[tournament.status] ?? "badge-draft"}>
            {STATUS_LABELS[tournament.status] ?? tournament.status}
          </span>
        </div>
        <svg
          className="w-4 h-4 text-gray-600 shrink-0 group-hover:text-gray-400 transition-colors"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <p className="text-white font-semibold text-base">{tournament.name}</p>
      <p className="text-gray-500 text-xs mt-1">
        Temporada {tournament.season} · {tournament.clubs?.length ?? 0} clubes
      </p>
    </button>
  );
}

function EmptyCard({ msg, cta, onCta }) {
  return (
    <div
      className="rounded-3xl p-10 text-center"
      style={{
        background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
        border: "1px solid rgba(36,255,122,0.10)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 18px 45px rgba(0,0,0,.38)",
      }}
    >
      <p className="mb-4 text-sm" style={{ color: "var(--fifa-mute)" }}>{msg}</p>
      <button onClick={onCta} className="btn-primary mx-auto">{cta}</button>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-3xl p-5"
          style={{
            background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
            border: "1px solid rgba(36,255,122,0.08)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 12px 30px rgba(0,0,0,.35)",
          }}
        >
          <div className="mb-3 flex gap-2">
            <div className="h-5 w-12 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
            <div className="h-5 w-16 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          </div>
          <div className="mb-2 h-5 w-40 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          <div className="h-3 w-28 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
        </div>
      ))}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function TrophyStatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  );
}

function BoltStatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function ShieldStatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}
