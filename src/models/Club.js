const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del club es obligatorio"],
      trim: true,
      minlength: [2, "Debe tener al menos 2 caracteres"],
    },

    abbr: {
      type: String,
      required: [true, "La abreviación del club es obligatoria"],
      trim: true,
      uppercase: true,
      minlength: [2, "La abreviación debe tener al menos 2 caracteres"],
      maxlength: [5, "La abreviación no puede tener más de 5 caracteres"],
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
clubSchema.index({ createdBy: 1, abbr: 1 }, { unique: true });

module.exports = mongoose.model("Club", clubSchema);