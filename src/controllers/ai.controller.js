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

// Words that appear in OCR but are never club names
const GENERIC_WORDS = new Set([
  "stats", "match", "resumen", "posesion", "posesión", "tiros", "pases",
  "defensa", "eventos", "total", "overview", "summary", "statistics",
  "goals", "goles", "shots", "passes", "possession", "defense", "general",
  "final", "ft", "full time", "half time", "ht", "tiempo", "minuto",
  "league", "cup", "tournament", "champion", "liga", "copa",
  "round", "phase", "jornada", "ronda", "amenaza", "bloqueos",
]);

function isGenericWord(text = "") {
  const lower = String(text).toLowerCase().trim();
  return (
    GENERIC_WORDS.has(lower) ||
    /^\d+$/.test(lower) ||
    /^\d{1,3}%$/.test(lower) ||
    /^\d{1,2}:\d{2}$/.test(lower) ||
    /^\d{1,2}\s*[:\-–]\s*\d{1,2}$/.test(lower)
  );
}

function extractClubCandidate(text = "") {
  let cleaned = String(text)
    .replace(/[|[\]{}()<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Cut off at stats section keywords
  const sectionPattern =
    /\b(resumen|posesi[oó]n|tiros|pases|defens[ae]|eventos|statistics|stats|overview|summary)\b/i;
  const sm = cleaned.match(sectionPattern);
  if (sm) cleaned = cleaned.slice(0, sm.index).trim();
  // Remove trailing punctuation
  cleaned = cleaned.replace(/[-–—\s]+$/, "").trim();
  if (!cleaned || cleaned.length < 2 || /^\d+$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Extracts club names from OCR results using three strategies:
 * 1. AI-parsed names already extracted by parseSingleImage
 * 2. Heuristic "Club / Score-line / Club" pattern in OCR text
 * 3. Match every non-trivial OCR line against tournament clubs list
 */
function extractClubNamesFromOCR(parsedResults = [], tournamentClubs = []) {
  // 1. Use names the AI (OpenAI) already identified
  const aiHome =
    parsedResults.map((r) => r?.partialDraft?.homeClub?.name).find(Boolean) ||
    null;
  const aiAway =
    parsedResults.map((r) => r?.partialDraft?.awayClub?.name).find(Boolean) ||
    null;
  if (aiHome && aiAway) return { home: aiHome, away: aiAway };

  // 2. Heuristic: look for "Club\nX:Y\nClub" or "Club\nX-Y\nClub" pattern
  const ocrTexts = parsedResults
    .map((r) => r?.sourceImage?.ocrPreview || "")
    .filter(Boolean);

  for (const text of ocrTexts) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    for (let i = 0; i + 2 < lines.length; i++) {
      const scoreLine = lines[i + 1];
      if (/^\d{1,2}\s*[:\-–]\s*\d{1,2}$/.test(scoreLine)) {
        const home = extractClubCandidate(lines[i]);
        const away = extractClubCandidate(lines[i + 2]);
        if (home && away && !isGenericWord(home) && !isGenericWord(away)) {
          return { home, away };
        }
      }
    }
  }

  // 3. Aggressive: try every non-trivial OCR line against tournament club list
  if (tournamentClubs.length > 0) {
    const allLines = new Set();
    for (const text of ocrTexts) {
      text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && l.length >= 2 && l.length <= 40 && !isGenericWord(l))
        .forEach((l) => allLines.add(l));
    }

    const candidates = [];
    for (const line of allLines) {
      const m = matchClubName(line, tournamentClubs);
      if (m && m.confidence >= 0.5) {
        candidates.push(m);
      }
    }

    // Deduplicate by club id, sorted by confidence
    const seen = new Set();
    const unique = candidates
      .sort((a, b) => b.confidence - a.confidence)
      .filter((m) => {
        const id = String(m.club._id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

    if (unique.length >= 2) {
      return { home: unique[0].club.name, away: unique[1].club.name };
    }
    if (unique.length === 1) {
      const other = (aiHome !== unique[0].club.name ? aiHome : null) || aiAway;
      return { home: unique[0].club.name, away: other || null };
    }
  }

  return { home: aiHome, away: aiAway };
}

function fuzzyMatchClub(ocrNorm, clubs) {
  if (!ocrNorm || !clubs.length) return null;
  return (
    clubs.find((club) => {
      const norm = normalizeClubName(club.name);
      return norm === ocrNorm || norm.includes(ocrNorm) || ocrNorm.includes(norm);
    }) ||
    clubs.find((club) => club.abbr && normalizeClubName(club.abbr) === ocrNorm) ||
    null
  );
}

// Confidence levels by source screen type
const SCREEN_CONF = {
  possession_screen:     0.90,
  shots_screen:          0.90,
  passes_screen:         0.90,
  defense_screen:        0.85,
  events_screen:         0.85,
  final_overview_screen: 0.72,
  scoreboard_summary:    0.65,
};

function buildFieldConfidence(normalizedDraft) {
  const { matchDraft, confidence, conflicts = [], statSources = {} } = normalizedDraft;

  const stats = matchDraft?.stats || {};
  const scoreConf = confidence?.score || 0;
  const clubsConf = confidence?.clubs || 0;
  const statsConf = confidence?.stats || 0;
  const scoreMin = SCORE_MIN();

  const hasConflict = (prefix) =>
    conflicts.some((c) => String(c?.field || "").startsWith(prefix));

  function statFamilyConf(homeKey, awayKey, conflictPrefix) {
    const homeVal = stats[homeKey];
    const awayVal = stats[awayKey];

    if (homeVal == null && awayVal == null) {
      return { extracted: false, confidence: 0, requiresValidation: true };
    }

    if (hasConflict(conflictPrefix)) {
      return { extracted: true, confidence: 0.5, requiresValidation: true };
    }

    const source = statSources[homeKey] || statSources[awayKey] || null;
    const baseConf = source
      ? (SCREEN_CONF[source] ?? Math.max(statsConf, 0.5))
      : Math.max(statsConf, 0.5);

    // Partial pair (only one side detected): cap at 0.65 and flag for validation
    const isPartial = (homeVal == null) !== (awayVal == null);
    const effectiveConf = isPartial ? Math.min(baseConf, 0.65) : baseConf;

    return {
      extracted: true,
      confidence: Number(effectiveConf.toFixed(3)),
      requiresValidation: effectiveConf < 0.7,
    };
  }

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
    possession:      statFamilyConf("possessionHome",    "possessionAway",    "possession"),
    shots:           statFamilyConf("shotsHome",          "shotsAway",          "shots"),
    shotsOnTarget:   statFamilyConf("shotsOnTargetHome",  "shotsOnTargetAway",  "shotsOnTarget"),
    passes:          statFamilyConf("passesHome",          "passesAway",          "passes"),
    passesCompleted: statFamilyConf("passesCompletedHome", "passesCompletedAway", "passesCompleted"),
    tackles:         statFamilyConf("tacklesHome",         "tacklesAway",         "tackles"),
    recoveries:      statFamilyConf("recoveriesHome",      "recoveriesAway",      "recoveries"),
    corners:         statFamilyConf("cornersHome",         "cornersAway",         "corners"),
    fouls:           statFamilyConf("foulsHome",           "foulsAway",           "fouls"),
    yellowCards:     statFamilyConf("yellowCardsHome",     "yellowCardsAway",     "yellowCards"),
    redCards:        statFamilyConf("redCardsHome",        "redCardsAway",        "redCards"),
  };
}

exports.parseMatchImages = async (req, res, next) => {
  try {
    const t_req = Date.now();
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

    console.log("[ai] Azure config:", {
      endpoint: process.env.AZURE_VISION_ENDPOINT,
      key: process.env.AZURE_VISION_KEY ? "OK" : "MISSING",
    });

    // 1. Classify images
    const classifiedImages = classifyImages(files);

    // 2. Parse OCR — pass tournament clubs so OpenAI can match them
    const t_parse = Date.now();
    const parsedResults = await parseMatchImagesService({
      classifiedImages,
      meta: { source },
      tournamentClubs,
    });
    console.log(`[ai] parseMatchImages: ${Date.now() - t_parse}ms (${files.length} img)`);
    const openAIUsed = parsedResults.filter((r) => r?.notes?.some((n) => String(n).startsWith("OpenAI usado"))).length;
    console.log(`[ai] OpenAI llamado para ${openAIUsed}/${files.length} imágenes`);

    // 3. Merge results
    const mergedDraft = mergeMatchImageResults({ parsedResults, meta: { source } });

    // 4. Normalize draft
    const normalizedDraft = normalizeMatchDraft(mergedDraft, { source });
    const matchDraft = normalizedDraft.matchDraft;

    // 5. Extract club names from OCR (three-strategy cascade)
    const extractedNames = extractClubNamesFromOCR(parsedResults, tournamentClubs);

    const detectedHomeName =
      matchDraft.homeClub?.name || extractedNames.home || null;
    const detectedAwayName =
      matchDraft.awayClub?.name || extractedNames.away || null;

    console.log("[ai] clubs detected:", { detectedHomeName, detectedAwayName });

    // 6. Smart fuzzy match against tournament clubs
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

    // 7. Fallback by normalizedName
    const homeNorm =
      matchDraft.homeClub?.normalizedName ||
      normalizeClubName(detectedHomeName || "");
    const awayNorm =
      matchDraft.awayClub?.normalizedName ||
      normalizeClubName(detectedAwayName || "");

    if (!normalizedDraft.matchedHomeClub && homeNorm) {
      const fallback = fuzzyMatchClub(homeNorm, tournamentClubs);
      if (fallback) {
        normalizedDraft.matchedHomeClub = fallback;
        matchDraft.homeClub = { id: fallback._id, name: fallback.name, confidence: 0.75 };
      }
    }

    if (!normalizedDraft.matchedAwayClub && awayNorm) {
      const fallback = fuzzyMatchClub(awayNorm, tournamentClubs);
      if (fallback) {
        normalizedDraft.matchedAwayClub = fallback;
        matchDraft.awayClub = { id: fallback._id, name: fallback.name, confidence: 0.75 };
      }
    }

    // 8. Recalculate clubs confidence based on actual match quality
    const homeConf = matchDraft.homeClub?.confidence || 0;
    const awayConf = matchDraft.awayClub?.confidence || 0;

    if (normalizedDraft.matchedHomeClub || normalizedDraft.matchedAwayClub) {
      let clubsConf;
      if (normalizedDraft.matchedHomeClub && normalizedDraft.matchedAwayClub) {
        clubsConf = (homeConf + awayConf) / 2;
      } else {
        // Only one matched — penalize
        clubsConf = Math.max(homeConf, awayConf) * 0.65;
      }

      normalizedDraft.confidence = {
        ...(normalizedDraft.confidence || {}),
        clubs: Number(clubsConf.toFixed(3)),
      };

      normalizedDraft.missingFields = (normalizedDraft.missingFields || []).filter(
        (f) => f !== "homeClub.name" && f !== "awayClub.name"
      );
    }

    // 9. Infer status from score
    if (matchDraft.scoreHome != null && matchDraft.scoreAway != null) {
      matchDraft.status = "played";
    }

    const fieldConfidence = buildFieldConfidence(normalizedDraft);

    console.log(`[ai] total: ${Date.now() - t_req}ms`);
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
