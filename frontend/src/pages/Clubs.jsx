import { useState, useEffect } from "react";
import { clubsApi } from "../api";
import { Modal, ModalActions, ConfirmModal } from "../components/ui/Modal";
import ClubAvatar from "../components/ui/ClubAvatar";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");
  const [country, setCountry] = useState("");
  const [logo, setLogo] = useState("");

  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [editingClub, setEditingClub] = useState(null);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    loadClubs();
  }, []);

  async function loadClubs() {
    try {
      const res = await clubsApi.getAll();
      setClubs(res.data.clubs ?? []);
    } catch {
      setError("Error cargando clubes");
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setName("");
    setAbbr("");
    setCountry("");
    setLogo("");
    setError("");
  }

  async function handleCreateClub(e) {
    e.preventDefault();

    if (!name.trim() || !abbr.trim()) {
      setError("Nombre y abreviación son obligatorios");
      return;
    }

    try {
      setSaving(true);

      const res = await clubsApi.create({
        name: name.trim(),
        abbr: abbr.trim().toUpperCase(),
        country: country.trim(),
        logo: logo.trim(),
      });

      setClubs((prev) => [...prev, res.data.club]);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Error creando club");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditClub(id, formData) {
    try {
      const res = await clubsApi.update(id, formData);
      setClubs((prev) => prev.map((c) => (c._id === id ? res.data.club : c)));
      setEditingClub(null);
      setEditError("");
    } catch (err) {
      setEditError(err.response?.data?.message || "Error actualizando club");
    }
  }

  function handleDeleteClub(id) {
    setConfirmState({
      message: "¿Eliminar este club?",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await clubsApi.remove(id);
          setClubs((prev) => prev.filter((c) => c._id !== id));
        } catch (err) {
          alert(err.response?.data?.message || "Error eliminando club");
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clubes</h1>
          <p className="page-subtitle">
            Crea y gestiona los clubes participantes
          </p>
        </div>

        <button onClick={openModal} className="btn-primary">
          Crear club
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : clubs.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">No hay clubes aún</p>
          <button onClick={openModal} className="btn-primary mx-auto">
            Crear primer club
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clubs.map((club) => (
            <div
              key={club._id}
              className="card p-5 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <ClubAvatar name={club.name} logo={club.logo} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{club.name}</p>
                    <span className="rounded-md border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-400">
                      {club.abbr || "—"}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {club.country || "Sin país"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditError(""); setEditingClub(club); }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5"
                  style={{
                    color: "var(--fifa-mute)",
                    borderColor: "var(--fifa-line)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                  }}
                >
                  <PencilIcon /> Editar
                </button>
                <button
                  onClick={() => handleDeleteClub(club._id)}
                  className="btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
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

      {editingClub && (
        <EditClubModal
          club={editingClub}
          error={editError}
          onSave={(data) => handleEditClub(editingClub._id, data)}
          onClose={() => { setEditingClub(null); setEditError(""); }}
        />
      )}

      {showModal && (
        <Modal title="Crear club" onClose={closeModal}>
          {error && <p className="error-msg mb-4">{error}</p>}

          <form onSubmit={handleCreateClub} className="space-y-5">
            <div>
              <label className="label">Nombre del club *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
                placeholder="Ej: Real Madrid"
              />
            </div>

            <div>
              <label className="label">Abreviación *</label>
              <input
                value={abbr}
                onChange={(e) => setAbbr(e.target.value.toUpperCase())}
                required
                maxLength={5}
                className="input-field"
                placeholder="Ej: RMA"
              />
            </div>

            <div>
              <label className="label">País</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-field"
                placeholder="Ej: España"
              />
            </div>

            <div>
              <label className="label">Logo (URL)</label>
              <input
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="input-field"
                placeholder="https://ejemplo.com/logo.png"
              />
              {logo && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={logo}
                    alt="Preview"
                    className="w-10 h-10 rounded-full object-contain shrink-0"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--fifa-line)",
                    }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span className="text-xs" style={{ color: "var(--fifa-mute)" }}>
                    Vista previa
                  </span>
                </div>
              )}
            </div>

            <ModalActions
              onCancel={closeModal}
              saving={saving}
              label="Crear club"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

function EditClubModal({ club, error, onSave, onClose }) {
  const [form, setForm] = useState({
    name: club.name ?? "",
    abbr: club.abbr ?? "",
    country: club.country ?? "",
    logo: club.logo ?? "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "abbr" ? value.toUpperCase() : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.abbr.trim()) return;
    setSaving(true);
    await onSave({
      name: form.name.trim(),
      abbr: form.abbr.trim().toUpperCase(),
      country: form.country.trim(),
      logo: form.logo.trim(),
    });
    setSaving(false);
  }

  return (
    <Modal title="Editar club" onClose={onClose}>
      {error && <p className="error-msg mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Nombre del club *</label>
          <input
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Abreviación *</label>
          <input
            name="abbr"
            required
            maxLength={5}
            value={form.abbr}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">País</label>
          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            className="input-field"
            placeholder="Ej: España"
          />
        </div>

        <div>
          <label className="label">Logo (URL)</label>
          <input
            name="logo"
            value={form.logo}
            onChange={handleChange}
            className="input-field"
            placeholder="https://ejemplo.com/logo.png"
          />
          {form.logo && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={form.logo}
                alt="Preview"
                className="w-10 h-10 rounded-full object-contain shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--fifa-line)",
                }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <span className="text-xs" style={{ color: "var(--fifa-mute)" }}>
                Vista previa
              </span>
            </div>
          )}
        </div>

        <ModalActions onCancel={onClose} saving={saving} label="Guardar cambios" />
      </form>
    </Modal>
  );
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  );
}