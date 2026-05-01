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

router.post("/clubs", createClub);
router.get("/clubs", getClubs);
router.get("/clubs/:id", getClubById);
router.patch("/clubs/:id", updateClub);
router.delete("/clubs/:id", deleteClub);

module.exports = router;