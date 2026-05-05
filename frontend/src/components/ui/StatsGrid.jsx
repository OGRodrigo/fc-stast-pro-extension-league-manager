// frontend/src/components/ui/StatsGrid.jsx
// Categorized stats grid for match import preview.

function confColor(v) {
  if (v >= 0.8) return "var(--fifa-neon)";
  if (v >= 0.6) return "#facc15";
  return "#ef4444";
}

function ConfBadge({ confidence, requiresValidation }) {
  const color = requiresValidation
    ? confidence >= 0.6 ? "#facc15" : "#ef4444"
    : confColor(confidence);
  const pct = Math.round((confidence || 0) * 100);
  return (
    <span
      className="ml-1.5 shrink-0 text-[9px] font-bold px-1 py-px rounded-full border"
      style={{ color, borderColor: color, backgroundColor: `${color}18` }}
    >
      {requiresValidation ? `${pct}%⚠` : `${pct}%`}
    </span>
  );
}

const CATEGORIES = [
  {
    id: "attack",
    label: "Ataque",
    rows: [
      { label: "Posesión (%)",   home: "possessionHome",    away: "possessionAway",    fcKey: "possession",      step: "any" },
      { label: "Tiros totales",  home: "shotsHome",         away: "shotsAway",         fcKey: "shots",           step: "1" },
      { label: "Tiros al arco",  home: "shotsOnTargetHome", away: "shotsOnTargetAway", fcKey: "shotsOnTarget",   step: "1" },
    ],
  },
  {
    id: "passes",
    label: "Pases",
    rows: [
      { label: "Pases totales",      home: "passesHome",          away: "passesAway",          fcKey: "passes",          step: "1" },
      { label: "Pases completados",  home: "passesCompletedHome", away: "passesCompletedAway", fcKey: "passesCompleted", step: "1" },
    ],
  },
  {
    id: "defense",
    label: "Defensa",
    rows: [
      { label: "Tackles",         home: "tacklesHome",    away: "tacklesAway",    fcKey: "tackles",    step: "1" },
      { label: "Recuperaciones",  home: "recoveriesHome", away: "recoveriesAway", fcKey: "recoveries", step: "1" },
      { label: "Córners",         home: "cornersHome",    away: "cornersAway",    fcKey: "corners",    step: "1" },
    ],
  },
  {
    id: "discipline",
    label: "Disciplina",
    rows: [
      { label: "Faltas",    home: "foulsHome",       away: "foulsAway",       fcKey: "fouls",       step: "1" },
      { label: "Amarillas", home: "yellowCardsHome", away: "yellowCardsAway", fcKey: "yellowCards", step: "1" },
      { label: "Rojas",     home: "redCardsHome",    away: "redCardsAway",    fcKey: "redCards",    step: "1" },
    ],
  },
];

export default function StatsGrid({ field, fieldConfidence = {} }) {
  // Only return confidence entry if the stat was actually extracted by AI
  function getFC(fcKey) {
    if (!fcKey) return null;
    const fc = fieldConfidence[fcKey];
    if (!fc || !fc.extracted) return null;
    return fc;
  }

  return (
    <div>
      {/* Column headers */}
      <div className="grid items-center mb-3" style={{ gridTemplateColumns: "1fr 88px 88px", gap: "0 8px" }}>
        <span />
        <span className="text-[10px] text-center font-semibold uppercase tracking-wider text-gray-500">
          Local
        </span>
        <span className="text-[10px] text-center font-semibold uppercase tracking-wider text-gray-500">
          Visita
        </span>
      </div>

      <div className="space-y-5">
        {CATEGORIES.map((cat) => (
          <div key={cat.id}>
            {/* Category divider */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[9px] font-bold uppercase tracking-widest shrink-0"
                style={{ color: "var(--fifa-mute)" }}
              >
                {cat.label}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
            </div>

            <div className="space-y-1.5">
              {cat.rows.map((row) => {
                const fc = getFC(row.fcKey);
                const homeVal = field(row.home).value;
                const awayVal = field(row.away).value;
                const hasData = homeVal !== "" || awayVal !== "";

                return (
                  <div
                    key={row.home}
                    className="grid items-center rounded px-1 py-0.5 transition-colors"
                    style={{
                      gridTemplateColumns: "1fr 88px 88px",
                      gap: "0 8px",
                      backgroundColor: hasData ? "rgba(36,255,122,0.04)" : undefined,
                    }}
                  >
                    {/* Label + badge — badge only when AI detected this stat */}
                    <div className="flex items-center min-w-0 gap-0.5">
                      <span className="text-xs text-gray-400 truncate">{row.label}</span>
                      {fc && hasData && (
                        <ConfBadge
                          confidence={fc.confidence}
                          requiresValidation={fc.requiresValidation}
                        />
                      )}
                    </div>

                    {/* Home input */}
                    <input
                      type="number"
                      min="0"
                      step={row.step || "1"}
                      className="input text-center text-xs py-1.5"
                      style={{ height: "32px" }}
                      placeholder="—"
                      {...field(row.home)}
                    />

                    {/* Away input */}
                    <input
                      type="number"
                      min="0"
                      step={row.step || "1"}
                      className="input text-center text-xs py-1.5"
                      style={{ height: "32px" }}
                      placeholder="—"
                      {...field(row.away)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
