import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const src = "C:/Users/darks/OneDrive/Escritorio/fcstatspro-new-logo.png.png";
const out = join(__dirname, "public");

// Dark background (#060b12) matching the logo
const BG = { r: 6, g: 11, b: 18, alpha: 1 };

if (!existsSync(out)) mkdirSync(out, { recursive: true });

// Crop the isotipo (hexagonal icon, no text).
// Source: 1254x1254. Icon bounding box: x≈200..1060, y≈50..670.
// Using 860x620 (ratio 1.39:1) — text "FC STATS PRO" starts at y≈710, so y+620=670 is safe.
const CROP = { left: 200, top: 50, width: 860, height: 620 };

const isotipoBuffer = await sharp(src)
  .extract(CROP)
  .png()
  .toBuffer();

console.log(`Isotipo extraído: ${CROP.width}x${CROP.height} (sin texto)`);

// Regular PWA icons
const icons = [
  { file: "pwa-64x64.png",        size: 64  },
  { file: "pwa-192x192.png",      size: 192 },
  { file: "pwa-512x512.png",      size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const icon of icons) {
  await sharp(isotipoBuffer)
    .resize(icon.size, icon.size, { fit: "contain", background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(join(out, icon.file));
  console.log(`✓ ${icon.file} (${icon.size}x${icon.size})`);
}

// maskable-icon-512x512: icon in safe zone (icon occupies ≤76% of canvas)
{
  const SIZE    = 512;
  const PADDING = Math.round(SIZE * 0.13); // 66px each side → icon at 74% safe zone
  const INNER   = SIZE - PADDING * 2;      // 380px

  await sharp(isotipoBuffer)
    .resize(INNER, INNER, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: PADDING, bottom: PADDING, left: PADDING, right: PADDING, background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(join(out, "maskable-icon-512x512.png"));
  console.log(`✓ maskable-icon-512x512.png (${SIZE}x${SIZE}, padding ${PADDING}px)`);
}

// favicon-32x32
await sharp(isotipoBuffer)
  .resize(32, 32, { fit: "contain", background: BG })
  .flatten({ background: BG })
  .png()
  .toFile(join(out, "favicon-32x32.png"));
console.log("✓ favicon-32x32.png");

console.log("\nDone! Iconos PWA generados en public/");
