import { useState } from "react";
import ClubAvatar from "./ui/ClubAvatar";

const MATCH_STATUS_BADGE = {
  scheduled: "badge-scheduled",
  played: "badge-played",
};

const MATCH_STATUS_LABELS = {
  scheduled: "Programado",
  played: "Jugado",
};

function groupMatchesByRound(matches) {
  const rounds = {};

  matches.forEach((match) => {
    const r = match.round || 1;
    if (!rounds[r]) rounds[r] = [];
    rounds[r].push(match);
  });

  return Object.keys(rounds)
    .sort((a, b) => Number(a) - Number(b))
    .map((r) => rounds[r]);
}

function getRoundLabel(totalRounds, roundIdx) {
  const remaining = totalRounds - roundIdx;
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semifinal";
  if (remaining === 3) return "Cuartos de final";
  return `Ronda ${roundIdx + 1}`;
}

export default function Bracket({ matches, onEdit }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500 text-sm">No hay partidos en el bracket</p>
      </div>
    );
  }

  const rounds = groupMatchesByRound(matches);

  // Build winner ID set for champion-path highlighting
  const winnerIds = new Set();
  rounds.forEach((round) => {
    round.forEach((match) => {
      if (match.status === "played") {
        const wId =
          match.scoreHome >= match.scoreAway
            ? match.homeClub?._id
            : match.awayClub?._id;
        if (wId) winnerIds.add(wId);
      }
    });
  });

  // Detect champion from the final
  const lastRound = rounds[rounds.length - 1];
  const finalMatch = lastRound?.length === 1 ? lastRound[0] : null;
  const champion =
    finalMatch?.status === "played"
      ? finalMatch.scoreHome >= finalMatch.scoreAway
        ? finalMatch.homeClub
        : finalMatch.awayClub
      : null;

  return (
    <div className="space-y-5">
      {champion && <WinnerBanner club={champion} />}

      <div className="overflow-x-auto pb-2">
        <div
          className="flex gap-8 items-start"
          style={{ minWidth: `${rounds.length * 260}px` }}
        >
          {rounds.map((round, rIdx) => {
            const isFinalRound = rIdx === rounds.length - 1;
            const label = getRoundLabel(rounds.length, rIdx);

            return (
              <div key={rIdx} className="flex flex-col flex-1 min-w-[230px] space-y-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: isFinalRound ? "var(--fifa-neon)" : "var(--fifa-mute)",
                  }}
                >
                  {label}
                </p>

                {round.map((match) => (
                  <BracketCard
                    key={match._id}
                    match={match}
                    winnerIds={winnerIds}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BracketCard({ match, winnerIds, onEdit }) {
  const [hovered, setHovered] = useState(false);
  const isPlayed = match.status === "played";
  const homeWins = isPlayed && match.scoreHome >= match.scoreAway;
  const awayWins = isPlayed && match.scoreAway > match.scoreHome;
  const homeName = match.homeClub?.name || "—";
  const awayName = match.awayClub?.name || "—";

  const homeOnPath = Boolean(match.homeClub?._id && winnerIds.has(match.homeClub._id));
  const awayOnPath = Boolean(match.awayClub?._id && winnerIds.has(match.awayClub._id));

  return (
    <div
      onClick={() => onEdit?.(match)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="card px-4 py-3"
      style={{
        cursor: onEdit ? "pointer" : "default",
        borderColor: hovered
          ? "rgba(36,255,122,0.40)"
          : isPlayed
          ? "rgba(255,255,255,0.12)"
          : undefined,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease",
        boxShadow: hovered ? "0 6px 24px rgba(36,255,122,0.14)" : undefined,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={MATCH_STATUS_BADGE[match.status] ?? "badge-scheduled"}>
          {MATCH_STATUS_LABELS[match.status] ?? match.status}
        </span>
        {onEdit && (
          <span
            className="text-[10px]"
            style={{
              color: "var(--fifa-mute)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.15s ease",
            }}
          >
            Editar →
          </span>
        )}
      </div>

      {/* Home row */}
      <div
        className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md mb-1"
        style={{
          backgroundColor: homeWins ? "rgba(36,255,122,0.09)" : undefined,
          boxShadow:
            homeWins && homeOnPath ? "inset 0 0 14px rgba(36,255,122,0.08)" : undefined,
          transition: "background-color 0.2s",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ClubAvatar
            name={homeName}
            logo={match.homeClub?.logo}
            small
            dim={isPlayed && !homeWins}
          />
          <span
            className="text-sm truncate"
            style={{
              color: homeWins ? "#fff" : isPlayed ? "#6b7280" : "#e5e7eb",
              fontWeight: homeWins ? 700 : 400,
            }}
          >
            {homeName}
          </span>
        </div>
        {isPlayed && (
          <span
            className="tabular-nums text-base font-bold shrink-0"
            style={{ color: homeWins ? "var(--fifa-neon)" : "#4b5563" }}
          >
            {match.scoreHome}
          </span>
        )}
      </div>

      {/* Away row */}
      <div
        className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md"
        style={{
          backgroundColor: awayWins ? "rgba(36,255,122,0.09)" : undefined,
          boxShadow:
            awayWins && awayOnPath ? "inset 0 0 14px rgba(36,255,122,0.08)" : undefined,
          transition: "background-color 0.2s",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ClubAvatar
            name={awayName}
            logo={match.awayClub?.logo}
            small
            dim={isPlayed && !awayWins}
          />
          <span
            className="text-sm truncate"
            style={{
              color: awayWins ? "#fff" : isPlayed ? "#6b7280" : "#e5e7eb",
              fontWeight: awayWins ? 700 : 400,
            }}
          >
            {awayName}
          </span>
        </div>
        {isPlayed && (
          <span
            className="tabular-nums text-base font-bold shrink-0"
            style={{ color: awayWins ? "var(--fifa-neon)" : "#4b5563" }}
          >
            {match.scoreAway}
          </span>
        )}
      </div>

      {!isPlayed && (
        <p className="text-center text-xs mt-2" style={{ color: "var(--fifa-mute)" }}>
          vs
        </p>
      )}
    </div>
  );
}

function WinnerBanner({ club }) {
  return (
    <div
      className="card p-6 text-center"
      style={{
        border: "2px solid rgba(36,255,122,0.5)",
        backgroundColor: "rgba(36,255,122,0.05)",
        boxShadow: "0 0 40px rgba(36,255,122,0.12)",
      }}
    >
      <p
        className="text-[10px] uppercase tracking-widest font-bold mb-3"
        style={{ color: "var(--fifa-neon)" }}
      >
        🏆 Campeón del torneo
      </p>
      <div className="flex items-center justify-center gap-3">
        <ClubAvatar name={club.name} logo={club.logo} />
        <p className="text-2xl font-bold text-white">{club.name}</p>
        {club.abbr && (
          <span className="text-sm font-bold" style={{ color: "var(--fifa-neon)" }}>
            {club.abbr}
          </span>
        )}
      </div>
    </div>
  );
}
