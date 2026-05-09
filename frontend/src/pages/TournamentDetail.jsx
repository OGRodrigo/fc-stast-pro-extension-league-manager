import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tournamentsApi, matchesApi, clubsApi } from "../api";
import ClubAvatar from "../components/ui/ClubAvatar";
import { Modal, ModalActions, ConfirmModal } from "../components/ui/Modal";
import ProBracket from "../components/ProBracket";
import TournamentShareModal from "../components/share/TournamentShareModal";
import {
  generateLeagueRounds,
  generateCupBracket,
  generateCupNextRoundPairs,
  groupMatchesIntoCupRounds,
  groupMatchesIntoJornadas,
  getCupRoundName,
  isValidCupSize,
  calculateMatchWinner,
} from "../utils/helpers";

const TYPE_LABELS = { league: "Liga", tournament: "Torneo" };
const TYPE_BADGE = { league: "badge-league", tournament: "badge-tournament" };

const FORMAT_LABELS = {
  league: "Tabla de puntos",
  cup: "Copa",
  mixed: "Liga + playoffs",
};

const STATUS_LABELS = {
  active: "Activo",
  draft: "Borrador",
  finished: "Finalizado",
};

const STATUS_BADGE = {
  active: "badge-active",
  draft: "badge-draft",
  finished: "badge-finished",
};

const MATCH_STATUS_BADGE = {
  scheduled: "badge-scheduled",
  played: "badge-played",
};

const MATCH_STATUS_LABELS = {
  scheduled: "Programado",
  played: "Jugado",
};

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDatetimeLocal(dateStr) {
  if (!dateStr) return "";

  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [tournamentClubs, setTournamentClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [table, setTable] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("Clubes");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showEditTournament, setShowEditTournament] = useState(false);
  const [editTournamentError, setEditTournamentError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  const [editingMatch, setEditingMatch] = useState(null);
  const [editMatchError, setEditMatchError] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [showLeagueGenModal, setShowLeagueGenModal] = useState(false);
  const [generatingNextRound, setGeneratingNextRound] = useState(false);

  const allLeaguePlayed =
  matches.filter((m) => m.phase === "league").length > 0 &&
  matches
    .filter((m) => m.phase === "league")
    .every((m) => m.status === "played");

  const load = useCallback(async () => {
    try {
      const [tRes, tcRes, acRes] = await Promise.all([
        tournamentsApi.getOne(id),
        tournamentsApi.getClubs(id),
        clubsApi.getAll(),
      ]);

      setTournament(tRes.data.tournament);
      setTournamentClubs(tcRes.data.clubs ?? []);
      setAllClubs(acRes.data.clubs ?? []);

      const [tableRes, matchRes] = await Promise.allSettled([
        tournamentsApi.getTable(id),
        matchesApi.getAll(id),
      ]);

      setTable(tableRes.status === "fulfilled" ? (tableRes.value.data.table ?? []) : []);
      setMatches(matchRes.status === "fulfilled" ? (matchRes.value.data.matches ?? []) : []);
    } catch {
      setLoadError("Error cargando el torneo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddClub(clubId) {
    try {
      await tournamentsApi.addClub(id, clubId);

      const [clubsRes, tournamentRes] = await Promise.all([
        tournamentsApi.getClubs(id),
        tournamentsApi.getOne(id),
      ]);

      setTournamentClubs(clubsRes.data.clubs ?? []);
      setTournament(tournamentRes.data.tournament);

      try {
        const tableRes = await tournamentsApi.getTable(id);
        setTable(tableRes.data.table ?? []);
      } catch {
        // table not yet available
      }
    } catch (err) {
      alert(err.response?.data?.message ?? "Error agregando club");
    }
  }

  function handleRemoveClub(clubId) {
    setConfirmState({
      message: "¿Quitar este club del torneo?",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await tournamentsApi.removeClub(id, clubId);
          setTournamentClubs((prev) => prev.filter((c) => c._id !== clubId));
          try {
            const tableRes = await tournamentsApi.getTable(id);
            setTable(tableRes.data.table ?? []);
          } catch {
            // table not yet available
          }
        } catch (err) {
          alert(err.response?.data?.message ?? "Error quitando club");
        }
      },
    });
  }

  function handleDeleteMatch(matchId) {
    setConfirmState({
      message: "¿Eliminar este partido?",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await matchesApi.remove(matchId);
          setMatches((prev) => prev.filter((m) => m._id !== matchId));
          try {
            const tableRes = await tournamentsApi.getTable(id);
            setTable(tableRes.data.table ?? []);
          } catch {
            // table not yet available
          }
        } catch (err) {
          alert(err.response?.data?.message ?? "Error eliminando partido");
        }
      },
    });
  }

  async function handleUpdateTournament(formData) {
    try {
      const res = await tournamentsApi.update(id, formData);

      setTournament(res.data.tournament);
      setShowEditTournament(false);
      setEditTournamentError("");
    } catch (err) {
      setEditTournamentError(
        err.response?.data?.message ?? "Error actualizando torneo"
      );
    }
  }

  async function handleUpdateMatch(matchId, formData) {
    try {
      const res = await matchesApi.update(matchId, formData);

      setMatches((prev) =>
        prev.map((m) => (m._id === matchId ? res.data.match : m))
      );

      try {
        const tableRes = await tournamentsApi.getTable(id);
        setTable(tableRes.data.table ?? []);
      } catch {
        // table not yet available
      }

      setEditingMatch(null);
      setEditMatchError("");
    } catch (err) {
      setEditMatchError(
        err.response?.data?.message ?? "Error actualizando partido"
      );
    }
  }

  async function handleGenerateCalendar({ legs = 1 } = {}) {
  setGeneratingCalendar(true);

  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const baseDate = new Date();
  baseDate.setHours(16, 0, 0, 0);

  try {
    if (tournament.format === "cup") {
      const pairs = generateCupBracket(tournamentClubs);

      for (let matchIndex = 0; matchIndex < pairs.length; matchIndex++) {
        const pair = pairs[matchIndex];

        await matchesApi.create(id, {
          homeClub: pair.homeClub,
          awayClub: pair.awayClub,
          date: baseDate.toISOString(),
          status: "scheduled",
          scoreHome: 0,
          scoreAway: 0,

          // Copa: primera ronda
          phase: "cup",
          round: 1,
          order: matchIndex,
        });
      }
    } else {
      const rounds = generateLeagueRounds(tournamentClubs);

      const allRounds =
        legs === 2
          ? [
              ...rounds,
              ...rounds.map((round) =>
                round.map((pair) => ({
                  homeClub: pair.awayClub,
                  awayClub: pair.homeClub,
                }))
              ),
            ]
          : rounds;

      for (let roundIndex = 0; roundIndex < allRounds.length; roundIndex++) {
        const roundDate = new Date(baseDate.getTime() + roundIndex * WEEK);
        const roundMatches = allRounds[roundIndex];

        for (let matchIndex = 0; matchIndex < roundMatches.length; matchIndex++) {
          const pair = roundMatches[matchIndex];

          await matchesApi.create(id, {
            homeClub: pair.homeClub,
            awayClub: pair.awayClub,
            date: roundDate.toISOString(),
            status: "scheduled",
            scoreHome: 0,
            scoreAway: 0,

            // Liga: round = jornada
            phase: "league",
            round: roundIndex + 1,
            order: matchIndex,
          });
        }
      }
    }

    const [matchRes, tableRes] = await Promise.allSettled([
      matchesApi.getAll(id),
      tournamentsApi.getTable(id),
    ]);

    setMatches(
      matchRes.status === "fulfilled"
        ? matchRes.value.data.matches ?? []
        : []
    );

    setTable(
      tableRes.status === "fulfilled"
        ? tableRes.value.data.table ?? []
        : []
    );

    setShowLeagueGenModal(false);
    setActiveTab(tournament.format === "cup" ? "Bracket" : "Partidos");
  } catch (err) {
    alert(err.response?.data?.message ?? "Error generando calendario");
  } finally {
    setGeneratingCalendar(false);
  }
}

async function handleGenerateNextCupRound() {
  const cupMatches = matches.filter((m) => m.phase === "cup");
  // Fall back to all matches for data created before phase field was persisted
  const matchesToGroup = cupMatches.length > 0 ? cupMatches : matches;
  const rounds = groupMatchesIntoCupRounds(matchesToGroup, tournamentClubs.length);
  const lastRound = rounds[rounds.length - 1];

  if (!lastRound) return;

  if (lastRound.length === 1 && lastRound[0].status === "played") {
    alert("El torneo ya tiene un ganador.");
    return;
  }

  if (lastRound.some((m) => m.status !== "played")) {
    alert(
      "Todos los partidos de la ronda actual deben estar marcados como jugados para avanzar."
    );
    return;
  }

  const nextPairs = generateCupNextRoundPairs(lastRound);

  if (!nextPairs.length) return;

  const lastDate = Math.max(
    ...lastRound.map((m) => new Date(m.date).getTime())
  );

  const nextDate = new Date(lastDate + 7 * 24 * 60 * 60 * 1000);
  nextDate.setHours(16, 0, 0, 0);

  const nextRoundNumber =
    Math.max(...lastRound.map((m) => Number(m.round || 1))) + 1;

  setGeneratingNextRound(true);

  try {
    for (let matchIndex = 0; matchIndex < nextPairs.length; matchIndex++) {
      const pair = nextPairs[matchIndex];

      await matchesApi.create(id, {
        homeClub: pair.homeClub,
        awayClub: pair.awayClub,
        date: nextDate.toISOString(),
        status: "scheduled",
        scoreHome: 0,
        scoreAway: 0,

        // Copa: siguiente ronda real
        phase: "cup",
        round: nextRoundNumber,
        order: matchIndex,
      });
    }

    const [matchRes] = await Promise.allSettled([matchesApi.getAll(id)]);

    setMatches(
      matchRes.status === "fulfilled"
        ? matchRes.value.data.matches ?? []
        : matches
    );
  } catch (err) {
    alert(err.response?.data?.message ?? "Error generando siguiente ronda");
  } finally {
    setGeneratingNextRound(false);
  }
}

async function handleGeneratePlayoffs() {
  if (!tournament.playoffTeams || table.length < tournament.playoffTeams) {
    alert("No hay suficientes datos en la tabla para generar playoffs.");
    return;
  }

  const existingPlayoffMatches = matches.filter((m) => m.phase === "playoff");

  if (existingPlayoffMatches.length > 0) {
    alert("Los playoffs ya fueron generados.");
    return;
  }

  const qualifiedClubs = table
    .slice(0, tournament.playoffTeams)
    .map((row) => ({ _id: row.club.id }));

  const pairs = generateCupBracket(qualifiedClubs);

  const leagueMatches = matches.filter((m) => m.phase === "league");

  const lastLeagueDate =
    leagueMatches.length > 0
      ? Math.max(...leagueMatches.map((m) => new Date(m.date).getTime()))
      : Date.now();

  const playoffDate = new Date(lastLeagueDate + 7 * 24 * 60 * 60 * 1000);
  playoffDate.setHours(16, 0, 0, 0);

  setGeneratingCalendar(true);

  try {
    for (let matchIndex = 0; matchIndex < pairs.length; matchIndex++) {
      const pair = pairs[matchIndex];

      await matchesApi.create(id, {
        homeClub: pair.homeClub,
        awayClub: pair.awayClub,
        date: playoffDate.toISOString(),
        status: "scheduled",
        scoreHome: 0,
        scoreAway: 0,

        // Playoffs: primera ronda real
        phase: "playoff",
        round: 1,
        order: matchIndex,
      });
    }

    const [matchRes] = await Promise.allSettled([matchesApi.getAll(id)]);

    setMatches(
      matchRes.status === "fulfilled"
        ? matchRes.value.data.matches ?? []
        : matches
    );

    setActiveTab("Playoffs");
  } catch (err) {
    alert(err.response?.data?.message ?? "Error generando playoffs");
  } finally {
    setGeneratingCalendar(false);
  }
}

async function handleGenerateNextPlayoffRound() {
  // 👉 SOLO partidos de playoff (sin hacks de slice por fecha)
  const playoffMatches = matches.filter((m) => m.phase === "playoff");

  const rounds = groupMatchesIntoCupRounds(
    playoffMatches,
    tournament.playoffTeams
  );

  const lastRound = rounds[rounds.length - 1];

  if (!lastRound) return;

  if (lastRound.length === 1 && lastRound[0].status === "played") {
    alert("Los playoffs ya tienen un ganador.");
    return;
  }

  if (lastRound.some((m) => m.status !== "played")) {
    alert("Todos los partidos de la ronda actual deben estar jugados.");
    return;
  }

  const nextPairs = generateCupNextRoundPairs(lastRound);

  if (!nextPairs.length) return;

  const lastDate = Math.max(
    ...lastRound.map((m) => new Date(m.date).getTime())
  );

  const nextDate = new Date(lastDate + 7 * 24 * 60 * 60 * 1000);
  nextDate.setHours(16, 0, 0, 0);

  // 👉 NUEVO: calcular siguiente ronda real
  const nextRoundNumber =
    Math.max(...lastRound.map((m) => Number(m.round || 1))) + 1;

  setGeneratingNextRound(true);

  try {
    for (let matchIndex = 0; matchIndex < nextPairs.length; matchIndex++) {
      const pair = nextPairs[matchIndex];

      await matchesApi.create(id, {
        homeClub: pair.homeClub,
        awayClub: pair.awayClub,
        date: nextDate.toISOString(),
        status: "scheduled",
        scoreHome: 0,
        scoreAway: 0,

        // 🔥 CLAVE
        phase: "playoff",
        round: nextRoundNumber,
        order: matchIndex,
      });
    }

    const [matchRes] = await Promise.allSettled([matchesApi.getAll(id)]);

    setMatches(
      matchRes.status === "fulfilled"
        ? matchRes.value.data.matches ?? []
        : matches
    );
  } catch (err) {
    alert(
      err.response?.data?.message ??
        "Error generando siguiente ronda de playoffs"
    );
  } finally {
    setGeneratingNextRound(false);
  }
}

  async function handleMarkMatchPlayed(matchId) {
    try {
      const res = await matchesApi.update(matchId, { status: "played" });
      setMatches((prev) =>
        prev.map((m) => (m._id === matchId ? res.data.match : m))
      );
      try {
        const tableRes = await tournamentsApi.getTable(id);
        setTable(tableRes.data.table ?? []);
      } catch {
        // table not yet available
      }
    } catch (err) {
      alert(err.response?.data?.message ?? "Error actualizando partido");
    }
  }

  async function handleVisibilityUpdate(data) {
    const res = await tournamentsApi.update(id, data);
    setTournament(res.data.tournament);
  }

  if (loading) return <TournamentDetailSkeleton />;

  if (loadError || !tournament) {
    return (
      <div className="card p-10 text-center space-y-4">
        <p className="text-red-400">{loadError || "Torneo no encontrado"}</p>
        <button
          onClick={() => navigate("/tournaments")}
          className="btn-secondary mx-auto"
        >
          Volver a torneos
        </button>
      </div>
    );
  }

  const inTournamentIds = new Set(tournamentClubs.map((c) => c._id));
  const clubsToAdd = allClubs.filter((c) => !inTournamentIds.has(c._id));

  const tabs =
    tournament.format === "cup"
      ? ["Clubes", "Bracket", "Partidos"]
      : tournament.format === "mixed"
      ? ["Clubes", "Tabla", "Partidos", "Playoffs"]
      : ["Clubes", "Tabla", "Partidos"];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/tournaments")}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <BackIcon /> Torneos
      </button>

      <div
  className="relative overflow-hidden rounded-[32px] px-7 py-7 md:px-9 md:py-8"
  style={{
    background:
      "linear-gradient(135deg, rgba(8,18,28,.96), rgba(5,10,16,.98))",
    border: "1px solid rgba(36,255,122,.12)",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,.02), 0 28px 70px rgba(0,0,0,.55)",
  }}
>
  {/* Glow FX */}
  <div
    className="pointer-events-none absolute inset-0"
    style={{
      background:
        "radial-gradient(circle at top left, rgba(36,255,122,.14), transparent 30%), radial-gradient(circle at right, rgba(54,230,255,.10), transparent 28%)",
    }}
  />

  {/* Neon Accent */}
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: "4px",
      background: "var(--fifa-neon)",
      boxShadow: "0 0 18px var(--fifa-neon)",
    }}
  />

  <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
    {/* LEFT */}
    <div className="flex items-start gap-5">
      {/* Tournament Logo */}
      <div
        className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border"
        style={{
          borderColor: "rgba(36,255,122,.18)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01))",
          boxShadow: "0 0 24px rgba(36,255,122,.08)",
        }}
      >
        {tournament.logo ? (
          <img
            src={tournament.logo}
            alt={tournament.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <TrophyIcon />
        )}
      </div>

      {/* Tournament Info */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={
              TYPE_BADGE[tournament.type] ?? "badge-tournament"
            }
          >
            {TYPE_LABELS[tournament.type] ?? tournament.type}
          </span>

          <span
            className={
              STATUS_BADGE[tournament.status] ?? "badge-draft"
            }
          >
            {STATUS_LABELS[tournament.status] ?? tournament.status}
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-title)",
            fontSize: "clamp(2rem,4vw,3rem)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {tournament.name}
        </h1>

        <p
          className="mt-3 max-w-2xl text-sm"
          style={{
            color: "var(--fifa-mute)",
            fontFamily: "var(--font-ui)",
          }}
        >
          Plataforma competitiva para administrar clubes,
          calendarios, standings y playoffs inspirados en el
          ecosistema competitivo de EA FC.
        </p>

        {/* Meta */}
        <div className="mt-5 flex flex-wrap gap-3">
          <MetaBadge
            label="Temporada"
            value={tournament.season}
          />

          <MetaBadge
            label="Equipos"
            value={`${tournamentClubs.length}/${tournament.maxClubs ?? "—"}`}
          />

          <MetaBadge
            label="Formato"
            value={
              FORMAT_LABELS[tournament.format] ??
              tournament.format ??
              "—"
            }
          />

          {tournament.hasPlayoffs && (
            <MetaBadge
              label="Playoffs"
              value={`Top ${tournament.playoffTeams}`}
              neon
            />
          )}
        </div>
      </div>
    </div>

    {/* RIGHT */}
    <div className="flex flex-wrap items-center gap-3">
      {tournament.visibility === "public" && tournament.publicSlug && (
        <button
          onClick={() => setShareOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 14px", borderRadius: "10px",
            fontSize: "13px", fontWeight: 600,
            color: "#24ff7a",
            background: "rgba(36,255,122,.08)",
            border: "1px solid rgba(36,255,122,.28)",
            cursor: "pointer", transition: "all .15s",
            boxShadow: "0 0 14px rgba(36,255,122,.12)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Compartir
        </button>
      )}
      <button
        onClick={() => {
          setEditTournamentError("");
          setShowEditTournament(true);
        }}
        className="btn-secondary flex items-center gap-2"
      >
        <PencilIcon />
        Editar
      </button>
    </div>
  </div>
</div>

<TournamentShareModal
  isOpen={shareOpen}
  onClose={() => setShareOpen(false)}
  tournament={tournament}
  table={table}
/>

      <VisibilityBar tournament={tournament} onUpdate={handleVisibilityUpdate} />
      

      <div
        style={{
          borderBottom: "1px solid var(--fifa-line)",
          backgroundColor: "rgba(4,8,14,.6)",
          borderRadius: "12px 12px 0 0",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "14px 18px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: ".01em",
                  color: isActive ? "#fff" : "rgba(255,255,255,.38)",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? "var(--fifa-neon)" : "transparent"}`,
                  marginBottom: "-1px",
                  boxShadow: isActive ? "0 2px 10px rgba(36,255,122,.15)" : "none",
                  textShadow: isActive ? "0 0 10px rgba(36,255,122,.25)" : "none",
                  cursor: "pointer",
                  transition: "all .15s",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--fifa-neon)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,.38)";
                }}
              >
                {tab}
                {tab === "Clubes" && (
                  <span style={{ marginLeft: "5px", fontSize: "10px", color: "rgba(255,255,255,.3)" }}>
                    ({tournamentClubs.length}/{tournament.maxClubs ?? "—"})
                  </span>
                )}
                {tab === "Partidos" && (
                  <span style={{ marginLeft: "5px", fontSize: "10px", color: "rgba(255,255,255,.3)" }}>
                    ({matches.length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "Clubes" && (
        <ClubsTab
          tournament={tournament}
          tournamentClubs={tournamentClubs}
          clubsToAdd={clubsToAdd}
          onAdd={handleAddClub}
          onRemove={handleRemoveClub}
        />
      )}

      {activeTab === "Tabla" && (
        <LeagueTable
          table={table}
          playoffTeams={tournament.format === "mixed" ? tournament.playoffTeams : 0}
          champion={
            tournament.format === "league" && allLeaguePlayed && table.length > 0
              ? table[0].club
              : null
          }
        />
      )}

      {activeTab === "Bracket" && (
        <BracketTab
          tournament={tournament}
          matches={matches}
          tournamentClubs={tournamentClubs}
          onEdit={(match) => {
            setEditMatchError("");
            setEditingMatch(match);
          }}
          onGenerate={handleGenerateCalendar}
          onGenerateNext={handleGenerateNextCupRound}
          isGenerating={generatingCalendar || generatingNextRound}
        />
      )}

      {activeTab === "Playoffs" && (
        <PlayoffsTab
          tournament={tournament}
          table={table}
          matches={matches}
          tournamentClubs={tournamentClubs}
          onGeneratePlayoffs={handleGeneratePlayoffs}
          onGenerateNextRound={handleGenerateNextPlayoffRound}
          isGenerating={generatingCalendar || generatingNextRound}
        />
      )}

      {activeTab === "Partidos" && (
        <MatchesTab
          matches={matches}
          tournamentId={id}
          format={tournament.format}
          tournamentClubs={tournamentClubs}
          onDelete={handleDeleteMatch}
          onEdit={(match) => {
            setEditMatchError("");
            setEditingMatch(match);
          }}
          onMarkPlayed={handleMarkMatchPlayed}
          onView={(matchId) => navigate(`/tournaments/${id}/matches/${matchId}`)}
          onGenerate={() => {
            if (tournament.format === "cup") {
              handleGenerateCalendar();
            } else {
              setShowLeagueGenModal(true);
            }
          }}
          isGenerating={generatingCalendar || generatingNextRound}
          navigate={navigate}
        />
      )}

      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {showEditTournament && (
        <EditTournamentModal
          tournament={tournament}
          error={editTournamentError}
          onSave={handleUpdateTournament}
          onClose={() => setShowEditTournament(false)}
        />
      )}

      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          clubs={tournamentClubs}
          error={editMatchError}
          onSave={(data) => handleUpdateMatch(editingMatch._id, data)}
          onClose={() => setEditingMatch(null)}
        />
      )}

      {showLeagueGenModal && (
        <LeagueGenerateModal
          clubCount={tournamentClubs.length}
          onGenerate={handleGenerateCalendar}
          onClose={() => setShowLeagueGenModal(false)}
          isGenerating={generatingCalendar}
        />
      )}
    </div>
  );
}

function ClubsTab({ tournament, tournamentClubs, clubsToAdd, onAdd, onRemove }) {
  const isFull =
    tournament.maxClubs && tournamentClubs.length >= tournament.maxClubs;

  return (
    <div className="space-y-6">
      <div>
        <p className="section-title">
          Clubes en el torneo{" "}
          <span className="text-gray-600">
            ({tournamentClubs.length}/{tournament.maxClubs ?? "—"})
          </span>
        </p>

        {tournamentClubs.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500 text-sm">
              No hay clubes en este torneo todavía
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th className="hidden sm:table-cell">Abrev.</th>
                    <th className="hidden sm:table-cell">País</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {tournamentClubs.map((club) => (
                    <tr key={club._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <ClubAvatar name={club.name} />
                          <span className="font-medium text-gray-100">
                            {club.name}
                          </span>
                        </div>
                      </td>

                      <td className="hidden sm:table-cell">
                        <span className="text-xs text-green-400 font-bold">
                          {club.abbr || "—"}
                        </span>
                      </td>

                      <td className="hidden sm:table-cell text-gray-400">{club.country || "—"}</td>

                      <td className="text-right">
                        <button
                          onClick={() => onRemove(club._id)}
                          className="btn-danger"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="section-title">Agregar club al torneo</p>

        {isFull ? (
          <div className="card p-6 text-center">
            <p className="text-yellow-400 text-sm">
              Este torneo ya alcanzó el máximo de equipos permitidos.
            </p>
          </div>
        ) : clubsToAdd.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-gray-500 text-sm">
              No hay clubes disponibles para agregar.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th className="hidden sm:table-cell">Abrev.</th>
                    <th className="hidden sm:table-cell">País</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {clubsToAdd.map((club) => (
                    <tr key={club._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <ClubAvatar name={club.name} dim />
                          <span className="text-gray-400">{club.name}</span>
                        </div>
                      </td>

                      <td className="hidden sm:table-cell">
                        <span className="text-xs text-green-400 font-bold">
                          {club.abbr || "—"}
                        </span>
                      </td>

                      <td className="hidden sm:table-cell text-gray-500">{club.country || "—"}</td>

                      <td className="text-right">
                        <button
                          onClick={() => onAdd(club._id)}
                          className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                          style={{
                            color: "var(--fifa-neon)",
                            borderColor: "rgba(36,255,122,0.20)",
                            backgroundColor: "rgba(36,255,122,0.06)",
                          }}
                        >
                          + Agregar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function VisibilityBar({ tournament, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isPublic = tournament.visibility === "public";

  const publicUrl =
    isPublic && tournament.publicSlug
      ? `${window.location.origin}/public/tournaments/${tournament.publicSlug}`
      : null;

  async function makePublic() {
    const slug = tournament.publicSlug || generateSlug(tournament.name);

    setLoading(true);

    try {
      await onUpdate({
        visibility: "public",
        publicSlug: slug,
      });

      toast.success("Torneo publicado correctamente");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error actualizando visibilidad");
    } finally {
      setLoading(false);
    }
  }

  async function makePrivate() {
    setLoading(true);

    try {
      await onUpdate({ visibility: "private" });
      toast.success("Torneo privado correctamente");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error actualizando visibilidad");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="card px-5 py-3.5 flex items-center gap-4 flex-wrap"
        style={{
          borderColor: isPublic ? "rgba(36,255,122,0.25)" : "var(--fifa-line)",
          backgroundColor: isPublic ? "rgba(36,255,122,0.03)" : undefined,
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <GlobeIcon isPublic={isPublic} />

          <span
            className="text-xs font-semibold uppercase tracking-wider shrink-0"
            style={{ color: "var(--fifa-mute)" }}
          >
            Visibilidad
          </span>

          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0"
            style={
              isPublic
                ? {
                    color: "var(--fifa-neon)",
                    backgroundColor: "rgba(36,255,122,0.12)",
                  }
                : {
                    color: "var(--fifa-mute)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }
            }
          >
            {isPublic ? "Público" : "Privado"}
          </span>

          {publicUrl && (
            <span
              className="text-xs truncate hidden sm:block"
              style={{ color: "var(--fifa-mute)" }}
              title={publicUrl}
            >
              {publicUrl}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPublic ? (
            <>
              <button
                onClick={() => setShareOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  color: "var(--fifa-neon)",
                  borderColor: "rgba(36,255,122,0.30)",
                  backgroundColor: "rgba(36,255,122,0.06)",
                }}
              >
                Compartir torneo
              </button>

              <button
                onClick={makePrivate}
                disabled={loading}
                className="btn-danger"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                {loading ? "Guardando..." : "Hacer privado"}
              </button>
            </>
          ) : (
            <button
              onClick={makePublic}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all"
              style={{
                color: "var(--fifa-neon)",
                borderColor: "rgba(36,255,122,0.30)",
                backgroundColor: "rgba(36,255,122,0.06)",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Guardando..." : "Hacer público"}
            </button>
          )}
        </div>
      </div>

      {shareOpen && publicUrl && (
        <AdminShareModal
          tournament={tournament}
          publicUrl={publicUrl}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}

function AdminShareModal({ tournament, publicUrl, onClose }) {
  const shareText = `Sigue el torneo ${tournament.name} en FC Stats Pro League Manager`;
  const encodedText = encodeURIComponent(`${shareText}: ${publicUrl}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      toast.error("Compartir nativo no disponible en este navegador");
      return;
    }

    try {
      await navigator.share({
        title: tournament.name,
        text: shareText,
        url: publicUrl,
      });
    } catch {
      // Usuario canceló compartir
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(0,0,0,.72)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="w-full max-w-md rounded-[28px] border p-6"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,34,43,.96), rgba(6,16,22,.98))",
          borderColor: "rgba(36,255,122,.18)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,.03), 0 28px 70px rgba(0,0,0,.65)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              style={{
                fontFamily: "var(--font-title)",
                color: "var(--fifa-neon)",
                fontSize: "0.75rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Compartir torneo
            </p>

            <h2
              className="mt-2 text-2xl font-black uppercase"
              style={{
                fontFamily: "var(--font-title)",
                color: "var(--fifa-text)",
              }}
            >
              {tournament.name}
            </h2>

            <p className="mt-2 text-sm" style={{ color: "var(--fifa-mute)" }}>
              Comparte la página pública del torneo con jugadores, comunidades
              o redes sociales.
            </p>
          </div>

          <button onClick={onClose} className="btn-secondary">
            ×
          </button>
        </div>

        <div
          className="mt-5 rounded-2xl border p-3 text-xs break-all"
          style={{
            color: "var(--fifa-mute)",
            borderColor: "rgba(255,255,255,.08)",
            backgroundColor: "rgba(255,255,255,.035)",
          }}
        >
          {publicUrl}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={nativeShare} className="btn-primary">
            Compartir
          </button>

          <button onClick={copyLink} className="btn-secondary">
            Copiar link
          </button>

          <a
            href={`https://wa.me/?text=${encodedText}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-center"
          >
            WhatsApp
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-center"
          >
            X / Twitter
          </a>
        </div>

        <p className="mt-4 text-xs leading-6" style={{ color: "var(--fifa-mute)" }}>
          Instagram y Discord no permiten compartir web directo de forma fiable
          desde navegador. En móvil, usa el botón “Compartir” para abrir las apps
          disponibles.
        </p>
      </div>
    </div>
  );
}


function ImageIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      style={{ color: "var(--fifa-mute)" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      className="h-10 w-10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      style={{
        color: "var(--fifa-neon)",
        filter: "drop-shadow(0 0 10px rgba(36,255,122,.35))",
      }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3h3a1.5 1.5 0 011.5 1.5V6a5 5 0 01-5 5h-.09M7.5 3h-3A1.5 1.5 0 003 4.5V6a5 5 0 005 5h.09m3.91-8v11m0 0l-3 3m3-3l3 3m-3-3H9"
      />
    </svg>
  );
}


function GlobeIcon({ isPublic }) {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      style={{ color: isPublic ? "var(--fifa-neon)" : "var(--fifa-mute)" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

function MatchesTab({
  matches,
  tournamentId,
  format,
  tournamentClubs,
  onDelete,
  onEdit,
  onMarkPlayed,
  onView,
  onGenerate,
  isGenerating,
  navigate,
}) {
  const [filter, setFilter] = useState("all");

  const scheduledCount = matches.filter((m) => m.status === "scheduled").length;
  const playedCount = matches.filter((m) => m.status === "played").length;

  const filtered =
    filter === "all" ? matches : matches.filter((m) => m.status === filter);

  const FILTERS = [
    { key: "all", label: "Todos", count: matches.length },
    { key: "scheduled", label: "Programados", count: scheduledCount },
    { key: "played", label: "Jugados", count: playedCount },
  ];

  const canGenerate =
    tournamentClubs.length >= 2 &&
    (format !== "cup" || isValidCupSize(tournamentClubs.length));

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => navigate(`/tournaments/${tournamentId}/matches/create`)}
          className="btn-primary"
        >
          <PlusIcon /> Crear partido manual
        </button>

        <button
          onClick={() =>
            navigate(`/tournaments/${tournamentId}/matches/import-image`)
          }
          className="btn-secondary"
        >
          <ImageIcon /> Importar por imagen
        </button>

        {matches.length === 0 && canGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="btn-secondary flex items-center gap-2"
            style={{
              color: "var(--fifa-neon)",
              borderColor: "rgba(36,255,122,0.30)",
              backgroundColor: "rgba(36,255,122,0.05)",
            }}
          >
            <CalendarIcon />
            {isGenerating ? "Generando..." : "Generar calendario"}
          </button>
        )}
      </div>

      {matches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all"
              style={
                filter === f.key
                  ? {
                      color: "var(--fifa-neon)",
                      borderColor: "rgba(36,255,122,0.35)",
                      backgroundColor: "rgba(36,255,122,0.10)",
                    }
                  : {
                      color: "var(--fifa-mute)",
                      borderColor: "var(--fifa-line)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }
              }
            >
              {f.label}{" "}
              <span
                className="ml-1 rounded px-1"
                style={{
                  backgroundColor:
                    filter === f.key
                      ? "rgba(36,255,122,0.15)"
                      : "rgba(255,255,255,0.06)",
                  color:
                    filter === f.key
                      ? "var(--fifa-neon)"
                      : "var(--fifa-mute)",
                  fontSize: "0.65rem",
                }}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 text-sm">
            {filter !== "all"
              ? `No hay partidos ${
                  filter === "scheduled" ? "programados" : "jugados"
                }`
              : tournamentClubs.length < 2
              ? "Agrega equipos para comenzar"
              : "No hay partidos registrados todavía"}
          </p>
        </div>
      ) : format !== "cup" ? (
        <JornadaMatchList
          matches={filtered}
          onDelete={onDelete}
          onEdit={onEdit}
          onMarkPlayed={onMarkPlayed}
          onView={onView}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((match) => (
            <MatchRow
              key={match._id}
              match={match}
              onDelete={() => onDelete(match._id)}
              onEdit={() => onEdit(match)}
              onMarkPlayed={() => onMarkPlayed(match._id)}
              onView={() => onView(match._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JornadaMatchList({ matches, onDelete, onEdit, onMarkPlayed, onView }) {
  const jornadas = groupMatchesIntoJornadas(matches);

  if (jornadas.length <= 1) {
    return (
      <div className="space-y-2">
        {matches.map((match) => (
          <MatchRow
            key={match._id}
            match={match}
            onDelete={() => onDelete(match._id)}
            onEdit={() => onEdit(match)}
            onMarkPlayed={() => onMarkPlayed(match._id)}
            onView={() => onView(match._id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {jornadas.map((group, idx) => {
        const playedCount = group.filter((m) => m.status === "played").length;
        return (
          <div key={idx}>
            <div className="flex items-center gap-3 mb-2">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--fifa-neon)" }}
              >
                Jornada {idx + 1}
              </p>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "var(--fifa-mute)",
                }}
              >
                {playedCount}/{group.length} jugados
              </span>
            </div>
            <div className="space-y-2">
              {group.map((match) => (
                <MatchRow
                  key={match._id}
                  match={match}
                  onDelete={() => onDelete(match._id)}
                  onEdit={() => onEdit(match)}
                  onMarkPlayed={() => onMarkPlayed(match._id)}
                  onView={() => onView(match._id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatchRow({ match, onDelete, onEdit, onMarkPlayed, onView }) {
  const date = new Date(match.date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const homeLabel = match.homeClub?.abbr || match.homeClub?.name || "—";
  const awayLabel = match.awayClub?.abbr || match.awayClub?.name || "—";

  return (
    <div
      className="card px-5 py-4 flex items-center gap-4 cursor-pointer"
      onClick={onView}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--fifa-line)";
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={MATCH_STATUS_BADGE[match.status] ?? "badge-scheduled"}>
            {MATCH_STATUS_LABELS[match.status] ?? match.status}
          </span>

          <span className="text-xs text-gray-600">{date}</span>

          {match.stadium && (
            <span className="hidden sm:inline text-xs text-gray-600 truncate">
              {match.stadium}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-sm font-semibold text-gray-200 flex-1 text-right truncate">
            {homeLabel}
          </span>

          <span className="text-xl font-bold text-white tabular-nums shrink-0">
            {match.scoreHome} – {match.scoreAway}
          </span>

          <span className="text-sm font-semibold text-gray-200 flex-1 truncate">
            {awayLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
        {match.status === "scheduled" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkPlayed();
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap"
            style={{
              color: "var(--fifa-neon)",
              borderColor: "rgba(36,255,122,0.20)",
              backgroundColor: "rgba(36,255,122,0.06)",
            }}
          >
            ✓ <span className="hidden sm:inline">Jugado</span>
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap"
          style={{
            color: "var(--fifa-mute)",
            borderColor: "var(--fifa-line)",
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          <span className="hidden sm:inline">Editar</span>
          <span className="sm:hidden">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="btn-danger whitespace-nowrap"
        >
          <span className="hidden sm:inline">Eliminar</span>
          <span className="sm:hidden">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}

function CupBracketTab({
  matches,
  tournamentClubs,
  onGenerate,
  onGenerateNext,
  isGenerating,
}) {
  const count = tournamentClubs.length;

  if (count < 2) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-500 text-sm">Agrega equipos para comenzar</p>
      </div>
    );
  }

  if (!isValidCupSize(count)) {
    return (
      <div className="card p-10 text-center space-y-2">
        <p className="text-yellow-400 text-sm font-medium">
          El formato copa requiere 4, 8 o 16 equipos
        </p>
        <p className="text-xs" style={{ color: "var(--fifa-mute)" }}>
          Actualmente hay {count} equipos en el torneo
        </p>
      </div>
    );
  }

  const cupMatches = matches.filter((m) => m.phase === "cup");

  if (cupMatches.length === 0) {
    return (
      <div className="card p-10 text-center space-y-4">
        <p className="text-gray-500 text-sm">
          El bracket no ha sido generado aún
        </p>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn-primary mx-auto"
        >
          {isGenerating ? "Generando..." : "Generar bracket"}
        </button>
      </div>
    );
  }

  const rounds = groupMatchesIntoCupRounds(cupMatches, count);
  const lastRound = rounds[rounds.length - 1];
  const allPlayed = lastRound?.every((m) => m.status === "played");
  const isFinal = lastRound?.length === 1;
  const finalMatch = isFinal ? lastRound[0] : null;
  const isOver = finalMatch?.status === "played";

  const winner = isOver
    ? finalMatch.scoreHome >= finalMatch.scoreAway
      ? finalMatch.homeClub
      : finalMatch.awayClub
    : null;

  return (
    <div className="space-y-5">
      {winner && <WinnerBanner club={winner} />}

      {!isOver && allPlayed && !isFinal && (
        <button
          onClick={onGenerateNext}
          disabled={isGenerating}
          className="btn-primary flex items-center gap-2"
        >
          <CalendarIcon />
          {isGenerating
            ? "Generando..."
            : `Generar ${getCupRoundName(count, rounds.length)} →`}
        </button>
      )}

      <CupBracket
        matches={cupMatches}
        count={count}
      />
    </div>
  );
}

// Constantes de geometría del bracket
const SLOT_H = 120;   // px de alto por slot (tarjeta de partido)
const SLOT_W = 200;   // px de ancho de cada columna
const CONN_W = 32;    // px de ancho del conector entre columnas
const LABEL_H = 44;   // px de alto para la etiqueta de ronda

function CupBracketSlot({ match, onClick }) {
  const { isPlayed, homeWon, awayWon } = calculateMatchWinner(match);

  const handleClick = () => {
    if (typeof onClick === "function") onClick(match);
  };

  const TeamRow = ({ club, score, winner, muted }) => (
    <div
      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all"
      style={{
        background: winner
          ? "linear-gradient(90deg, rgba(36,255,122,.12), rgba(36,255,122,.04))"
          : "rgba(255,255,255,.04)",
        border: winner ? "1px solid rgba(36,255,122,.22)" : "1px solid rgba(255,255,255,.06)",
        opacity: muted ? 0.48 : 1,
        borderLeft: winner ? "3px solid var(--fifa-neon)" : "none",
      }}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <ClubAvatar name={club?.name || "TBD"} logo={club?.logo} small />
        <span
          className="text-xs font-bold uppercase truncate"
          style={{
            color: winner ? "var(--fifa-neon)" : "var(--fifa-text)",
          }}
        >
          {club?.abbr || club?.name || "TBD"}
        </span>
      </div>
      <span
        className="text-sm font-black tabular-nums ml-auto"
        style={{
          color: winner ? "var(--fifa-neon)" : "var(--fifa-text)",
        }}
      >
        {score ?? "-"}
      </span>
    </div>
  );

  return (
    <div
      onClick={handleClick}
      className="rounded-xl border transition-all cursor-pointer hover:shadow-lg"
      style={{
        width: `${SLOT_W}px`,
        borderColor: isPlayed ? "rgba(36,255,122,.18)" : "rgba(255,255,255,.08)",
        background: "linear-gradient(135deg, rgba(9,22,30,.8), rgba(4,8,14,.9))",
        boxShadow: isPlayed ? "0 0 12px rgba(36,255,122,.12)" : "0 4px 12px rgba(0,0,0,.3)",
      }}
    >
      <div className="flex flex-col gap-1 p-1.5">
        <TeamRow
          club={match.homeClub}
          score={match.scoreHome}
          winner={homeWon}
          muted={isPlayed && awayWon}
        />
        <TeamRow
          club={match.awayClub}
          score={match.scoreAway}
          winner={awayWon}
          muted={isPlayed && homeWon}
        />
      </div>
    </div>
  );
}

function CupBracketColumn({ title, slots, roundIndex, onMatchClick }) {
  const blockH = SLOT_H * (1 << roundIndex); // Bitshift is faster than Math.pow for powers of 2

  return (
    <div className="flex flex-col items-center">
      <p
        className="text-[11px] font-black uppercase tracking-[0.4em] mb-3 text-center whitespace-nowrap"
        style={{
          color: title === "Final" ? "var(--fifa-neon)" : "rgba(255,255,255,.65)",
          height: `${LABEL_H}px`,
          display: "flex",
          alignItems: "center",
        }}
      >
        {title}
      </p>

      <div
        className="flex flex-col relative"
        style={{
          gap: `${roundIndex === 0 ? 12 : blockH - SLOT_H}px`,
        }}
      >
        {slots.map((slot, idx) => (
          <div
            key={idx}
            style={{
              paddingTop: idx === 0 ? 0 : 0,
              paddingBottom: idx === slots.length - 1 ? 0 : 0,
            }}
          >
            {slot ? (
              <CupBracketSlot match={slot} onClick={onMatchClick} />
            ) : (
              <div
                className="rounded-lg border flex items-center justify-center text-[10px]"
                style={{
                  width: `${SLOT_W}px`,
                  height: `${SLOT_H}px`,
                  borderColor: "rgba(36,255,122,.08)",
                  color: "var(--fifa-mute)",
                  background: "rgba(255,255,255,.01)",
                }}
              >
                —
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CupBracketConnector({ sourceSlots, targetSlots }) {
  const slotHeight = SLOT_H;
  const sourceBlockH = slotHeight * Math.pow(2, 1); // Asumiendo que vienen de rondas anteriores

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: `${CONN_W}px`,
        height: "auto",
      }}
    >
      <svg
        width={CONN_W}
        height="100%"
        style={{
          overflow: "visible",
          minHeight: "200px",
        }}
      >
        <g stroke="rgba(36,255,122,0.35)" strokeWidth="2" fill="none">
          {/* Stubs de conexión simplificados */}
          {[0, 1].map((i) => {
            const y = (i + 0.5) * sourceBlockH;
            return (
              <g key={`stub-${i}`}>
                <line x1="0" y1={y} x2={10} y2={y} />
              </g>
            );
          })}
          {/* Vertical bar connecting the two stubs */}
          <line x1="10" y1={sourceBlockH * 0.5} x2="10" y2={sourceBlockH * 1.5} />
          {/* Final stub to next round */}
          <line x1="10" y1={sourceBlockH} x2={CONN_W} y2={sourceBlockH} />
        </g>
      </svg>
    </div>
  );
}

function CupBracket({ matches, count, onMatchClick }) {
  const rounds = groupMatchesIntoCupRounds(matches, count);

  if (!rounds.length) return null;

  const finalRound = rounds[rounds.length - 1] ?? [];
  const sideRounds = rounds.slice(0, -1);

  const leftRounds = sideRounds.map((round) =>
    round.slice(0, Math.ceil(round.length / 2))
  );

  const rightRounds = [...sideRounds]
    .reverse()
    .map((round) => round.slice(Math.ceil(round.length / 2)));

  return (
    <div
      className="relative overflow-x-auto rounded-[34px] p-8"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,22,32,.96), rgba(4,8,14,.98))",
        border: "1px solid rgba(36,255,122,.12)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,.02), 0 30px 80px rgba(0,0,0,.65)",
      }}
    >
      <div
        className="relative z-10 flex min-w-max items-center justify-start gap-0"
        style={{
          padding: `${LABEL_H + 20}px 20px 20px 20px`,
        }}
      >
        {/* Left side - rondas de afuera hacia adentro */}
        {leftRounds.map((round, index) => (
          <div key={`left-group-${index}`} className="flex items-center gap-0">
            <CupBracketColumn
              title={getCupRoundName(count, index)}
              slots={round}
              roundIndex={index}
              onMatchClick={onMatchClick}
            />
            {index < leftRounds.length - 1 && (
              <div
                className="flex-shrink-0"
                style={{
                  width: `${CONN_W}px`,
                  minHeight: "200px",
                }}
              />
            )}
          </div>
        ))}

        {/* Final/Current round in the center */}
        {finalRound.length > 0 && (
          <div className="flex items-center">
            {sideRounds.length > 0 && (
              <div
                className="flex-shrink-0"
                style={{
                  width: `${CONN_W}px`,
                }}
              />
            )}
            <CupBracketColumn
              title={getCupRoundName(count, sideRounds.length)}
              slots={finalRound}
              roundIndex={sideRounds.length}
              onMatchClick={onMatchClick}
            />
            {sideRounds.length > 0 && (
              <div
                className="flex-shrink-0"
                style={{
                  width: `${CONN_W}px`,
                }}
              />
            )}
          </div>
        )}

        {/* Right side - rondas de adentro hacia afuera (espejo) */}
        {rightRounds.map((round, index) => {
          const originalIndex = sideRounds.length - 1 - index;
          return (
            <div key={`right-group-${index}`} className="flex items-center gap-0">
              {index > 0 && (
                <div
                  className="flex-shrink-0"
                  style={{
                    width: `${CONN_W}px`,
                  }}
                />
              )}
              <CupBracketColumn
                title={getCupRoundName(count, originalIndex)}
                slots={round}
                roundIndex={originalIndex}
                onMatchClick={onMatchClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WinnerBanner({ club }) {
  return (
    <div
      className="card p-6 text-center"
      style={{
        border: "2px solid rgba(36,255,122,0.5)",
        backgroundColor: "rgba(36,255,122,0.05)",
      }}
    >
      <p
        className="text-[10px] uppercase tracking-widest font-bold mb-3"
        style={{ color: "var(--fifa-neon)" }}
      >
        🏆 Campeón del torneo
      </p>
      <div className="flex items-center justify-center gap-3">
        <ClubAvatar name={club.name} logo={club.logo} />
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-title)", color: "var(--fifa-text)" }}
        >
          {club.name}
        </p>
        {club.abbr && (
          <span className="text-sm font-bold" style={{ color: "var(--fifa-neon)" }}>
            {club.abbr}
          </span>
        )}
      </div>
    </div>
  );
}

function PlayoffsTab({
  tournament,
  table,
  matches,
  tournamentClubs,
  onGeneratePlayoffs,
  onGenerateNextRound,
  isGenerating,
}) {
  const playoffCount = tournament.playoffTeams ?? 0;
  const playoffMatches = matches.filter((m) => m.phase === "playoff");
  const topTeams = (table ?? []).slice(0, playoffCount);

  const rounds =
    playoffMatches.length > 0
      ? groupMatchesIntoCupRounds(playoffMatches, playoffCount)
      : [];
  const lastRound = rounds[rounds.length - 1];
  const allPlayed = lastRound?.every((m) => m.status === "played");
  const isFinal = lastRound?.length === 1;
  const isOver = isFinal && lastRound[0]?.status === "played";
  const winner = isOver
    ? lastRound[0].scoreHome >= lastRound[0].scoreAway
      ? lastRound[0].homeClub
      : lastRound[0].awayClub
    : null;

  if (table.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-500 text-sm">
          Registra partidos de liga y marca los resultados para ver los
          clasificados a playoffs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-title">
          Clasificados{" "}
          <span className="text-gray-600">
            ({topTeams.length}/{playoffCount})
          </span>
        </p>
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>Club</th>
                <th className="text-center">PJ</th>
                <th className="text-center text-white font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {topTeams.map((row, i) => (
                <tr key={row.club.id}>
                  <td>
                    <span className="text-xs font-bold text-yellow-400">
                      {i + 1}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ClubAvatar name={row.club.name} small />
                      <span className="font-medium text-gray-100">
                        {row.club.name}
                      </span>
                      {row.club.abbr && (
                        <span className="text-xs text-green-400 font-bold">
                          {row.club.abbr}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center text-gray-400 tabular-nums">
                    {row.played}
                  </td>
                  <td className="text-center font-bold text-white tabular-nums">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {winner && <WinnerBanner club={winner} />}

      {!isOver && allPlayed && !isFinal && playoffMatches.length > 0 && (
        <button
          onClick={onGenerateNextRound}
          disabled={isGenerating}
          className="btn-primary flex items-center gap-2"
        >
          <CalendarIcon />
          {isGenerating
            ? "Generando..."
            : `Generar ${getCupRoundName(playoffCount, rounds.length)} →`}
        </button>
      )}

      {playoffMatches.length === 0 ? (
        <div className="card p-10 text-center space-y-4">
          <p className="text-gray-500 text-sm">
            El bracket de playoffs aún no ha sido generado
          </p>
          <button
            onClick={onGeneratePlayoffs}
            disabled={isGenerating || topTeams.length < playoffCount}
            className="btn-primary mx-auto"
          >
            {isGenerating ? "Generando..." : "Generar bracket de playoffs"}
          </button>
          {topTeams.length < playoffCount && (
            <p className="text-xs" style={{ color: "var(--fifa-mute)" }}>
              Necesitas al menos {playoffCount} equipos con partidos jugados
            </p>
          )}
        </div>
      ) : (
        <div>
          <p className="section-title">Bracket de playoffs</p>
          <div className="overflow-x-auto pb-2">
            <div
              className="flex gap-5 items-stretch"
              style={{ minWidth: `${rounds.length * 230}px` }}
            >
              {rounds.map((round, rIdx) => {
                const paddingTop = (Math.pow(2, rIdx) - 1) * 50;
                const gap = Math.pow(2, rIdx) * 12;
                return (
                  <div key={rIdx} className="flex flex-col flex-1 min-w-[210px]">
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: "var(--fifa-mute)" }}
                    >
                      {getCupRoundName(playoffCount, rIdx)}
                    </p>
                    <div
                      className="flex flex-col"
                      style={{
                        gap: `${gap}px`,
                        paddingTop: `${paddingTop}px`,
                      }}
                    >
                      {round.map((match) => (
                        <BracketMatchCard key={match._id} match={match} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {!allPlayed && !isOver && (
            <p
              className="text-xs mt-3"
              style={{ color: "var(--fifa-mute)" }}
            >
              Marca todos los partidos como jugados para avanzar a la
              siguiente ronda
            </p>
          )}
        </div>
      )}
    </div>
  );
}



function BracketMatchCard({ match, onClick }) {
  const isPlayed = match.status === "played";

  const homeWon =
    isPlayed && Number(match.scoreHome) >= Number(match.scoreAway);
  const awayWon =
    isPlayed && Number(match.scoreAway) > Number(match.scoreHome);

  function handleClick() {
    if (typeof onClick === "function") onClick(match);
  }

  return (
    <div
      onClick={handleClick}
      className="group relative z-10 overflow-hidden rounded-3xl border p-4 transition-all duration-300 hover:-translate-y-1"
      style={{
        cursor: typeof onClick === "function" ? "pointer" : "default",
        borderColor: isPlayed
          ? "rgba(36,255,122,.22)"
          : "rgba(255,255,255,.08)",
        background:
          "linear-gradient(135deg, rgba(9,22,30,.96), rgba(4,8,14,.98))",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,.025), 0 18px 42px rgba(0,0,0,.45)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className={MATCH_STATUS_BADGE[match.status] ?? "badge-scheduled"}>
          {MATCH_STATUS_LABELS[match.status] ?? match.status}
        </span>

        <span
          className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{
            color: "rgba(255,255,255,.38)",
            backgroundColor: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.05)",
          }}
        >
          R{match.round || 1} · #{(match.order ?? 0) + 1}
        </span>
      </div>

      <BracketTeamRow
        club={match.homeClub}
        score={match.scoreHome}
        winner={homeWon}
        muted={isPlayed && awayWon}
      />

      <div
        className="my-2 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)",
        }}
      />

      <BracketTeamRow
        club={match.awayClub}
        score={match.scoreAway}
        winner={awayWon}
        muted={isPlayed && homeWon}
      />
    </div>
  );
}

function BracketTeamRow({ club, score, winner, muted }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-all"
      style={{
        background: winner
          ? "linear-gradient(90deg, rgba(36,255,122,.14), rgba(36,255,122,.04))"
          : "rgba(255,255,255,.035)",
        border: winner
          ? "1px solid rgba(36,255,122,.25)"
          : "1px solid rgba(255,255,255,.04)",
        opacity: muted ? 0.48 : 1,
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <ClubAvatar name={club?.name || "TBD"} logo={club?.logo} small />

        <div className="min-w-0">
          <p
            className="truncate text-sm font-black uppercase"
            style={{
              color: winner ? "var(--fifa-neon)" : "var(--fifa-text)",
              letterSpacing: ".03em",
            }}
          >
            {club?.abbr || club?.name || "TBD"}
          </p>

          <p className="truncate text-[10px]" style={{ color: "var(--fifa-mute)" }}>
            {club?.name || "Por definir"}
          </p>
        </div>
      </div>

      <span
        className="text-2xl font-black tabular-nums"
        style={{
          color: winner ? "var(--fifa-neon)" : "var(--fifa-text)",
          textShadow: winner ? "0 0 14px rgba(36,255,122,.35)" : "none",
        }}
      >
        {score ?? 0}
      </span>
    </div>
  );
}

function LeagueGenerateModal({ clubCount, onGenerate, onClose, isGenerating }) {
  const [legs, setLegs] = useState(1);
  const singleCount = (clubCount * (clubCount - 1)) / 2;
  const roundCount = clubCount % 2 === 0 ? clubCount - 1 : clubCount;

  return (
    <Modal title="Generar calendario" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate({ legs });
        }}
        className="space-y-5"
      >
        <p className="text-sm" style={{ color: "var(--fifa-mute)" }}>
          Se generarán todos los partidos automáticamente con estado
          "Programado", agrupados por jornada.
        </p>

        <div className="space-y-3">
          {[
            {
              value: 1,
              label: "Solo ida",
              detail: `${singleCount} partidos · ${roundCount} jornadas`,
            },
            {
              value: 2,
              label: "Ida y vuelta",
              detail: `${singleCount * 2} partidos · ${roundCount * 2} jornadas`,
            },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all"
              style={
                legs === opt.value
                  ? {
                      borderColor: "rgba(36,255,122,0.35)",
                      backgroundColor: "rgba(36,255,122,0.06)",
                    }
                  : {
                      borderColor: "var(--fifa-line)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                    }
              }
            >
              <input
                type="radio"
                name="legs"
                checked={legs === opt.value}
                onChange={() => setLegs(opt.value)}
                className="mt-0.5 accent-green-400"
              />
              <div>
                <p className="text-white text-sm font-medium">{opt.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fifa-mute)" }}>
                  {opt.detail}
                </p>
              </div>
            </label>
          ))}
        </div>

        <ModalActions
          onCancel={onClose}
          saving={isGenerating}
          label={`Generar ${legs === 1 ? singleCount : singleCount * 2} partidos · ${legs === 1 ? roundCount : roundCount * 2} jornadas`}
        />
      </form>
    </Modal>
  );
}

function EditTournamentModal({ tournament, error, onSave, onClose }) {
  const [form, setForm] = useState({
  name: tournament.name ?? "",
  type: tournament.type ?? "league",
  format: tournament.format ?? "league",
  season: tournament.season ?? "",
  status: tournament.status ?? "draft",
  maxClubs: tournament.maxClubs ?? 8,
  playoffTeams: tournament.playoffTeams ?? 0,
  win: tournament.pointsConfig?.win ?? 3,
  draw: tournament.pointsConfig?.draw ?? 1,
  loss: tournament.pointsConfig?.loss ?? 0,
  logo: tournament.logo ?? "",
});

  const [saving, setSaving] = useState(false);

  const isMixed = form.format === "mixed";

function handleLogoChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert("La imagen no puede superar 2 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    setForm((prev) => ({
      ...prev,
      logo: reader.result,
    }));
  };

  reader.readAsDataURL(file);
}

function removeLogo() {
  setForm((prev) => ({
    ...prev,
    logo: "",
  }));
}

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "format" && value !== "mixed"
        ? { playoffTeams: 0 }
        : {}),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const maxClubs = Number(form.maxClubs);
    const playoffTeams = isMixed ? Number(form.playoffTeams) : 0;

    setSaving(true);

    await onSave({
  name: form.name,
  type: form.type,
  format: form.format,
  season: form.season,
  status: form.status,
  maxClubs,
  hasPlayoffs: isMixed,
  playoffTeams,
  logo: form.logo,
  pointsConfig: {
    win: Number(form.win),
    draw: Number(form.draw),
    loss: Number(form.loss),
  },
});

    setSaving(false);
  }

  return (
    <Modal title="Editar torneo" onClose={onClose}>
      {error && <p className="error-msg mb-4">{error}</p>}

      <form
  onSubmit={handleSubmit}
  className="max-h-[72vh] space-y-3 overflow-y-auto pr-1"
>
        <div>
          <label className="label">Nombre *</label>
          <input
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div
  className="rounded-2xl border p-4"
  style={{
    borderColor: "rgba(36,255,122,.12)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.01))",
  }}
>
  <p className="label mb-3">Imagen del torneo</p>

  <div className="flex flex-wrap items-center gap-4">
    <div
      className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
      style={{
        borderColor: "rgba(36,255,122,.18)",
        backgroundColor: "rgba(255,255,255,.04)",
      }}
    >
      {form.logo ? (
        <img
          src={form.logo}
          alt="Logo torneo"
          className="h-full w-full object-contain"
        />
      ) : (
        <ImageIcon />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-sm text-white">
        {form.logo ? "Imagen cargada" : "Sin imagen cargada"}
      </p>

      <p className="mt-1 text-xs" style={{ color: "var(--fifa-mute)" }}>
        Se usará en la portada del torneo y en la página pública.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <label
          className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all"
          style={{
            color: "var(--fifa-neon)",
            borderColor: "rgba(36,255,122,.30)",
            backgroundColor: "rgba(36,255,122,.06)",
          }}
        >
          {form.logo ? "Cambiar imagen" : "Subir imagen"}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </label>

        {form.logo && (
          <button type="button" onClick={removeLogo} className="btn-danger">
            Quitar
          </button>
        )}
      </div>
    </div>
  </div>
</div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="league">Liga</option>
              <option value="tournament">Torneo</option>
            </select>
          </div>

          <div>
            <label className="label">Temporada</label>
            <input
              name="season"
              type="text"
              value={form.season}
              onChange={handleChange}
              placeholder="2026"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="label">Formato *</label>
          <select
            name="format"
            value={form.format}
            onChange={handleChange}
            className="input-field"
          >
            <option value="league">Liga por puntos</option>
            <option value="cup">Copa eliminación directa</option>
            <option value="mixed">Liga + playoffs</option>
          </select>
        </div>

        <div>
          <label className="label">Cantidad de equipos *</label>
          <input
            name="maxClubs"
            type="number"
            min={2}
            value={form.maxClubs}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {isMixed && (
          <div>
            <label className="label">Equipos que clasifican a playoffs</label>
            <input
              name="playoffTeams"
              type="number"
              min={2}
              max={form.maxClubs}
              value={form.playoffTeams}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        )}

        <div>
          <label className="label">Estado</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="finished">Finalizado</option>
          </select>
        </div>

        <div
          className="border-t pt-4"
          style={{ borderColor: "var(--fifa-line)" }}
        >
          <p className="label mb-3">Puntos por resultado</p>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Victoria</label>
              <input
                name="win"
                type="number"
                min={0}
                value={form.win}
                onChange={handleChange}
                className="input-field text-center"
              />
            </div>

            <div>
              <label className="label">Empate</label>
              <input
                name="draw"
                type="number"
                min={0}
                value={form.draw}
                onChange={handleChange}
                className="input-field text-center"
              />
            </div>

            <div>
              <label className="label">Derrota</label>
              <input
                name="loss"
                type="number"
                min={0}
                value={form.loss}
                onChange={handleChange}
                className="input-field text-center"
              />
            </div>
          </div>
        </div>

        <ModalActions
          onCancel={onClose}
          saving={saving}
          label="Guardar cambios"
        />
      </form>
    </Modal>
  );
}

function EditMatchModal({ match, clubs, error, onSave, onClose }) {
  const [form, setForm] = useState({
    homeClub: match.homeClub?._id ?? match.homeClub ?? "",
    awayClub: match.awayClub?._id ?? match.awayClub ?? "",
    date: toDatetimeLocal(match.date),
    stadium: match.stadium ?? "",
    scoreHome: match.scoreHome ?? 0,
    scoreAway: match.scoreAway ?? 0,
    status: match.status ?? "scheduled",
    possessionHome: match.clubStats?.possessionHome ?? 0,
    possessionAway: match.clubStats?.possessionAway ?? 0,
    shotsHome: match.clubStats?.shotsHome ?? 0,
    shotsAway: match.clubStats?.shotsAway ?? 0,
    passesHome: match.clubStats?.passesHome ?? 0,
    passesAway: match.clubStats?.passesAway ?? 0,
  });

  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.homeClub === form.awayClub) return;

    setSaving(true);

    await onSave({
      homeClub: form.homeClub,
      awayClub: form.awayClub,
      date: form.date,
      stadium: form.stadium,
      scoreHome: Number(form.scoreHome),
      scoreAway: Number(form.scoreAway),
      status: form.status,
      clubStats: {
        possessionHome: Number(form.possessionHome),
        possessionAway: Number(form.possessionAway),
        shotsHome: Number(form.shotsHome),
        shotsAway: Number(form.shotsAway),
        passesHome: Number(form.passesHome),
        passesAway: Number(form.passesAway),
      },
    });

    setSaving(false);
  }

  const sameClub = form.homeClub && form.homeClub === form.awayClub;

  return (
    <Modal title="Editar partido" onClose={onClose}>
      {error && <p className="error-msg mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Club local *</label>
            <select
              name="homeClub"
              required
              value={form.homeClub}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Seleccionar...</option>
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.abbr ? `${c.abbr} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Club visitante *</label>
            <select
              name="awayClub"
              required
              value={form.awayClub}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Seleccionar...</option>
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.abbr ? `${c.abbr} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sameClub && (
          <p className="error-msg">
            El club local y visitante no pueden ser iguales.
          </p>
        )}

        <div>
          <p className="label mb-3">Marcador</p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">Local</label>
              <input
                name="scoreHome"
                type="number"
                min={0}
                value={form.scoreHome}
                onChange={handleChange}
                className="input-field text-center text-lg font-bold"
              />
            </div>

            <span className="text-gray-600 font-bold text-xl mt-4">–</span>

            <div className="flex-1">
              <label className="label">Visitante</label>
              <input
                name="scoreAway"
                type="number"
                min={0}
                value={form.scoreAway}
                onChange={handleChange}
                className="input-field text-center text-lg font-bold"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha *</label>
            <input
              name="date"
              type="datetime-local"
              required
              value={form.date}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Estadio</label>
            <input
              name="stadium"
              type="text"
              value={form.stadium}
              onChange={handleChange}
              placeholder="Nombre del estadio"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="label">Estado</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="scheduled">Programado</option>
            <option value="played">Jugado</option>
          </select>
        </div>

        <div
          className="border-t pt-5"
          style={{ borderColor: "var(--fifa-line)" }}
        >
          <p className="label mb-1">
            Estadísticas{" "}
            <span
              className="text-xs font-normal"
              style={{ color: "var(--fifa-mute)" }}
            >
              opcional
            </span>
          </p>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 mt-3">
            <span
              className="text-xs text-center mb-2"
              style={{ color: "var(--fifa-mute)" }}
            >
              Local
            </span>

            <span />

            <span
              className="text-xs text-center mb-2"
              style={{ color: "var(--fifa-mute)" }}
            >
              Visitante
            </span>

            <input
              name="possessionHome"
              type="number"
              min={0}
              max={100}
              value={form.possessionHome}
              onChange={handleChange}
              className="input-field text-center mb-3"
            />

            <span
              className="text-xs text-center px-2 whitespace-nowrap mb-3"
              style={{ color: "var(--fifa-mute)" }}
            >
              Posesión %
            </span>

            <input
              name="possessionAway"
              type="number"
              min={0}
              max={100}
              value={form.possessionAway}
              onChange={handleChange}
              className="input-field text-center mb-3"
            />

            <input
              name="shotsHome"
              type="number"
              min={0}
              value={form.shotsHome}
              onChange={handleChange}
              className="input-field text-center mb-3"
            />

            <span
              className="text-xs text-center px-2 whitespace-nowrap mb-3"
              style={{ color: "var(--fifa-mute)" }}
            >
              Tiros
            </span>

            <input
              name="shotsAway"
              type="number"
              min={0}
              value={form.shotsAway}
              onChange={handleChange}
              className="input-field text-center mb-3"
            />

            <input
              name="passesHome"
              type="number"
              min={0}
              value={form.passesHome}
              onChange={handleChange}
              className="input-field text-center"
            />

            <span
              className="text-xs text-center px-2 whitespace-nowrap"
              style={{ color: "var(--fifa-mute)" }}
            >
              Pases
            </span>

            <input
              name="passesAway"
              type="number"
              min={0}
              value={form.passesAway}
              onChange={handleChange}
              className="input-field text-center"
            />
          </div>
        </div>

        <ModalActions
          onCancel={onClose}
          saving={saving}
          label="Guardar cambios"
        />
      </form>
    </Modal>
  );
}

function MetaBadge({ label, value, neon }) {
  return (
    <div
      className="rounded-2xl px-4 py-2"
      style={{
        background: neon
          ? "rgba(36,255,122,.08)"
          : "rgba(255,255,255,.04)",
        border: neon
          ? "1px solid rgba(36,255,122,.25)"
          : "1px solid rgba(255,255,255,.05)",
      }}
    >
      <p
        className="text-[10px] uppercase tracking-widest"
        style={{
          color: "rgba(255,255,255,.35)",
        }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-sm font-semibold"
        style={{
          color: neon
            ? "var(--fifa-neon)"
            : "var(--fifa-text)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function LeagueTable({ table, playoffTeams, champion }) {
  if (!table || table.length === 0) {
    return (
      <div
        className="rounded-3xl p-10 text-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
          border: "1px solid rgba(36,255,122,0.10)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.02), 0 18px 45px rgba(0,0,0,.38)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--fifa-mute)" }}>
          No hay datos de tabla aún.
        </p>
        <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,.28)" }}>
          Registra partidos jugados para ver los puntos.
        </p>
      </div>
    );
  }

  const POS_COLOR = ["text-yellow-400", "text-gray-300", "text-orange-400"];

  return (
    <div className="space-y-4">
      {champion && <WinnerBanner club={champion} />}

      <div
        className="overflow-hidden rounded-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.96))",
          border: "1px solid rgba(36,255,122,0.12)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.02), 0 18px 50px rgba(0,0,0,.42)",
        }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "rgba(255,255,255,.08)" }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-title)",
                color: "var(--fifa-text)",
                fontSize: "1.45rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}
            >
              Tabla de posiciones
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--fifa-mute)" }}>
              Ranking competitivo según resultados registrados.
            </p>
          </div>

          {playoffTeams > 0 && (
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{
                color: "var(--fifa-neon)",
                backgroundColor: "rgba(36,255,122,0.08)",
                border: "1px solid rgba(36,255,122,0.22)",
              }}
            >
              Top {playoffTeams} → playoffs
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                <th className="w-8 px-3 py-3 text-[11px] uppercase tracking-wider text-gray-500">
                  #
                </th>
                <th className="px-3 py-3 text-[11px] uppercase tracking-wider text-gray-500">
                  Club
                </th>
                <th className="px-2 py-3 text-center text-[11px] uppercase tracking-wider text-gray-500">
                  PJ
                </th>
                <th className="px-2 py-3 text-center text-[11px] uppercase tracking-wider text-gray-500">
                  G
                </th>
                <th className="px-2 py-3 text-center text-[11px] uppercase tracking-wider text-gray-500">
                  E
                </th>
                <th className="px-2 py-3 text-center text-[11px] uppercase tracking-wider text-gray-500">
                  P
                </th>
                <th className="hidden sm:table-cell px-2 py-3 text-center text-[11px] uppercase tracking-wider text-gray-500">
                  GF
                </th>
                <th className="hidden sm:table-cell px-2 py-3 text-center text-[11px] uppercase tracking-wider text-gray-500">
                  GC
                </th>
                <th className="px-2 py-3 text-center text-[11px] uppercase tracking-wider text-gray-500">
                  DG
                </th>
                <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white">
                  PTS
                </th>
              </tr>
            </thead>

            <tbody>
              {table.map((row, index) => {
                const isTopThree = index < 3;
                const isPlayoff = playoffTeams > 0 && index < playoffTeams;
                const isLastPlayoff = isPlayoff && index === playoffTeams - 1;

                const diff =
                  row.goalDifference ??
                  (Number(row.goalsFor ?? 0) - Number(row.goalsAgainst ?? 0));

                return (
                  <tr
                    key={row.club.id}
                    className="transition-colors hover:bg-white/[0.045]"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,.055)",
                      backgroundColor: isPlayoff
                        ? "rgba(36,255,122,0.035)"
                        : "transparent",
                      borderLeft: isPlayoff
                        ? "3px solid rgba(36,255,122,0.42)"
                        : "3px solid transparent",
                      borderBottom: isLastPlayoff
                        ? "1px solid rgba(36,255,122,0.22)"
                        : undefined,
                    }}
                  >
                    <td className="px-3 py-3">
                      <span
                        className={`text-sm font-black tabular-nums ${
                          POS_COLOR[index] ?? "text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ClubAvatar
                          name={row.club.name}
                          logo={row.club.logo}
                          small
                        />

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-100">
                            {row.club.name}
                          </p>

                          <div className="mt-0.5 flex items-center gap-2">
                            {row.club.abbr && (
                              <span className="text-[11px] font-bold text-green-400">
                                {row.club.abbr}
                              </span>
                            )}

                            {isTopThree && (
                              <span className="text-[10px] uppercase tracking-wider text-yellow-400/80">
                                Top {index + 1}
                              </span>
                            )}

                            {isPlayoff && (
                              <span className="text-[10px] uppercase tracking-wider text-green-400/80">
                                Playoffs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-3 text-center text-gray-400 tabular-nums">
                      {row.played}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-400 tabular-nums">
                      {row.wins}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-400 tabular-nums">
                      {row.draws}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-400 tabular-nums">
                      {row.losses}
                    </td>
                    <td className="hidden sm:table-cell px-2 py-3 text-center text-gray-400 tabular-nums">
                      {row.goalsFor}
                    </td>
                    <td className="hidden sm:table-cell px-2 py-3 text-center text-gray-400 tabular-nums">
                      {row.goalsAgainst}
                    </td>
                    <td
                      className={`px-2 py-3 text-center font-semibold tabular-nums ${
                        diff > 0
                          ? "text-green-400"
                          : diff < 0
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className="rounded-xl px-3 py-1 text-lg font-black tabular-nums"
                        style={{
                          color: "var(--fifa-text)",
                          backgroundColor: "rgba(255,255,255,.055)",
                          border: "1px solid rgba(255,255,255,.06)",
                        }}
                      >
                        {row.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {playoffTeams > 0 && (
          <div
            className="border-t px-5 py-3 text-xs"
            style={{
              borderColor: "rgba(255,255,255,.08)",
              color: "var(--fifa-mute)",
            }}
          >
            La zona marcada en verde indica los clubes clasificados a playoffs.
          </div>
        )}
      </div>
    </div>
  );
}

function groupMatchesByRound(matches) {
  const rounds = {};

  matches.forEach((match) => {
    const r = match.round || 1;
    if (!rounds[r]) rounds[r] = [];
    rounds[r].push(match);
  });

  return Object.keys(rounds)
    .sort((a, b) => Number(a) - Number(b))
    .map((r) => rounds[r]);
}

function BracketTab({
  tournament,
  matches,
  tournamentClubs,
  onEdit,
  onGenerate,
  onGenerateNext,
  isGenerating,
}) {
  const count = tournamentClubs.length;

  if (count < 2) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-500 text-sm">Agrega equipos para comenzar</p>
      </div>
    );
  }

  if (!isValidCupSize(count)) {
    return (
      <div className="card p-10 text-center space-y-2">
        <p className="text-yellow-400 text-sm font-medium">
          El formato copa requiere 4, 8 o 16 equipos
        </p>
        <p className="text-xs" style={{ color: "var(--fifa-mute)" }}>
          Actualmente hay {count} equipos en el torneo
        </p>
      </div>
    );
  }

  const cupMatches = matches.filter((m) => m.phase === "cup");

  if (cupMatches.length === 0) {
    return (
      <div className="card p-10 text-center space-y-4">
        <p className="text-gray-500 text-sm">El bracket no ha sido generado aún</p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn-primary mx-auto"
        >
          {isGenerating ? "Generando..." : "Generar bracket"}
        </button>
      </div>
    );
  }

  const rounds = groupMatchesIntoCupRounds(cupMatches, count);
  const lastRound = rounds[rounds.length - 1];
  const allPlayed = lastRound?.every((m) => m.status === "played");
  const isFinal = lastRound?.length === 1;
  const isOver = isFinal && lastRound[0]?.status === "played";

  return (
    <div className="space-y-4">
      {!isOver && allPlayed && !isFinal && (
        <button
          onClick={onGenerateNext}
          disabled={isGenerating}
          className="btn-primary flex items-center gap-2"
        >
          <CalendarIcon />
          {isGenerating
            ? "Generando..."
            : `Generar ${getCupRoundName(count, rounds.length)} →`}
        </button>
      )}

      <CupBracket
  matches={cupMatches}
  count={count}
  onMatchClick={onEdit}
/>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

function SkeletonPulse({ className = "", style = {} }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.05)", ...style }}
    />
  );
}

function TournamentDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button ghost */}
      <SkeletonPulse style={{ width: 72, height: 14, borderRadius: 6 }} />

      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-[32px] px-7 py-7 md:px-9 md:py-8"
        style={{
          background: "linear-gradient(135deg, rgba(8,18,28,.96), rgba(5,10,16,.98))",
          border: "1px solid rgba(36,255,122,.10)",
          boxShadow: "0 0 0 1px rgba(255,255,255,.02), 0 28px 70px rgba(0,0,0,.55)",
        }}
      >
        <div
          style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
            background: "rgba(36,255,122,.25)",
          }}
        />
        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}
          <div className="flex items-start gap-5">
            {/* Logo placeholder */}
            <SkeletonPulse style={{ width: 96, height: 96, borderRadius: 24, flexShrink: 0 }} />
            <div className="space-y-3 flex-1">
              {/* Badges */}
              <div className="flex gap-2">
                <SkeletonPulse style={{ width: 52, height: 20, borderRadius: 20 }} />
                <SkeletonPulse style={{ width: 68, height: 20, borderRadius: 20 }} />
              </div>
              {/* Title */}
              <SkeletonPulse style={{ width: 260, height: 36, borderRadius: 8 }} />
              {/* Description */}
              <SkeletonPulse style={{ width: "90%", height: 13, borderRadius: 6 }} />
              <SkeletonPulse style={{ width: "70%", height: 13, borderRadius: 6 }} />
              {/* Meta badges */}
              <div className="flex flex-wrap gap-3 pt-1">
                <SkeletonPulse style={{ width: 80, height: 32, borderRadius: 12 }} />
                <SkeletonPulse style={{ width: 80, height: 32, borderRadius: 12 }} />
                <SkeletonPulse style={{ width: 80, height: 32, borderRadius: 12 }} />
              </div>
            </div>
          </div>
          {/* Right: edit button ghost */}
          <SkeletonPulse style={{ width: 90, height: 36, borderRadius: 10, flexShrink: 0 }} />
        </div>
      </div>

      {/* Visibility bar ghost */}
      <SkeletonPulse style={{ height: 52, borderRadius: 16 }} />

      {/* Tab bar ghost */}
      <div
        style={{
          borderBottom: "1px solid var(--fifa-line)",
          backgroundColor: "rgba(4,8,14,.6)",
          borderRadius: "12px 12px 0 0",
          padding: "0 4px",
          display: "flex", gap: 8,
        }}
      >
        {[90, 70, 85].map((w, i) => (
          <SkeletonPulse key={i} style={{ width: w, height: 14, margin: "14px 4px", borderRadius: 6 }} />
        ))}
      </div>

      {/* Content: 4 club card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl p-5"
            style={{
              background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
              border: "1px solid rgba(36,255,122,.08)",
              boxShadow: "0 0 0 1px rgba(255,255,255,.02), 0 12px 30px rgba(0,0,0,.35)",
            }}
          >
            <div className="flex items-center gap-4">
              <SkeletonPulse style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0 }} />
              <div className="flex-1 space-y-2">
                <SkeletonPulse style={{ width: "60%", height: 16, borderRadius: 6 }} />
                <SkeletonPulse style={{ width: "40%", height: 12, borderRadius: 6 }} />
              </div>
              <SkeletonPulse style={{ width: 64, height: 28, borderRadius: 8, flexShrink: 0 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
  );
}

function BackIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5 8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
      />
    </svg>
  );
}
