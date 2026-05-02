const express = require("express");

const {
  createTournament,
  getTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  addClubToTournament,
  removeClubFromTournament,
  getTournamentClubs,
} = require("../controllers/tournament.controller");

const { getTournamentTable } = require("../controllers/table.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/:tournamentId/table", getTournamentTable);

router.post("/:tournamentId/clubs/:clubId", addClubToTournament);
router.delete("/:tournamentId/clubs/:clubId", removeClubFromTournament);
router.get("/:tournamentId/clubs", getTournamentClubs);

router.post("/", createTournament);
router.get("/", getTournaments);
router.get("/:id", getTournamentById);
router.patch("/:id", updateTournament);
router.delete("/:id", deleteTournament);

module.exports = router;