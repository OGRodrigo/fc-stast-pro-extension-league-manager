import { useState, useEffect } from "react";
import { clubsApi } from "../api";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClub, setEditClub] = useState(null);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    clubsApi
      .getAll()
      .then((res) => setClubs(res.data.clubs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditClub(null);
    setModalError("");
    setShowModal(true);
  }

  function openEdit(club) {
    setEditClub(club);
    setModalError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditClub(null);
    setModalError("");
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este club? Esta acción no se puede deshacer.")) return;
    try {
      await clubsApi.remove(id);
      setClubs((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message ?? "Error eliminando club");
    }
  }

  async function handleSave(formData) {
    try {
      if (editClub) {
        const res = await clubsApi.update(editClub._id, formData);
        setClubs((prev) =>
          prev.map((c) => (c._id === editClub._id ? res.data.club : c))
        );
      } else {
        const res = await clubsApi.create(formData);
        setClubs((prev) => [...prev, res.data.club]);
      }
      closeModal();
    } catch (err) {
      setModalError(err.response?.data?.message ?? "Error guardando club");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clubes</h1>
          <p className="page-subtitle">Gestión de clubes globales</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon /> Nuevo club
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : clubs.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">Aún no tienes clubes registrados</p>
          <button onClick={openCreate} className="btn-primary mx-auto">
            Crear primer club
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Club</th>
                <th>País</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr key={club._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <ClubAvatar name={club.name} />
                      <span className="font-medium text-gray-100">{club.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-400">{club.country || "—"}</td>
                  <td>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(club)}
                        className="text-xs text-gray-500 hover:text-gray-200 px-2 py-1 rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button onClick={() => handleDelete(club._id)} className="btn-danger">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ClubModal
          club={editClub}
          error={modalError}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function ClubModal({ club, error, onSave, onClose }) {
  const [form, setForm] = useState({
    name: club?.name ?? "",
    country: club?.country ?? "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <Modal title={club ? "Editar club" : "Nuevo club"} onClose={onClose}>
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
            placeholder="Nombre del club"
            className="input-field"
          />
        </div>
        <div>
          <label className="label">País</label>
          <input
            name="country"
            type="text"
            value={form.country}
            onChange={handleChange}
            placeholder="Ej: Argentina"
            className="input-field"
          />
        </div>
        <ModalActions
          onCancel={onClose}
          saving={saving}
          label={club ? "Guardar cambios" : "Crear club"}
        />
      </form>
    </Modal>
  );
}

export function ClubAvatar({ name, dim, small }) {
  return (
    <div
      className={`rounded-full border flex items-center justify-center shrink-0 ${
        small ? "w-6 h-6" : "w-8 h-8"
      }`}
      style={{
        backgroundColor: dim ? "rgba(255,255,255,0.04)" : "rgba(34,197,94,0.08)",
        borderColor: dim ? "rgba(255,255,255,0.08)" : "rgba(34,197,94,0.2)",
      }}
    >
      <span
        className={`font-bold ${small ? "text-[9px]" : "text-xs"}`}
        style={{ color: dim ? "#6b7280" : "#4ade80" }}
      >
        {name?.substring(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ onCancel, saving, label }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel} className="btn-secondary flex-1">
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="btn-primary flex-1">
        {saving ? "Guardando..." : label}
      </button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-white/5 animate-pulse"
        >
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          <div className="h-4 rounded w-36" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          <div className="ml-auto h-4 rounded w-20" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
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
