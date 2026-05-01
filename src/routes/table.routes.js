const express = require("express");

const {
  getTournamentTable,
} = require("../controllers/table.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/tournaments/:tournamentId/table", getTournamentTable);

module.exports = router;