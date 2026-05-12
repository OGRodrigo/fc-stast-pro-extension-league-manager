import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "public/images/logo-league-manager.png");
const out = join(__dirname, "public");

const icons = [
  { file: "pwa-64x64.png",           size: 64  },
  { file: "pwa-192x192.png",          size: 192 },
  { file: "pwa-512x512.png",          size: 512 },
  { file: "apple-touch-icon.png",     size: 180 },
  { file: "maskable-icon-512x512.png",size: 512, padding: 0.1 },
];

if (!existsSync(out)) mkdirSync(out, { recursive: true });

for (const icon of icons) {
  const dest = join(out, icon.file);
  let pipeline = sharp(src).resize(icon.size, icon.size, { fit: "contain", background: { r: 6, g: 11, b: 18, alpha: 1 } });

  if (icon.padding) {
    const innerSize = Math.round(icon.size * (1 - icon.padding * 2));
    pipeline = sharp(src)
      .resize(innerSize, innerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.round(icon.size * icon.padding),
        bottom: Math.round(icon.size * icon.padding),
        left: Math.round(icon.size * icon.padding),
        right: Math.round(icon.size * icon.padding),
        background: { r: 6, g: 11, b: 18, alpha: 1 },
      });
  }

  await pipeline.png().toFile(dest);
  console.log(`✓ ${icon.file} (${icon.size}x${icon.size})`);
}

// favicon.ico — use 32x32 PNG renamed (browsers accept PNG as favicon)
await sharp(src)
  .resize(32, 32, { fit: "contain", background: { r: 6, g: 11, b: 18, alpha: 1 } })
  .png()
  .toFile(join(out, "favicon-32x32.png"));
console.log("✓ favicon-32x32.png");

console.log("\nDone! Icons generated in public/");
