// src/controllers/public.controller.js
const Tournament = require("../models/Tournament");
const Match = require("../models/Match");

function buildTable(clubs, matches, pointsConfig) {
  const tableMap = new Map();

  clubs.forEach((club) => {
    tableMap.set(club._id.toString(), {
      club: {
        id: club._id,
        name: club.name,
        abbr: club.abbr,
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

  matches
    .filter((m) => m.status === "played" && m.phase === "league")
    .forEach((match) => {
      const homeId = (match.homeClub?._id ?? match.homeClub).toString();
      const awayId = (match.awayClub?._id ?? match.awayClub).toString();
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

  return Array.from(tableMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.club.name.localeCompare(b.club.name);
  });
}

/**
 * GET /public/tournaments/:slug
 * Acceso público sin autenticación.
 * Solo devuelve torneos con visibility === "public".
 */
exports.getPublicTournament = async (req, res) => {
  try {
    const { slug } = req.params;

    const tournament = await Tournament.findOne({
      publicSlug: slug,
      visibility: "public",
    }).populate("clubs", "name abbr country logo");

    if (!tournament) {
      return res.status(404).json({
        message: "Torneo no encontrado o no disponible públicamente.",
      });
    }

    const pointsConfig = {
      win: tournament.pointsConfig?.win ?? 3,
      draw: tournament.pointsConfig?.draw ?? 1,
      loss: tournament.pointsConfig?.loss ?? 0,
    };

    const allMatches = await Match.find({ tournament: tournament._id })
      .populate("homeClub", "name abbr logo")
      .populate("awayClub", "name abbr logo")
      .sort({ date: -1 });

    const table = buildTable(tournament.clubs, allMatches, pointsConfig);

    const playedMatches = allMatches.filter((m) => m.status === "played").length;
    const totalMatches = allMatches.length;

    const playedLeagueRounds = new Set(
      allMatches
        .filter((m) => m.phase === "league" && m.status === "played")
        .map((m) => m.round)
    );
    const currentRound = playedLeagueRounds.size;

    const recentMatches = allMatches
      .filter((m) => m.status === "played")
      .slice(0, 5);

    return res.json({
      tournament: {
  id: tournament._id,
  name: tournament.name,
  season: tournament.season,
  type: tournament.type,
  format: tournament.format,
  status: tournament.status,
  maxClubs: tournament.maxClubs,
  hasPlayoffs: tournament.hasPlayoffs,
  playoffTeams: tournament.playoffTeams,
  pointsConfig,
  logo: tournament.logo,
  publicSlug: tournament.publicSlug,
  updatedAt: tournament.updatedAt,
},
      clubs: tournament.clubs,
      table,
      recentMatches,
      allMatches,
      summary: {
        totalClubs: tournament.clubs.length,
        playedMatches,
        totalMatches,
        currentRound,
        lastUpdated: tournament.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error obteniendo datos del torneo.",
    });
  }
};
