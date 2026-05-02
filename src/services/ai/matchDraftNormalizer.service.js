// src/services/ai/matchDraftNormalizer.service.js
const normalizeClubName = require("../../utils/ai/normalizeClubName");

function isLikelyNoiseLine(value = "") {
  const line = String(value).trim();
  if (!line) return true;
  const lowered = line.toLowerCase();
  if (/^(\d{1,2}\s*[:\-–]\s*\d{1,2})$/.test(line)) return true;
  if (/^\d{1,3}%$/.test(line)) return true;
  if (/^\d{1,2}:\d{2}$/.test(line)) return true;
  if (/^\d+$/.test(line)) return true;
  const banned = ["resumen", "posesión", "posesion", "tiros", "pases", "defensa", "eventos", "total", "pases en general", "defensa en general", "tiros en general", "goles esperados"];
  return banned.some((b) => lowered.includes(b));
}

function normalizeMatchDraft(payload = {}, options = {}) {
  const output = structuredClone(payload);

  if (output.matchDraft?.homeClub?.name) {
    output.matchDraft.homeClub.normalizedName = normalizeClubName(output.matchDraft.homeClub.name);
  }
  if (output.matchDraft?.awayClub?.name) {
    output.matchDraft.awayClub.normalizedName = normalizeClubName(output.matchDraft.awayClub.name);
  }

  output.notes = Array.isArray(output.notes) ? [...new Set(output.notes)] : [];
  output.conflicts = Array.isArray(output.conflicts) ? [...new Set(output.conflicts)] : [];
  output.missingFields = Array.isArray(output.missingFields) ? [...new Set(output.missingFields)] : [];

  return output;
}

module.exports = normalizeMatchDraft;
