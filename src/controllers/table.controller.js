const Tournament = require("../models/Tournament");
const Match = require("../models/Match");

/**
 * GET /tournaments/:tournamentId/table
 *
 * Calcula tabla de posiciones desde los partidos jugados.
 * Solo considera partidos con status = "played".
 */
exports.getTournamentTable = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findOne({
      _id: tournamentId,
      createdBy: req.admin._id,
    }).populate("clubs");

    if (!tournament) {
      return res.status(404).json({
        message: "Torneo no encontrado.",
      });
    }

    const pointsConfig = {
      win: tournament.pointsConfig?.win ?? 3,
      draw: tournament.pointsConfig?.draw ?? 1,
      loss: tournament.pointsConfig?.loss ?? 0,
    };

    const tableMap = new Map();

    tournament.clubs.forEach((club) => {
      tableMap.set(club._id.toString(), {
        club: {
          id: club._id,
          name: club.name,
          country: club.country,
          logo: club.logo,
        },
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    });

    const matches = await Match.find({
      tournament: tournamentId,
      createdBy: req.admin._id,
      status: "played",
    });

    matches.forEach((match) => {
      const homeId = match.homeClub.toString();
      const awayId = match.awayClub.toString();

      const homeRow = tableMap.get(homeId);
      const awayRow = tableMap.get(awayId);

      if (!homeRow || !awayRow) return;

      homeRow.played += 1;
      awayRow.played += 1;

      homeRow.goalsFor += match.scoreHome;
      homeRow.goalsAgainst += match.scoreAway;

      awayRow.goalsFor += match.scoreAway;
      awayRow.goalsAgainst += match.scoreHome;

      if (match.scoreHome > match.scoreAway) {
        homeRow.wins += 1;
        awayRow.losses += 1;

        homeRow.points += pointsConfig.win;
        awayRow.points += pointsConfig.loss;
      } else if (match.scoreHome < match.scoreAway) {
        awayRow.wins += 1;
        homeRow.losses += 1;

        awayRow.points += pointsConfig.win;
        homeRow.points += pointsConfig.loss;
      } else {
        homeRow.draws += 1;
        awayRow.draws += 1;

        homeRow.points += pointsConfig.draw;
        awayRow.points += pointsConfig.draw;
      }

      homeRow.goalDifference = homeRow.goalsFor - homeRow.goalsAgainst;
      awayRow.goalDifference = awayRow.goalsFor - awayRow.goalsAgainst;
    });

    const table = Array.from(tableMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.club.name.localeCompare(b.club.name);
    });

    return res.json({
      tournament: {
        id: tournament._id,
        name: tournament.name,
        type: tournament.type,
        season: tournament.season,
        status: tournament.status,
      },
      table,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error calculando tabla de posiciones.",
      error: error.message,
    });
  }
};