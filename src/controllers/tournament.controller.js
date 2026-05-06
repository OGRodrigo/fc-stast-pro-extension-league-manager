const Tournament = require("../models/Tournament");
const Match = require("../models/Match");
const Club = require("../models/Club");

/**
 * POST /tournaments
 */
exports.createTournament = async (req, res) => {
  try {
    const {
      name,
      type,
      format = "league",
      season,
      maxClubs,
      hasPlayoffs = false,
      playoffTeams = 0,
      pointsConfig,
    } = req.body;

    if (!name || !type || !maxClubs) {
      return res.status(400).json({
        message: "name, type y maxClubs son obligatorios.",
      });
    }

    if (!["league", "tournament"].includes(type)) {
      return res.status(400).json({
        message: "Tipo inválido. Usa 'league' o 'tournament'.",
      });
    }

    if (!["league", "cup", "mixed"].includes(format)) {
      return res.status(400).json({
        message: "Formato inválido. Usa 'league', 'cup' o 'mixed'.",
      });
    }

    if (Number(maxClubs) < 2) {
      return res.status(400).json({
        message: "Debe haber al menos 2 equipos.",
      });
    }

    if (hasPlayoffs && Number(playoffTeams) < 2) {
      return res.status(400).json({
        message: "Si hay playoffs, deben clasificar al menos 2 equipos.",
      });
    }

    if (hasPlayoffs && Number(playoffTeams) > Number(maxClubs)) {
      return res.status(400).json({
        message: "Los equipos de playoffs no pueden superar el máximo de equipos.",
      });
    }

    const tournament = await Tournament.create({
      name,
      type,
      format,
      season: season || "2026",
      maxClubs,
      hasPlayoffs,
      playoffTeams,
      pointsConfig: {
        win: pointsConfig?.win ?? 3,
        draw: pointsConfig?.draw ?? 1,
        loss: pointsConfig?.loss ?? 0,
      },
      createdBy: req.admin._id,
    });

    return res.status(201).json({
      message: "Torneo/liga creado correctamente.",
      tournament,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe un torneo/liga con ese nombre y temporada.",
      });
    }

    return res.status(500).json({
      message: "Error creando torneo/liga.",
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
  const ALLOWED_FIELDS = [
    "name",
    "season",
    "status",
    "visibility",
    "format",
    "maxClubs",
    "hasPlayoffs",
    "playoffTeams",
    "pointsConfig",
    "description",
    "logoUrl",
    "publicSlug",
  ];

  const update = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in req.body) {
      update[field] = req.body[field];
    }
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No hay campos válidos para actualizar." });
  }

  const tournament = await Tournament.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.admin._id },
    update,
    { new: true, runValidators: true }
  );

  if (!tournament) {
    return res.status(404).json({ message: "Torneo no encontrado" });
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

if (tournament.clubs.length >= tournament.maxClubs) {
  return res.status(400).json({
    message: "El torneo ya alcanzó el máximo de equipos.",
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