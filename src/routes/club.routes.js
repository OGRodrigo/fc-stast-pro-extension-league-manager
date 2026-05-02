const express = require("express");

const {
  createClub,
  getClubs,
  updateClub,
  getClubById,
  deleteClub,
} = require("../controllers/club.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/", createClub);
router.get("/", getClubs);
router.get("/:id", getClubById);
router.patch("/:id", updateClub);
router.delete("/:id", deleteClub);

module.exports = router;