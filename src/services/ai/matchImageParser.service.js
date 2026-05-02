// src/services/ai/matchImageParser.service.js
// Adapted from fifa-club-pro — opencv dependency removed (Python optional feature not ported)
const { getBaseConfidenceByType, buildFieldConfidence } = require("../../utils/ai/confidence");
const { readImageText } = require("./ocr.service");
const { interpretMatchImageOcr } = require("./visionValidation.service");

function isValidScoreNumber(value) {
  return Number.isInteger(value) && value >= 0 && value <= 30;
}

function extractScoreFromText(text = "") {
  const normalized = String(text).replace(/\r/g, "\n").replace(/\s+/g, " ").trim();
  if (!normalized) return { home: null, away: null, method: null, confidence: 0 };

  const vsScoreVs = normalized.match(/.+?\bvs\b\s*(\d{1,2})\s*[:\-–]\s*(\d{1,2})\s*\bvs\b\s*.+/i);
  if (vsScoreVs) {
    const home = Number(vsScoreVs[1]), away = Number(vsScoreVs[2]);
    if (isValidScoreNumber(home) && isValidScoreNumber(away)) return { home, away, method: "vs_score_vs", confidence: 0.9 };
  }

  const classic = normalized.match(/(\d{1,2})\s*[:\-–]\s*(\d{1,2})/);
  if (classic) {
    const home = Number(classic[1]), away = Number(classic[2]);
    if (isValidScoreNumber(home) && isValidScoreNumber(away)) return { home, away, method: "classic_pair", confidence: 0.55 };
  }

  const loose = normalized.match(/\b(\d{1,2})\s+(\d{1,2})\b/);
  if (loose) {
    const home = Number(loose[1]), away = Number(loose[2]);
    if (isValidScoreNumber(home) && isValidScoreNumber(away)) return { home, away, method: "loose_pair", confidence: 0.25 };
  }

  return { home: null, away: null, method: null, confidence: 0 };
}

function extractMatchStatus(text = "") {
  const n = text.toLowerCase();
  if (n.includes("full time") || n.includes("match finished") || n.includes("final") || n.includes("ft")) return "final";
  return null;
}

function cleanOCRText(text = "") {
  return String(text)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s:%.\-]/g, " ")
    .replace(/\r/g, "\n").replace(/[|]/g, " ")
    .replace(/\b[oO]\b/g, "0")
    .replace(/\s+/g, " ").toLowerCase().trim();
}

function normalizeOcrTextForStats(text = "") { return cleanOCRText(text); }

function labelToRegex(label = "") {
  return String(label).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
}

function toSafeNumber(value, allowFloat = false) {
  if (value == null || value === "") return null;
  const parsed = allowFloat ? Number(value) : Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function detectImageType(text = "") {
  const n = cleanOCRText(text);
  if (!n) return "unknown";
  if (n.includes("pases en general") || n.includes("total de pases") || n.includes("completados") || n.includes("precision de pases")) return "passes_screen";
  if (n.includes("defensa en general") || n.includes("entradas de frente") || n.includes("recuperaciones") || n.includes("bloqueos")) return "defense_screen";
  if (n.includes("eventos en general") || n.includes("saques de esquina") || n.includes("tarjetas amarillas") || n.includes("fuera de juego")) return "events_screen";
  if (n.includes("posesion total") || n.includes("% de posesion") || n.includes("amenaza")) return "possession_screen";
  if (n.includes("tiros a gol") || n.includes("tiros a puerta") || n.includes("precision en tiros")) return "shots_screen";
  if (n.includes("resumen") || n.includes("goles esperados") || n.includes("tasa de exito en regates")) return "scoreboard_summary";
  return "unknown";
}

function extractLabeledPair(text = "", labels = [], options = {}) {
  const { allowFloat = false } = options;
  const normalized = normalizeOcrTextForStats(text);
  const numberPattern = allowFloat ? "(\\d{1,3}(?:\\.\\d+)?)" : "(\\d{1,3})";

  for (const label of labels) {
    const labelRegex = labelToRegex(label);
    const regex = new RegExp(`${numberPattern}\\s*${labelRegex}\\s*${numberPattern}`, "i");
    const match = normalized.match(regex);
    if (match) {
      const home = toSafeNumber(match[1], allowFloat);
      const away = toSafeNumber(match[2], allowFloat);
      if (home !== null && away !== null) return { home, away };
    }
  }
  return { home: null, away: null };
}

function pickPair(primary = {}, fallback = {}) {
  return {
    home: primary?.home != null ? primary.home : fallback?.home ?? null,
    away: primary?.away != null ? primary.away : fallback?.away ?? null,
  };
}

function extractPossessionFromText(text = "") {
  const n = normalizeOcrTextForStats(text);
  const sidePair = n.match(/(\d{1,3})\s*%\s*(?:posesion total|posesion|global)[\s\S]{0,80}(\d{1,3})\s*%/i);
  if (sidePair) {
    const home = Number(sidePair[1]), away = Number(sidePair[2]);
    if (Number.isInteger(home) && Number.isInteger(away) && home >= 0 && away >= 0 && home <= 100 && away <= 100 && home + away >= 90 && home + away <= 110) {
      return { possessionHome: home, possessionAway: away };
    }
  }

  const central = n.match(/(\d{1,3})\s*(?:%|)\s*(?:de\s*)?posesi\w*\s*(\d{1,3})/i);
  if (central) {
    const home = Number(central[1]), away = Number(central[2]);
    if (Number.isInteger(home) && Number.isInteger(away) && home >= 0 && away >= 0 && home <= 100 && away <= 100 && home + away >= 90 && home + away <= 110) {
      return { possessionHome: home, possessionAway: away };
    }
  }

  const percents = [...n.matchAll(/(\d{1,3})\s*%/g)].map((m) => Number(m[1]));
  for (let i = 0; i < percents.length - 1; i++) {
    const home = percents[i], away = percents[i + 1];
    if (Number.isInteger(home) && Number.isInteger(away) && home + away >= 90 && home + away <= 110) {
      return { possessionHome: home, possessionAway: away };
    }
  }

  return { possessionHome: null, possessionAway: null };
}

function calculateAccuracy(total, completed) {
  if (Number.isInteger(total) && Number.isInteger(completed) && total > 0 && completed >= 0 && completed <= total) {
    return Math.round((completed / total) * 100);
  }
  return null;
}

function extractStrictShotAccuracy(text = "") {
  const n = normalizeOcrTextForStats(text);
  const regex = new RegExp(`(\\d{1,3})\\s*%[\\s\\S]{0,40}(?:precision\\s*en\\s*tiros|precision\\s*de\\s*tiro)[\\s\\S]{0,40}(\\d{1,3})\\s*%`, "i");
  const match = n.match(regex);
  if (match) {
    const home = Number(match[1]), away = Number(match[2]);
    if (home >= 0 && home <= 100 && away >= 0 && away <= 100) return { home, away };
  }
  return { home: null, away: null };
}

function extractShotsFromText(text = "") {
  const total = extractLabeledPair(text, ["total de tiros", "tiros", "shots"]);
  const onTarget = extractLabeledPair(text, ["tiros a gol", "tiros a puerta", "shots on target"]);
  const acc = extractStrictShotAccuracy(text);
  return {
    shotsHome: total.home, shotsAway: total.away,
    shotsOnTargetHome: onTarget.home, shotsOnTargetAway: onTarget.away,
    shotAccuracyHome: acc.home ?? calculateAccuracy(total.home, onTarget.home),
    shotAccuracyAway: acc.away ?? calculateAccuracy(total.away, onTarget.away),
  };
}

function extractPassesFromText(text = "") {
  const total = extractLabeledPair(text, ["total de pases", "pases"]);
  const completed = extractLabeledPair(text, ["completados"]);

  const safeCompHome = Number.isInteger(total.home) && Number.isInteger(completed.home) && completed.home >= 0 && completed.home <= total.home ? completed.home : null;
  const safeCompAway = Number.isInteger(total.away) && Number.isInteger(completed.away) && completed.away >= 0 && completed.away <= total.away ? completed.away : null;

  const n = normalizeOcrTextForStats(text);
  const accRegex = new RegExp(`(\\d{1,3})\\s*%[\\s\\S]{0,120}(?:precision\\s*de\\s*pases|precision\\s*en\\s*pases)[\\s\\S]{0,120}(\\d{1,3})\\s*%`, "i");
  const accMatch = n.match(accRegex);
  let passAccHome = null, passAccAway = null;
  if (accMatch) {
    passAccHome = Number(accMatch[1]);
    passAccAway = Number(accMatch[2]);
    if (passAccHome < 0 || passAccHome > 100) passAccHome = null;
    if (passAccAway < 0 || passAccAway > 100) passAccAway = null;
  }

  return {
    passesHome: total.home, passesAway: total.away,
    passesCompletedHome: safeCompHome, passesCompletedAway: safeCompAway,
    interceptionsHome: extractLabeledPair(text, ["interceptados"]).home,
    interceptionsAway: extractLabeledPair(text, ["interceptados"]).away,
    passAccuracyHome: passAccHome ?? calculateAccuracy(total.home, safeCompHome),
    passAccuracyAway: passAccAway ?? calculateAccuracy(total.away, safeCompAway),
  };
}

function extractDefenseFromText(text = "") {
  const tackles = pickPair(extractLabeledPair(text, ["entradas de frente", "entradas"]), extractLabeledPair(text, ["entradas"]));
  const recoveries = extractLabeledPair(text, ["recuperaciones"]);
  const blocks = extractLabeledPair(text, ["bloqueos"]);
  const saves = extractLabeledPair(text, ["atajadas"]);
  const clearances = extractLabeledPair(text, ["despejes"]);
  const fouls = pickPair(extractLabeledPair(text, ["faltas cometidas", "faltas", "fouls"]), extractLabeledPair(text, ["faltas"]));
  const yellowCards = pickPair(extractLabeledPair(text, ["tarjetas amarillas", "amarillas"]), extractLabeledPair(text, ["amarillas"]));
  const redCards = pickPair(extractLabeledPair(text, ["tarjetas rojas", "rojas"]), extractLabeledPair(text, ["rojas"]));
  const corners = pickPair(extractLabeledPair(text, ["saques de esquina", "corners"]), extractLabeledPair(text, ["corner"]));

  return {
    tacklesHome: tackles.home, tacklesAway: tackles.away,
    recoveriesHome: recoveries.home, recoveriesAway: recoveries.away,
    blocksHome: blocks.home, blocksAway: blocks.away,
    savesHome: saves.home, savesAway: saves.away,
    clearancesHome: clearances.home, clearancesAway: clearances.away,
    foulsHome: fouls.home, foulsAway: fouls.away,
    yellowCardsHome: yellowCards.home, yellowCardsAway: yellowCards.away,
    redCardsHome: redCards.home, redCardsAway: redCards.away,
    cornersHome: corners.home, cornersAway: corners.away,
  };
}

function extractEventsFromText(text = "") {
  const n = normalizeOcrTextForStats(text);
  function extractPairFlexible(labels = [], { maxValue = 999 } = {}) {
    for (const label of labels) {
      const lr = labelToRegex(label);
      for (const regex of [
        new RegExp(`\\b(\\d{1,3})\\b\\s*${lr}\\s*\\b(\\d{1,3})\\b`, "i"),
        new RegExp(`${lr}\\s*\\b(\\d{1,3})\\b\\s*\\b(\\d{1,3})\\b`, "i"),
      ]) {
        const match = n.match(regex);
        if (!match) continue;
        const home = toSafeNumber(match[1]), away = toSafeNumber(match[2]);
        if (home != null && away != null && home >= 0 && away >= 0 && home <= maxValue && away <= maxValue) return { home, away };
      }
    }
    return { home: null, away: null };
  }

  const corners = extractPairFlexible(["tiros de esquina", "saques de esquina"], { maxValue: 15 });
  const freeKicks = extractPairFlexible(["tiros libres", "tiro libre", "free kick"], { maxValue: 30 });
  const penalties = extractPairFlexible(["penales", "penaltis", "penalty"], { maxValue: 10 });
  const yellowCards = extractPairFlexible(["tarjetas amarillas", "tarjeta amarilla"], { maxValue: 10 });
  const redCards = extractPairFlexible(["tarjetas rojas", "tarjeta roja"], { maxValue: 10 });
  const offsides = extractPairFlexible(["fuera de juego", "fuera de lugar"], { maxValue: 10 });
  const fouls = extractPairFlexible(["faltas cometidas", "faltas", "fouls"], { maxValue: 50 });

  return {
    cornersHome: corners.home, cornersAway: corners.away,
    freeKicksHome: freeKicks.home, freeKicksAway: freeKicks.away,
    penaltiesHome: penalties.home, penaltiesAway: penalties.away,
    yellowCardsHome: yellowCards.home, yellowCardsAway: yellowCards.away,
    redCardsHome: redCards.home, redCardsAway: redCards.away,
    offsidesHome: offsides.home, offsidesAway: offsides.away,
    foulsHome: fouls.home, foulsAway: fouls.away,
  };
}

function cleanClubCandidate(value = "") {
  let cleaned = String(value).replace(/[|[\]{}()<>]/g, " ").replace(/\s+/g, " ").trim();
  const sectionPattern = /\b(resumen|posesi[oó]n|tiros|pases|defens[ae]|eventos|statistics|stats|overview|summary)\b/i;
  const sm = cleaned.match(sectionPattern);
  if (sm) cleaned = cleaned.slice(0, sm.index).trim();
  cleaned = cleaned.replace(/\b[eE][sS][pP]\b.*$/i, "").trim();
  cleaned = cleaned.replace(/\s+\d{3,}.*$/i, "").trim();
  cleaned = cleaned.replace(/[-–—\s]+$/g, "").trim();
  return cleaned || null;
}

function extractStatsFromText(text = "") {
  const possession = extractPossessionFromText(text);
  const shots = extractShotsFromText(text);
  const passes = extractPassesFromText(text);
  const defense = extractDefenseFromText(text);
  const events = extractEventsFromText(text);

  return {
    possessionHome: possession.possessionHome, possessionAway: possession.possessionAway,
    shotsHome: shots.shotsHome, shotsAway: shots.shotsAway,
    shotsOnTargetHome: shots.shotsOnTargetHome, shotsOnTargetAway: shots.shotsOnTargetAway,
    passesHome: passes.passesHome, passesAway: passes.passesAway,
    passesCompletedHome: passes.passesCompletedHome, passesCompletedAway: passes.passesCompletedAway,
    tacklesHome: defense.tacklesHome, tacklesAway: defense.tacklesAway,
    recoveriesHome: defense.recoveriesHome, recoveriesAway: defense.recoveriesAway,
    cornersHome: events.cornersHome ?? defense.cornersHome, cornersAway: events.cornersAway ?? defense.cornersAway,
    foulsHome: events.foulsHome ?? defense.foulsHome, foulsAway: events.foulsAway ?? defense.foulsAway,
    yellowCardsHome: events.yellowCardsHome ?? defense.yellowCardsHome, yellowCardsAway: events.yellowCardsAway ?? defense.yellowCardsAway,
    redCardsHome: events.redCardsHome ?? defense.redCardsHome, redCardsAway: events.redCardsAway ?? defense.redCardsAway,
    offsidesHome: events.offsidesHome, offsidesAway: events.offsidesAway,
    freeKicksHome: events.freeKicksHome, freeKicksAway: events.freeKicksAway,
    penaltiesHome: events.penaltiesHome, penaltiesAway: events.penaltiesAway,
  };
}

async function parseSingleImage(image, meta = {}) {
  let type = image.type || "unknown";
  let baseConfidence = getBaseConfidenceByType(type);

  let ocr = { text: "", confidence: 0, lines: [], words: [], provider: "azure-vision" };

  try {
    ocr = await readImageText(image.buffer, {
      contentType: image.mimetype || "application/octet-stream",
      filename: image.originalName || null,
      size: image.size || null,
    });
  } catch (error) {
    return {
      sourceImage: { index: image.index, type, originalName: image.originalName, size: image.size, mimetype: image.mimetype },
      partialDraft: {
        homeClub: { name: null, normalizedName: null },
        awayClub: { name: null, normalizedName: null },
        scoreHome: null, scoreAway: null, status: null, stats: {},
      },
      confidence: buildFieldConfidence(baseConfidence),
      notes: [`Imagen clasificada como '${type}'.`, "OCR falló en esta imagen.", `OCR error: ${error?.message || "unknown error"}`],
      conflicts: [],
      missingFields: ["ocr.text"],
    };
  }

  const text = ocr.text || "";

  // Detect image type from OCR text if not known from filename
  const detectedType = detectImageType(text);
  if (type === "unknown" && detectedType !== "unknown") {
    type = detectedType;
    baseConfidence = getBaseConfidenceByType(type);
  }

  const heuristicScore = extractScoreFromText(text);
  const heuristicStatus = extractMatchStatus(text);
  const heuristicStats = extractStatsFromText(text);

  let aiInterpretation = null;
  try {
    aiInterpretation = await interpretMatchImageOcr({
      text,
      lines: Array.isArray(ocr.lines) ? ocr.lines : [],
      words: Array.isArray(ocr.words) ? ocr.words : [],
      imageType: type,
      meta,
    });
  } catch (error) {
    aiInterpretation = null;
  }

  const aiScore = aiInterpretation?.score || {};
  const aiClubs = aiInterpretation?.clubs || {};
  const aiStats = aiInterpretation?.teamStats || {};
  const aiNotes = Array.isArray(aiInterpretation?.notes) ? aiInterpretation.notes : [];

  const scoreMin = Number(process.env.AI_SCORE_CONFIDENCE_MIN || 0.85);
  const statsMin = Number(process.env.AI_STATS_CONFIDENCE_MIN || 0.7);

  const useAiScore = typeof aiScore.home === "number" && typeof aiScore.away === "number" && Number(aiScore.confidence || 0) >= scoreMin && aiScore.conflict !== true;
  const finalScoreHome = useAiScore ? aiScore.home : heuristicScore.home;
  const finalScoreAway = useAiScore ? aiScore.away : heuristicScore.away;

  const finalStatus = aiInterpretation?.status || heuristicStatus;

  const hS = heuristicStats || {};
  const useAiStats = aiInterpretation && Number(aiStats.confidence || 0) >= statsMin && aiStats.conflict !== true;

  const finalStats = useAiStats
    ? {
        ...hS,
        possessionHome: aiStats.possessionHome ?? hS.possessionHome ?? null,
        possessionAway: aiStats.possessionAway ?? hS.possessionAway ?? null,
        shotsHome: aiStats.shotsHome ?? hS.shotsHome ?? null,
        shotsAway: aiStats.shotsAway ?? hS.shotsAway ?? null,
        shotsOnTargetHome: aiStats.shotsOnTargetHome ?? hS.shotsOnTargetHome ?? null,
        shotsOnTargetAway: aiStats.shotsOnTargetAway ?? hS.shotsOnTargetAway ?? null,
        passesHome: aiStats.passesHome ?? hS.passesHome ?? null,
        passesAway: aiStats.passesAway ?? hS.passesAway ?? null,
        passesCompletedHome: hS.passesCompletedHome ?? null,
        passesCompletedAway: hS.passesCompletedAway ?? null,
        tacklesHome: aiStats.tacklesHome ?? hS.tacklesHome ?? null,
        tacklesAway: aiStats.tacklesAway ?? hS.tacklesAway ?? null,
        recoveriesHome: aiStats.recoveriesHome ?? hS.recoveriesHome ?? null,
        recoveriesAway: aiStats.recoveriesAway ?? hS.recoveriesAway ?? null,
        cornersHome: aiStats.cornersHome ?? hS.cornersHome ?? null,
        cornersAway: aiStats.cornersAway ?? hS.cornersAway ?? null,
        foulsHome: aiStats.foulsHome ?? hS.foulsHome ?? null,
        foulsAway: aiStats.foulsAway ?? hS.foulsAway ?? null,
        yellowCardsHome: aiStats.yellowCardsHome ?? hS.yellowCardsHome ?? null,
        yellowCardsAway: aiStats.yellowCardsAway ?? hS.yellowCardsAway ?? null,
        redCardsHome: aiStats.redCardsHome ?? hS.redCardsHome ?? null,
        redCardsAway: aiStats.redCardsAway ?? hS.redCardsAway ?? null,
      }
    : hS;

  const finalHomeClubName = typeof aiClubs.home === "string" && aiClubs.home.trim()
    ? cleanClubCandidate(aiClubs.home.trim())
    : null;
  const finalAwayClubName = typeof aiClubs.away === "string" && aiClubs.away.trim()
    ? cleanClubCandidate(aiClubs.away.trim())
    : null;

  const canUseScoreboardData = type === "scoreboard_summary" || type === "final_overview_screen" || type === "unknown";

  const partialDraft = {
    homeClub: { name: finalHomeClubName, normalizedName: null },
    awayClub: { name: finalAwayClubName, normalizedName: null },
    scoreHome: canUseScoreboardData ? finalScoreHome : null,
    scoreAway: canUseScoreboardData ? finalScoreAway : null,
    status: canUseScoreboardData ? finalStatus : null,
    stats: finalStats,
  };

  const conflicts = [];
  if (heuristicScore.home !== null && heuristicScore.away !== null && typeof aiScore.home === "number" && typeof aiScore.away === "number" && (heuristicScore.home !== aiScore.home || heuristicScore.away !== aiScore.away)) {
    conflicts.push({ field: "score", heuristic: { home: heuristicScore.home, away: heuristicScore.away }, ai: { home: aiScore.home, away: aiScore.away } });
  }
  if (aiScore.conflict === true) conflicts.push({ field: "score", reason: "OpenAI detectó conflicto en score" });
  if (aiClubs.conflict === true) conflicts.push({ field: "clubs", reason: "OpenAI detectó conflicto en nombres de clubes" });

  const notes = [
    `Imagen clasificada como '${type}'.`,
    "OCR ejecutado correctamente.",
    `Texto OCR preview: ${text.slice(0, 120)}`,
    `Score heurístico: ${heuristicScore.home ?? "null"} - ${heuristicScore.away ?? "null"}`,
    `Confianza score heurístico: ${heuristicScore.confidence ?? 0}`,
    `Score IA: ${aiScore.home ?? "null"} - ${aiScore.away ?? "null"}`,
    `Club local IA: ${finalHomeClubName ?? "null"}`,
    `Club visita IA: ${finalAwayClubName ?? "null"}`,
    `Posesión: ${finalStats.possessionHome ?? "null"} - ${finalStats.possessionAway ?? "null"}`,
    `Tiros: ${finalStats.shotsHome ?? "null"} - ${finalStats.shotsAway ?? "null"}`,
    `Pases: ${finalStats.passesHome ?? "null"} - ${finalStats.passesAway ?? "null"}`,
    ...aiNotes,
  ];

  if (!ocr.text) notes.push("OCR sin texto útil.");

  const missingFields = [];
  if (!partialDraft.homeClub.name) missingFields.push("homeClub.name");
  if (!partialDraft.awayClub.name) missingFields.push("awayClub.name");
  if (partialDraft.scoreHome == null) missingFields.push("scoreHome");
  if (partialDraft.scoreAway == null) missingFields.push("scoreAway");

  return {
    sourceImage: {
      index: image.index, type, originalName: image.originalName,
      size: image.size, mimetype: image.mimetype,
      ocrPreview: text.slice(0, 500),
    },
    partialDraft,
    confidence: {
      ...buildFieldConfidence(baseConfidence),
      ocr: Number(ocr.confidence || 0),
      aiScore: Number(aiScore.confidence || 0),
      aiClubs: Number(aiClubs.confidence || 0),
      aiStats: Number(aiStats.confidence || 0),
    },
    notes,
    conflicts,
    missingFields,
  };
}

async function parseMatchImagesService({ classifiedImages = [], meta = {} }) {
  const results = [];
  for (const image of classifiedImages) {
    results.push(await parseSingleImage(image, meta));
  }
  return results;
}

module.exports = parseMatchImagesService;
