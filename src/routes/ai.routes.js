const express = require("express");
const { parseMatchImages } = require("../controllers/ai.controller");
const uploadMatchImages = require("../middlewares/uploadMatchImages");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /ai/parse-match-images
// multipart/form-data: images[] (files), tournamentId (string)
router.post(
  "/parse-match-images",
  protect,
  uploadMatchImages.array("images", 10),
  parseMatchImages
);

module.exports = router;
