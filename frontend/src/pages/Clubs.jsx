import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clubsApi } from "../api";
import { Modal, ModalActions, ConfirmModal } from "../components/ui/Modal";
import ClubAvatar from "../components/ui/ClubAvatar";
import { heroItem, staggerGrid, cardItem } from "../utils/motionVariants";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function readImageFile(file, onLoad, onError) {
  if (!file) return;

  if (file.size > MAX_IMAGE_SIZE) {
    onError("La imagen no puede superar 2 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    onLoad(reader.result);
  };

  reader.onerror = () => {
    onError("No se pudo leer la imagen.");
  };

  reader.readAsDataURL(file);
}

function ClubLogoPicker({ value, onChange, onError }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "rgba(36,255,122,.12)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.01))",
      }}
    >
      <p className="label mb-3">Logo del club</p>

      <div className="flex items-center gap-4">
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border"
          style={{
            borderColor: "rgba(36,255,122,.18)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01))",
            boxShadow: "0 0 22px rgba(36,255,122,.08)",
          }}
        >
          {value ? (
            <img
              src={value}
              alt="logo"
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <ClubAvatar name="" logo={null} />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: "rgba(36,255,122,.10)",
              border: "1px solid rgba(36,255,122,.25)",
              color: "var(--fifa-neon)",
            }}
          >
            Subir imagen
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readImageFile(file, onChange, onError);
                e.target.value = "";
              }}
            />
          </label>

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs"
              style={{ color: "var(--fifa-mute)" }}
            >
              Quitar logo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
        logo,
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
      <motion.div
        variants={heroItem}
        initial="initial"
        animate="animate"
        className="relative overflow-hidden rounded-3xl p-7 md:p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,24,34,.95), rgba(6,16,22,.92))",
          border: "1px solid rgba(36,255,122,0.12)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.02), 0 20px 60px rgba(0,0,0,.45)",
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
              Club Management
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
              Clubes Competitivos
            </h1>

            <p
              className="mt-2 max-w-xl"
              style={{
                color: "var(--fifa-mute)",
                fontFamily: "var(--font-ui)",
              }}
            >
              Gestiona identidades competitivas, logos, países y participantes
              oficiales de tus ligas y torneos.
            </p>
          </div>

          <button onClick={openModal} className="btn-primary">
            Crear club
          </button>
        </div>
      </motion.div>

      {loading ? (
        <ClubsGridSkeleton />
      ) : clubs.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">No hay clubes aún</p>

          <button onClick={openModal} className="btn-primary mx-auto">
            Crear primer club
          </button>
        </div>
      ) : (
        <motion.div
          variants={staggerGrid}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {clubs.map((club) => (
            <motion.div key={club._id} variants={cardItem}>
              <div
                className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.96))",
                  border: "1px solid rgba(36,255,122,.10)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,.02), 0 18px 40px rgba(0,0,0,.42)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at top left, rgba(36,255,122,.10), transparent 35%)",
                  }}
                />

                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
                      style={{
                        borderColor: "rgba(36,255,122,.16)",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01))",
                      }}
                    >
                      <ClubAvatar name={club.name} logo={club.logo} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className="truncate"
                          style={{
                            color: "var(--fifa-text)",
                            fontFamily: "var(--font-title)",
                            fontSize: "1.25rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                          }}
                        >
                          {club.name}
                        </h3>

                        <span
                          className="rounded-full px-2 py-1 text-[11px] font-bold"
                          style={{
                            color: "var(--fifa-neon)",
                            backgroundColor: "rgba(36,255,122,.08)",
                            border: "1px solid rgba(36,255,122,.25)",
                          }}
                        >
                          {club.abbr || "—"}
                        </span>
                      </div>

                      <p
                        className="mt-2 text-sm"
                        style={{ color: "var(--fifa-mute)" }}
                      >
                        {club.country || "Sin país registrado"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div
                      className="rounded-xl px-3 py-2 text-xs"
                      style={{
                        background: "rgba(255,255,255,.04)",
                        border: "1px solid rgba(255,255,255,.05)",
                        color: "var(--fifa-mute)",
                      }}
                    >
                      Club competitivo registrado
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditError("");
                          setEditingClub(club);
                        }}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <PencilIcon />
                        Editar
                      </button>

                      <button
                        onClick={() => handleDeleteClub(club._id)}
                        className="btn-danger"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
        {editingClub && (
          <EditClubModal
            club={editingClub}
            error={editError}
            onSave={(data) => handleEditClub(editingClub._id, data)}
            onClose={() => {
              setEditingClub(null);
              setEditError("");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
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

              <ClubLogoPicker
                value={logo}
                onChange={setLogo}
                onError={setError}
              />

              <ModalActions
                onCancel={closeModal}
                saving={saving}
                label="Crear club"
              />
            </form>
          </Modal>
        )}
      </AnimatePresence>
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
  const [localError, setLocalError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "abbr" ? value.toUpperCase() : value,
    }));

    if (localError) setLocalError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.abbr.trim()) return;

    setSaving(true);

    await onSave({
      name: form.name.trim(),
      abbr: form.abbr.trim().toUpperCase(),
      country: form.country.trim(),
      logo: form.logo,
    });

    setSaving(false);
  }

  return (
    <Modal title="Editar club" onClose={onClose}>
      {(error || localError) && (
        <p className="error-msg mb-4">{error || localError}</p>
      )}

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

        <ClubLogoPicker
          value={form.logo}
          onChange={(value) => {
            setForm((prev) => ({ ...prev, logo: value }));
            if (localError) setLocalError("");
          }}
          onError={setLocalError}
        />

        <ModalActions
          onCancel={onClose}
          saving={saving}
          label="Guardar cambios"
        />
      </form>
    </Modal>
  );
}

function ClubsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-3xl p-5"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,34,43,.88), rgba(6,16,22,.94))",
            border: "1px solid rgba(36,255,122,0.08)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.02), 0 12px 30px rgba(0,0,0,.35)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="h-20 w-20 rounded-2xl shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            />

            <div className="flex-1 space-y-3 mt-2">
              <div className="flex gap-2">
                <div
                  className="h-5 w-32 rounded"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                />

                <div
                  className="h-5 w-12 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                />
              </div>

              <div
                className="h-3 w-20 rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div
              className="h-7 w-36 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />

            <div className="flex gap-2">
              <div
                className="h-7 w-16 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              />

              <div
                className="h-7 w-16 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
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