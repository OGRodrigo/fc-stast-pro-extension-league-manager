const Club = require("../models/Club");

/**
 * POST /clubs
 */
exports.createClub = async (req, res) => {
  try {
    const { name, abbr, country, logo } = req.body;

    if (!name || !abbr) {
      return res.status(400).json({
        message: "Nombre y abreviación son obligatorios.",
      });
    }

    const club = await Club.create({
      name,
      abbr,
      country,
      logo,
      createdBy: req.admin._id,
    });

    return res.status(201).json({
      message: "Club creado correctamente.",
      club,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe un club con ese nombre o abreviación.",
      });
    }

    return res.status(500).json({
      message: "Error creando club",
    });
  }
};

/**
 * GET /clubs
 */
exports.getClubs = async (req, res) => {
  const clubs = await Club.find({
    createdBy: req.admin._id,
  }).sort({ name: 1 });

  res.json({ clubs });
};

/**
 * PATCH /clubs/:id
 */
exports.updateClub = async (req, res) => {
  try {
    const updates = {};

    ["name", "abbr", "country", "logo"].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const club = await Club.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.admin._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!club) {
      return res.status(404).json({
        message: "Club no encontrado",
      });
    }

    return res.json({
      message: "Club actualizado correctamente.",
      club,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe un club con ese nombre o abreviación.",
      });
    }

    return res.status(500).json({
      message: "Error actualizando club",
    });
  }
};

/**
 * GET /clubs/:id
 * Obtiene un club global del administrador autenticado.
 */
exports.getClubById = async (req, res) => {
  try {
    const club = await Club.findOne({
      _id: req.params.id,
      createdBy: req.admin._id,
    });

    if (!club) {
      return res.status(404).json({
        message: "Club no encontrado",
      });
    }

    return res.json({
      club,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error obteniendo club",
    });
  }
};

/**
 * DELETE /clubs/:id
 */
exports.deleteClub = async (req, res) => {
  const club = await Club.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.admin._id,
  });

  if (!club) {
    return res.status(404).json({
      message: "Club no encontrado",
    });
  }

  res.json({
    message: "Club eliminado",
  });
};