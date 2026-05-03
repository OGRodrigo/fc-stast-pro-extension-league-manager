// src/services/ai/clubMatcher.service.js

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function matchClubName(ocrName, clubs) {
  if (!ocrName) return null;

  const normalizedOCR = normalize(ocrName);

  let bestMatch = null;
  let bestScore = 0;

  for (const club of clubs) {
    const normalizedClub = normalize(club.name);

    if (normalizedOCR === normalizedClub) {
      return { club, confidence: 1 };
    }

    // similitud básica
    if (normalizedClub.includes(normalizedOCR) || normalizedOCR.includes(normalizedClub)) {
      const score = normalizedOCR.length / normalizedClub.length;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = club;
      }
    }
  }

  if (bestMatch) {
    return { club: bestMatch, confidence: bestScore };
  }

  return null;
}

module.exports = {
  matchClubName,
};