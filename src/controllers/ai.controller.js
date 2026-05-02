// src/controllers/ai.controller.js
const Tournament = require("../models/Tournament");
const normalizeClubName = require("../utils/ai/normalizeClubName");
const classifyImages = require("../services/ai/imageClassifier.service");
const parseMatchImagesService = require("../services/ai/matchImageParser.service");
const mergeMatchImageResults = require("../services/ai/matchImageMerge.service");
const normalizeMatchDraft = require("../services/ai/matchDraftNormalizer.service");

const SCORE_MIN = () => Number(process.env.AI_SCORE_CONFIDENCE_MIN || 0.85);
const STATS_MIN = () => Number(process.env.AI_STATS_CONFIDENCE_MIN || 0.70);

function fuzzyMatchClub(ocrNorm, clubs) {
  if (!ocrNorm || !clubs.length) return null;
  return (
    clubs.find((c) => {
      const norm = normalizeClubName(c.name);
      return norm === ocrNorm || norm.includes(ocrNorm) || ocrNorm.includes(norm);
    }) ||
    // try abbreviation match
    clubs.find((c) => c.abbr && normalizeClubName(c.abbr) === ocrNorm) ||
    null
  );
}

function buildFieldConfidence(normalizedDraft) {
  const { matchDraft, confidence, conflicts = [] } = normalizedDraft;
  const stats = matchDraft?.stats || {};
  const scoreConf = confidence?.score || 0;
  const clubsConf = confidence?.clubs || 0;
  const statsConf = confidence?.stats || 0;
  const scoreMin = SCORE_MIN();
  const statsMin = STATS_MIN();

  const hasConflict = (prefix) =>
    conflicts.some((c) => String(c?.field || "").startsWith(prefix));

  const catConf = (extracted, conflictPrefix) => {
    if (!extracted) return 0;
    if (hasConflict(conflictPrefix)) return Math.max(statsConf * 0.7, 0.4);
    return Math.max(statsConf, statsMin);
  };

  return {
    scoreHome: {
      value: matchDraft.scoreHome,
      confidence: scoreConf,
      requiresValidation: matchDraft.scoreHome == null || scoreConf < scoreMin,
    },
    scoreAway: {
      value: matchDraft.scoreAway,
      confidence: scoreConf,
      requiresValidation: matchDraft.scoreAway == null || scoreConf < scoreMin,
    },
    homeClub: {
      value: matchDraft.homeClub?.name || null,
      confidence: clubsConf,
      requiresValidation: !matchDraft.homeClub?.name || clubsConf < scoreMin,
    },
    awayClub: {
      value: matchDraft.awayClub?.name || null,
      confidence: clubsConf,
      requiresValidation: !matchDraft.awayClub?.name || clubsConf < scoreMin,
    },
    possession: {
      extracted: stats.possessionHome != null,
      confidence: catConf(stats.possessionHome != null, "possession"),
      requiresValidation: stats.possessionHome == null,
    },
    shots: {
      extracted: stats.shotsHome != null,
      confidence: catConf(stats.shotsHome != null, "shots"),
      requiresValidation: stats.shotsHome == null,
    },
    passes: {
      extracted: stats.passesHome != null,
      confidence: catConf(stats.passesHome != null, "passes"),
      requiresValidation: stats.passesHome == null,
    },
  };
}

exports.parseMatchImages = async (req, res, next) => {
  try {
    const files = req.files || [];
    const { tournamentId, source = "ea_fc_match_screens" } = req.body || {};

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "Debes subir al menos una imagen en el campo 'images'.",
      });
    }

    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        message: "tournamentId es requerido.",
      });
    }

    const tournament = await Tournament.findOne({
      _id: tournamentId,
      createdBy: req.admin._id,
    }).populate("clubs", "name abbr logo");

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Torneo no encontrado.",
      });
    }

    const tournamentClubs = (tournament.clubs || []).map((c) => ({
      _id: c._id,
      name: c.name,
      abbr: c.abbr || null,
      logo: c.logo || null,
    }));

    // Run AI pipeline
    const classifiedImages = classifyImages(files);

    const parsedResults = await parseMatchImagesService({
      classifiedImages,
      meta: { source },
    });

    const mergedDraft = mergeMatchImageResults({ parsedResults, meta: { source } });

    const normalizedDraft = normalizeMatchDraft(mergedDraft, { source });

    const fieldConfidence = buildFieldConfidence(normalizedDraft);

    // Match OCR club names against tournament clubs
    const homeNorm = normalizedDraft.matchDraft?.homeClub?.normalizedName;
    const awayNorm = normalizedDraft.matchDraft?.awayClub?.normalizedName;

    const matchedHomeClub = fuzzyMatchClub(homeNorm, tournamentClubs);
    const matchedAwayClub = fuzzyMatchClub(awayNorm, tournamentClubs);

    return res.status(200).json({
      success: true,
      message: "Imágenes procesadas correctamente",
      ...normalizedDraft,
      fieldConfidence,
      tournamentClubs,
      matchedHomeClub: matchedHomeClub || null,
      matchedAwayClub: matchedAwayClub || null,
    });
  } catch (error) {
    console.error("[ai.controller] error:", error?.message);
    next(error);
  }
};
