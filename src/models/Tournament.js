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

module.exports = mongoose.model("Tournament", tournamentSchema);