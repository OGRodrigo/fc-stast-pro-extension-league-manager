import { Fragment } from "react";
import { QRCodeSVG } from "react-qr-code";
import ClubAvatar from "./ui/ClubAvatar";
import QRCode from "react-qr-code";


// ─── Layout constants ──────────────────────────────────────────────────────────
const LABEL_H = 40;   // round label row height
const SLOT_H  = 138;  // match slot height in round 0
const CONN_W  = 56;   // connector column width between rounds
const CARD_W  = 222;  // bracket card width

const neon = (a) => `rgba(36,255,122,${a})`;

const STATUS_LABELS = { scheduled: "Programado", played: "Jugado" };

// ─── Data helpers ──────────────────────────────────────────────────────────────
function groupByRound(matches = []) {
  const map = new Map();
  matches.forEach((m) => {
    const r = Number(m.round || 1);
    if (!map.has(r)) map.set(r, []);
    map.get(r).push(m);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([, ms]) => ({ matches: ms.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) }));
}

function buildAllRounds(matches) {
  const realRounds = groupByRound(matches);
  if (!realRounds.length) return [];
  const firstCount = realRounds[0].matches.length;
  const totalRounds = Math.round(Math.log2(firstCount)) + 1;
  return Array.from({ length: totalRounds }, (_, i) => {
    if (i < realRounds.length) return realRounds[i];
    const count = Math.round(firstCount / Math.pow(2, i));
    return {
      matches: Array.from({ length: count }, (_, j) => ({
        _id: `__ph_${i}_${j}`,
        homeClub: null, awayClub: null, status: "pending",
        scoreHome: null, scoreAway: null, round: i + 1, order: j, isPlaceholder: true,
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
  return getWinner(rounds[rounds.length - 1]?.matches?.[0] ?? null);
}

function getRoundLabel(count) {
  if (count >= 8) return "Octavos";
  if (count === 4) return "Cuartos";
  if (count === 2) return "Semifinal";
  return "Final";
}

// ─── Root component ────────────────────────────────────────────────────────────
export default function ProBracket({ matches = [], slug = "" }) {
  if (!matches.length) {
    return (
      <div
        className="card flex flex-col items-center justify-center p-16 text-center"
        style={{ background: "rgba(4,10,16,0.95)" }}
      >
        <div className="mb-4 text-5xl opacity-20">🏆</div>
        <p className="text-sm font-medium text-gray-500">
          El bracket no ha sido generado aún
        </p>
      </div>
    );
  }

  const rounds      = buildAllRounds(matches);
  const champion    = getChampion(rounds);
  const firstCount  = rounds[0]?.matches.length ?? 1;
  const totalCardH  = firstCount * SLOT_H;
  const columnH     = LABEL_H + totalCardH;
  const minW        = rounds.length * CARD_W + (rounds.length - 1) * CONN_W + 196;

  return (
    <div className="card overflow-hidden">
      {/* ── scrollable arena wrapper ── */}
      <div
        className="overflow-x-auto"
        style={{
          // Arena base: deep dark + centre floodlight glow + subtle grid
          background: `
            radial-gradient(ellipse 80% 55% at 50% 42%, ${neon(0.048)} 0%, transparent 60%),
            linear-gradient(${neon(0.018)} 1px, transparent 1px),
            linear-gradient(90deg, ${neon(0.018)} 1px, transparent 1px),
            linear-gradient(160deg, rgba(4,11,17,1) 0%, rgba(2,7,13,1) 100%)
          `,
          backgroundSize: "auto, 44px 44px, 44px 44px, auto",
        }}
      >
        {/* ── bracket flex row ── */}
        <div
          className="flex items-start"
          style={{ minWidth: minW, padding: "16px 20px 28px 20px" }}
        >
          {rounds.map((roundGroup, rIdx) => {
            const slotH  = SLOT_H * Math.pow(2, rIdx);
            const hasNext = rIdx < rounds.length - 1;
            const label  = getRoundLabel(roundGroup.matches.length);
            const isLast = rIdx === rounds.length - 1;

            return (
              <Fragment key={rIdx}>
                {/* ── Round column ── */}
                <div className="shrink-0" style={{ width: CARD_W }}>
                  {/* Round label */}
                  <p
                    className="text-center text-[10px] font-black uppercase tracking-[0.28em]"
                    style={{
                      height: LABEL_H,
                      lineHeight: `${LABEL_H}px`,
                      color: isLast ? "#24ff7a" : "rgba(255,255,255,0.22)",
                      textShadow: isLast
                        ? "0 0 14px rgba(36,255,122,0.55)"
                        : "none",
                    }}
                  >
                    {label}
                  </p>

                  {/* Match cards */}
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

                {/* ── Connector lines ── */}
                {hasNext && (
                  <ConnectorColumn
                    count={roundGroup.matches.length}
                    slotH={slotH}
                    columnH={columnH}
                  />
                )}
              </Fragment>
            );
          })}

          {/* ── Champion display ── */}
          <ChampionDisplay champion={champion} height={columnH} slug={slug} />
        </div>
      </div>
    </div>
  );
}

// ─── Connector lines ───────────────────────────────────────────────────────────
function ConnectorColumn({ count, slotH, columnH }) {
  return (
    <div className="relative shrink-0" style={{ width: CONN_W, height: columnH }}>
      {Array.from({ length: count }, (_, mIdx) => {
        const isPairTop = mIdx % 2 === 0;
        const cardMidY  = LABEL_H + mIdx * slotH + slotH / 2;
        const midpointY = cardMidY + slotH / 2; // midpoint between the pair

        return (
          <Fragment key={mIdx}>
            {/* Horizontal stub: card → vertical bar */}
            <div
              className="absolute"
              style={{
                left: 0,
                top: cardMidY - 1,
                width: 22,
                height: 2,
                background: `linear-gradient(to right, ${neon(0.65)}, ${neon(0.35)})`,
                boxShadow: `0 0 8px ${neon(0.35)}, 0 0 2px ${neon(0.6)}`,
              }}
            />

            {/* Vertical bar connecting the pair — top card draws it */}
            {isPairTop && (
              <div
                className="absolute"
                style={{
                  left: 21,
                  top: cardMidY,
                  width: 2,
                  height: slotH,
                  background: `linear-gradient(to bottom, ${neon(0.5)}, ${neon(0.12)}, ${neon(0.5)})`,
                  boxShadow: `0 0 6px ${neon(0.22)}`,
                }}
              />
            )}

            {/* Horizontal stub: midpoint → next round — top card draws it */}
            {isPairTop && (
              <div
                className="absolute"
                style={{
                  left: 22,
                  top: midpointY - 1,
                  width: CONN_W - 22,
                  height: 2,
                  background: `linear-gradient(to right, ${neon(0.35)}, ${neon(0.65)})`,
                  boxShadow: `0 0 8px ${neon(0.35)}, 0 0 2px ${neon(0.6)}`,
                }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── Match card ────────────────────────────────────────────────────────────────
function BracketCard({ match, champion }) {
  const { isPlaceholder } = match;
  const winner     = getWinner(match);
  const championId = champion?._id;
  const isPlayed   = match.status === "played";
  const homeWon    = !!(winner?._id && winner._id === match.homeClub?._id);
  const awayWon    = !!(winner?._id && winner._id === match.awayClub?._id);
  const homeChamp  = !!(championId && championId === match.homeClub?._id);
  const awayChamp  = !!(championId && championId === match.awayClub?._id);
  const anyChamp   = homeChamp || awayChamp;

  return (
    <div
      className="w-full overflow-hidden rounded-[18px] border"
      style={{
        borderColor: anyChamp
          ? neon(0.42)
          : isPlaceholder
          ? "rgba(255,255,255,0.05)"
          : neon(0.14),
        background: isPlaceholder
          ? "rgba(255,255,255,0.025)"
          : "linear-gradient(148deg, rgba(9,23,31,0.97) 0%, rgba(3,9,16,0.99) 100%)",
        boxShadow: anyChamp
          ? `0 0 30px ${neon(0.18)}, 0 0 60px ${neon(0.06)}, inset 0 0 20px ${neon(0.05)}`
          : isPlaceholder
          ? "none"
          : `0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)`,
        opacity: isPlaceholder ? 0.38 : 1,
        padding: "10px 10px 9px",
      }}
    >
      {/* Status badge */}
      <div className="mb-2.5">
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
          style={{
            background: isPlayed && !isPlaceholder
              ? neon(0.1)
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${
              isPlayed && !isPlaceholder
                ? neon(0.22)
                : "rgba(255,255,255,0.07)"
            }`,
            color: isPlaceholder ? "#374151" : isPlayed ? "#24ff7a" : "#6b7280",
          }}
        >
          {isPlaceholder ? "Pendiente" : (STATUS_LABELS[match.status] ?? match.status)}
        </span>
      </div>

      {/* Home team */}
      <TeamLine
        club={match.homeClub}
        score={match.scoreHome}
        won={homeWon}
        championPath={homeChamp}
        played={isPlayed}
        placeholder={isPlaceholder}
      />

      {/* Divider */}
      <div
        className="my-1.5 mx-1 h-px"
        style={{ background: "rgba(255,255,255,0.055)" }}
      />

      {/* Away team */}
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

// ─── Team row inside card ──────────────────────────────────────────────────────
function TeamLine({ club, score, won, championPath, played, placeholder }) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-[12px] px-2.5 py-[7px]"
      style={{
        background: won
          ? neon(0.1)
          : "rgba(255,255,255,0.022)",
        opacity: played && !won ? 0.38 : 1,
        boxShadow: championPath
          ? `inset 0 0 18px ${neon(0.08)}`
          : "none",
      }}
    >
      {/* Club info */}
      <div className="flex min-w-0 items-center gap-2">
        <ClubAvatar name={club?.name || "TBD"} logo={club?.logo} small />
        <span
          className="truncate text-[13px] leading-tight"
          style={{
            color: won
              ? "#ffffff"
              : played
              ? "#4b5563"
              : placeholder
              ? "#374151"
              : "#d1d5db",
            fontWeight: won ? 700 : 400,
            fontStyle: placeholder ? "italic" : "normal",
            letterSpacing: won ? "-0.01em" : "normal",
          }}
        >
          {club?.name || "Por definir"}
        </span>
      </div>

      {/* Score */}
      <span
        className="shrink-0 tabular-nums text-[15px] leading-none"
        style={{
          color: won ? "#24ff7a" : "#374151",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          textShadow: won ? `0 0 12px ${neon(0.5)}` : "none",
        }}
      >
        {played ? (score ?? 0) : "–"}
      </span>
    </div>
  );
}

// ─── Champion display ──────────────────────────────────────────────────────────
function ChampionDisplay({ champion, height, slug }) {
  const qrUrl = slug
    ? `${window.location.origin}/public/tournaments/${slug}`
    : null;

  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center"
      style={{ width: 184, height, paddingLeft: 12 }}
    >
      <div className="flex flex-col items-center text-center">
        {/* Trophy glow ring */}
        <div
          className="relative mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-full"
          style={{
            border: `1.5px solid ${neon(0.45)}`,
            background: `radial-gradient(circle, ${neon(
              0.13
            )} 0%, rgba(0,0,0,0.25) 100%)`,
            boxShadow: champion
              ? `0 0 32px ${neon(0.2)}, 0 0 64px ${neon(
                  0.08
                )}, inset 0 0 16px ${neon(0.06)}`
              : `0 0 20px ${neon(0.1)}, 0 0 40px ${neon(0.04)}`,
          }}
        >
          {/* Outer pulse ring */}
          <div
            className="absolute inset-[-5px] rounded-full"
            style={{
              border: `1px solid ${neon(0.12)}`,
            }}
          />

          <span className="text-3xl">🏆</span>
        </div>

        {champion ? (
          <>
            <div className="mb-2">
              <ClubAvatar name={champion.name} logo={champion.logo} />
            </div>

            <p
              className="text-[13px] font-black leading-tight text-white"
              style={{ textShadow: "0 0 16px rgba(255,255,255,0.2)" }}
            >
              {champion.name}
            </p>

            {champion.abbr && (
              <p
                className="mt-0.5 text-[11px] font-bold"
                style={{
                  color: "#24ff7a",
                  textShadow: `0 0 10px ${neon(0.5)}`,
                }}
              >
                {champion.abbr}
              </p>
            )}

            <p
              className="mt-2.5 text-[8.5px] font-bold uppercase tracking-[0.22em]"
              style={{ color: neon(0.4) }}
            >
              Campeón
            </p>
          </>
        ) : (
          <>
            <p
              className="text-[8.5px] font-bold uppercase tracking-[0.22em] mb-2"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Campeón
            </p>

            <p className="text-[11px] leading-relaxed text-gray-600 text-center">
              Se conocerá al jugar la final
            </p>
          </>
        )}

        {/* Small QR — only in public mode */}
        {qrUrl && (
          <div
            className="mt-4 flex flex-col items-center gap-1.5"
            style={{
              padding: "10px",
              borderRadius: "12px",
              background: "rgba(36,255,122,.04)",
              border: `1px solid ${neon(0.14)}`,
            }}
          >
            <div
              style={{
                borderRadius: "7px",
                overflow: "hidden",
                background: "#fff",
                padding: "6px",
              }}
            >
              <QRCode
                value={qrUrl}
                size={66}
                bgColor="#ffffff"
                fgColor="#04080e"
                level="M"
              />
            </div>

            <p
              className="text-[8.5px] text-center"
              style={{ color: neon(0.38), letterSpacing: ".04em" }}
            >
              📱 Sigue el torneo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}