// src/services/ai/clubMatcher.service.js

function normalize(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function matchClubName(ocrName, clubs) {
  if (!ocrName || !clubs || !clubs.length) return null;

  const ocrNorm = normalize(ocrName);
  if (!ocrNorm || ocrNorm.length < 2) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const club of clubs) {
    const clubNorm = normalize(club.name);
    const abbrNorm = club.abbr ? normalize(club.abbr) : "";

    // Exact match
    if (ocrNorm === clubNorm || (abbrNorm && ocrNorm === abbrNorm)) {
      return { club, confidence: 1 };
    }

    let score = 0;

    // Substring containment
    if (clubNorm.includes(ocrNorm) || ocrNorm.includes(clubNorm)) {
      const shorter = Math.min(ocrNorm.length, clubNorm.length);
      const longer = Math.max(ocrNorm.length, clubNorm.length);
      score = Math.max(score, shorter / longer);
    }

    // Levenshtein similarity
    score = Math.max(score, similarity(ocrNorm, clubNorm));

    // Abbreviation match (slight confidence penalty)
    if (abbrNorm && abbrNorm.length >= 2) {
      score = Math.max(score, similarity(ocrNorm, abbrNorm) * 0.85);
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = club;
    }
  }

  if (bestMatch && bestScore >= 0.5) {
    return { club: bestMatch, confidence: Number(bestScore.toFixed(3)) };
  }

  return null;
}

module.exports = { matchClubName };
