const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const clubRoutes = require("./routes/club.routes");
const tournamentRoutes = require("./routes/tournament.routes");
const matchRoutes = require("./routes/match.routes");
const aiRoutes = require("./routes/ai.routes");
const publicRoutes = require("./routes/public.routes");

const app = express();

// ── Seguridad HTTP headers ──────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  })
);

// ── Rate limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta más tarde." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de autenticación. Intenta más tarde." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Límite de análisis de imágenes alcanzado. Espera un momento." },
});

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
