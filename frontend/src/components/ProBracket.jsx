import { Fragment } from "react";
import ClubAvatar from "./ui/ClubAvatar";

const LABEL_H = 36; // px for round label row
const SLOT_H = 140; // px per match slot in round 0
const CONN_W = 44; // px for connector column between rounds

const MATCH_STATUS_LABELS = {
  scheduled: "Programado",
  played: "Jugado",
};

function groupByRound(matches = []) {
  const map = new Map();
  matches.forEach((match) => {
    const round = Number(match.round || 1);
    if (!map.has(round)) map.set(round, []);
    map.get(round).push(match);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([, roundMatches]) => ({
      matches: roundMatches.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }));
}

// Builds the full bracket structure, filling future rounds with placeholder cards
function buildAllRounds(matches) {
  const realRounds = groupByRound(matches);
  if (!realRounds.length) return [];

  const firstCount = realRounds[0].matches.length;
  // log2(8)=3 → 4 rounds, log2(4)=2 → 3 rounds, log2(2)=1 → 2, log2(1)=0 → 1
  const totalRounds = Math.round(Math.log2(firstCount)) + 1;

  return Array.from({ length: totalRounds }, (_, i) => {
    if (i < realRounds.length) return realRounds[i];

    const count = Math.round(firstCount / Math.pow(2, i));
    return {
      matches: Array.from({ length: count }, (_, j) => ({
        _id: `__ph_${i}_${j}`,
        homeClub: null,
        awayClub: null,
        status: "pending",
        scoreHome: null,
        scoreAway: null,
        round: i + 1,
        order: j,
        isPlaceholder: true,
      })),
    };
  });
}

function getWinner(match) {
  if (!match || match.status !== "played") return null;
  return Number(match.scoreHome) >= Number(match.scoreAway)
    ? match.homeClub
    : match.awayClub;
}

function getChampion(rounds) {
  const finalRound = rounds[rounds.length - 1];
  return getWinner(finalRound?.matches?.[0] ?? null);
}

function getRoundNameByCount(count) {
  if (count >= 8) return "Octavos";
  if (count === 4) return "Cuartos";
  if (count === 2) return "Semifinal";
  return "Final";
}

export default function ProBracket({ matches = [] }) {
  if (!matches.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-500 text-sm">El bracket no ha sido generado aún</p>
      </div>
    );
  }

  const rounds = buildAllRounds(matches);
  const champion = getChampion(rounds);

  const firstCount = rounds[0]?.matches.length ?? 1;
  const totalCardH = firstCount * SLOT_H;
  const columnH = LABEL_H + totalCardH;
  const minW = rounds.length * 230 + (rounds.length - 1) * CONN_W + 200;

  return (
    <div className="card overflow-hidden">
      <div
        className="overflow-x-auto p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(4,10,14,0.98), rgba(2,6,10,0.98))",
        }}
      >
        <div className="flex items-start" style={{ minWidth: minW }}>
          {rounds.map((roundGroup, rIdx) => {
            const slotH = SLOT_H * Math.pow(2, rIdx);
            const hasNext = rIdx < rounds.length - 1;
            const label = getRoundNameByCount(roundGroup.matches.length);
            const isLast = rIdx === rounds.length - 1;

            return (
              <Fragment key={rIdx}>
                {/* ── Round column ── */}
                <div className="shrink-0" style={{ width: 230 }}>
                  <p
                    className="text-center text-[11px] font-black uppercase tracking-[0.25em]"
                    style={{
                      height: LABEL_H,
                      lineHeight: `${LABEL_H}px`,
                      color: isLast ? "var(--fifa-neon)" : "var(--fifa-mute)",
                    }}
                  >
                    {label}
                  </p>

                  {roundGroup.matches.map((match) => (
                    <div
                      key={match._id}
                      className="flex items-center px-1"
                      style={{ height: slotH }}
                    >
                      <BracketCard match={match} champion={champion} />
                    </div>
                  ))}
                </div>

                {/* ── Connector column (between rounds only) ── */}
                {hasNext && (
                  <div
                    className="relative shrink-0"
                    style={{ width: CONN_W, height: columnH }}
                  >
                    {roundGroup.matches.map((_, mIdx) => {
                      const isPairTop = mIdx % 2 === 0;
                      const cardMidY = LABEL_H + mIdx * slotH + slotH / 2;

                      return (
                        <Fragment key={mIdx}>
                          {/* Horizontal stub: card → vertical bar */}
                          <div
                            className="absolute"
                            style={{
                              left: 0,
                              top: cardMidY - 1,
                              width: 20,
                              height: 2,
                              background: "rgba(36,255,122,0.5)",
                              boxShadow: "0 0 7px rgba(36,255,122,0.35)",
                            }}
                          />
                          {/* Vertical bar connecting the pair — drawn once by the top card */}
                          {isPairTop && (
                            <div
                              className="absolute"
                              style={{
                                left: 19,
                                top: cardMidY,
                                width: 2,
                                height: slotH,
                                background: "rgba(36,255,122,0.35)",
                                boxShadow: "0 0 6px rgba(36,255,122,0.2)",
                              }}
                            />
                          )}
                          {/* Horizontal stub: midpoint → next round — drawn once by the top card */}
                          {isPairTop && (
                            <div
                              className="absolute"
                              style={{
                                left: 20,
                                top: cardMidY + slotH / 2 - 1,
                                width: CONN_W - 20,
                                height: 2,
                                background: "rgba(36,255,122,0.5)",
                                boxShadow: "0 0 7px rgba(36,255,122,0.35)",
                              }}
                            />
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                )}
              </Fragment>
            );
          })}

          {/* ── Champion display ── */}
          <ChampionDisplay champion={champion} height={columnH} />
        </div>
      </div>
    </div>
  );
}

function BracketCard({ match, champion }) {
  const { isPlaceholder } = match;
  const winner = getWinner(match);
  const championId = champion?._id;
  const isPlayed = match.status === "played";

  const homeWon = !!(winner?._id && winner._id === match.homeClub?._id);
  const awayWon = !!(winner?._id && winner._id === match.awayClub?._id);
  const homeChamp = !!(championId && championId === match.homeClub?._id);
  const awayChamp = !!(championId && championId === match.awayClub?._id);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border p-3"
      style={{
        borderColor: isPlaceholder
          ? "rgba(255,255,255,0.06)"
          : "rgba(36,255,122,0.18)",
        background: isPlaceholder
          ? "rgba(255,255,255,0.02)"
          : "linear-gradient(135deg, rgba(9,26,31,0.96), rgba(3,8,13,0.98))",
        boxShadow:
          homeChamp || awayChamp
            ? "0 0 28px rgba(36,255,122,0.14)"
            : "0 0 10px rgba(36,255,122,0.04)",
        opacity: isPlaceholder ? 0.45 : 1,
      }}
    >
      <div className="mb-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {isPlaceholder
            ? "Pendiente"
            : (MATCH_STATUS_LABELS[match.status] ?? match.status)}
        </span>
      </div>

      <TeamLine
        club={match.homeClub}
        score={match.scoreHome}
        won={homeWon}
        championPath={homeChamp}
        played={isPlayed}
        placeholder={isPlaceholder}
      />

      <div className="my-1.5 h-px bg-white/5" />

      <TeamLine
        club={match.awayClub}
        score={match.scoreAway}
        won={awayWon}
        championPath={awayChamp}
        played={isPlayed}
        placeholder={isPlaceholder}
      />
    </div>
  );
}

function TeamLine({ club, score, won, championPath, played, placeholder }) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5"
      style={{
        background: won ? "rgba(36,255,122,0.11)" : "rgba(255,255,255,0.025)",
        opacity: played && !won ? 0.45 : 1,
        boxShadow: championPath
          ? "inset 0 0 12px rgba(36,255,122,0.1)"
          : "none",
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <ClubAvatar name={club?.name || "TBD"} logo={club?.logo} small />
        <span
          className="truncate text-sm"
          style={{
            color: won
              ? "#fff"
              : played
              ? "#6b7280"
              : placeholder
              ? "#4b5563"
              : "#e5e7eb",
            fontWeight: won ? 700 : 400,
            fontStyle: placeholder ? "italic" : "normal",
          }}
        >
          {club?.name || "Por definir"}
        </span>
      </div>
      <span
        className="tabular-nums text-base font-bold shrink-0"
        style={{ color: won ? "var(--fifa-neon)" : "#4b5563" }}
      >
        {played ? (score ?? 0) : "–"}
      </span>
    </div>
  );
}

function ChampionDisplay({ champion, height }) {
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center"
      style={{ width: 180, height }}
    >
      <div className="px-4 text-center">
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border"
          style={{
            borderColor: "rgba(36,255,122,0.4)",
            background:
              "radial-gradient(circle, rgba(36,255,122,0.15), rgba(0,0,0,0.3))",
            boxShadow: "0 0 40px rgba(36,255,122,0.15)",
          }}
        >
          <span className="text-3xl">🏆</span>
        </div>

        {champion ? (
          <div>
            <div className="mx-auto mb-2 flex justify-center">
              <ClubAvatar name={champion.name} logo={champion.logo} />
            </div>
            <p className="text-base font-black leading-tight text-white">
              {champion.name}
            </p>
            {champion.abbr && (
              <p
                className="mt-1 text-sm font-bold"
                style={{ color: "var(--fifa-neon)" }}
              >
                {champion.abbr}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-gray-500">
            El campeón aparecerá cuando se juegue la final
          </p>
        )}
      </div>
    </div>
  );
}
