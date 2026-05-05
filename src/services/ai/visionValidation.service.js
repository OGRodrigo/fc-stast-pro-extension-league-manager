// src/services/ai/visionValidation.service.js
const OpenAI = require("openai");

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function buildPrompt(payload = {}) {
  const clubsHint =
    Array.isArray(payload.tournamentClubs) && payload.tournamentClubs.length > 0
      ? `\nClubes registrados en este torneo (usa estos nombres exactos si los detectas): ${payload.tournamentClubs.map((c) => c.name).join(", ")}`
      : "";

  return `
Eres un validador de screenshots de partidos de fútbol de videojuego.
Tu tarea es interpretar el OCR entregado sin inventar datos.
${clubsHint}

Reglas obligatorias:
- Usa SOLO el OCR entregado.
- Si se dan clubes del torneo, intenta identificar cuál aparece en el OCR (puede haber errores OCR leves).
- No inventes clubes si no aparecen claros en el OCR.
- No asumas local/visita si no hay evidencia. El local suele aparecer a la izquierda o arriba.
- No rellenes campos dudosos.
- Si no puedes confirmar algo, devuélvelo como null.
- Si hay contradicción, marca conflict=true.
- confidence debe ser un número entre 0 y 1.
- status solo puede ser "final" o null.

Objetivos:
1. Detectar score si hay evidencia suficiente.
2. Detectar nombres de clubes; si hay lista de clubes del torneo, elige el más parecido al texto OCR.
3. Detectar estadísticas de equipo visibles.
4. Detectar contradicciones entre señales del OCR.
5. Devolver salida estructurada y conservadora.

OCR INPUT:
${JSON.stringify({ ...payload, tournamentClubs: undefined }, null, 2)}
  `.trim();
}

const interpretationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "object",
      additionalProperties: false,
      properties: {
        home: { type: ["integer", "null"] },
        away: { type: ["integer", "null"] },
        confidence: { type: "number" },
        evidence: { type: "array", items: { type: "string" } },
        conflict: { type: "boolean" },
      },
      required: ["home", "away", "confidence", "evidence", "conflict"],
    },
    clubs: {
      type: "object",
      additionalProperties: false,
      properties: {
        home: { type: ["string", "null"] },
        away: { type: ["string", "null"] },
        confidence: { type: "number" },
        evidence: { type: "array", items: { type: "string" } },
        conflict: { type: "boolean" },
      },
      required: ["home", "away", "confidence", "evidence", "conflict"],
    },
    status: { type: ["string", "null"] },
    teamStats: {
      type: "object",
      additionalProperties: false,
      properties: {
        possessionHome: { type: ["number", "null"] },
        possessionAway: { type: ["number", "null"] },
        shotsHome: { type: ["integer", "null"] },
        shotsAway: { type: ["integer", "null"] },
        shotsOnTargetHome: { type: ["integer", "null"] },
        shotsOnTargetAway: { type: ["integer", "null"] },
        passesHome: { type: ["integer", "null"] },
        passesAway: { type: ["integer", "null"] },
        tacklesHome: { type: ["integer", "null"] },
        tacklesAway: { type: ["integer", "null"] },
        recoveriesHome: { type: ["integer", "null"] },
        recoveriesAway: { type: ["integer", "null"] },
        cornersHome: { type: ["integer", "null"] },
        cornersAway: { type: ["integer", "null"] },
        foulsHome: { type: ["integer", "null"] },
        foulsAway: { type: ["integer", "null"] },
        yellowCardsHome: { type: ["integer", "null"] },
        yellowCardsAway: { type: ["integer", "null"] },
        redCardsHome: { type: ["integer", "null"] },
        redCardsAway: { type: ["integer", "null"] },
        confidence: { type: "number" },
        evidence: { type: "array", items: { type: "string" } },
        conflict: { type: "boolean" },
      },
      required: [
        "possessionHome", "possessionAway", "shotsHome", "shotsAway",
        "shotsOnTargetHome", "shotsOnTargetAway", "passesHome", "passesAway",
        "tacklesHome", "tacklesAway", "recoveriesHome", "recoveriesAway",
        "cornersHome", "cornersAway", "foulsHome", "foulsAway",
        "yellowCardsHome", "yellowCardsAway", "redCardsHome", "redCardsAway",
        "confidence", "evidence", "conflict",
      ],
    },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["score", "clubs", "status", "teamStats", "notes"],
};

const EMPTY_RESPONSE = {
  score: { home: null, away: null, confidence: 0, evidence: [], conflict: false },
  clubs: { home: null, away: null, confidence: 0, evidence: [], conflict: false },
  status: null,
  teamStats: {
    possessionHome: null, possessionAway: null,
    shotsHome: null, shotsAway: null,
    shotsOnTargetHome: null, shotsOnTargetAway: null,
    passesHome: null, passesAway: null,
    tacklesHome: null, tacklesAway: null,
    recoveriesHome: null, recoveriesAway: null,
    cornersHome: null, cornersAway: null,
    foulsHome: null, foulsAway: null,
    yellowCardsHome: null, yellowCardsAway: null,
    redCardsHome: null, redCardsAway: null,
    confidence: 0, evidence: [], conflict: false,
  },
  notes: ["OpenAI deshabilitado: falta OPENAI_API_KEY"],
};

async function interpretMatchImageOcr({ text = "", lines = [], words = [], imageType = "unknown", meta = {}, tournamentClubs = [] } = {}) {
  const client = getClient();
  if (!client) return EMPTY_RESPONSE;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const payload = {
    imageType,
    meta,
    text,
    lines: Array.isArray(lines) ? lines.map((l) => ({ text: l?.text || "" })) : [],
    words: Array.isArray(words) ? words.slice(0, 150).map((w) => ({ text: w?.text || "", confidence: typeof w?.confidence === "number" ? w.confidence : null })) : [],
    tournamentClubs: Array.isArray(tournamentClubs) ? tournamentClubs.map((c) => ({ name: c.name })) : [],
  };

  const response = await client.responses.create({
    model,
    input: buildPrompt(payload),
    text: {
      format: {
        type: "json_schema",
        name: "match_image_interpretation",
        schema: interpretationSchema,
        strict: true,
      },
    },
  });

  const outputText = response.output_text;
  if (!outputText) throw new Error("[visionValidation.service] Empty model output");

  return JSON.parse(outputText);
}

module.exports = { interpretMatchImageOcr };
