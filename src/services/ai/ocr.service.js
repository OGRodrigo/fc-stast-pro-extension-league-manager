// src/services/ai/ocr.service.js
const fs = require("fs/promises");

function ensureEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`[ocr.service] Missing env var: ${name}`);
  return value;
}

function averageWordConfidence(words = []) {
  const valid = words
    .map((w) => w?.confidence)
    .filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!valid.length) return 0;
  return Number((valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(4));
}

function normalizeAzureReadResult(raw = {}, meta = {}) {
  const readResult = raw.readResult || {};
  const lines = [];
  const words = [];

  if (Array.isArray(readResult.blocks)) {
    for (const block of readResult.blocks) {
      for (const line of (block.lines || [])) {
        const lineText = typeof line.text === "string" ? line.text.trim() : "";
        if (lineText) lines.push({ text: lineText, boundingPolygon: line.boundingPolygon || [] });
        for (const word of (line.words || [])) {
          const text = typeof word.text === "string" ? word.text.trim() : "";
          if (!text) continue;
          words.push({ text, confidence: typeof word.confidence === "number" ? word.confidence : null, boundingPolygon: word.boundingPolygon || [] });
        }
      }
    }
  }

  if (Array.isArray(readResult.pages)) {
    for (const page of readResult.pages) {
      for (const line of (page.lines || [])) {
        const lineText = typeof line.content === "string" ? line.content.trim() : "";
        if (lineText) lines.push({ text: lineText, boundingPolygon: line.boundingPolygon || [] });
        for (const word of (line.words || [])) {
          const text = typeof word.content === "string" ? word.content.trim() : "";
          if (!text) continue;
          words.push({ text, confidence: typeof word.confidence === "number" ? word.confidence : null, boundingPolygon: word.boundingPolygon || [] });
        }
      }
    }
  }

  const fallbackText = typeof readResult.content === "string" ? readResult.content : "";
  const text = lines.length > 0 ? lines.map((l) => l.text).join("\n") : fallbackText;
  const confidence = averageWordConfidence(words);

  return {
    provider: "azure-vision",
    modelVersion: raw.modelVersion || null,
    metadata: raw.metadata || {},
    source: { filename: meta.filename || null, mimeType: meta.mimeType || null, size: meta.size || null },
    text,
    confidence,
    lines,
    words,
    fullText: text,
    raw,
  };
}

async function callAzureVisionReadFromBuffer(buffer, contentType = "application/octet-stream") {
  const endpoint = ensureEnv("AZURE_VISION_ENDPOINT").replace(/\/+$/, "");
  const apiKey = ensureEnv("AZURE_VISION_KEY");
  const apiVersion = process.env.AZURE_VISION_API_VERSION || "2023-10-01";

  const url =
    `${endpoint}/computervision/imageanalysis:analyze` +
    `?api-version=${encodeURIComponent(apiVersion)}&features=read`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": apiKey, "Content-Type": contentType },
    body: buffer,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`[ocr.service] Azure Vision OCR failed (${response.status} ${response.statusText}): ${errText}`);
  }

  return response.json();
}

async function readImageText(buffer, options = {}) {
  if (!buffer) throw new Error("[ocr.service] buffer is required");
  const raw = await callAzureVisionReadFromBuffer(buffer, options.contentType || "application/octet-stream");
  return normalizeAzureReadResult(raw, {
    filename: options.filename || null,
    mimeType: options.contentType || null,
    size: options.size || buffer.length,
  });
}

async function extractTextFromFile(file) {
  if (!file) throw new Error("[ocr.service] file is required");
  const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
  if (!buffer) throw new Error("[ocr.service] file buffer/path not found");
  return readImageText(buffer, {
    contentType: file.mimetype || "application/octet-stream",
    filename: file.originalname || file.filename || null,
    size: file.size || buffer.length,
  });
}

module.exports = { readImageText, extractTextFromFile };
