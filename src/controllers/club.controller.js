const Club = require("../models/Club");

/**
 * POST /clubs
 */
exports.createClub = async (req, res) => {
  try {
    const { name, country } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Nombre obligatorio.",
      });
    }

    const club = await Club.create({
      name,
      country,
      createdBy: req.admin._id,
    });

    res.status(201).json({
      message: "Club creado correctamente.",
      club,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe un club con ese nombre.",
      });
    }

    res.status(500).json({
      message: "Error creando club",
      error: error.message,
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
  const club = await Club.findOneAndUpdate(
    {
      _id: req.params.id,
      createdBy: req.admin._id,
    },
    req.body,
    { new: true }
  );

  if (!club) {
    return res.status(404).json({
      message: "Club no encontrado",
    });
  }

  res.json({ club });
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
      error: error.message,
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