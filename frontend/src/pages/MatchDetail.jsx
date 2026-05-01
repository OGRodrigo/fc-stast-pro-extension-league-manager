import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { matchesApi, tournamentsApi } from "../api";
import { Modal, ModalActions } from "./Clubs";

const MATCH_STATUS_BADGE = { scheduled: "badge-scheduled", played: "badge-played" };
const MATCH_STATUS_LABELS = { scheduled: "Programado", played: "Jugado" };

function toDatetimeLocal(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MatchDetail() {
  const { id: tournamentId, matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    Promise.all([
      matchesApi.getOne(matchId),
      tournamentsApi.getClubs(tournamentId),
    ])
      .then(([mRes, cRes]) => {
        setMatch(mRes.data.match);
        setClubs(cRes.data.clubs ?? []);
      })
      .catch(() => setError("Partido no encontrado"))
      .finally(() => setLoading(false));
  }, [matchId, tournamentId]);

  async function handleUpdate(formData) {
    try {
      const res = await matchesApi.update(matchId, formData);
      setMatch(res.data.match);
      setShowEdit(false);
      setEditError("");
    } catch (err) {
      setEditError(err.response?.data?.message ?? "Error actualizando partido");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="card p-10 text-center space-y-4">
        <p className="text-red-400">{error || "Partido no encontrado"}</p>
        <button
          onClick={() => navigate(`/tournaments/${tournamentId}`)}
          className="btn-secondary mx-auto"
        >
          Volver al torneo
        </button>
      </div>
    );
  }

  const s = match.clubStats ?? {};
  const hasStats =
    (s.possessionHome || 0) > 0 ||
    (s.possessionAway || 0) > 0 ||
    (s.shotsHome || 0) > 0 ||
    (s.shotsAway || 0) > 0 ||
    (s.passesHome || 0) > 0 ||
    (s.passesAway || 0) > 0;

  const date = new Date(match.date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate(`/tournaments/${tournamentId}`)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <BackIcon /> {match.tournament?.name ?? "Torneo"}
      </button>

      {/* Match card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className={MATCH_STATUS_BADGE[match.status] ?? "badge-scheduled"}>
            {MATCH_STATUS_LABELS[match.status] ?? match.status}
          </span>
          <span className="text-xs capitalize" style={{ color: "var(--fifa-mute)" }}>{date}</span>
          {match.stadium && (
            <span className="text-xs" style={{ color: "var(--fifa-mute)" }}>· {match.stadium}</span>
          )}
        </div>

        <div
          className="flex items-center justify-between gap-2 py-5 border-y"
          style={{ borderColor: "var(--fifa-line)" }}
        >
          <div className="flex-1 text-right">
            <p className="text-xl font-bold" style={{ color: "var(--fifa-text)" }}>
              {match.homeClub?.name ?? "—"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--fifa-mute)" }}>Local</p>
          </div>
          <div className="text-center px-4 shrink-0">
            <p
              className="tabular-nums"
              style={{
                fontFamily: "var(--font-title)",
                fontSize: "3rem",
                color: "var(--fifa-text)",
                lineHeight: 1,
                letterSpacing: "0.05em",
              }}
            >
              {match.scoreHome} – {match.scoreAway}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold" style={{ color: "var(--fifa-text)" }}>
              {match.awayClub?.name ?? "—"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--fifa-mute)" }}>Visitante</p>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => { setEditError(""); setShowEdit(true); }}
            className="btn-secondary flex items-center gap-2"
          >
            <PencilIcon /> Editar partido
          </button>
        </div>
      </div>

      {/* Stats */}
      {hasStats ? (
        <div className="card p-6 space-y-5">
          <h2
            className="text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-title)", color: "var(--fifa-mute)", fontWeight: 700 }}
          >
            Estadísticas del partido
          </h2>

          <div className="space-y-5">
            <StatBar
              label="Posesión"
              unit="%"
              home={s.possessionHome ?? 0}
              away={s.possessionAway ?? 0}
            />
            <StatBar
              label="Tiros"
              home={s.shotsHome ?? 0}
              away={s.shotsAway ?? 0}
            />
            <StatBar
              label="Pases"
              home={s.passesHome ?? 0}
              away={s.passesAway ?? 0}
            />
          </div>

          <div
            className="flex justify-between text-xs pt-3 border-t"
            style={{ borderColor: "var(--fifa-line)", color: "var(--fifa-mute)" }}
          >
            <span style={{ color: "var(--fifa-neon)", fontWeight: 600 }}>
              {match.homeClub?.name ?? "Local"}
            </span>
            <span style={{ color: "var(--fifa-cyan)", fontWeight: 600 }}>
              {match.awayClub?.name ?? "Visitante"}
            </span>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--fifa-mute)" }}>
            No hay estadísticas registradas para este partido.
          </p>
          <button
            onClick={() => { setEditError(""); setShowEdit(true); }}
            className="text-xs mt-3 transition-opacity hover:opacity-80"
            style={{ color: "var(--fifa-neon)" }}
          >
            + Agregar estadísticas
          </button>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <EditMatchModal
          match={match}
          clubs={clubs}
          error={editError}
          onSave={handleUpdate}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

/* ── Stat bar ── */

function StatBar({ label, unit = "", home, away }) {
  const total = home + away;
  if (total === 0) return null;

  const homePct = Math.round((home / total) * 100);
  const awayPct = 100 - homePct;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold tabular-nums" style={{ color: "var(--fifa-neon)" }}>
          {home}{unit}
        </span>
        <span className="text-xs" style={{ color: "var(--fifa-mute)" }}>{label}</span>
        <span className="font-bold tabular-nums" style={{ color: "var(--fifa-cyan)" }}>
          {away}{unit}
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div
          style={{
            width: `${homePct}%`,
            backgroundColor: "var(--fifa-neon)",
            transition: "width 0.5s ease",
          }}
        />
        <div
          style={{
            width: `${awayPct}%`,
            backgroundColor: "var(--fifa-cyan)",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ── Edit modal ── */

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
              {clubs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Club visitante *</label>
            <select name="awayClub" required value={form.awayClub} onChange={handleChange} className="input-field">
              <option value="">Seleccionar...</option>
              {clubs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
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

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  );
}
