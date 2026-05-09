import logo from "../../assets/logo-league-manager.png";

export default function LoadingScreen({
  text = "Cargando plataforma...",
}) {
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#060b12]">
      {/* Background glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at top left,
              rgba(36,255,122,.10),
              transparent 30%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(54,230,255,.08),
              transparent 35%
            )
          `,
        }}
      />

      {/* Center */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="relative">
          {/* Pulse ring */}
          <div
            className="absolute inset-0 animate-ping rounded-full"
            style={{
              background:
                "rgba(36,255,122,.08)",
              filter: "blur(10px)",
            }}
          />

          <img
            src={logo}
            alt="FC Stats Pro League Manager"
            className="relative h-28 w-auto"
            style={{
              filter:
                "drop-shadow(0 0 30px rgba(36,255,122,.25))",
            }}
          />
        </div>

        {/* Brand */}
        <h1
          className="mt-8 text-center text-3xl font-black uppercase tracking-[0.18em]"
          style={{
            fontFamily: "var(--font-title)",
            color: "white",
          }}
        >
          FC Stats Pro
        </h1>

        <p
          className="mt-2 text-sm uppercase tracking-[0.28em]"
          style={{
            color: "var(--fifa-neon)",
          }}
        >
          League Manager
        </p>

        {/* Loading text */}
        <p
          className="mt-10 text-sm"
          style={{
            color: "var(--fifa-mute)",
          }}
        >
          {text}
        </p>

        {/* Progress line */}
        <div
          className="mt-5 h-[3px] w-[220px] overflow-hidden rounded-full"
          style={{
            background: "rgba(255,255,255,.06)",
          }}
        >
          <div
            className="h-full animate-pulse rounded-full"
            style={{
              width: "65%",
              background:
                "linear-gradient(90deg, var(--fifa-neon), #36e6ff)",
              boxShadow:
                "0 0 18px rgba(36,255,122,.35)",
            }}
          />
        </div>
      </div>
    </div>
  );
}