export default function SkeletonCard({
  height = 140,
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{
        height,
        background:
          "linear-gradient(180deg, rgba(13,34,43,.82), rgba(6,16,22,.92))",
        border: "1px solid rgba(36,255,122,.08)",
      }}
    >
      {/* Shine */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent)",
        }}
      />
    </div>
  );
}