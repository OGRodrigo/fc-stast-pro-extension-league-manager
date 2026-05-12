import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { QRCode as QRCodeSVG } from "react-qr-code";
import { publicApi } from "../api";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAT_LABELS = { league: "Liga", cup: "Copa", mixed: "Liga + Playoffs" };
const STATUS_LABELS = { active: "En curso", draft: "Próximamente", finished: "Finalizado" };
const STATUS_COLORS = { active: "#24ff7a", draft: "#facc15", finished: "rgba(255,255,255,.5)" };

const REFRESH_INTERVAL = 60_000;

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrophyIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}

function CalendarIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClubBadge({ club }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
        background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        {club?.logo ? (
          <img src={club.logo} alt={club.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#24ff7a" }}>
            {(club?.abbr ?? club?.name ?? "?").slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span style={{
        fontSize: "14px", fontWeight: 600, color: "#fff",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {club?.name ?? "Por definir"}
      </span>
    </div>
  );
}

function StandingsTable({ table, tournament }) {
  if (!table?.length) {
    return (
      <div style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,.25)", fontSize: "13px" }}>
        Sin partidos disputados aún
      </div>
    );
  }

  const playoffLine = tournament?.hasPlayoffs ? tournament.playoffTeams : 0;

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: "grid", gridTemplateColumns: "28px 1fr 44px 44px 44px 44px 56px",
        gap: "4px", padding: "6px 12px 10px",
        fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,.3)", letterSpacing: ".08em",
        textTransform: "uppercase",
      }}>
        <span>#</span>
        <span>Club</span>
        <span style={{ textAlign: "center" }}>PJ</span>
        <span style={{ textAlign: "center" }}>PG</span>
        <span style={{ textAlign: "center" }}>PE</span>
        <span style={{ textAlign: "center" }}>PP</span>
        <span style={{ textAlign: "right" }}>PTS</span>
      </div>

      {table.map((row, i) => {
        const isFirst    = i === 0;
        const isPlayoff  = playoffLine > 0 && i < playoffLine;
        const lastPlayoff = playoffLine > 0 && i === playoffLine - 1;

        return (
          <div key={row.club?._id ?? i}>
            {lastPlayoff && (
              <div style={{ height: "1px", margin: "4px 0", background: "rgba(36,255,122,.25)", boxShadow: "0 0 6px rgba(36,255,122,.2)" }} />
            )}
            <div style={{
              display: "grid", gridTemplateColumns: "28px 1fr 44px 44px 44px 44px 56px",
              gap: "4px", padding: "10px 12px",
              borderRadius: "10px",
              background: isFirst ? "rgba(36,255,122,.07)" : "rgba(255,255,255,.02)",
              border: `1px solid ${isFirst ? "rgba(36,255,122,.18)" : "rgba(255,255,255,.04)"}`,
              marginBottom: "4px",
              alignItems: "center",
            }}>
              <span style={{
                fontSize: "14px", fontWeight: 800,
                color: i === 0 ? "#24ff7a" : i === 1 ? "#d1d5db" : i === 2 ? "#fb923c" : "rgba(255,255,255,.3)",
              }}>
                {i + 1}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "7px", flexShrink: 0,
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {row.club?.logo ? (
                    <img src={row.club.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#24ff7a" }}>
                      {(row.club?.abbr ?? row.club?.name ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: "14px", fontWeight: isFirst ? 700 : 500,
                  color: isFirst ? "#fff" : "rgba(255,255,255,.78)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {row.club?.name ?? "—"}
                </span>
              </div>

              {[row.played, row.won, row.drawn, row.lost].map((val, j) => (
                <span key={j} style={{
                  textAlign: "center", fontSize: "14px",
                  color: j === 1 && val > 0 ? "rgba(36,255,122,.8)" : "rgba(255,255,255,.45)",
                  fontWeight: j === 1 ? 600 : 400,
                }}>
                  {val ?? 0}
                </span>
              ))}

              <span style={{
                textAlign: "right", fontSize: "17px", fontWeight: 800,
                color: isFirst ? "#24ff7a" : "rgba(255,255,255,.65)",
                textShadow: isFirst ? "0 0 14px rgba(36,255,122,.5)" : "none",
              }}>
                {row.points ?? 0}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatchCard({ match, upcoming = false }) {
  const home = match.homeClub;
  const away = match.awayClub;
  const played = match.status === "played";

  return (
    <div style={{
      padding: "12px 14px", borderRadius: "12px",
      background: upcoming ? "rgba(255,255,255,.03)" : "rgba(36,255,122,.05)",
      border: `1px solid ${upcoming ? "rgba(255,255,255,.07)" : "rgba(36,255,122,.15)"}`,
      marginBottom: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Home */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "7px", justifyContent: "flex-end", overflow: "hidden" }}>
          <span style={{
            fontSize: "13px", fontWeight: 600,
            color: played && match.scoreHome > match.scoreAway ? "#fff" : "rgba(255,255,255,.6)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            textAlign: "right",
          }}>
            {home?.name ?? "—"}
          </span>
          {home?.logo && <img src={home.logo} alt="" style={{ width: "22px", height: "22px", objectFit: "contain", flexShrink: 0 }} />}
        </div>

        {/* Score or VS */}
        <div style={{
          padding: "4px 10px", borderRadius: "8px", flexShrink: 0,
          background: played ? "rgba(36,255,122,.1)" : "rgba(255,255,255,.04)",
          border: `1px solid ${played ? "rgba(36,255,122,.22)" : "rgba(255,255,255,.08)"}`,
          minWidth: "52px", textAlign: "center",
        }}>
          {played ? (
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#24ff7a", letterSpacing: "1px" }}>
              {match.scoreHome} – {match.scoreAway}
            </span>
          ) : (
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,.35)" }}>VS</span>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "7px", overflow: "hidden" }}>
          {away?.logo && <img src={away.logo} alt="" style={{ width: "22px", height: "22px", objectFit: "contain", flexShrink: 0 }} />}
          <span style={{
            fontSize: "13px", fontWeight: 600,
            color: played && match.scoreAway > match.scoreHome ? "#fff" : "rgba(255,255,255,.6)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {away?.name ?? "—"}
          </span>
        </div>
      </div>

      {/* Date */}
      <div style={{ marginTop: "8px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
          <CalendarIcon />
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,.3)" }}>
            {formatDate(match.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

function LivePulse() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
      <div style={{
        position: "relative", width: "8px", height: "8px",
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "#24ff7a",
          animation: "pulse 2s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "#24ff7a", opacity: 0.4,
          transform: "scale(2)",
          animation: "ping 2s ease-in-out infinite",
        }} />
      </div>
      <span style={{ fontSize: "10px", fontWeight: 700, color: "#24ff7a", letterSpacing: ".1em", textTransform: "uppercase" }}>
        EN VIVO
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StreamModePage() {
  const { slug } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef(null);

  const publicUrl = `${window.location.origin}/public/tournaments/${slug}`;

  const fetchData = async () => {
    try {
      const res = await publicApi.getTournamentBySlug(slug);
      setData(res.data);
      setError(null);
      setLastRefresh(new Date());
    } catch {
      setError("No se pudo cargar el torneo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [slug]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#04080e",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px",
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          border: "2px solid rgba(36,255,122,.2)",
          borderTop: "2px solid #24ff7a",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,.35)", letterSpacing: ".05em" }}>Cargando torneo...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes ping { 0%,100%{opacity:.4;transform:scale(2)} 50%{opacity:.1;transform:scale(2.8)} } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: "100vh", background: "#04080e",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ color: "rgba(255,80,80,.8)", fontSize: "14px" }}>{error ?? "Torneo no encontrado"}</p>
      </div>
    );
  }

  const { tournament, clubs, table, recentMatches, allMatches, summary } = data;
  const upcoming = allMatches.filter(m => m.status === "scheduled").slice(0, 4);
  const recent   = (recentMatches ?? []).slice(0, 5);
  const champion = tournament.status === "finished" && table?.[0]?.club ? table[0].club : null;

  const statusColor = STATUS_COLORS[tournament.status] ?? "rgba(255,255,255,.5)";

  return (
    <div style={{
      minHeight: "100vh",
      background: `
        radial-gradient(ellipse 60% 40% at 50% 0%, rgba(36,255,122,.06) 0%, transparent 55%),
        linear-gradient(rgba(36,255,122,.012) 1px, transparent 1px),
        linear-gradient(90deg, rgba(36,255,122,.012) 1px, transparent 1px),
        #04080e
      `,
      backgroundSize: "auto, 60px 60px, 60px 60px, auto",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#fff",
    }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes ping  { 0%,100%{opacity:.4;transform:scale(2)} 50%{opacity:.1;transform:scale(2.8)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
      `}</style>

      {/* ── Top neon bar ── */}
      <div style={{ height: "3px", background: "#24ff7a", boxShadow: "0 0 20px #24ff7a, 0 0 40px rgba(36,255,122,.4)" }} />

      {/* ── Header ── */}
      <div style={{
        padding: "20px 40px",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        background: "rgba(4,8,14,.8)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "20px", flexWrap: "wrap",
      }}>
        {/* Left: branding + tournament */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* FC Stats Pro logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "rgba(36,255,122,.12)", border: "1px solid rgba(36,255,122,.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 900, color: "#24ff7a" }}>FC</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,.4)", letterSpacing: ".1em", textTransform: "uppercase" }}>
              FC STATS PRO
            </span>
          </div>

          {/* Separator */}
          <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,.1)" }} />

          {/* Tournament info */}
          <div>
            {tournament.logo && (
              <img src={tournament.logo} alt="" style={{ width: "32px", height: "32px", objectFit: "contain", verticalAlign: "middle", marginRight: "10px" }} />
            )}
            <span style={{
              fontSize: "18px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "1px",
              verticalAlign: "middle",
            }}>
              {tournament.name}
            </span>
            <span style={{
              marginLeft: "10px", fontSize: "11px", padding: "3px 8px", borderRadius: "6px",
              background: `rgba(${statusColor === "#24ff7a" ? "36,255,122" : statusColor === "#facc15" ? "250,204,21" : "255,255,255"},.1)`,
              border: `1px solid ${statusColor}44`,
              color: statusColor, fontWeight: 600, verticalAlign: "middle",
            }}>
              {STATUS_LABELS[tournament.status]}
            </span>
          </div>
        </div>

        {/* Right: live indicator + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {tournament.status === "active" && <LivePulse />}
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,.22)" }}>
            Actualiza cada 60s · {lastRefresh.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>

      {/* ── Champion banner ── */}
      {champion && (
        <div style={{
          background: "linear-gradient(135deg, rgba(36,255,122,.12), rgba(36,255,122,.04))",
          borderBottom: "1px solid rgba(36,255,122,.2)",
          padding: "14px 40px",
          display: "flex", alignItems: "center", gap: "14px",
          boxShadow: "0 0 40px rgba(36,255,122,.1) inset",
        }}>
          <TrophyIcon size={22} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#24ff7a", letterSpacing: ".06em" }}>CAMPEÓN:</span>
          {champion.logo && <img src={champion.logo} alt="" style={{ width: "28px", height: "28px", objectFit: "contain" }} />}
          <span style={{ fontSize: "17px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: ".5px" }}>
            {champion.name}
          </span>
          {champion.abbr && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#24ff7a", opacity: .7 }}>({champion.abbr})</span>
          )}
        </div>
      )}

      {/* ── Main grid ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 340px",
        gap: "0", minHeight: "calc(100vh - 130px)",
      }}>

        {/* ── LEFT: Standings + Recent results ── */}
        <div style={{
          padding: "32px 36px",
          borderRight: "1px solid rgba(255,255,255,.06)",
          overflow: "auto",
        }}>
          {/* Standings */}
          {(tournament.format === "league" || tournament.format === "mixed") && table.length > 0 && (
            <section style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div style={{
                  width: "3px", height: "20px", borderRadius: "2px",
                  background: "#24ff7a", boxShadow: "0 0 10px #24ff7a",
                }} />
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.55)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  Tabla de posiciones
                </h2>
                <span style={{
                  padding: "2px 8px", borderRadius: "6px",
                  background: "rgba(36,255,122,.08)", border: "1px solid rgba(36,255,122,.2)",
                  fontSize: "10px", fontWeight: 600, color: "#24ff7a",
                }}>
                  {table.length} equipos
                </span>
              </div>
              <StandingsTable table={table} tournament={tournament} />
            </section>
          )}

          {/* Recent results */}
          {recent.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div style={{
                  width: "3px", height: "20px", borderRadius: "2px",
                  background: "rgba(54,230,255,.7)", boxShadow: "0 0 10px rgba(54,230,255,.5)",
                }} />
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.55)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  Resultados recientes
                </h2>
              </div>
              {recent.map(m => <MatchCard key={m._id} match={m} />)}
            </section>
          )}

          {table.length === 0 && recent.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: "80px", color: "rgba(255,255,255,.2)", fontSize: "14px" }}>
              <TrophyIcon size={40} />
              <p style={{ marginTop: "16px" }}>El torneo aún no tiene partidos disputados</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Upcoming matches + QR ── */}
        <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: "36px" }}>

          {/* Upcoming matches */}
          {upcoming.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div style={{
                  width: "3px", height: "20px", borderRadius: "2px",
                  background: "#facc15", boxShadow: "0 0 10px rgba(250,204,21,.5)",
                }} />
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.55)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                  Próximos partidos
                </h2>
              </div>
              {upcoming.map(m => <MatchCard key={m._id} match={m} upcoming />)}
            </section>
          )}

          {/* Stats summary */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "3px", height: "20px", borderRadius: "2px", background: "rgba(255,255,255,.3)" }} />
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.55)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                Stats
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "Equipos",  value: summary?.totalClubs ?? clubs?.length ?? 0 },
                { label: "Partidos", value: summary?.totalMatches ?? 0 },
                { label: "Jugados",  value: summary?.playedMatches ?? 0 },
                { label: "Goles",    value: summary?.totalGoals ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: "12px 14px", borderRadius: "10px",
                  background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
                  textAlign: "center",
                }}>
                  <p style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{value}</p>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: ".06em", textTransform: "uppercase", marginTop: "2px" }}>{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* QR */}
          <section style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: "16px" }}>
            <div style={{
              padding: "24px 20px", borderRadius: "20px",
              background: "rgba(36,255,122,.04)",
              border: "1px solid rgba(36,255,122,.18)",
              boxShadow: "0 0 40px rgba(36,255,122,.07)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "14px",
              width: "100%",
            }}>
              <div style={{ borderRadius: "12px", overflow: "hidden", background: "#fff", padding: "12px", boxShadow: "0 0 20px rgba(36,255,122,.2)" }}>
                <QRCodeSVG value={publicUrl} size={150} bgColor="#ffffff" fgColor="#04080e" level="M" />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: "4px" }}>
                  📱 Sigue el torneo
                </p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,.25)", fontFamily: "monospace" }}>
                  {publicUrl.replace("https://", "").replace("http://", "")}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,.05)",
        padding: "12px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(4,8,14,.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,.25)", letterSpacing: ".1em" }}>FC STATS PRO</span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,.15)" }}>·</span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,.2)" }}>
            {FORMAT_LABELS[tournament.format]} · Temporada {tournament.season}
          </span>
        </div>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,.15)" }}>fcstatspro.app</span>
      </div>
    </div>
  );
}
