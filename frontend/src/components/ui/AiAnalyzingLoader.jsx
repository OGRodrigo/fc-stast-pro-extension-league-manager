import { useState, useEffect } from "react";

const STAGES = [
  { label: "Azure Vision leyendo imagen..." },
  { label: "Detectando marcador y clubes..." },
  { label: "Extrayendo estadísticas..." },
  { label: "OpenAI validando resultados..." },
  { label: "Compilando datos del partido..." },
];

const STAGE_MS = 3000;

export default function AiAnalyzingLoader({
  title = "Analizando imágenes con IA...",
  subtitle,
}) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (subtitle) return;
    const t = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, STAGE_MS);
    return () => clearInterval(t);
  }, [subtitle]);

  const progress = Math.round(((stage + 1) / STAGES.length) * 100);

  return (
    <>
      <style>{`
        @keyframes ai-spin     { to { transform: rotate(360deg); } }
        @keyframes ai-spin-rev { to { transform: rotate(-360deg); } }
        @keyframes ai-pulse-ring {
          0%,100% { opacity: 0.12; transform: scale(1); }
          50%      { opacity: 0.28; transform: scale(1.1); }
        }
        @keyframes ai-dot {
          0%,80%,100% { opacity: 0.1; }
          40%          { opacity: 1; }
        }
        .ai-spin       { animation: ai-spin 1.2s linear infinite; }
        .ai-spin-rev   { animation: ai-spin-rev 0.9s linear infinite; }
        .ai-pulse-ring { animation: ai-pulse-ring 2.2s ease-in-out infinite; }
        .ai-d1 { animation: ai-dot 1.2s ease-in-out infinite 0s; }
        .ai-d2 { animation: ai-dot 1.2s ease-in-out infinite 0.22s; }
        .ai-d3 { animation: ai-dot 1.2s ease-in-out infinite 0.44s; }
      `}</style>

      <div className="mt-8 card relative overflow-hidden p-10 flex flex-col items-center gap-8 select-none">
        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(36,255,122,0.03) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Spinner */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div
            className="absolute ai-pulse-ring"
            style={{
              inset: "-10px",
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(36,255,122,0.14) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full ai-spin"
            style={{
              border: "2.5px solid rgba(36,255,122,0.1)",
              borderTopColor: "var(--fifa-neon)",
              filter: "drop-shadow(0 0 8px rgba(36,255,122,0.55))",
            }}
          />
          <div
            className="absolute inset-3 rounded-full ai-spin-rev"
            style={{
              border: "1.5px solid rgba(36,255,122,0.07)",
              borderBottomColor: "rgba(36,255,122,0.45)",
            }}
          />
          <SparklesIcon />
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <p className="text-white font-bold text-base tracking-wide">{title}</p>
          {subtitle && (
            <p className="text-sm font-medium" style={{ color: "var(--fifa-neon)" }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Stage pipeline — only shown during AI analysis, not during save */}
        {!subtitle && (
          <div className="w-full max-w-xs space-y-2.5">
            {STAGES.map((s, i) => {
              const done   = i < stage;
              const active = i === stage;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3"
                  style={{
                    opacity: i > stage ? 0.22 : 1,
                    transition: "opacity 0.45s ease",
                  }}
                >
                  {/* Stage dot */}
                  <div
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center border"
                    style={{
                      borderColor:
                        done || active ? "var(--fifa-neon)" : "rgba(255,255,255,0.12)",
                      backgroundColor: done
                        ? "rgba(36,255,122,0.2)"
                        : active
                        ? "rgba(36,255,122,0.08)"
                        : "transparent",
                      boxShadow: active ? "0 0 8px rgba(36,255,122,0.35)" : "none",
                      transition: "all 0.35s ease",
                    }}
                  >
                    {done ? (
                      <CheckMini />
                    ) : active ? (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: "var(--fifa-neon)" }}
                      />
                    ) : null}
                  </div>

                  {/* Label */}
                  <span
                    className="text-xs"
                    style={{
                      color: active
                        ? "#fff"
                        : done
                        ? "rgba(255,255,255,0.42)"
                        : "rgba(255,255,255,0.18)",
                      fontWeight: active ? 600 : 400,
                      transition: "color 0.3s ease, font-weight 0.3s ease",
                    }}
                  >
                    {s.label}
                  </span>

                  {/* Active blinking dots */}
                  {active && (
                    <div className="ml-auto flex gap-[3px]">
                      <span className="ai-d1 w-1 h-1 rounded-full inline-block" style={{ background: "var(--fifa-neon)" }} />
                      <span className="ai-d2 w-1 h-1 rounded-full inline-block" style={{ background: "var(--fifa-neon)" }} />
                      <span className="ai-d3 w-1 h-1 rounded-full inline-block" style={{ background: "var(--fifa-neon)" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        <div
          className="w-full max-w-xs h-[3px] rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {!subtitle ? (
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                borderRadius: "9999px",
                background: "var(--fifa-neon)",
                boxShadow: "0 0 10px rgba(36,255,122,0.6)",
                transition: "width 0.7s ease",
              }}
            />
          ) : (
            /* Indeterminate bar for save state */
            <div style={{ position: "relative", overflow: "hidden", height: "100%", borderRadius: "9999px" }}>
              <style>{`
                @keyframes ai-bar-slide {
                  0%   { left: -45%; width: 45%; }
                  65%  { left: 65%; width: 35%; }
                  100% { left: 110%; width: 0%; }
                }
                .ai-bar-fill { position: absolute; top: 0; bottom: 0; border-radius: 9999px; animation: ai-bar-slide 1.9s ease-in-out infinite; }
              `}</style>
              <div
                className="ai-bar-fill"
                style={{ background: "var(--fifa-neon)", boxShadow: "0 0 10px var(--fifa-neon)" }}
              />
            </div>
          )}
        </div>

        <p className="text-gray-600 text-xs tracking-wide">
          {subtitle ? "Esto puede tardar unos segundos" : "Azure Vision + OpenAI · puede tardar 10–20 seg"}
        </p>
      </div>
    </>
  );
}

function SparklesIcon() {
  return (
    <svg
      width="22" height="22" fill="none" viewBox="0 0 24 24"
      stroke="var(--fifa-neon)" strokeWidth={1.5} style={{ opacity: 0.9 }}
    >
      <path
        strokeLinecap="round" strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  );
}

function CheckMini() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
      stroke="var(--fifa-neon)" strokeWidth={3.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
