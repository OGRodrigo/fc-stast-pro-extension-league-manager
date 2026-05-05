const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    // 🔗 Relación con torneo
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    // 🏟️ Equipos
    homeClub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },

    awayClub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },

    // 📅 Datos básicos
    date: {
      type: Date,
      required: true,
    },

    stadium: {
      type: String,
      default: "",
      trim: true,
    },

    // ⚽ Marcador
    scoreHome: {
      type: Number,
      default: 0,
      min: [0, "Los goles del local no pueden ser negativos"],
    },

    scoreAway: {
      type: Number,
      default: 0,
      min: [0, "Los goles del visitante no pueden ser negativos"],
    },

    // 📌 Estado del partido
    status: {
      type: String,
      enum: ["scheduled", "played"],
      default: "scheduled",
    },

    // 🤖 Origen del partido
    source: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
    },

    // 🧠 SISTEMA DE COMPETICIÓN
    round: {
      type: Number,
      default: 1,
      min: [1, "La ronda debe ser al menos 1"],
    },

    phase: {
      type: String,
      enum: ["league", "cup", "playoff"],
      default: "league",
    },

    order: {
      type: Number,
      default: 0,
      min: [0, "El orden no puede ser negativo"],
    },

    // 📊 Estadísticas del partido (club vs club)
    clubStats: {
      possessionHome:      { type: Number, default: 0 },
      possessionAway:      { type: Number, default: 0 },
      shotsHome:           { type: Number, default: 0 },
      shotsAway:           { type: Number, default: 0 },
      shotsOnTargetHome:   { type: Number, default: 0 },
      shotsOnTargetAway:   { type: Number, default: 0 },
      passesHome:          { type: Number, default: 0 },
      passesAway:          { type: Number, default: 0 },
      passesCompletedHome: { type: Number, default: 0 },
      passesCompletedAway: { type: Number, default: 0 },
      tacklesHome:         { type: Number, default: 0 },
      tacklesAway:         { type: Number, default: 0 },
      recoveriesHome:      { type: Number, default: 0 },
      recoveriesAway:      { type: Number, default: 0 },
      cornersHome:         { type: Number, default: 0 },
      cornersAway:         { type: Number, default: 0 },
      foulsHome:           { type: Number, default: 0 },
      foulsAway:           { type: Number, default: 0 },
      yellowCardsHome:     { type: Number, default: 0 },
      yellowCardsAway:     { type: Number, default: 0 },
      redCardsHome:        { type: Number, default: 0 },
      redCardsAway:        { type: Number, default: 0 },
    },

    // 👤 Admin que creó el partido
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//
// 📌 ÍNDICES (IMPORTANTE PARA PERFORMANCE)
//

// Para listado por torneo y orden cronológico
matchSchema.index({ tournament: 1, date: -1 });

// Para bracket y estructura de competición
matchSchema.index({ tournament: 1, phase: 1, round: 1, order: 1 });

// Para seguridad / queries por admin
matchSchema.index({ createdBy: 1 });

//
// 🔒 VALIDACIONES
//

matchSchema.pre("validate", function () {
  if (
    this.homeClub &&
    this.awayClub &&
    this.homeClub.toString() === this.awayClub.toString()
  ) {
    this.invalidate(
      "awayClub",
      "El club local y visitante no pueden ser iguales"
    );
  }
});

module.exports = mongoose.model("Match", matchSchema);