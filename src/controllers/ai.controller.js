// src/controllers/ai.controller.js
const Tournament = require("../models/Tournament");

const normalizeClubName = require("../utils/ai/normalizeClubName");
const classifyImages = require("../services/ai/imageClassifier.service");
const parseMatchImagesService = require("../services/ai/matchImageParser.service");
const mergeMatchImageResults = require("../services/ai/matchImageMerge.service");
const normalizeMatchDraft = require("../services/ai/matchDraftNormalizer.service");
const { matchClubName } = require("../services/ai/clubMatcher.service");

const SCORE_MIN = () => Number(process.env.AI_SCORE_CONFIDENCE_MIN || 0.85);
const STATS_MIN = () => Number(process.env.AI_STATS_CONFIDENCE_MIN || 0.7);

/**
 * Busca club por nombre normalizado o abreviación.
 * Fallback por si el matcher principal no encuentra algo.
 */
function fuzzyMatchClub(ocrNorm, clubs) {
  if (!ocrNorm || !clubs.length) return null;

  return (
    clubs.find((club) => {
      const norm = normalizeClubName(club.name);
      return norm === ocrNorm || norm.includes(ocrNorm) || ocrNorm.includes(norm);
    }) ||
    clubs.find(
      (club) => club.abbr && normalizeClubName(club.abbr) === ocrNorm
    ) ||
    null
  );
}

/**
 * Extrae nombres de clubes desde OCR.
 *
 * Caso esperado EA FC:
 * Bullamotics
 * 2: 3
 * KKTeam
 */
function extractClubNamesFromOCR(parsedResults = []) {
  const texts = [];

  for (const result of parsedResults) {
    if (typeof result?.ocrText === "string") texts.push(result.ocrText);
    if (typeof result?.ocrPreview === "string") texts.push(result.ocrPreview);
    if (typeof result?.text === "string") texts.push(result.text);
    if (typeof result?.fullText === "string") texts.push(result.fullText);
    if (typeof result?.ocr?.text === "string") texts.push(result.ocr.text);
    if (typeof result?.ocr?.fullText === "string") texts.push(result.ocr.fullText);
  }

  for (const text of texts) {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (let i = 0; i < lines.length - 2; i++) {
      const possibleHome = lines[i];
      const possibleScore = lines[i + 1];
      const possibleAway = lines[i + 2];

      const isScoreLine = /^\d+\s*[:\-]\s*\d+$/.test(possibleScore);

      if (isScoreLine) {
        return {
          home: possibleHome,
          away: possibleAway,
        };
      }
    }
  }

  return {
    home: null,
    away: null,
  };
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
    conflicts.some((conflict) =>
      String(conflict?.field || "").startsWith(prefix)
    );

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

    const tournamentClubs = (tournament.clubs || []).map((club) => ({
      _id: club._id,
      name: club.name,
      abbr: club.abbr || null,
      logo: club.logo || null,
    }));

    console.log("AZURE CONFIG:", {
      endpoint: process.env.AZURE_VISION_ENDPOINT,
      key: process.env.AZURE_VISION_KEY ? "OK" : "MISSING",
    });

    // 1. Clasificar imágenes
    const classifiedImages = classifyImages(files);

    // 2. Parsear imágenes/OCR
    const parsedResults = await parseMatchImagesService({
      classifiedImages,
      meta: { source },
    });

    // 3. Fusionar resultados
    const mergedDraft = mergeMatchImageResults({
      parsedResults,
      meta: { source },
    });

    // 4. Normalizar draft
    const normalizedDraft = normalizeMatchDraft(mergedDraft, { source });
    const matchDraft = normalizedDraft.matchDraft;

    // 5. Extraer clubes desde OCR directamente
    const extractedNames = extractClubNamesFromOCR(parsedResults);

    const detectedHomeName =
      matchDraft.homeClub?.name || extractedNames.home || null;

    const detectedAwayName =
      matchDraft.awayClub?.name || extractedNames.away || null;

    console.log("OCR CLUBS DETECTED:", {
      detectedHomeName,
      detectedAwayName,
    });

    // 6. Matching inteligente contra clubes del torneo
    const homeCandidate = matchClubName(detectedHomeName, tournamentClubs);
    const awayCandidate = matchClubName(detectedAwayName, tournamentClubs);

    if (homeCandidate) {
      matchDraft.homeClub = {
        id: homeCandidate.club._id,
        name: homeCandidate.club.name,
        confidence: homeCandidate.confidence,
      };

      normalizedDraft.matchedHomeClub = homeCandidate.club;
    }

    if (awayCandidate) {
      matchDraft.awayClub = {
        id: awayCandidate.club._id,
        name: awayCandidate.club.name,
        confidence: awayCandidate.confidence,
      };

      normalizedDraft.matchedAwayClub = awayCandidate.club;
    }

    // 7. Fallback por normalizedName si aún falta alguno
    const homeNorm =
      matchDraft.homeClub?.normalizedName || normalizeClubName(detectedHomeName || "");

    const awayNorm =
      matchDraft.awayClub?.normalizedName || normalizeClubName(detectedAwayName || "");

    const fallbackHomeClub =
      normalizedDraft.matchedHomeClub || fuzzyMatchClub(homeNorm, tournamentClubs);

    const fallbackAwayClub =
      normalizedDraft.matchedAwayClub || fuzzyMatchClub(awayNorm, tournamentClubs);

    if (!normalizedDraft.matchedHomeClub && fallbackHomeClub) {
      normalizedDraft.matchedHomeClub = fallbackHomeClub;

      matchDraft.homeClub = {
        id: fallbackHomeClub._id,
        name: fallbackHomeClub.name,
        confidence: 0.85,
      };
    }

    if (!normalizedDraft.matchedAwayClub && fallbackAwayClub) {
      normalizedDraft.matchedAwayClub = fallbackAwayClub;

      matchDraft.awayClub = {
        id: fallbackAwayClub._id,
        name: fallbackAwayClub.name,
        confidence: 0.85,
      };
    }

    // 8. Recalcular confianza de clubes
    const homeClubConfidence = matchDraft.homeClub?.confidence || 0;
    const awayClubConfidence = matchDraft.awayClub?.confidence || 0;

    if (normalizedDraft.matchedHomeClub && normalizedDraft.matchedAwayClub) {
      normalizedDraft.confidence = {
        ...(normalizedDraft.confidence || {}),
        clubs: Math.min(homeClubConfidence, awayClubConfidence) || 0.85,
      };

      normalizedDraft.missingFields = (normalizedDraft.missingFields || []).filter(
        (field) => field !== "homeClub.name" && field !== "awayClub.name"
      );
    }

    // 9. Estado sugerido
    if (matchDraft.scoreHome != null && matchDraft.scoreAway != null) {
      matchDraft.status = "played";
    }

    const fieldConfidence = buildFieldConfidence(normalizedDraft);

    return res.status(200).json({
      success: true,
      message: "Imágenes procesadas correctamente",
      ...normalizedDraft,
      fieldConfidence,
      tournamentClubs,
      matchedHomeClub: normalizedDraft.matchedHomeClub || null,
      matchedAwayClub: normalizedDraft.matchedAwayClub || null,
    });
  } catch (error) {
    console.error("[ai.controller] error:", error?.message);
    next(error);
  }
};