const Match = require("../models/Match");
const Tournament = require("../models/Tournament");

function isClubInTournament(tournament, clubId) {
  return tournament.clubs.some((club) => club.toString() === clubId.toString());
}

function normalizeScore(value, defaultValue = 0) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return Number(value);
}

async function findOwnedTournament(tournamentId, adminId) {
  return Tournament.findOne({
    _id: tournamentId,
    createdBy: adminId,
  });
}

/**
 * POST /tournaments/:tournamentId/matches
 * Crea un partido dentro de un torneo.
 */
exports.createMatch = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const {
      homeClub,
      awayClub,
      date,
      stadium,
      scoreHome,
      scoreAway,
      status,
      source,
      clubStats,
      phase,
      round,
      order,
    } = req.body;

    if (!homeClub || !awayClub || !date) {
      return res.status(400).json({
        message: "homeClub, awayClub y date son obligatorios.",
      });
    }

    if (homeClub === awayClub) {
      return res.status(400).json({
        message: "El club local y visitante no pueden ser iguales.",
      });
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Fecha inválida.",
      });
    }

    const tournament = await findOwnedTournament(tournamentId, req.admin._id);

    if (!tournament) {
      return res.status(404).json({
        message: "Torneo no encontrado.",
      });
    }

    if (!isClubInTournament(tournament, homeClub)) {
      return res.status(400).json({
        message: "El club local no pertenece al torneo.",
      });
    }

    if (!isClubInTournament(tournament, awayClub)) {
      return res.status(400).json({
        message: "El club visitante no pertenece al torneo.",
      });
    }

    const finalScoreHome = normalizeScore(scoreHome, 0);
    const finalScoreAway = normalizeScore(scoreAway, 0);

    if (finalScoreHome < 0 || finalScoreAway < 0) {
      return res.status(400).json({
        message: "Los goles no pueden ser negativos.",
      });
    }

    const match = await Match.create({
      tournament: tournamentId,
      homeClub,
      awayClub,
      date: parsedDate,
      stadium,
      scoreHome: finalScoreHome,
      scoreAway: finalScoreAway,
      status: status || "scheduled",
      source: source || "manual",
      clubStats: clubStats || {},
      phase: phase || "league",
      round: round ?? 1,
      order: order ?? 0,
      createdBy: req.admin._id,
    });

    const populatedMatch = await Match.findById(match._id)
      .populate("homeClub")
      .populate("awayClub")
      .populate("tournament");

    return res.status(201).json({
      message: "Partido creado correctamente.",
      match: populatedMatch,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creando partido.",
      error: error.message,
    });
  }
};

/**
 * GET /tournaments/:tournamentId/matches
 * Lista partidos de un torneo.
 */
exports.getTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await findOwnedTournament(tournamentId, req.admin._id);

    if (!tournament) {
      return res.status(404).json({
        message: "Torneo no encontrado.",
      });
    }

    const matches = await Match.find({
      tournament: tournamentId,
      createdBy: req.admin._id,
    })
      .populate("homeClub")
      .populate("awayClub")
      .sort({ date: -1 });

    return res.json({
      count: matches.length,
      matches,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error obteniendo partidos.",
      error: error.message,
    });
  }
};

/**
 * GET /matches/:id
 * Obtiene un partido por ID.
 */
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.tournamentId,
      createdBy: req.admin._id,
    })
      .populate("homeClub")
      .populate("awayClub")
      .populate("tournament");

    if (!match) {
      return res.status(404).json({
        message: "Partido no encontrado.",
      });
    }

    return res.json({
      match,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error obteniendo partido.",
      error: error.message,
    });
  }
};

/**
 * PATCH /matches/:id
 * Actualiza un partido.
 */
exports.updateMatch = async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.tournamentId,
      createdBy: req.admin._id,
    });

    if (!match) {
      return res.status(404).json({
        message: "Partido no encontrado.",
      });
    }

    const tournament = await findOwnedTournament(match.tournament, req.admin._id);

    if (!tournament) {
      return res.status(404).json({
        message: "Torneo del partido no encontrado.",
      });
    }

    const allowedFields = [
      "homeClub",
      "awayClub",
      "date",
      "stadium",
      "scoreHome",
      "scoreAway",
      "status",
      "source",
      "clubStats",
      "phase",
      "round",
      "order",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        match[field] = req.body[field];
      }
    });

    if (match.homeClub.toString() === match.awayClub.toString()) {
      return res.status(400).json({
        message: "El club local y visitante no pueden ser iguales.",
      });
    }

    if (!isClubInTournament(tournament, match.homeClub)) {
      return res.status(400).json({
        message: "El club local no pertenece al torneo.",
      });
    }

    if (!isClubInTournament(tournament, match.awayClub)) {
      return res.status(400).json({
        message: "El club visitante no pertenece al torneo.",
      });
    }

    if (match.scoreHome < 0 || match.scoreAway < 0) {
      return res.status(400).json({
        message: "Los goles no pueden ser negativos.",
      });
    }

    if (match.date) {
      const parsedDate = new Date(match.date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Fecha inválida.",
        });
      }

      match.date = parsedDate;
    }

    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate("homeClub")
      .populate("awayClub")
      .populate("tournament");

    return res.json({
      message: "Partido actualizado correctamente.",
      match: populatedMatch,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error actualizando partido.",
      error: error.message,
    });
  }
};

/**
 * GET /tournaments/:id/matches
 * Obtener todos los partidos de un torneo
 */
exports.getMatchesByTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const matches = await Match.find({
      tournament: tournamentId,
      createdBy: req.admin._id,
    })
      .populate("homeClub", "name abbr logo")
      .populate("awayClub", "name abbr logo")
      .sort({ date: 1 });

    return res.json({
      matches,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error obteniendo partidos del torneo",
      error: error.message,
    });
  }
};


/**
 * DELETE /matches/:id
 * Elimina un partido.
 */
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.admin._id,
    });

    if (!match) {
      return res.status(404).json({
        message: "Partido no encontrado.",
      });
    }

    return res.json({
      message: "Partido eliminado correctamente.",
      matchId: match._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error eliminando partido.",
      error: error.message,
    });
  }
};