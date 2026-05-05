// src/routes/public.routes.js
// Rutas públicas — NO usan protect, accesibles sin login.
const express = require("express");
const { getPublicTournament } = require("../controllers/public.controller");

const router = express.Router();

router.get("/tournaments/:slug", getPublicTournament);

module.exports = router;
