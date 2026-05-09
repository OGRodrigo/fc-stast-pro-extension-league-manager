import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { tournamentsApi, clubsApi } from "../api";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import ClubAvatar from "../components/ui/ClubAvatar";
import { heroItem, staggerGrid, cardItem } from "../utils/motionVariants";

const TYPE_LABELS = { league: "Liga", tournament: "Torneo" };
const TYPE_BADGE  = { league: "badge-league", tournament: "badge-tournament" };

const FORMAT_LABELS = {
  league: "Tabla de puntos",
  cup: "Copa",
  mixed: "Liga + playoffs",
};

const STATUS_LABELS = { active: "Activo", draft: "Borrador", finished: "Finalizado" };
const STATUS_BADGE  = { active: "badge-active", draft: "badge-draft", finished: "badge-finished" };

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
        try { await tournamentsApi.addClub(tournament._id, clubId); } catch { /* continue */ }
      }
      setShowModal(false);
      setModalError("");
      navigate(`/tournaments/${tournament._id}`);
    } catch (err) {
      setModalError(err.response?.data?.message ?? "Error creando torneo");
    }
  }

  return (
    <div className="space-y-6">

      {/* Premium Header */}
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

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
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
              Competition Center
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
              Torneos y Ligas
            </h1>

            <p
              className="mt-2 max-w-xl"
              style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
            >
              Crea, organiza y administra competiciones con formato de liga,
              copa o liga con playoffs.
            </p>
          </div>

          <button onClick={openCreate} className="btn-primary">
            <PlusIcon />
            Crear liga / torneo
          </button>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <GridSkeleton />
      ) : tournaments.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <motion.div
          variants={staggerGrid}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {tournaments.map((t) => (
            <motion.div key={t._id} variants={cardItem}>
              <TournamentCard
                tournament={t}
                onClick={() => navigate(`/tournaments/${t._id}`)}
                onDelete={(e) => handleDelete(t._id, e)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {confirmState && (
          <ConfirmModal
            message={confirmState.message}
            onConfirm={confirmState.onConfirm}
            onCancel={() => setConfirmState(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}

function TournamentCard({ tournament, onClick, onDelete }) {
  const clubsCount = tournament.clubs?.length ?? 0;
  const maxClubs = tournament.maxClubs ?? "—";

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-3xl p-5 text-left transition-all duration-300 hover:-translate-y-1 h-full"
      style={{
        background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
        border: "1px solid rgba(36,255,122,0.10)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 12px 30px rgba(0,0,0,.35)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid rgba(36,255,122,0.28)";
        e.currentTarget.style.boxShadow =
          "0 0 0 1px rgba(255,255,255,0.03), 0 18px 45px rgba(0,0,0,.48), 0 0 24px rgba(36,255,122,.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid rgba(36,255,122,0.10)";
        e.currentTarget.style.boxShadow =
          "0 0 0 1px rgba(255,255,255,0.02), 0 12px 30px rgba(0,0,0,.35)";
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className={TYPE_BADGE[tournament.type] ?? "badge-tournament"}>
            {TYPE_LABELS[tournament.type] ?? tournament.type}
          </span>
          <span className={STATUS_BADGE[tournament.status] ?? "badge-draft"}>
            {STATUS_LABELS[tournament.status] ?? tournament.status}
          </span>
        </div>
        <button
          onClick={onDelete}
          className="btn-danger opacity-0 transition-opacity group-hover:opacity-100"
        >
          Eliminar
        </button>
      </div>

      <p className="text-base font-semibold text-white">{tournament.name}</p>
      <p className="mt-1 text-xs text-gray-500">
        Temporada {tournament.season} · {clubsCount}/{maxClubs} equipos
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Formato: {FORMAT_LABELS[tournament.format] ?? tournament.format ?? "—"}
      </p>
      {tournament.hasPlayoffs && (
        <p className="mt-2 text-xs text-green-400">
          Clasifican {tournament.playoffTeams} a playoffs
        </p>
      )}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div
      className="rounded-3xl p-10 text-center"
      style={{
        background: "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
        border: "1px solid rgba(36,255,122,0.10)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 18px 45px rgba(0,0,0,.38)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-title)",
          color: "var(--fifa-text)",
          fontSize: "1.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Sin competiciones creadas
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--fifa-mute)" }}>
        Crea tu primera liga o torneo para comenzar a organizar clubes,
        resultados y tablas de competición.
      </p>
      <button onClick={onCreate} className="btn-primary mx-auto mt-5">
        <PlusIcon />
        Crear primera liga
      </button>
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
    if (maxClubs < 2) { setFormError("Debe haber al menos 2 equipos."); return; }
    if (isMixed && Number(form.playoffTeams) < 2) {
      setFormError("Si es liga + playoffs, deben clasificar al menos 2 equipos."); return;
    }
    if (isMixed && Number(form.playoffTeams) > maxClubs) {
      setFormError("Los clasificados a playoffs no pueden superar el máximo de equipos."); return;
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedClubs.size !== maxClubs) {
      setClubsError(`Debes seleccionar exactamente ${maxClubs} clubes.`); return;
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
        pointsConfig: { win: Number(form.win), draw: Number(form.draw), loss: Number(form.loss) },
      },
      Array.from(selectedClubs)
    );
    setSaving(false);
  }

  if (step === 1) {
    return (
      <Modal title="Nueva liga / torneo" onClose={onClose}>
        <div className="mb-4 flex items-center gap-2">
          <StepDot n={1} active />
          <div className="h-px flex-1" style={{ backgroundColor: "var(--fifa-line)" }} />
          <StepDot n={2} />
        </div>

        {(formError || error) && (
          <p className="error-msg mb-4">{formError || error}</p>
        )}

        <form onSubmit={goToStep2} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div>
            <label className="label">Nombre *</label>
            <input
              name="name" type="text" required value={form.name} onChange={handleChange}
              placeholder="Ej: Liga Apertura 2026" className="input-field"
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
                name="season" type="text" value={form.season} onChange={handleChange}
                placeholder="2026" className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Formato *</label>
            <select name="format" value={form.format} onChange={handleChange} className="input-field">
              <option value="league">Liga por puntos</option>
              <option value="cup">Copa eliminación directa</option>
              <option value="mixed">Liga + playoffs</option>
            </select>
          </div>

          <div>
            <label className="label">Cantidad de equipos *</label>
            <input
              name="maxClubs" type="number" min={2} required value={form.maxClubs}
              onChange={handleChange} className="input-field"
            />
          </div>

          {isMixed && (
            <div>
              <label className="label">Equipos que clasifican a playoffs *</label>
              <input
                name="playoffTeams" type="number" min={2} max={form.maxClubs} required
                value={form.playoffTeams} onChange={handleChange} className="input-field"
              />
            </div>
          )}

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
                <input name="win" type="number" min={0} value={form.win} onChange={handleChange} className="input-field text-center" />
              </div>
              <div>
                <label className="label">Empate</label>
                <input name="draw" type="number" min={0} value={form.draw} onChange={handleChange} className="input-field text-center" />
              </div>
              <div>
                <label className="label">Derrota</label>
                <input name="loss" type="number" min={0} value={form.loss} onChange={handleChange} className="input-field text-center" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
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
      <div className="mb-4 flex items-center gap-2">
        <StepDot done />
        <div className="h-px flex-1" style={{ backgroundColor: "var(--fifa-neon)", opacity: 0.4 }} />
        <StepDot active />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--fifa-mute)" }}>Clubes participantes</p>
          <span
            className="rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
            style={{
              color: selectedClubs.size === maxClubs ? "var(--fifa-neon)" : "var(--fifa-mute)",
              backgroundColor: selectedClubs.size === maxClubs ? "rgba(36,255,122,0.08)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${selectedClubs.size === maxClubs ? "rgba(36,255,122,0.3)" : "var(--fifa-line)"}`,
            }}
          >
            {selectedClubs.size} / {maxClubs} seleccionados
          </span>
        </div>

        {clubs.length === 0 ? (
          <div className="rounded-lg border py-8 text-center" style={{ borderColor: "var(--fifa-line)" }}>
            <p className="text-sm text-gray-500">No hay clubes creados.</p>
            <p className="mt-1 text-xs text-gray-600">Crea clubes primero en la sección Clubes.</p>
          </div>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {clubs.map((club) => {
              const isSelected = selectedClubs.has(club._id);
              return (
                <button
                  key={club._id}
                  type="button"
                  onClick={() => toggleClub(club._id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
                  style={{
                    backgroundColor: isSelected ? "rgba(36,255,122,0.06)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isSelected ? "rgba(36,255,122,0.4)" : "var(--fifa-line)"}`,
                  }}
                >
                  <ClubAvatar name={club.name} logo={club.logo} small />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{club.name}</p>
                    <p className="text-xs" style={{ color: "var(--fifa-mute)" }}>
                      {club.abbr}{club.country ? ` · ${club.country}` : ""}
                    </p>
                  </div>
                  {isSelected && <CheckIcon />}
                </button>
              );
            })}
          </div>
        )}

        {(clubsError || error) && <p className="error-msg">{clubsError || error}</p>}

        <div className="flex justify-between border-t pt-3" style={{ borderColor: "var(--fifa-line)" }}>
          <button type="button" onClick={() => setStep(1)} className="btn-secondary" disabled={saving}>
            ← Volver
          </button>
          <button type="submit" disabled={saving || clubs.length === 0} className="btn-primary">
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
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        backgroundColor: active ? "var(--fifa-neon)" : done ? "rgba(36,255,122,0.2)" : "rgba(255,255,255,0.08)",
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
      className={small ? "h-3 w-3" : "h-4 w-4"}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
      style={{ color: "var(--fifa-neon)", flexShrink: 0 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[1, 2, 3].map((i) => (
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
          <div className="mb-2 h-5 w-44 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          <div className="h-3 w-28 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
        </div>
      ))}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
