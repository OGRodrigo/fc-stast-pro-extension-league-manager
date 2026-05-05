import { useState, useEffect } from "react";

const MESSAGES = [
  "Leyendo OCR...",
  "Detectando marcador...",
  "Reconociendo clubes...",
  "Extrayendo estadísticas...",
  "Preparando revisión...",
];

export default function AiAnalyzingLoader({
  title = "Analizando imágenes...",
  subtitle,
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes ai-bar-slide {
          0%   { left: -45%; width: 45%; }
          65%  { left: 65%; width: 35%; }
          100% { left: 110%; width: 0%; }
        }
        @keyframes ai-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ai-pulse-ring {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(1.08); }
        }
        .ai-bar-track { position: relative; overflow: hidden; }
        .ai-bar-fill {
          position: absolute;
          top: 0; bottom: 0;
          border-radius: 9999px;
          animation: ai-bar-slide 1.9s ease-in-out infinite;
        }
        .ai-spin-rev {
          animation: ai-spin-rev 0.8s linear infinite;
        }
        .ai-pulse-ring {
          animation: ai-pulse-ring 2s ease-in-out infinite;
        }
      `}</style>

      <div className="mt-10 card p-12 flex flex-col items-center gap-7 select-none">
        {/* Spinner stack */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Ambient glow ring */}
          <div
            className="absolute inset-[-6px] rounded-full ai-pulse-ring"
            style={{
              background:
                "radial-gradient(circle, rgba(36,255,122,0.18) 0%, transparent 70%)",
            }}
          />
          {/* Outer rotating ring */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              border: "3px solid rgba(36,255,122,0.12)",
              borderTopColor: "var(--fifa-neon)",
              animationDuration: "1s",
              filter: "drop-shadow(0 0 7px rgba(36,255,122,0.65))",
            }}
          />
          {/* Inner counter-rotating ring */}
          <div
            className="absolute inset-3 rounded-full ai-spin-rev"
            style={{
              border: "2px solid rgba(36,255,122,0.07)",
              borderTopColor: "rgba(36,255,122,0.5)",
            }}
          />
          {/* Center sparkle icon */}
          <div style={{ color: "var(--fifa-neon)", opacity: 0.9 }}>
            <SparklesIconSm />
          </div>
        </div>

        {/* Text block */}
        <div className="text-center space-y-2">
          <p className="text-white font-semibold text-base tracking-wide">
            {title}
          </p>
          <p
            className="text-sm font-medium transition-opacity duration-300"
            style={{
              color: "var(--fifa-neon)",
              opacity: visible ? 1 : 0,
              minHeight: "1.25rem",
            }}
          >
            {subtitle ?? MESSAGES[idx]}
          </p>
        </div>

        {/* Indeterminate progress bar */}
        <div
          className="ai-bar-track w-full max-w-xs h-[3px] rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="ai-bar-fill"
            style={{
              background: "var(--fifa-neon)",
              boxShadow: "0 0 10px var(--fifa-neon)",
            }}
          />
        </div>

        <p className="text-gray-600 text-xs tracking-wide">
          Azure Vision + OpenAI · puede tardar 10–20 seg
        </p>
      </div>
    </>
  );
}

function SparklesIconSm() {
  return (
    <svg
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  );
}
