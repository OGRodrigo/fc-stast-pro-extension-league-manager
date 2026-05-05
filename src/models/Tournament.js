const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del torneo/liga es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
    },

    type: {
      type: String,
      enum: ["league", "tournament"],
      required: [true, "El tipo es obligatorio"],
    },

    format: {
      type: String,
      enum: ["league", "cup", "mixed"],
      required: [true, "El formato es obligatorio"],
      default: "league",
    },

    season: {
      type: String,
      default: "2026",
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "active", "finished"],
      default: "draft",
    },

    maxClubs: {
      type: Number,
      required: [true, "La cantidad de equipos es obligatoria"],
      min: [2, "Debe haber al menos 2 equipos"],
    },

    hasPlayoffs: {
      type: Boolean,
      default: false,
    },

    playoffTeams: {
      type: Number,
      default: 0,
      min: [0, "La cantidad de clasificados no puede ser negativa"],
    },

    pointsConfig: {
      win: { type: Number, default: 3 },
      draw: { type: Number, default: 1 },
      loss: { type: Number, default: 0 },
    },

    clubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ],

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    logo: {
      type: String,
      default: "",
    },

    publicSlug: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => !v || /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(v),
        message: "El slug solo puede contener letras minúsculas, números y guiones.",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

tournamentSchema.index(
  { createdBy: 1, name: 1, season: 1 },
  { unique: true }
);

tournamentSchema.index({ publicSlug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Tournament", tournamentSchema);