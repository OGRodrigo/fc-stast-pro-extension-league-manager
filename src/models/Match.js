const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

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

    date: {
      type: Date,
      required: true,
    },

    stadium: {
      type: String,
      default: "",
      trim: true,
    },

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

    status: {
      type: String,
      enum: ["scheduled", "played"],
      default: "scheduled",
    },

    source: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
    },

    clubStats: {
      possessionHome: { type: Number, default: 0 },
      possessionAway: { type: Number, default: 0 },
      shotsHome: { type: Number, default: 0 },
      shotsAway: { type: Number, default: 0 },
      passesHome: { type: Number, default: 0 },
      passesAway: { type: Number, default: 0 },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

matchSchema.index({ tournament: 1, date: -1 });
matchSchema.index({ createdBy: 1 });

matchSchema.pre("validate", function () {
  if (
    this.homeClub &&
    this.awayClub &&
    this.homeClub.toString() === this.awayClub.toString()
  ) {
    this.invalidate("awayClub", "El club local y visitante no pueden ser iguales");
  }
});

module.exports = mongoose.model("Match", matchSchema);