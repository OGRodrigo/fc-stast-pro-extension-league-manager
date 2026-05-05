// src/services/ai/matchImageMerge.service.js
// Fusiona resultados de múltiples imágenes en un draft unificado

function createEmptyDraft(meta = {}) {
  return {
    matchDraft: {
      homeClub: { name: null, normalizedName: null },
      awayClub: { name: null, normalizedName: null },
      scoreHome: null,
      scoreAway: null,
      status: null,
      stats: {
        possessionHome: null, possessionAway: null,
        shotsHome: null, shotsAway: null,
        shotsOnTargetHome: null, shotsOnTargetAway: null,
        passesHome: null, passesAway: null,
        passesCompletedHome: null, passesCompletedAway: null,
        tacklesHome: null, tacklesAway: null,
        recoveriesHome: null, recoveriesAway: null,
        cornersHome: null, cornersAway: null,
        foulsHome: null, foulsAway: null,
        yellowCardsHome: null, yellowCardsAway: null,
        redCardsHome: null, redCardsAway: null,
      },
      sourceImages: [],
    },
    confidence: { overall: 0, score: 0, clubs: 0, stats: 0 },
    statSources: {},
    missingFields: [],
    conflicts: [],
    notes: [],
  };
}

function fillIfEmpty(target, key, value) {
  if (target[key] == null && value != null) target[key] = value;
}

function mergeStats(targetStats, incomingStats) {
  Object.keys(targetStats).forEach((key) => {
    if (targetStats[key] == null && incomingStats[key] != null) {
      targetStats[key] = incomingStats[key];
    }
  });
}

function groupResultsByType(parsedResults = []) {
  return parsedResults.reduce((acc, result) => {
    const type = result?.sourceImage?.type || "unknown";
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {
    scoreboard_summary: [], final_overview_screen: [],
    possession_screen: [], shots_screen: [], passes_screen: [],
    defense_screen: [], events_screen: [], unknown: [],
  });
}

function pickStatFromResults(results = [], field) {
  for (const result of results) {
    const value = result?.partialDraft?.stats?.[field];
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

function applyStatsPriority(targetStats, grouped = {}, statSources = {}) {
  const pick = (type, field) => pickStatFromResults(grouped[type] || [], field);

  function apply(key, screenType) {
    const value = pick(screenType, key);
    if (value != null) { targetStats[key] = value; statSources[key] = screenType; }
  }

  // possession
  apply("possessionHome", "possession_screen");
  apply("possessionAway", "possession_screen");
  // shots
  apply("shotsHome", "shots_screen");
  apply("shotsAway", "shots_screen");
  apply("shotsOnTargetHome", "shots_screen");
  apply("shotsOnTargetAway", "shots_screen");
  // passes
  apply("passesHome", "passes_screen");
  apply("passesAway", "passes_screen");
  apply("passesCompletedHome", "passes_screen");
  apply("passesCompletedAway", "passes_screen");
  // defense
  apply("tacklesHome", "defense_screen");
  apply("tacklesAway", "defense_screen");
  apply("recoveriesHome", "defense_screen");
  apply("recoveriesAway", "defense_screen");
  // events
  apply("cornersHome", "events_screen");
  apply("cornersAway", "events_screen");
  apply("foulsHome", "events_screen");
  apply("foulsAway", "events_screen");
  apply("yellowCardsHome", "events_screen");
  apply("yellowCardsAway", "events_screen");
  apply("redCardsHome", "events_screen");
  apply("redCardsAway", "events_screen");
}

function average(nums = []) {
  const valid = nums.filter((n) => typeof n === "number");
  if (!valid.length) return 0;
  return Number((valid.reduce((a, n) => a + n, 0) / valid.length).toFixed(2));
}

function pickBestScoreResult(parsedResults = []) {
  const candidates = parsedResults
    .map((result) => {
      const draft = result?.partialDraft || {};
      let home = draft?.scoreHome;
      let away = draft?.scoreAway;

      if (home == null || away == null) {
        const notes = Array.isArray(result?.notes) ? result.notes : [];
        const scoreNote = notes.find((n) => String(n).startsWith("Score heurístico:"));
        if (scoreNote) {
          const match = scoreNote.match(/(\d{1,2})\s*-\s*(\d{1,2})/);
          if (match) { home = Number(match[1]); away = Number(match[2]); }
        }
      }

      if (home == null || away == null) return null;

      const notes = Array.isArray(result?.notes) ? result.notes : [];
      const hNote = notes.find((n) => String(n).startsWith("Confianza score heurístico:"));
      const hConf = hNote ? Number(hNote.replace("Confianza score heurístico:", "").trim()) || 0 : 0;
      const aiConf = Number(result?.confidence?.aiScore || 0);

      return { home, away, confidence: Math.max(hConf, aiConf) };
    })
    .filter(Boolean);

  if (!candidates.length) return null;

  const grouped = new Map();
  for (const c of candidates) {
    const key = `${c.home}-${c.away}`;
    if (!grouped.has(key)) grouped.set(key, { home: c.home, away: c.away, count: 0, maxConfidence: 0, totalConfidence: 0 });
    const b = grouped.get(key);
    b.count += 1;
    b.totalConfidence += c.confidence;
    b.maxConfidence = Math.max(b.maxConfidence, c.confidence);
  }

  const ranked = Array.from(grouped.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.maxConfidence - a.maxConfidence;
  });

  const best = ranked[0];
  if (!best || best.maxConfidence < 0.5) return null;
  return { home: best.home, away: best.away, confidence: best.maxConfidence, count: best.count };
}

function mergeMatchImageResults({ parsedResults = [], meta = {} }) {
  const output = createEmptyDraft(meta);
  const grouped = groupResultsByType(parsedResults);

  parsedResults.forEach((result) => {
    const draft = result?.partialDraft || {};
    const stats = draft?.stats || {};

    fillIfEmpty(output.matchDraft.homeClub, "name", draft?.homeClub?.name ?? null);
    fillIfEmpty(output.matchDraft.homeClub, "normalizedName", draft?.homeClub?.normalizedName ?? null);
    fillIfEmpty(output.matchDraft.awayClub, "name", draft?.awayClub?.name ?? null);
    fillIfEmpty(output.matchDraft.awayClub, "normalizedName", draft?.awayClub?.normalizedName ?? null);
    fillIfEmpty(output.matchDraft, "status", draft?.status);

    mergeStats(output.matchDraft.stats, stats);

    if (result?.sourceImage) output.matchDraft.sourceImages.push(result.sourceImage);
    if (Array.isArray(result?.notes)) output.notes.push(...result.notes);
    if (Array.isArray(result?.conflicts)) output.conflicts.push(...result.conflicts);
  });

  applyStatsPriority(output.matchDraft.stats, grouped, output.statSources);

  // Track sources for stats filled by mergeStats but not covered by a dedicated screen
  parsedResults.forEach((result) => {
    const stats = result?.partialDraft?.stats || {};
    const type = result?.sourceImage?.type || "unknown";
    for (const [key, value] of Object.entries(stats)) {
      if (value != null && output.matchDraft.stats[key] != null && !output.statSources[key]) {
        output.statSources[key] = type;
      }
    }
  });

  const bestScore = pickBestScoreResult(parsedResults);
  if (bestScore) {
    output.matchDraft.scoreHome = bestScore.home;
    output.matchDraft.scoreAway = bestScore.away;
    output.notes.push(`Score final elegido: ${bestScore.home} - ${bestScore.away}`);
  }

  const ocrConf = average(parsedResults.map((r) => Number(r?.confidence?.ocr || 0)));
  let scoreConf = average(parsedResults.map((r) => {
    const ai = Number(r?.confidence?.aiScore || 0);
    const notes = Array.isArray(r?.notes) ? r.notes : [];
    const hn = notes.find((n) => String(n).startsWith("Confianza score heurístico:"));
    const h = hn ? Number(hn.replace("Confianza score heurístico:", "").trim()) || 0 : 0;
    return Math.max(ai, h);
  }));

  if (bestScore) {
    if (bestScore.count >= 3) scoreConf = Math.min(0.95, Math.max(scoreConf, 0.90));
    else if (bestScore.count >= 2) scoreConf = Math.min(0.92, Math.max(scoreConf, 0.82));
  }

  const aiStatsConf = average(parsedResults.map((r) => Number(r?.confidence?.aiStats || 0)));
  const statsExtracted = Object.values(output.matchDraft.stats).filter((v) => v != null).length;
  const statsConf = aiStatsConf > 0 ? aiStatsConf : statsExtracted > 0 ? Math.max(0.5, ocrConf * 0.65) : 0;

  output.confidence = {
    overall: average([ocrConf, scoreConf]),
    score: scoreConf,
    clubs: average(parsedResults.map((r) => Number(r?.confidence?.aiClubs || 0))),
    stats: Number(statsConf.toFixed(2)),
  };

  const missingFields = [];
  if (!output.matchDraft.homeClub.name) missingFields.push("homeClub.name");
  if (!output.matchDraft.awayClub.name) missingFields.push("awayClub.name");
  if (output.matchDraft.scoreHome == null) missingFields.push("scoreHome");
  if (output.matchDraft.scoreAway == null) missingFields.push("scoreAway");
  output.missingFields = missingFields;

  return output;
}

module.exports = mergeMatchImageResults;
