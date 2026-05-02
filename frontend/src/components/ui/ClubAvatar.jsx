import { useState } from "react";

export default function ClubAvatar({ name, logo, small, dim }) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "CL";

  const sizeClass = small ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";
  const opacity = dim ? 0.5 : 1;

  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt={name ?? "Club"}
        className={`${sizeClass} rounded-full object-contain shrink-0`}
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid var(--fifa-line)",
          opacity,
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-[var(--fifa-neon)] text-black font-bold flex items-center justify-center shrink-0`}
      style={{ opacity }}
    >
      {initials}
    </div>
  );
}
