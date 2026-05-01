import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tournamentsApi, matchesApi, clubsApi } from "../api";
import { ClubAvatar, Modal, ModalActions } from "./Clubs";

const TYPE_LABELS = { league: "Liga", tournament: "Torneo" };
const TYPE_BADGE = { league: "badge-league", tournament: "badge-tournament" };
const STATUS_LABELS = { active: "Activo", draft: "Borrador", finished: "Finalizado" };
const STATUS_BADGE = { active: "badge-active", draft: "badge-draft", finished: "badge-finished" };
const MATCH_STATUS_BADGE = { scheduled: "badge-scheduled", played: "badge-played" };
const MATCH_STATUS_LABELS = { scheduled: "Programado", played: "Jugado" };

const TABS = ["Clubes", "Tabla", "Partidos"];

function toDatetimeLocal(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  // Edit tournament
  const [showEditTournament, setShowEditTournament] = useState(false);
  const [editTournamentError, setEditTournamentError] = useState("");

  // Edit match
  const [editingMatch, setEditingMatch] = useState(null);
  const [editMatchError, setEditMatchError] = useState("");

  const load = useCallback(async () => {
    try {
      const [tRes, tcRes, acRes, tableRes, matchRes] = await Promise.all([
        tournamentsApi.getOne(id),
        tournamentsApi.getClubs(id),
        clubsApi.getAll(),
        tournamentsApi.getTable(id),
        matchesApi.getAll(id),
      ]);
      setTournament(tRes.data.tournament);
      setTournamentClubs(tcRes.data.clubs ?? []);
      setAllClubs(acRes.data.clubs ?? []);
      setTable(tableRes.data.table ?? []);
      setMatches(matchRes.data.matches ?? []);
    } catch {
      setLoadError("Error cargando el torneo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleAddClub(clubId) {
    try {
      await tournamentsApi.addClub(id, clubId);
      const res = await tournamentsApi.getClubs(id);
      setTournamentClubs(res.data.clubs ?? []);
    } catch (err) {
      alert(err.response?.data?.message ?? "Error agregando club");
    }
  }

  async function handleRemoveClub(clubId) {
    if (!confirm("¿Quitar este club del torneo?")) return;
    try {
      await tournamentsApi.removeClub(id, clubId);
      setTournamentClubs((prev) => prev.filter((c) => c._id !== clubId));
    } catch (err) {
      alert(err.response?.data?.message ?? "Error quitando club");
    }
  }

  async function handleDeleteMatch(matchId) {
    if (!confirm("¿Eliminar este partido?")) return;
    try {
      await matchesApi.remove(matchId);
      setMatches((prev) => prev.filter((m) => m._id !== matchId));
    } catch (err) {
      alert(err.response?.data?.message ?? "Error eliminando partido");
    }
  }

  async function handleUpdateTournament(formData) {
    try {
      const res = await tournamentsApi.update(id, formData);
      setTournament(res.data.tournament);
      setShowEditTournament(false);
      setEditTournamentError("");
    } catch (err) {
      setEditTournamentError(err.response?.data?.message ?? "Error actualizando torneo");
    }
  }

  async function handleUpdateMatch(matchId, formData) {
    try {
      const res = await matchesApi.update(matchId, formData);
      setMatches((prev) =>
        prev.map((m) => (m._id === matchId ? res.data.match : m))
      );
      setEditingMatch(null);
      setEditMatchError("");
    } catch (err) {
      setEditMatchError(err.response?.data?.message ?? "Error actualizando partido");
    }
  }

  async function handleMarkMatchPlayed(matchId) {
    try {
      const res = await matchesApi.update(matchId, { status: "played" });
      setMatches((prev) =>
        prev.map((m) => (m._id === matchId ? res.data.match : m))
      );
      const tableRes = await tournamentsApi.getTable(id);
      setTable(tableRes.data.table ?? []);
    } catch (err) {
      alert(err.response?.data?.message ?? "Error actualizando partido");
    }
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
        <button onClick={() => navigate("/tournaments")} className="btn-secondary mx-auto">
          Volver a torneos
        </button>
      </div>
    );
  }

  const inTournamentIds = new Set(tournamentClubs.map((c) => c._id));
  const clubsToAdd = allClubs.filter((c) => !inTournamentIds.has(c._id));

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/tournaments")}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <BackIcon /> Torneos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={TYPE_BADGE[tournament.type] ?? "badge-tournament"}>
              {TYPE_LABELS[tournament.type] ?? tournament.type}
            </span>
            <span className={STATUS_BADGE[tournament.status] ?? "badge-draft"}>
              {STATUS_LABELS[tournament.status] ?? tournament.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Temporada {tournament.season}</p>
        </div>
        <button
          onClick={() => { setEditTournamentError(""); setShowEditTournament(true); }}
          className="btn-secondary shrink-0 flex items-center gap-2"
        >
          <PencilIcon /> Editar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "text-white border-green-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            {tab}
            {tab === "Clubes" && (
              <span className="ml-1.5 text-[11px] text-gray-600">({tournamentClubs.length})</span>
            )}
            {tab === "Partidos" && (
              <span className="ml-1.5 text-[11px] text-gray-600">({matches.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Clubes" && (
        <ClubsTab
          tournamentClubs={tournamentClubs}
          clubsToAdd={clubsToAdd}
          onAdd={handleAddClub}
          onRemove={handleRemoveClub}
        />
      )}
      {activeTab === "Tabla" && <TableTab table={table} />}
      {activeTab === "Partidos" && (
        <MatchesTab
          matches={matches}
          tournamentId={id}
          onDelete={handleDeleteMatch}
          onEdit={(match) => { setEditMatchError(""); setEditingMatch(match); }}
          onMarkPlayed={handleMarkMatchPlayed}
          onView={(matchId) => navigate(`/tournaments/${id}/matches/${matchId}`)}
          navigate={navigate}
        />
      )}

      {/* Edit tournament modal */}
      {showEditTournament && (
        <EditTournamentModal
          tournament={tournament}
          error={editTournamentError}
          onSave={handleUpdateTournament}
          onClose={() => setShowEditTournament(false)}
        />
      )}

      {/* Edit match modal */}
      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          clubs={tournamentClubs}
          error={editMatchError}
          onSave={(data) => handleUpdateMatch(editingMatch._id, data)}
          onClose={() => setEditingMatch(null)}
        />
      )}
    </div>
  );
}

/* ── Tabs ── */

function ClubsTab({ tournamentClubs, clubsToAdd, onAdd, onRemove }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="section-title">Clubes en el torneo</p>
        {tournamentClubs.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500 text-sm">No hay clubes en este torneo todavía</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Club</th>
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
                        <span className="font-medium text-gray-100">{club.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-400">{club.country || "—"}</td>
                    <td className="text-right">
                      <button onClick={() => onRemove(club._id)} className="btn-danger">
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

      {clubsToAdd.length > 0 && (
        <div>
          <p className="section-title">Agregar club al torneo</p>
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Club</th>
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
        </div>
      )}
    </div>
  );
}

function TableTab({ table }) {
  if (table.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-500 text-sm">
          Agrega clubes al torneo para ver la tabla de posiciones.
          <br />
          <span className="text-gray-600 text-xs mt-1 block">
            La tabla se calculará con los partidos con estado "Jugado".
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-8">#</th>
            <th>Club</th>
            <th className="text-center">PJ</th>
            <th className="text-center">G</th>
            <th className="text-center">E</th>
            <th className="text-center">P</th>
            <th className="text-center">GF</th>
            <th className="text-center">GC</th>
            <th className="text-center">DG</th>
            <th className="text-center text-white font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row, i) => (
            <tr key={row.club.id}>
              <td>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    i === 0 ? "text-yellow-400"
                    : i === 1 ? "text-gray-300"
                    : i === 2 ? "text-orange-500"
                    : "text-gray-600"
                  }`}
                >
                  {i + 1}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <ClubAvatar name={row.club.name} small />
                  <span className="font-medium text-gray-100">{row.club.name}</span>
                </div>
              </td>
              <td className="text-center text-gray-400 tabular-nums">{row.played}</td>
              <td className="text-center text-green-400 tabular-nums">{row.wins}</td>
              <td className="text-center text-gray-400 tabular-nums">{row.draws}</td>
              <td className="text-center text-red-400 tabular-nums">{row.losses}</td>
              <td className="text-center text-gray-300 tabular-nums">{row.goalsFor}</td>
              <td className="text-center text-gray-300 tabular-nums">{row.goalsAgainst}</td>
              <td className="text-center text-gray-300 tabular-nums">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
              <td className="text-center font-bold text-white tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchesTab({ matches, tournamentId, onDelete, onEdit, onMarkPlayed, onView, navigate }) {
  const [filter, setFilter] = useState("all");

  const scheduledCount = matches.filter((m) => m.status === "scheduled").length;
  const playedCount = matches.filter((m) => m.status === "played").length;
  const filtered = filter === "all" ? matches : matches.filter((m) => m.status === filter);

  const FILTERS = [
    { key: "all", label: "Todos", count: matches.length },
    { key: "scheduled", label: "Programados", count: scheduledCount },
    { key: "played", label: "Jugados", count: playedCount },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/tournaments/${tournamentId}/matches/create`)}
          className="btn-primary"
        >
          <PlusIcon /> Crear partido manual
        </button>
        <button
          onClick={() => navigate(`/tournaments/${tournamentId}/matches/import-image`)}
          className="btn-secondary"
        >
          <ImageIcon /> Importar por imagen
        </button>
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
                  ? { color: "var(--fifa-neon)", borderColor: "rgba(36,255,122,0.35)", backgroundColor: "rgba(36,255,122,0.10)" }
                  : { color: "var(--fifa-mute)", borderColor: "var(--fifa-line)", backgroundColor: "rgba(255,255,255,0.03)" }
              }
            >
              {f.label}{" "}
              <span
                className="ml-1 rounded px-1"
                style={{
                  backgroundColor: filter === f.key ? "rgba(36,255,122,0.15)" : "rgba(255,255,255,0.06)",
                  color: filter === f.key ? "var(--fifa-neon)" : "var(--fifa-mute)",
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
            {filter === "all"
              ? "No hay partidos registrados todavía"
              : `No hay partidos ${filter === "scheduled" ? "programados" : "jugados"}`}
          </p>
        </div>
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

function MatchRow({ match, onDelete, onEdit, onMarkPlayed, onView }) {
  const date = new Date(match.date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="card px-5 py-4 flex items-center gap-4 cursor-pointer"
      onClick={onView}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--fifa-line)"; }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={MATCH_STATUS_BADGE[match.status] ?? "badge-scheduled"}>
            {MATCH_STATUS_LABELS[match.status] ?? match.status}
          </span>
          <span className="text-xs text-gray-600">{date}</span>
          {match.stadium && (
            <span className="text-xs text-gray-600 truncate">{match.stadium}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-200 flex-1 text-right truncate">
            {match.homeClub?.name ?? "—"}
          </span>
          <span className="text-xl font-bold text-white tabular-nums shrink-0">
            {match.scoreHome} – {match.scoreAway}
          </span>
          <span className="text-sm font-semibold text-gray-200 flex-1 truncate">
            {match.awayClub?.name ?? "—"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {match.status === "scheduled" && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkPlayed(); }}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{ color: "var(--fifa-neon)", borderColor: "rgba(36,255,122,0.20)", backgroundColor: "rgba(36,255,122,0.06)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(36,255,122,0.12)"; e.currentTarget.style.borderColor = "rgba(36,255,122,0.40)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(36,255,122,0.06)"; e.currentTarget.style.borderColor = "rgba(36,255,122,0.20)"; }}
            title="Marcar como jugado"
          >
            ✓ Jugado
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{ color: "var(--fifa-mute)", borderColor: "var(--fifa-line)", backgroundColor: "rgba(255,255,255,0.03)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fifa-text)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fifa-mute)"; e.currentTarget.style.borderColor = "var(--fifa-line)"; }}
        >
          Editar
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="btn-danger">
          Eliminar
        </button>
      </div>
    </div>
  );
}

/* ── Modals ── */

function EditTournamentModal({ tournament, error, onSave, onClose }) {
  const [form, setForm] = useState({
    name: tournament.name ?? "",
    type: tournament.type ?? "league",
    season: tournament.season ?? "",
    status: tournament.status ?? "draft",
    win: tournament.pointsConfig?.win ?? 3,
    draw: tournament.pointsConfig?.draw ?? 1,
    loss: tournament.pointsConfig?.loss ?? 0,
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name: form.name,
      type: form.type,
      season: form.season,
      status: form.status,
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
            <select name="type" value={form.type} onChange={handleChange} className="input-field">
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
          <label className="label">Estado</label>
          <select name="status" value={form.status} onChange={handleChange} className="input-field">
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="finished">Finalizado</option>
          </select>
        </div>

        <div className="border-t pt-4" style={{ borderColor: "var(--fifa-line)" }}>
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

        <ModalActions onCancel={onClose} saving={saving} label="Guardar cambios" />
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
        {/* Clubs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Club local *</label>
            <select name="homeClub" required value={form.homeClub} onChange={handleChange} className="input-field">
              <option value="">Seleccionar...</option>
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Club visitante *</label>
            <select name="awayClub" required value={form.awayClub} onChange={handleChange} className="input-field">
              <option value="">Seleccionar...</option>
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        {sameClub && <p className="error-msg">El club local y visitante no pueden ser iguales.</p>}

        {/* Score */}
        <div>
          <p className="label mb-3">Marcador</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">Local</label>
              <input name="scoreHome" type="number" min={0} value={form.scoreHome} onChange={handleChange} className="input-field text-center text-lg font-bold" />
            </div>
            <span className="text-gray-600 font-bold text-xl mt-4">–</span>
            <div className="flex-1">
              <label className="label">Visitante</label>
              <input name="scoreAway" type="number" min={0} value={form.scoreAway} onChange={handleChange} className="input-field text-center text-lg font-bold" />
            </div>
          </div>
        </div>

        {/* Date + Stadium */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha *</label>
            <input name="date" type="datetime-local" required value={form.date} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Estadio</label>
            <input name="stadium" type="text" value={form.stadium} onChange={handleChange} placeholder="Nombre del estadio" className="input-field" />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label">Estado</label>
          <select name="status" value={form.status} onChange={handleChange} className="input-field">
            <option value="scheduled">Programado</option>
            <option value="played">Jugado</option>
          </select>
        </div>

        {/* Stats */}
        <div className="border-t pt-5" style={{ borderColor: "var(--fifa-line)" }}>
          <p className="label mb-1">
            Estadísticas{" "}
            <span className="text-xs font-normal" style={{ color: "var(--fifa-mute)" }}>opcional</span>
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 mt-3">
            <span className="text-xs text-center mb-2" style={{ color: "var(--fifa-mute)" }}>Local</span>
            <span />
            <span className="text-xs text-center mb-2" style={{ color: "var(--fifa-mute)" }}>Visitante</span>
            <input name="possessionHome" type="number" min={0} max={100} value={form.possessionHome} onChange={handleChange} className="input-field text-center mb-3" />
            <span className="text-xs text-center px-2 whitespace-nowrap mb-3" style={{ color: "var(--fifa-mute)" }}>Posesión %</span>
            <input name="possessionAway" type="number" min={0} max={100} value={form.possessionAway} onChange={handleChange} className="input-field text-center mb-3" />
            <input name="shotsHome" type="number" min={0} value={form.shotsHome} onChange={handleChange} className="input-field text-center mb-3" />
            <span className="text-xs text-center px-2 whitespace-nowrap mb-3" style={{ color: "var(--fifa-mute)" }}>Tiros</span>
            <input name="shotsAway" type="number" min={0} value={form.shotsAway} onChange={handleChange} className="input-field text-center mb-3" />
            <input name="passesHome" type="number" min={0} value={form.passesHome} onChange={handleChange} className="input-field text-center" />
            <span className="text-xs text-center px-2 whitespace-nowrap" style={{ color: "var(--fifa-mute)" }}>Pases</span>
            <input name="passesAway" type="number" min={0} value={form.passesAway} onChange={handleChange} className="input-field text-center" />
          </div>
        </div>

        <ModalActions onCancel={onClose} saving={saving} label="Guardar cambios" />
      </form>
    </Modal>
  );
}

/* ── Icons ── */

function Spinner() {
  return <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />;
}

function BackIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}
