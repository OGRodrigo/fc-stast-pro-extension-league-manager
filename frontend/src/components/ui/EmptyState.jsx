import { Link } from "react-router-dom";

export default function EmptyState({
  title,
  description,
  buttonLabel,
  buttonTo,
  action,
  icon,
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[32px] border p-10 text-center"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,22,32,.92), rgba(4,8,14,.96))",
        borderColor: "rgba(36,255,122,.12)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,.02), 0 24px 60px rgba(0,0,0,.45)",
      }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(36,255,122,.08), transparent 35%)",
        }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "rgba(36,255,122,.08)",
            border: "1px solid rgba(36,255,122,.18)",
            color: "var(--fifa-neon)",
          }}
        >
          {icon || (
            <span className="text-3xl">
              ⚽
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className="mt-6 text-3xl font-black uppercase tracking-wide"
          style={{
            fontFamily: "var(--font-title)",
            color: "var(--fifa-text)",
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          className="mx-auto mt-4 max-w-xl text-sm leading-7"
          style={{
            color: "var(--fifa-mute)",
          }}
        >
          {description}
        </p>

        {/* Action */}
        {(buttonTo || action) && (
          <div className="mt-8">
            {buttonTo ? (
              <Link to={buttonTo} className="btn-primary">
                {buttonLabel}
              </Link>
            ) : (
              <button
                onClick={action}
                className="btn-primary"
              >
                {buttonLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}