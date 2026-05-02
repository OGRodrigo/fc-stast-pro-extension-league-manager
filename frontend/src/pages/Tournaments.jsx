import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tournamentsApi, clubsApi } from "../api";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import ClubAvatar from "../components/ui/ClubAvatar";

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

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    tournamentsApi
      .getAll()
      .then((res) => setTournaments(res.data.tournaments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setModalError("");
    setShowModal(true);
  }

  function handleDelete(id, e) {
    e.stopPropagation();
    setConfirmState({
      message: "¿Eliminar este torneo?",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await tournamentsApi.remove(id);
          setTournaments((prev) => prev.filter((t) => t._id !== id));
        } catch (err) {
          alert(err.response?.data?.message ?? "Error eliminando torneo");
        }
      },
    });
  }

  async function handleCreate(formData, selectedClubIds) {
    try {
      const res = await tournamentsApi.create(formData);
      const tournament = res.data.tournament;

      for (const clubId of selectedClubIds) {
        try {
          await tournamentsApi.addClub(tournament._id, clubId);
        } catch {
          // continue if a single club fails
        }
      }

      setShowModal(false);
      setModalError("");
      navigate(`/tournaments/${tournament._id}`);
    } catch (err) {
      setModalError(err.response?.data?.message ?? "Error creando torneo");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Torneos y Ligas</h1>
          <p className="page-subtitle">
            Crea ligas por puntos, copas o formatos mixtos.
          </p>
        </div>

        <button onClick={openCreate} className="btn-primary">
          <PlusIcon /> Crear liga / torneo
        </button>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : tournaments.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Sin torneos ni ligas todavía
          </p>
          <button onClick={openCreate} className="btn-primary mx-auto">
            Crear primera liga
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tournaments.map((t) => (
            <TournamentCard
              key={t._id}
              tournament={t}
              onClick={() => navigate(`/tournaments/${t._id}`)}
              onDelete={(e) => handleDelete(t._id, e)}
            />
          ))}
        </div>
      )}

      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {showModal && (
        <TournamentModal
          error={modalError}
          onCreate={handleCreate}
          onClose={() => {
            setShowModal(false);
            setModalError("");
          }}
        />
      )}
    </div>
  );
}

function TournamentCard({ tournament, onClick, onDelete }) {
  const clubsCount = tournament.clubs?.length ?? 0;
  const maxClubs = tournament.maxClubs ?? "—";

  return (
    <div
      onClick={onClick}
      className="card p-5 cursor-pointer group transition-all duration-200"
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

        <button
          onClick={onDelete}
          className="btn-danger opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Eliminar
        </button>
      </div>

      <p className="text-white font-semibold text-base">{tournament.name}</p>

      <p className="text-gray-500 text-xs mt-1">
        Temporada {tournament.season} · {clubsCount}/{maxClubs} equipos
      </p>

      <p className="text-gray-500 text-xs mt-1">
        Formato: {FORMAT_LABELS[tournament.format] ?? tournament.format ?? "—"}
      </p>

      {tournament.hasPlayoffs && (
        <p className="text-green-400 text-xs mt-2">
          Clasifican {tournament.playoffTeams} a playoffs
        </p>
      )}
    </div>
  );
}

function TournamentModal({ error, onCreate, onClose }) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    type: "league",
    format: "league",
    season: new Date().getFullYear().toString(),
    status: "draft",
    maxClubs: 8,
    playoffTeams: 4,
    win: 3,
    draw: 1,
    loss: 0,
  });
  const [formError, setFormError] = useState("");
  const [loadingClubs, setLoadingClubs] = useState(false);

  const [clubs, setClubs] = useState([]);
  const [selectedClubs, setSelectedClubs] = useState(new Set());
  const [clubsError, setClubsError] = useState("");
  const [saving, setSaving] = useState(false);

  const isMixed = form.format === "mixed";
  const maxClubs = Number(form.maxClubs);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "format" && value !== "mixed" ? { playoffTeams: 0 } : {}),
    }));
  }

  async function goToStep2(e) {
    e.preventDefault();
    setFormError("");

    if (maxClubs < 2) {
      setFormError("Debe haber al menos 2 equipos.");
      return;
    }
    if (isMixed && Number(form.playoffTeams) < 2) {
      setFormError("Si es liga + playoffs, deben clasificar al menos 2 equipos.");
      return;
    }
    if (isMixed && Number(form.playoffTeams) > maxClubs) {
      setFormError("Los clasificados a playoffs no pueden superar el máximo de equipos.");
      return;
    }

    setLoadingClubs(true);
    try {
      const res = await clubsApi.getAll();
      setClubs(res.data.clubs ?? []);
      setStep(2);
    } catch {
      setFormError("Error cargando clubes. Inténtalo de nuevo.");
    } finally {
      setLoadingClubs(false);
    }
  }

  function toggleClub(id) {
    setClubsError("");
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedClubs.size !== maxClubs) {
      setClubsError(`Debes seleccionar exactamente ${maxClubs} clubes.`);
      return;
    }
    setSaving(true);
    await onCreate(
      {
        name: form.name,
        type: form.type,
        format: form.format,
        season: form.season,
        status: form.status,
        maxClubs,
        hasPlayoffs: isMixed,
        playoffTeams: isMixed ? Number(form.playoffTeams) : 0,
        pointsConfig: {
          win: Number(form.win),
          draw: Number(form.draw),
          loss: Number(form.loss),
        },
      },
      Array.from(selectedClubs)
    );
    setSaving(false);
  }

  if (step === 1) {
    return (
      <Modal title="Nueva liga / torneo" onClose={onClose}>
        <div className="flex items-center gap-2 mb-4">
          <StepDot n={1} active />
          <div className="h-px flex-1" style={{ backgroundColor: "var(--fifa-line)" }} />
          <StepDot n={2} />
        </div>

        {(formError || error) && (
          <p className="error-msg mb-4">{formError || error}</p>
        )}

        <form onSubmit={goToStep2} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Liga Apertura 2026"
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
              required
              value={form.maxClubs}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {isMixed && (
            <div>
              <label className="label">Equipos que clasifican a playoffs *</label>
              <input
                name="playoffTeams"
                type="number"
                min={2}
                max={form.maxClubs}
                required
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

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loadingClubs} className="btn-primary">
              {loadingClubs ? "Cargando..." : "Siguiente →"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal title="Seleccionar clubes" onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <StepDot done />
        <div
          className="h-px flex-1"
          style={{ backgroundColor: "var(--fifa-neon)", opacity: 0.4 }}
        />
        <StepDot active />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--fifa-mute)" }}>
            Clubes participantes
          </p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-md tabular-nums"
            style={{
              color:
                selectedClubs.size === maxClubs
                  ? "var(--fifa-neon)"
                  : "var(--fifa-mute)",
              backgroundColor:
                selectedClubs.size === maxClubs
                  ? "rgba(36,255,122,0.08)"
                  : "rgba(255,255,255,0.05)",
              border: `1px solid ${
                selectedClubs.size === maxClubs
                  ? "rgba(36,255,122,0.3)"
                  : "var(--fifa-line)"
              }`,
            }}
          >
            {selectedClubs.size} / {maxClubs} seleccionados
          </span>
        </div>

        {clubs.length === 0 ? (
          <div className="text-center py-8 border rounded-lg" style={{ borderColor: "var(--fifa-line)" }}>
            <p className="text-sm text-gray-500">No hay clubes creados.</p>
            <p className="text-xs text-gray-600 mt-1">
              Crea clubes primero en la sección Clubes.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-64 space-y-1.5 pr-1">
            {clubs.map((club) => {
              const isSelected = selectedClubs.has(club._id);
              return (
                <button
                  key={club._id}
                  type="button"
                  onClick={() => toggleClub(club._id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? "rgba(36,255,122,0.06)"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      isSelected
                        ? "rgba(36,255,122,0.4)"
                        : "var(--fifa-line)"
                    }`,
                  }}
                >
                  <ClubAvatar name={club.name} logo={club.logo} small />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {club.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--fifa-mute)" }}
                    >
                      {club.abbr}
                      {club.country ? ` · ${club.country}` : ""}
                    </p>
                  </div>
                  {isSelected && <CheckIcon />}
                </button>
              );
            })}
          </div>
        )}

        {(clubsError || error) && (
          <p className="error-msg">{clubsError || error}</p>
        )}

        <div
          className="flex justify-between pt-3 border-t"
          style={{ borderColor: "var(--fifa-line)" }}
        >
          <button
            type="button"
            onClick={() => setStep(1)}
            className="btn-secondary"
            disabled={saving}
          >
            ← Volver
          </button>
          <button
            type="submit"
            disabled={saving || clubs.length === 0}
            className="btn-primary"
          >
            {saving ? "Creando..." : "Crear liga / torneo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StepDot({ active, done }) {
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{
        backgroundColor: active
          ? "var(--fifa-neon)"
          : done
          ? "rgba(36,255,122,0.2)"
          : "rgba(255,255,255,0.08)",
        color: active ? "#000" : done ? "var(--fifa-neon)" : "var(--fifa-mute)",
        border: done && !active ? "1px solid rgba(36,255,122,0.3)" : "none",
      }}
    >
      {done && !active ? <CheckIcon small /> : active ? "2" : "1"}
    </div>
  );
}

function CheckIcon({ small }) {
  return (
    <svg
      className={small ? "w-3 h-3" : "w-4 h-4"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      style={{ color: "var(--fifa-neon)", flexShrink: 0 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex gap-2 mb-3">
            <div
              className="h-5 rounded-full w-12"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            />
            <div
              className="h-5 rounded-full w-16"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            />
          </div>
          <div
            className="h-5 rounded w-44 mb-2"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          />
          <div
            className="h-3 rounded w-28"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          />
        </div>
      ))}
    </div>
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
