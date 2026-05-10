const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const clubRoutes = require("./routes/club.routes");
const tournamentRoutes = require("./routes/tournament.routes");
const matchRoutes = require("./routes/match.routes");
const aiRoutes = require("./routes/ai.routes");
const publicRoutes = require("./routes/public.routes");
const Tournament = require("./models/Tournament");
const {
  generalLimiter,
  authLimiter,
  aiLimiter,
} = require("./middlewares/rateLimiter");

const app = express();

// ── Seguridad HTTP headers ──────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://fcstatspro.com",
  "https://www.fcstatspro.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS bloqueado:", origin);

      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  })
);

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(generalLimiter);

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Health ──────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "FC Stats Pro League Manager API", status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "fc-stats-pro-league-manager-api" });
});

// ── OG tag middleware (bots) ─────────────────────────────────────────────────
const BOT_UA = /discordbot|whatsapp|telegrambot|twitterbot|slackbot|facebot|linkedinbot|googlebot/i;

const FORMAT_LABELS = { league: "Liga", cup: "Copa", mixed: "Liga + Playoffs" };

app.get("/public/tournaments/:slug", async (req, res, next) => {
  if (!BOT_UA.test(req.headers["user-agent"] || "")) return next();
  try {
    const t = await Tournament.findOne({ publicSlug: req.params.slug, visibility: "public" });
    if (!t) return next();
    const origin = `${req.protocol}://${req.get("host")}`;
    const url  = `${origin}/public/tournaments/${t.publicSlug}`;
    const desc = `${FORMAT_LABELS[t.format] ?? t.format} · Temporada ${t.season} · Sigue tabla, bracket y resultados en tiempo real`;
    const safeTitle = t.name.replace(/"/g, "&quot;");
    const safeDesc  = desc.replace(/"/g, "&quot;");
    res.set("Content-Type", "text/html; charset=utf-8").send(`<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8">
<title>${safeTitle} — FC Stats Pro</title>
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
${t.logo ? `<meta property="og:image" content="${t.logo}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
${t.logo ? `<meta name="twitter:image" content="${t.logo}">` : ""}
<meta http-equiv="refresh" content="0;url=${url}">
</head><body></body></html>`);
  } catch { next(); }
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/auth", authLimiter, authRoutes);
app.use("/clubs", clubRoutes);
app.use("/tournaments", tournamentRoutes);
app.use("/ai", aiLimiter, aiRoutes);
app.use("/public", publicRoutes);
app.use("/", matchRoutes);

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd || status >= 500) {
    console.error("❌ Error:", err.message);
  }

  res.status(status).json({
    message: status < 500 ? err.message : "Error interno del servidor",
  });
});

module.exports = app;
