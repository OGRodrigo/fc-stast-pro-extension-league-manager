const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del club es obligatorio"],
      trim: true,
      minlength: [2, "Debe tener al menos 2 caracteres"],
    },

    logo: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

clubSchema.index({ createdBy: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Club", clubSchema);