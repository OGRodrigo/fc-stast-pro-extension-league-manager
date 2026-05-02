import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { aiApi, matchesApi, tournamentsApi } from "../api";

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

function ConfBadge({ label, confidence, requiresValidation }) {
  if (!confidence && !requiresValidation) return null;
  const color = requiresValidation ? (confidence >= 0.6 ? "#facc15" : "#ef4444") : confColor(confidence);
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
  possessionHome: "",
  possessionAway: "",
  shotsHome: "",
  shotsAway: "",
  passesHome: "",
  passesAway: "",
};

// ─── component ───────────────────────────────────────────────────────────────

export default function ImportMatchImage() {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState("upload"); // upload | processing | preview | saving | done
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [draft, setDraft] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load tournament clubs on mount
  useEffect(() => {
    tournamentsApi
      .getClubs(tournamentId)
      .then((res) => setClubs(res.data.clubs ?? []))
      .catch(() => setClubs([]));
  }, [tournamentId]);

  // Revoke preview URLs on unmount
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

      // merge clubs from API response (in case component clubs state lagged)
      if (data.tournamentClubs?.length) setClubs(data.tournamentClubs);

      const md = data.matchDraft || {};
      const stats = md.stats || {};

      setForm({
        homeClubId: data.matchedHomeClub?._id || "",
        awayClubId: data.matchedAwayClub?._id || "",
        scoreHome: md.scoreHome ?? "",
        scoreAway: md.scoreAway ?? "",
        status: md.status === "final" ? "played" : "played",
        date: toDatetimeLocal(),
        stadium: "",
        phase: "league",
        possessionHome: stats.possessionHome ?? "",
        possessionAway: stats.possessionAway ?? "",
        shotsHome: stats.shotsHome ?? "",
        shotsAway: stats.shotsAway ?? "",
        passesHome: stats.passesHome ?? "",
        passesAway: stats.passesAway ?? "",
      });

      setStep("preview");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Error al analizar imágenes.";
      setError(msg);
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

    try {
      await matchesApi.create(tournamentId, {
        homeClub: form.homeClubId,
        awayClub: form.awayClubId,
        date: new Date(form.date).toISOString(),
        stadium: form.stadium || undefined,
        scoreHome: Number(form.scoreHome),
        scoreAway: Number(form.scoreAway),
        status: form.status,
        source: "ai",
        phase: form.phase || "league",
        round: 1,
        order: 0,
        clubStats: {
          possessionHome: form.possessionHome !== "" ? Number(form.possessionHome) : undefined,
          possessionAway: form.possessionAway !== "" ? Number(form.possessionAway) : undefined,
          shotsHome: form.shotsHome !== "" ? Number(form.shotsHome) : undefined,
          shotsAway: form.shotsAway !== "" ? Number(form.shotsAway) : undefined,
          passesHome: form.passesHome !== "" ? Number(form.passesHome) : undefined,
          passesAway: form.passesAway !== "" ? Number(form.passesAway) : undefined,
        },
      });
      navigate(`/tournaments/${tournamentId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Error al guardar el partido.";
      setError(msg);
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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      {/* Header */}
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

      {/* Step indicator */}
      <StepBar step={step} />

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── UPLOAD ── */}
      {(step === "upload") && (
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
              Sube capturas de: resumen del partido, posesión, tiros, pases
            </p>
          </div>

          {/* Thumbnails */}
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
            <button
              onClick={() => navigate(`/tournaments/${tournamentId}`)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!files.length}
              className="btn-primary"
            >
              <SparklesIcon /> Analizar {files.length > 0 ? `${files.length} imagen${files.length > 1 ? "es" : ""}` : "imágenes"}
            </button>
          </div>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {step === "processing" && (
        <div className="mt-10 card p-16 text-center space-y-4">
          <div className="w-12 h-12 border-2 rounded-full border-t-transparent mx-auto animate-spin" style={{ borderColor: "var(--fifa-neon)" }} />
          <p className="text-white font-semibold">Analizando imágenes…</p>
          <p className="text-gray-500 text-sm">OCR + extracción de datos · puede tardar 10-20 seg</p>
        </div>
      )}

      {/* ── SAVING ── */}
      {step === "saving" && (
        <div className="mt-10 card p-16 text-center space-y-4">
          <div className="w-12 h-12 border-2 rounded-full border-t-transparent mx-auto animate-spin" style={{ borderColor: "var(--fifa-neon)" }} />
          <p className="text-white font-semibold">Guardando partido…</p>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {step === "preview" && draft && (
        <div className="mt-5 space-y-5">
          {/* OCR quality summary */}
          <OcrSummary draft={draft} />

          {/* Club warning */}
          {(fc.homeClub?.requiresValidation || fc.awayClub?.requiresValidation) && (
            <div className="px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/08 text-yellow-400 text-sm flex gap-2">
              <span>⚠</span>
              <span>
                No se detectaron los clubes con certeza. Selecciona manualmente los equipos del torneo.
              </span>
            </div>
          )}

          <div className="card p-5 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fifa-mute)" }}>
              Partido
            </p>

            {/* Club selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Club Local
                  <ConfBadge confidence={fc.homeClub?.confidence} requiresValidation={fc.homeClub?.requiresValidation} />
                </label>
                {fc.homeClub?.value && (
                  <p className="text-[10px] text-gray-500 mb-1">OCR: <span className="text-gray-300">{fc.homeClub.value}</span></p>
                )}
                <select className="input w-full" {...field("homeClubId")}>
                  <option value="">— Seleccionar —</option>
                  {clubs.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Club Visitante
                  <ConfBadge confidence={fc.awayClub?.confidence} requiresValidation={fc.awayClub?.requiresValidation} />
                </label>
                {fc.awayClub?.value && (
                  <p className="text-[10px] text-gray-500 mb-1">OCR: <span className="text-gray-300">{fc.awayClub.value}</span></p>
                )}
                <select className="input w-full" {...field("awayClubId")}>
                  <option value="">— Seleccionar —</option>
                  {clubs.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Score */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Goles Local
                  <ConfBadge confidence={fc.scoreHome?.confidence} requiresValidation={fc.scoreHome?.requiresValidation} />
                </label>
                <input type="number" min="0" max="30" className="input w-full" {...field("scoreHome")} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Goles Visitante
                  <ConfBadge confidence={fc.scoreAway?.confidence} requiresValidation={fc.scoreAway?.requiresValidation} />
                </label>
                <input type="number" min="0" max="30" className="input w-full" {...field("scoreAway")} />
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
              <input type="text" className="input w-full" placeholder="Nombre del estadio" {...field("stadium")} />
            </div>
          </div>

          {/* Stats */}
          <div className="card p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fifa-mute)" }}>
              Estadísticas de club (opcionales)
            </p>

            <StatsRow
              label="Posesión (%)"
              fieldHome="possessionHome"
              fieldAway="possessionAway"
              fc={fc.possession}
              field={field}
            />
            <StatsRow
              label="Tiros totales"
              fieldHome="shotsHome"
              fieldAway="shotsAway"
              fc={fc.shots}
              field={field}
            />
            <StatsRow
              label="Pases totales"
              fieldHome="passesHome"
              fieldAway="passesAway"
              fc={fc.passes}
              field={field}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2">
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

function StepBar({ step }) {
  const steps = [
    { id: "upload", label: "Imágenes" },
    { id: "processing", label: "Análisis" },
    { id: "preview", label: "Revisión" },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step || (step === "saving" && s.id === "preview"));

  return (
    <div className="flex items-center gap-3 mb-2">
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
            <div className="w-8 h-px" style={{ backgroundColor: i < activeIdx ? "rgba(36,255,122,0.4)" : "rgba(255,255,255,0.1)" }} />
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
    { label: "Score", value: pct(conf.score), color: confColor(conf.score || 0) },
    { label: "Clubes", value: pct(conf.clubs), color: confColor(conf.clubs || 0) },
    { label: "Stats", value: pct(conf.stats), color: confColor(conf.stats || 0) },
    { label: "General", value: pct(conf.overall), color: confColor(conf.overall || 0) },
  ];

  return (
    <div className="card p-4 flex flex-wrap gap-4 items-center">
      <p className="text-xs text-gray-500 font-medium shrink-0">Confianza OCR</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">{item.label}:</span>
          <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
        </div>
      ))}
      {draft?.missingFields?.length > 0 && (
        <span className="ml-auto text-[10px] text-yellow-400">
          {draft.missingFields.filter((f) => !f.startsWith("stats.")).length > 0
            ? `⚠ Campos sin detectar: score/clubes`
            : null}
        </span>
      )}
    </div>
  );
}

function StatsRow({ label, fieldHome, fieldAway, fc, field }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 shrink-0">
        <span className="text-xs text-gray-400">{label}</span>
        {fc && <ConfBadge confidence={fc.confidence} requiresValidation={fc.requiresValidation} />}
      </div>
      <input
        type="number"
        min="0"
        className="input flex-1 text-center"
        placeholder="Local"
        {...field(fieldHome)}
      />
      <span className="text-gray-600 text-xs">vs</span>
      <input
        type="number"
        min="0"
        className="input flex-1 text-center"
        placeholder="Visita"
        {...field(fieldAway)}
      />
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
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border" style={{ backgroundColor: "rgba(36,255,122,0.08)", borderColor: "rgba(36,255,122,0.2)" }}>
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
