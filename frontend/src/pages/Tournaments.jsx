import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tournamentsApi } from "../api";
import { Modal, ModalActions } from "./Clubs";

const TYPE_LABELS = { league: "Liga", tournament: "Torneo" };
const TYPE_BADGE = { league: "badge-league", tournament: "badge-tournament" };
const STATUS_LABELS = { active: "Activo", draft: "Borrador", finished: "Finalizado" };
const STATUS_BADGE = { active: "badge-active", draft: "badge-draft", finished: "badge-finished" };

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
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

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("¿Eliminar este torneo? Los partidos asociados también se eliminarán.")) return;
    try {
      await tournamentsApi.remove(id);
      setTournaments((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      alert(err.response?.data?.message ?? "Error eliminando torneo");
    }
  }

  async function handleCreate(formData) {
    try {
      const res = await tournamentsApi.create(formData);
      setTournaments((prev) => [...prev, res.data.tournament]);
      setShowModal(false);
      setModalError("");
    } catch (err) {
      setModalError(err.response?.data?.message ?? "Error creando torneo");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Torneos y Ligas</h1>
          <p className="page-subtitle">Gestiona tus competiciones</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon /> Nueva liga
        </button>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : tournaments.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">Sin torneos ni ligas todavía</p>
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

      {showModal && (
        <TournamentModal
          error={modalError}
          onCreate={handleCreate}
          onClose={() => { setShowModal(false); setModalError(""); }}
        />
      )}
    </div>
  );
}

function TournamentCard({ tournament, onClick, onDelete }) {
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
        Temporada {tournament.season} · {tournament.clubs?.length ?? 0} clubes
      </p>
    </div>
  );
}

function TournamentModal({ error, onCreate, onClose }) {
  const [form, setForm] = useState({
    name: "",
    type: "league",
    season: new Date().getFullYear().toString(),
    status: "draft",
    win: 3,
    draw: 1,
    loss: 0,
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onCreate({
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
    <Modal title="Nueva liga / torneo" onClose={onClose}>
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
            placeholder="Ej: Liga Apertura 2026"
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

        <ModalActions onCancel={onClose} saving={saving} label="Crear liga" />
      </form>
    </Modal>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="h-5 rounded-full w-12" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
            <div className="h-5 rounded-full w-16" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          </div>
          <div className="h-5 rounded w-44 mb-2" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
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
