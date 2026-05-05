import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { aiApi, matchesApi, tournamentsApi } from "../api";
import AiAnalyzingLoader from "../components/ui/AiAnalyzingLoader";
import StatsGrid from "../components/ui/StatsGrid";

// ─── helpers ─────────────────────────────────────────────────────────────────

function toDatetimeLocal(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function confColor(conf) {
  if (conf >= 0.8) return "var(--fifa-neon)";
  if (conf >= 0.6) return "#facc15";
  return "#ef4444";
}

function ConfBadge({ confidence, requiresValidation }) {
  if (!confidence && !requiresValidation) return null;
  const color = requiresValidation
    ? confidence >= 0.6 ? "#facc15" : "#ef4444"
    : confColor(confidence);
  const pct = Math.round((confidence || 0) * 100);
  return (
    <span
      className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
      style={{ color, borderColor: color, backgroundColor: `${color}18` }}
    >
      {requiresValidation ? `${pct}% ⚠` : `${pct}%`}
    </span>
  );
}

const EMPTY_FORM = {
  homeClubId: "",
  awayClubId: "",
  scoreHome: "",
  scoreAway: "",
  status: "played",
  date: toDatetimeLocal(),
  stadium: "",
  phase: "league",
  // Ataque
  possessionHome: "",
  possessionAway: "",
  shotsHome: "",
  shotsAway: "",
  shotsOnTargetHome: "",
  shotsOnTargetAway: "",
  // Pases
  passesHome: "",
  passesAway: "",
  passesCompletedHome: "",
  passesCompletedAway: "",
  // Defensa
  tacklesHome: "",
  tacklesAway: "",
  recoveriesHome: "",
  recoveriesAway: "",
  cornersHome: "",
  cornersAway: "",
  // Disciplina
  foulsHome: "",
  foulsAway: "",
  yellowCardsHome: "",
  yellowCardsAway: "",
  redCardsHome: "",
  redCardsAway: "",
};

// ─── component ───────────────────────────────────────────────────────────────

export default function ImportMatchImage() {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState("upload"); // upload | processing | preview | saving
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [draft, setDraft] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    tournamentsApi
      .getClubs(tournamentId)
      .then((res) => setClubs(res.data.clubs ?? []))
      .catch(() => setClubs([]));
  }, [tournamentId]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  // ── file handling ─────────────────────────────────────────────────────────

  function addFiles(newFiles) {
    const valid = Array.from(newFiles).filter((f) =>
      ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)
    );
    if (!valid.length) return;
    const combined = [...files, ...valid].slice(0, 10);
    setFiles(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
    setError("");
  }

  function removeFile(idx) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  // ── analyze ───────────────────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!files.length) {
      setError("Selecciona al menos una imagen.");
      return;
    }
    setStep("processing");
    setError("");
    try {
      const res = await aiApi.parseMatchImages(tournamentId, files);
      const data = res.data;
      setDraft(data);

      if (data.tournamentClubs?.length) setClubs(data.tournamentClubs);

      const md = data.matchDraft || {};
      const s = md.stats || {};

      const sv = (v) => (v != null ? v : "");

      setForm({
        homeClubId: data.matchedHomeClub?._id || "",
        awayClubId: data.matchedAwayClub?._id || "",
        scoreHome: md.scoreHome ?? "",
        scoreAway: md.scoreAway ?? "",
        status: "played",
        date: toDatetimeLocal(),
        stadium: "",
        phase: "league",
        // Ataque
        possessionHome:    sv(s.possessionHome),
        possessionAway:    sv(s.possessionAway),
        shotsHome:         sv(s.shotsHome),
        shotsAway:         sv(s.shotsAway),
        shotsOnTargetHome: sv(s.shotsOnTargetHome),
        shotsOnTargetAway: sv(s.shotsOnTargetAway),
        // Pases
        passesHome:          sv(s.passesHome),
        passesAway:          sv(s.passesAway),
        passesCompletedHome: sv(s.passesCompletedHome),
        passesCompletedAway: sv(s.passesCompletedAway),
        // Defensa
        tacklesHome:    sv(s.tacklesHome),
        tacklesAway:    sv(s.tacklesAway),
        recoveriesHome: sv(s.recoveriesHome),
        recoveriesAway: sv(s.recoveriesAway),
        cornersHome:    sv(s.cornersHome),
        cornersAway:    sv(s.cornersAway),
        // Disciplina
        foulsHome:        sv(s.foulsHome),
        foulsAway:        sv(s.foulsAway),
        yellowCardsHome:  sv(s.yellowCardsHome),
        yellowCardsAway:  sv(s.yellowCardsAway),
        redCardsHome:     sv(s.redCardsHome),
        redCardsAway:     sv(s.redCardsAway),
      });

      setStep("preview");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al analizar imágenes.");
      setStep("upload");
    }
  }

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setError("");

    if (!form.homeClubId || !form.awayClubId) {
      setError("Debes seleccionar el club local y visitante.");
      return;
    }
    if (form.homeClubId === form.awayClubId) {
      setError("El club local y visitante no pueden ser el mismo.");
      return;
    }
    if (form.scoreHome === "" || form.scoreAway === "") {
      setError("El marcador es obligatorio.");
      return;
    }

    setStep("saving");

    const n = (key) => (form[key] !== "" ? Number(form[key]) : undefined);

    try {
      await matchesApi.create(tournamentId, {
        homeClub:  form.homeClubId,
        awayClub:  form.awayClubId,
        date:      new Date(form.date).toISOString(),
        stadium:   form.stadium || undefined,
        scoreHome: Number(form.scoreHome),
        scoreAway: Number(form.scoreAway),
        status:    form.status,
        source:    "ai",
        phase:     form.phase || "league",
        round:     1,
        order:     0,
        clubStats: {
          possessionHome:    n("possessionHome"),
          possessionAway:    n("possessionAway"),
          shotsHome:         n("shotsHome"),
          shotsAway:         n("shotsAway"),
          shotsOnTargetHome: n("shotsOnTargetHome"),
          shotsOnTargetAway: n("shotsOnTargetAway"),
          passesHome:          n("passesHome"),
          passesAway:          n("passesAway"),
          passesCompletedHome: n("passesCompletedHome"),
          passesCompletedAway: n("passesCompletedAway"),
          tacklesHome:    n("tacklesHome"),
          tacklesAway:    n("tacklesAway"),
          recoveriesHome: n("recoveriesHome"),
          recoveriesAway: n("recoveriesAway"),
          cornersHome:    n("cornersHome"),
          cornersAway:    n("cornersAway"),
          foulsHome:       n("foulsHome"),
          foulsAway:       n("foulsAway"),
          yellowCardsHome: n("yellowCardsHome"),
          yellowCardsAway: n("yellowCardsAway"),
          redCardsHome:    n("redCardsHome"),
          redCardsAway:    n("redCardsAway"),
        },
      });
      navigate(`/tournaments/${tournamentId}`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al guardar el partido.");
      setStep("preview");
    }
  }

  function field(key) {
    return {
      value: form[key],
      onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  const fc = draft?.fieldConfidence || {};
  const statsConf = draft?.confidence?.stats || 0;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Back */}
      <button
        onClick={() => navigate(`/tournaments/${tournamentId}`)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-5"
      >
        <ChevronLeft /> Volver al torneo
      </button>

      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Importar partido por imagen</h1>
          <p className="page-subtitle">Azure Vision + OpenAI · extracción automática de datos</p>
        </div>
      </div>

      <StepBar step={step} />

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── UPLOAD ── */}
      {step === "upload" && (
        <div className="mt-5 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            className="card p-10 text-center cursor-pointer transition-all"
            style={{
              borderColor: dragging ? "rgba(36,255,122,0.5)" : undefined,
              backgroundColor: dragging ? "rgba(36,255,122,0.05)" : undefined,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <ImageUploadIcon />
            <p className="text-white font-semibold mt-3">Arrastra imágenes aquí o haz clic</p>
            <p className="text-gray-500 text-xs mt-1">JPG · PNG · WEBP · máx 10 imágenes · 10 MB c/u</p>
            <p className="text-gray-600 text-xs mt-3">
              Sube capturas de: resumen, posesión, tiros, pases, defensa, eventos
            </p>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="w-full h-16 object-cover rounded-lg border border-white/10" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs hidden group-hover:flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={() => navigate(`/tournaments/${tournamentId}`)} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleAnalyze} disabled={!files.length} className="btn-primary">
              <SparklesIcon />
              Analizar {files.length > 0 ? `${files.length} imagen${files.length > 1 ? "es" : ""}` : "imágenes"}
            </button>
          </div>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {step === "processing" && <AiAnalyzingLoader />}

      {/* ── SAVING ── */}
      {step === "saving" && (
        <AiAnalyzingLoader
          title="Guardando partido..."
          subtitle="Registrando en la base de datos..."
        />
      )}

      {/* ── PREVIEW ── */}
      {step === "preview" && draft && (
        <div className="mt-5 space-y-5">
          {/* OCR confidence summary */}
          <OcrSummary draft={draft} />

          {/* Club detection warning */}
          {(fc.homeClub?.requiresValidation || fc.awayClub?.requiresValidation) && (
            <div className="px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.06] text-yellow-400 text-sm flex gap-2">
              <span className="shrink-0">⚠</span>
              <span>Clubes no detectados con certeza. Selecciona manualmente los equipos del torneo.</span>
            </div>
          )}

          {/* ─ Match details card ─ */}
          <div className="card p-5 space-y-5">
            <SectionTitle>Partido</SectionTitle>

            {/* Clubs */}
            <div className="grid grid-cols-2 gap-4">
              <ClubField
                label="Club Local"
                fc={fc.homeClub}
                clubs={clubs}
                fieldProps={field("homeClubId")}
              />
              <ClubField
                label="Club Visitante"
                fc={fc.awayClub}
                clubs={clubs}
                fieldProps={field("awayClubId")}
              />
            </div>

            {/* Score */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Goles Local
                  <ConfBadge confidence={fc.scoreHome?.confidence} requiresValidation={fc.scoreHome?.requiresValidation} />
                </label>
                <input
                  type="number" min="0" max="30"
                  className="input w-full text-center text-lg font-bold"
                  {...field("scoreHome")}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Goles Visitante
                  <ConfBadge confidence={fc.scoreAway?.confidence} requiresValidation={fc.scoreAway?.requiresValidation} />
                </label>
                <input
                  type="number" min="0" max="30"
                  className="input w-full text-center text-lg font-bold"
                  {...field("scoreAway")}
                />
              </div>
            </div>

            {/* Date / Status / Phase */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Fecha</label>
                <input type="datetime-local" className="input w-full" {...field("date")} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Estado</label>
                <select className="input w-full" {...field("status")}>
                  <option value="played">Jugado</option>
                  <option value="scheduled">Programado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Fase</label>
                <select className="input w-full" {...field("phase")}>
                  <option value="league">Liga</option>
                  <option value="cup">Copa</option>
                  <option value="playoff">Playoffs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Estadio (opcional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Nombre del estadio"
                {...field("stadium")}
              />
            </div>
          </div>

          {/* ─ Stats card ─ */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Estadísticas de club</SectionTitle>
              {statsConf > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    color: confColor(statsConf),
                    borderColor: confColor(statsConf),
                    backgroundColor: `${confColor(statsConf)}18`,
                  }}
                >
                  Confianza OCR {Math.round(statsConf * 100)}%
                </span>
              )}
            </div>
            <StatsGrid field={field} fieldConfidence={fc} />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 pb-4">
            <button
              onClick={() => { setStep("upload"); setDraft(null); }}
              className="btn-secondary"
            >
              ← Volver a subir
            </button>
            <div className="flex gap-3">
              <button onClick={() => navigate(`/tournaments/${tournamentId}`)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary">
                <CheckIcon /> Guardar partido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fifa-mute)" }}>
      {children}
    </p>
  );
}

function ClubField({ label, fc, clubs, fieldProps }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">
        {label}
        <ConfBadge confidence={fc?.confidence} requiresValidation={fc?.requiresValidation} />
      </label>
      {fc?.value && (
        <p className="text-[10px] text-gray-600 mb-1">
          OCR: <span className="text-gray-400">{fc.value}</span>
        </p>
      )}
      <select className="input w-full" {...fieldProps}>
        <option value="">— Seleccionar —</option>
        {clubs.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}

function StepBar({ step }) {
  const steps = [
    { id: "upload",     label: "Imágenes" },
    { id: "processing", label: "Análisis" },
    { id: "preview",    label: "Revisión" },
  ];
  const activeIdx = steps.findIndex(
    (s) => s.id === step || (step === "saving" && s.id === "preview")
  );

  return (
    <div className="flex items-center gap-3 mb-5">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border"
              style={{
                borderColor: i <= activeIdx ? "var(--fifa-neon)" : "rgba(255,255,255,0.15)",
                backgroundColor: i < activeIdx ? "rgba(36,255,122,0.15)" : "transparent",
                color: i <= activeIdx ? "var(--fifa-neon)" : "var(--fifa-mute)",
              }}
            >
              {i < activeIdx ? "✓" : i + 1}
            </div>
            <span className="text-xs" style={{ color: i <= activeIdx ? "#e5e7eb" : "var(--fifa-mute)" }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-8 h-px"
              style={{
                backgroundColor: i < activeIdx
                  ? "rgba(36,255,122,0.4)"
                  : "rgba(255,255,255,0.1)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function OcrSummary({ draft }) {
  const conf = draft?.confidence || {};
  const pct = (v) => `${Math.round((v || 0) * 100)}%`;

  const items = [
    { label: "Score",   value: pct(conf.score),   color: confColor(conf.score   || 0) },
    { label: "Clubes",  value: pct(conf.clubs),   color: confColor(conf.clubs   || 0) },
    { label: "Stats",   value: pct(conf.stats),   color: confColor(conf.stats   || 0) },
    { label: "General", value: pct(conf.overall), color: confColor(conf.overall || 0) },
  ];

  const statsDetected = draft?.matchDraft?.stats
    ? Object.values(draft.matchDraft.stats).filter((v) => v != null).length
    : 0;

  return (
    <div className="card p-4 flex flex-wrap gap-x-5 gap-y-2 items-center">
      <p className="text-xs text-gray-500 font-medium shrink-0">Confianza OCR</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600">{item.label}:</span>
          <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
        </div>
      ))}
      {statsDetected > 0 && (
        <span className="ml-auto text-[10px] text-gray-500">
          {statsDetected} stat{statsDetected !== 1 ? "s" : ""} detectado{statsDetected !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ─── icons ────────────────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function ImageUploadIcon() {
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border"
      style={{ backgroundColor: "rgba(36,255,122,0.08)", borderColor: "rgba(36,255,122,0.2)" }}
    >
      <svg className="w-7 h-7" style={{ color: "var(--fifa-neon)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
