const express = require("express");

const {
  createMatch,
  getTournamentMatches,
  getMatchById,
  updateMatch,
  getMatchesByTournament,
  deleteMatch,
} = require("../controllers/match.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/tournaments/:tournamentId/matches", createMatch);
router.get("/tournaments/:tournamentId/matches", getTournamentMatches);

router.get("/matches/:id", getMatchById);
router.patch("/matches/:id", updateMatch);
router.delete("/matches/:id", deleteMatch);

module.exports = router;