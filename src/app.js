const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.routes");
const clubRoutes = require("./routes/club.routes");
const tournamentRoutes = require("./routes/tournament.routes");
const matchRoutes = require("./routes/match.routes");
const tableRoutes = require("./routes/table.routes");


const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    message: "FC Stats Pro League Manager API funcionando",
    status: "ok",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "fc-stats-pro-league-manager-api",
  });
});

app.use("/auth", authRoutes);
app.use("/tournaments", tournamentRoutes);
app.use("/matches", matchRoutes);
app.use("/table", tableRoutes);
app.use("/", clubRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Error global:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor",
  });
});

module.exports = app;
