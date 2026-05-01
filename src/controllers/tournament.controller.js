const Tournament = require("../models/Tournament");
const Match = require("../models/Match");
const Club = require("../models/Club");

/**
 * POST /tournaments
 */
exports.createTournament = async (req, res) => {
  try {
    const { name, type, season, status, pointsConfig } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        message: "Nombre y tipo son obligatorios",
      });
    }

    const tournament = await Tournament.create({
      name,
      type,
      season,
      ...(status && { status }),
      ...(pointsConfig && { pointsConfig }),
      createdBy: req.admin._id,
    });

    res.status(201).json({ tournament });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Torneo duplicado",
      });
    }

    res.status(500).json({
      message: "Error creando torneo",
      error: error.message,
    });
  }
};

/**
 * GET /tournaments
 */
exports.getTournaments = async (req, res) => {
  const tournaments = await Tournament.find({
    createdBy: req.admin._id,
  });

  res.json({ tournaments });
};

/**
 * GET /tournaments/:id
 */
exports.getTournamentById = async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.admin._id,
  }).populate("clubs");

  if (!tournament) {
    return res.status(404).json({
      message: "Torneo no encontrado",
    });
  }

  res.json({ tournament });
};

/**
 * PATCH /tournaments/:id
 */
exports.updateTournament = async (req, res) => {
  const tournament = await Tournament.findOneAndUpdate(
    {
      _id: req.params.id,
      createdBy: req.admin._id,
    },
    req.body,
    { new: true }
  );

  if (!tournament) {
    return res.status(404).json({
      message: "Torneo no encontrado",
    });
  }

  res.json({ tournament });
};

/**
 * DELETE /tournaments/:id
 */
exports.deleteTournament = async (req, res) => {
  const tournament = await Tournament.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.admin._id,
  });

  if (!tournament) {
    return res.status(404).json({
      message: "Torneo no encontrado",
    });
  }

  await Match.deleteMany({ tournament: tournament._id });

  res.json({ message: "Torneo eliminado" });
};

/**
 * POST /tournaments/:tournamentId/clubs/:clubId
 */
exports.addClubToTournament = async (req, res) => {
  const { tournamentId, clubId } = req.params;

  const tournament = await Tournament.findOne({
    _id: tournamentId,
    createdBy: req.admin._id,
  });

  if (!tournament) {
    return res.status(404).json({
      message: "Torneo no encontrado",
    });
  }

  const club = await Club.findOne({
    _id: clubId,
    createdBy: req.admin._id,
  });

  if (!club) {
    return res.status(404).json({
      message: "Club no encontrado",
    });
  }

  const exists = tournament.clubs.some(
    (c) => c.toString() === clubId
  );

  if (exists) {
    return res.status(400).json({
      message: "El club ya está en el torneo",
    });
  }

  tournament.clubs.push(clubId);
  await tournament.save();

  res.json({ tournament });
};

/**
 * DELETE /tournaments/:tournamentId/clubs/:clubId
 */
exports.removeClubFromTournament = async (req, res) => {
  const { tournamentId, clubId } = req.params;

  const tournament = await Tournament.findOne({
    _id: tournamentId,
    createdBy: req.admin._id,
  });

  if (!tournament) {
    return res.status(404).json({
      message: "Torneo no encontrado",
    });
  }

  tournament.clubs = tournament.clubs.filter(
    (c) => c.toString() !== clubId
  );

  await tournament.save();

  res.json({ tournament });
};

/**
 * GET /tournaments/:tournamentId/clubs
 */
exports.getTournamentClubs = async (req, res) => {
  const { tournamentId } = req.params;

  const tournament = await Tournament.findOne({
    _id: tournamentId,
    createdBy: req.admin._id,
  }).populate("clubs");

  if (!tournament) {
    return res.status(404).json({
      message: "Torneo no encontrado",
    });
  }

  res.json({
    clubs: tournament.clubs,
  });
};