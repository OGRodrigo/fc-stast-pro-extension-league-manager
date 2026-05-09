import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tournamentsApi, matchesApi } from "../api";

export default function CreateMatch() {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [form, setForm] = useState({
    homeClub: "",
    awayClub: "",
    date: "",
    stadium: "",
    scoreHome: 0,
    scoreAway: 0,
    status: "scheduled",
    possessionHome: 0,
    possessionAway: 0,
    shotsHome: 0,
    shotsAway: 0,
    passesHome: 0,
    passesAway: 0,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      tournamentsApi.getClubs(tournamentId),
      tournamentsApi.getOne(tournamentId),
    ])
      .then(([cRes, tRes]) => {
        setClubs(cRes.data.clubs ?? []);
        setTournament(tRes.data.tournament);
      })
      .catch(() => setError("Error cargando datos del torneo"));
  }, [tournamentId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.homeClub === form.awayClub) {
      setError("El club local y visitante no pueden ser iguales.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await matchesApi.create(tournamentId, {
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
      navigate(`/tournaments/${tournamentId}`);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error creando partido");
      setSaving(false);
    }
  }

  const sameClub = form.homeClub && form.homeClub === form.awayClub;
  const homeClubName = clubs.find((c) => c._id === form.homeClub)?.name ?? "Local";
  const awayClubName = clubs.find((c) => c._id === form.awayClub)?.name ?? "Visitante";

  return (
    <div className="max-w-lg">
      <button
        onClick={() => navigate(`/tournaments/${tournamentId}`)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-5"
      >
        <BackIcon />
        {tournament?.name ?? "Torneo"}
      </button>

      <div
  className="relative overflow-hidden rounded-3xl p-7 md:p-8"
  style={{
    background:
      "linear-gradient(135deg, rgba(10,24,34,.95), rgba(6,16,22,.92))",
    border: "1px solid rgba(36,255,122,.12)",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,.02), 0 20px 60px rgba(0,0,0,.45)",
  }}
>
  {/* Glow */}
  <div
    className="pointer-events-none absolute inset-0"
    style={{
      background:
        "radial-gradient(circle at top left, rgba(36,255,122,.12), transparent 30%), radial-gradient(circle at right, rgba(54,230,255,.10), transparent 25%)",
    }}
  />

  <div className="relative z-10">
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
      Match Center
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
      Crear Partido
    </h1>

    <p
      className="mt-2 max-w-xl"
      style={{
        color: "var(--fifa-mute)",
        fontFamily: "var(--font-ui)",
      }}
    >
      Registra partidos oficiales, resultados competitivos y estadísticas
      avanzadas para alimentar standings y playoffs.
    </p>
  </div>
</div>

      <div className="card p-6">
        {error && <p className="error-msg mb-5">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Clubs */}
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
                  <option key={c._id} value={c._id}>{c.name}</option>
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
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          {sameClub && <p className="error-msg">El club local y visitante no pueden ser iguales.</p>}

          {/* Score Hero Block */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,16,22,.96), rgba(13,34,43,.92))",
              border: "1px solid rgba(36,255,122,.14)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
            }}
          >
            <p
              className="text-center mb-4"
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--fifa-mute)",
                fontFamily: "var(--font-title)",
              }}
            >
              Marcador
            </p>

            <div className="flex items-end justify-center gap-3">
              <div className="flex-1 flex flex-col items-center gap-2">
                <p
                  className="text-xs truncate max-w-[110px] text-center font-medium"
                  style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
                >
                  {homeClubName}
                </p>
                <input
                  name="scoreHome"
                  type="number"
                  min={0}
                  value={form.scoreHome}
                  onChange={handleChange}
                  className="w-24 text-center focus:outline-none"
                  style={{
                    fontSize: "3rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-title)",
                    color: "white",
                    background: "transparent",
                    border: "none",
                    borderBottom: "2px solid rgba(36,255,122,0.30)",
                    paddingBottom: "4px",
                    lineHeight: 1,
                  }}
                />
              </div>

              <div className="pb-2 px-1">
                <span
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.18)",
                    fontFamily: "var(--font-title)",
                    lineHeight: 1,
                  }}
                >
                  —
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-2">
                <p
                  className="text-xs truncate max-w-[110px] text-center font-medium"
                  style={{ color: "var(--fifa-mute)", fontFamily: "var(--font-ui)" }}
                >
                  {awayClubName}
                </p>
                <input
                  name="scoreAway"
                  type="number"
                  min={0}
                  value={form.scoreAway}
                  onChange={handleChange}
                  className="w-24 text-center focus:outline-none"
                  style={{
                    fontSize: "3rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-title)",
                    color: "white",
                    background: "transparent",
                    border: "none",
                    borderBottom: "2px solid rgba(36,255,122,0.30)",
                    paddingBottom: "4px",
                    lineHeight: 1,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Date + Stadium */}
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

          {/* Status */}
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/tournaments/${tournamentId}`)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Guardando..." : "Crear partido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}
