import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tournamentsApi, matchesApi, clubsApi } from "../api";
import ClubAvatar from "../components/ui/ClubAvatar";
import { Modal, ModalActions, ConfirmModal } from "../components/ui/Modal";
import ProBracket from "../components/ProBracket";
import {
  generateLeagueRounds,
  generateCupBracket,
  generateCupNextRoundPairs,
  groupMatchesIntoCupRounds,
  groupMatchesIntoJornadas,
  getCupRoundName,
  isValidCupSize,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

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
        className="card px-6 py-5"
        style={{
          borderColor: "rgba(36,255,122,.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Neon left accent */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
          background: "var(--fifa-neon)",
          boxShadow: "0 0 14px var(--fifa-neon)",
        }} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={TYPE_BADGE[tournament.type] ?? "badge-tournament"}>
                {TYPE_LABELS[tournament.type] ?? tournament.type}
              </span>
              <span className={STATUS_BADGE[tournament.status] ?? "badge-draft"}>
                {STATUS_LABELS[tournament.status] ?? tournament.status}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-title)",
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "1px",
                textTransform: "uppercase",
                lineHeight: 1.05,
              }}
            >
              {tournament.name}
            </h1>

            {allLeaguePlayed && tournament.format !== "cup" && (
              <p className="text-green-400 text-sm mt-2 font-semibold">
                ✔ Liga finalizada
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
              <p className="text-gray-500 text-sm">
                Temporada {tournament.season}
              </p>
              <p className="text-gray-500 text-sm">
                {tournamentClubs.length}/{tournament.maxClubs ?? "—"} equipos
              </p>
              <p className="text-gray-500 text-sm">
                {FORMAT_LABELS[tournament.format] ?? tournament.format ?? "—"}
              </p>
              {tournament.hasPlayoffs && (
                <p style={{ color: "var(--fifa-neon)", fontSize: "0.875rem" }}>
                  Top {tournament.playoffTeams} → playoffs
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setEditTournamentError("");
              setShowEditTournament(true);
            }}
            className="btn-secondary shrink-0 flex items-center gap-2"
          >
            <PencilIcon /> Editar
          </button>
        </div>
      </div>

      <VisibilityBar tournament={tournament} onUpdate={handleVisibilityUpdate} />
      <TournamentImageCard tournament={tournament} onUpdate={handleVisibilityUpdate} />

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
            <table className="data-table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Abrev.</th>
                  <th>País</th>
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

                    <td>
                      <span className="text-xs text-green-400 font-bold">
                        {club.abbr || "—"}
                      </span>
                    </td>

                    <td className="text-gray-400">{club.country || "—"}</td>

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
            <table className="data-table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Abrev.</th>
                  <th>País</th>
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

                    <td>
                      <span className="text-xs text-green-400 font-bold">
                        {club.abbr || "—"}
                      </span>
                    </td>

                    <td className="text-gray-500">{club.country || "—"}</td>

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
        )}
      </div>
    </div>
  );
}


function VisibilityBar({ tournament, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPublic = tournament.visibility === "public";
  const publicUrl = isPublic && tournament.publicSlug
    ? `${window.location.origin}/public/tournaments/${tournament.publicSlug}`
    : null;

  async function makePublic() {
    const slug = tournament.publicSlug || generateSlug(tournament.name);
    setLoading(true);
    try {
      await onUpdate({ visibility: "public", publicSlug: slug });
    } catch (err) {
      alert(err.response?.data?.message ?? "Error actualizando visibilidad");
    } finally {
      setLoading(false);
    }
  }

  async function makePrivate() {
    setLoading(true);
    try {
      await onUpdate({ visibility: "private" });
    } catch (err) {
      alert(err.response?.data?.message ?? "Error actualizando visibilidad");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
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
              ? { color: "var(--fifa-neon)", backgroundColor: "rgba(36,255,122,0.12)" }
              : { color: "var(--fifa-mute)", backgroundColor: "rgba(255,255,255,0.06)" }
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
              onClick={copyLink}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all"
              style={
                copied
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
              {copied ? "¡Copiado!" : "Copiar link"}
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
  );
}

function TournamentImageCard({ tournament, onUpdate }) {
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no puede superar 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true);
      try {
        await onUpdate({ logo: reader.result });
      } catch (err) {
        alert(err.response?.data?.message ?? "Error subiendo imagen");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function removeLogo() {
    setLoading(true);
    try {
      await onUpdate({ logo: "" });
    } catch (err) {
      alert(err.response?.data?.message ?? "Error quitando imagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card px-5 py-4 flex items-center gap-4 flex-wrap">
      {/* Preview */}
      <div
        className="w-12 h-12 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center"
        style={{ borderColor: "var(--fifa-line)", backgroundColor: "rgba(255,255,255,.04)" }}
      >
        {tournament.logo ? (
          <img
            src={tournament.logo}
            alt="Logo torneo"
            className="w-full h-full object-contain"
          />
        ) : (
          <ImageIcon />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fifa-mute)" }}>
          Imagen del torneo
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,.25)" }}>
          {tournament.logo
            ? "Imagen cargada · se muestra en la página pública"
            : "Sin imagen · se mostrará en la página pública"}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label
          className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all"
          style={{
            color: "var(--fifa-neon)",
            borderColor: "rgba(36,255,122,.30)",
            backgroundColor: "rgba(36,255,122,.06)",
            opacity: loading ? 0.5 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          {loading ? "Guardando..." : tournament.logo ? "Cambiar imagen" : "Subir imagen"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>

        {tournament.logo && !loading && (
          <button onClick={removeLogo} className="btn-danger">
            Quitar
          </button>
        )}
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
        <div className="flex items-center gap-2 mb-2">
          <span className={MATCH_STATUS_BADGE[match.status] ?? "badge-scheduled"}>
            {MATCH_STATUS_LABELS[match.status] ?? match.status}
          </span>

          <span className="text-xs text-gray-600">{date}</span>

          {match.stadium && (
            <span className="text-xs text-gray-600 truncate">
              {match.stadium}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
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

      <div className="flex items-center gap-2 shrink-0">
        {match.status === "scheduled" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkPlayed();
            }}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{
              color: "var(--fifa-neon)",
              borderColor: "rgba(36,255,122,0.20)",
              backgroundColor: "rgba(36,255,122,0.06)",
            }}
          >
            ✓ Jugado
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            color: "var(--fifa-mute)",
            borderColor: "var(--fifa-line)",
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          Editar
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="btn-danger"
        >
          Eliminar
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
        <p className="text-gray-500 text-sm">El bracket no ha sido generado aún</p>
        <button onClick={onGenerate} disabled={isGenerating} className="btn-primary mx-auto">
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
          {isGenerating ? "Generando..." : `Generar ${getCupRoundName(count, rounds.length)} →`}
        </button>
      )}

      <div className="card p-6 overflow-x-auto">
        <div className="flex gap-14 items-stretch min-w-max">
          {rounds.map((round, rIdx) => {
            const isLastRound = rIdx === rounds.length - 1;
            const paddingTop = (Math.pow(2, rIdx) - 1) * 58;
            const gap = Math.pow(2, rIdx) * 34;

            return (
              <div key={rIdx} className="relative flex flex-col min-w-[250px]">
                <p
                  className="mb-5 text-center text-xs font-bold uppercase tracking-[0.25em]"
                  style={{ color: "var(--fifa-neon)" }}
                >
                  {getCupRoundName(count, rIdx)}
                </p>

                <div
                  className="relative flex flex-col"
                  style={{ gap: `${gap}px`, paddingTop: `${paddingTop}px` }}
                >
                  {round.map((match, mIdx) => (
                    <div key={match._id} className="relative">
                      <BracketMatchCard
  match={match}
  onClick={(m) => handleOpenMatch(m)}
/>

                      {!isLastRound && (
                        <>
                          <div
                            className="absolute left-full top-1/2 h-[2px] w-14"
                            style={{
                              background:
                                "linear-gradient(90deg, rgba(36,255,122,.9), rgba(36,255,122,.25))",
                              boxShadow: "0 0 10px rgba(36,255,122,.65)",
                            }}
                          />

                          <div
                            className="absolute left-[calc(100%+56px)] top-1/2 w-[2px]"
                            style={{
                              height: `${gap / 2 + 74}px`,
                              transform: mIdx % 2 === 0 ? "translateY(0)" : "translateY(-100%)",
                              background: "rgba(36,255,122,.55)",
                              boxShadow: "0 0 12px rgba(36,255,122,.55)",
                            }}
                          />

                          <div
                            className="absolute left-[calc(100%+56px)] h-[2px] w-14"
                            style={{
                              top:
                                mIdx % 2 === 0
                                  ? `calc(50% + ${gap / 2 + 74}px)`
                                  : `calc(50% - ${gap / 2 + 74}px)`,
                              background:
                                "linear-gradient(90deg, rgba(36,255,122,.45), rgba(36,255,122,.85))",
                              boxShadow: "0 0 10px rgba(36,255,122,.6)",
                            }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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

  const homeWon = isPlayed && match.scoreHome >= match.scoreAway;
  const awayWon = isPlayed && match.scoreAway > match.scoreHome;

  return (
<div
  onClick={() => onClick(match)}
  className="relative z-10 overflow-hidden rounded-2xl border p-4 cursor-pointer hover:scale-[1.02] transition"
      style={{
        borderColor: "rgba(36,255,122,.22)",
        background:
          "linear-gradient(135deg, rgba(7,18,24,.96), rgba(4,8,14,.98))",
        boxShadow: "0 0 24px rgba(36,255,122,.08)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={MATCH_STATUS_BADGE[match.status] ?? "badge-scheduled"}>
          {MATCH_STATUS_LABELS[match.status] ?? match.status}
        </span>

        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
          R{match.round || 1} · #{(match.order ?? 0) + 1}
        </span>
      </div>

      <BracketTeamRow
        club={match.homeClub}
        score={match.scoreHome}
        winner={homeWon}
      />

      <div className="my-2 h-px bg-white/5" />

      <BracketTeamRow
        club={match.awayClub}
        score={match.scoreAway}
        winner={awayWon}
      />
    </div>
  );
}

function BracketTeamRow({ club, score, winner }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
        winner ? "bg-green-500/10" : "bg-white/[0.03]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <ClubAvatar name={club?.name || "TBD"} logo={club?.logo} small />

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {club?.abbr || club?.name || "TBD"}
          </p>
          <p className="truncate text-[10px] text-gray-500">
            {club?.name || "Por definir"}
          </p>
        </div>
      </div>

      <span
        className={`text-xl font-black tabular-nums ${
          winner ? "text-green-400" : "text-white"
        }`}
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
  });

  const [saving, setSaving] = useState(false);

  const isMixed = form.format === "mixed";

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

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-3 gap-3">
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

function LeagueTable({ table, playoffTeams, champion }) {
  if (!table || table.length === 0) {
    return (
      <div className="card p-6 text-center text-gray-500 text-sm">
        No hay datos de tabla aún. Registra partidos jugados para ver los puntos.
      </div>
    );
  }

  const POS_COLOR = ["text-yellow-400", "text-gray-300", "text-orange-400"];

  return (
    <div className="space-y-4">
      {champion && <WinnerBanner club={champion} />}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Tabla de posiciones</h2>
          {playoffTeams > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: "var(--fifa-neon)", backgroundColor: "rgba(36,255,122,0.08)" }}>
              Top {playoffTeams} → playoffs
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 w-8">#</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500">Equipo</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 text-center">PJ</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 text-center">G</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 text-center">E</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 text-center">P</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 text-center">GF</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 text-center">GC</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 text-center">DG</th>
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wider font-bold text-white text-center">PTS</th>
              </tr>
            </thead>

            <tbody>
              {table.map((row, index) => {
                const isPlayoff = playoffTeams > 0 && index < playoffTeams;
                const isLast = isPlayoff && index === playoffTeams - 1;

                return (
                  <tr
                    key={row.club.id}
                    className="border-t border-white/5 hover:bg-white/5 transition-colors"
                    style={{
                      backgroundColor: isPlayoff ? "rgba(36,255,122,0.04)" : undefined,
                      borderLeft: isPlayoff ? "2px solid rgba(36,255,122,0.35)" : "2px solid transparent",
                      borderBottom: isLast ? "1px solid rgba(36,255,122,0.2)" : undefined,
                    }}
                  >
                    <td className="px-3 py-3">
                      <span className={`font-bold tabular-nums text-sm ${POS_COLOR[index] ?? "text-gray-600"}`}>
                        {index + 1}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <ClubAvatar name={row.club.name} logo={row.club.logo} small />
                        <span className="text-white font-medium">{row.club.name}</span>
                        {row.club.abbr && (
                          <span className="text-[11px] font-bold" style={{ color: "var(--fifa-neon)" }}>
                            {row.club.abbr}
                          </span>
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
                    <td className="px-3 py-3 text-center font-bold text-white tabular-nums text-base">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

      <ProBracket matches={cupMatches} />
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
