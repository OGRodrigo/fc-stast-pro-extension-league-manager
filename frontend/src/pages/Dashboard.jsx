import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { tournamentsApi, clubsApi } from "../api";

const TYPE_LABELS = { league: "Liga", tournament: "Torneo" };
const TYPE_BADGE = { league: "badge-league", tournament: "badge-tournament" };
const STATUS_LABELS = { active: "Activo", draft: "Borrador", finished: "Finalizado" };
const STATUS_BADGE = { active: "badge-active", draft: "badge-draft", finished: "badge-finished" };

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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-green-500 uppercase tracking-widest mb-1">
            FC Stats Pro
          </p>
          <h1 className="text-2xl font-bold text-white">
            Hola, {admin?.name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">League Manager — Panel de administración</p>
        </div>
        <div className="flex gap-3 shrink-0">
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Torneos totales" value={loading ? "—" : tournaments.length} />
        <StatCard label="Ligas activas" value={loading ? "—" : activeCount} accent />
        <StatCard label="Clubes registrados" value={loading ? "—" : clubs.length} />
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tournaments.slice(0, 6).map((t) => (
              <TournamentCard
                key={t._id}
                tournament={t}
                onClick={() => navigate(`/tournaments/${t._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${accent ? "text-green-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function TournamentCard({ tournament, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card p-5 text-left w-full group transition-all duration-200"
      style={{}}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#111d30")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
    >
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
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
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
    <div className="card p-10 text-center">
      <p className="text-gray-500 text-sm mb-4">{msg}</p>
      <button onClick={onCta} className="btn-primary mx-auto">
        {cta}
      </button>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="h-5 rounded-full w-12" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
            <div className="h-5 rounded-full w-16" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          </div>
          <div className="h-5 rounded w-40 mb-2" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          <div className="h-3 rounded w-28" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
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
