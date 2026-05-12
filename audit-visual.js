const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "audit-results");
fs.mkdirSync(OUT_DIR, { recursive: true });

const pages = [
  { name: "login", url: "https://www.fcstatspro.com/login" },
  { name: "public-tournament", url: "https://www.fcstatspro.com/public/tournaments/kktteam" },
];

const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 1000 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const viewport of viewports) {
    for (const pageInfo of pages) {
      const page = await browser.newPage({ viewport });

      const consoleErrors = [];
      page.on("console", (msg) => {
        if (["error", "warning"].includes(msg.type())) {
          consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
        }
      });

      await page.goto(pageInfo.url, { waitUntil: "networkidle", timeout: 60000 });

      const fileName = `${pageInfo.name}-${viewport.name}.png`;
      await page.screenshot({
        path: path.join(OUT_DIR, fileName),
        fullPage: true,
      });

      report.push(`## ${pageInfo.name} — ${viewport.name}`);
      report.push(`URL: ${pageInfo.url}`);
      report.push(`Screenshot: ${fileName}`);
      report.push("");
      report.push("Console:");
      report.push(consoleErrors.length ? consoleErrors.join("\n") : "Sin errores visibles en consola.");
      report.push("\n---\n");

      await page.close();
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(OUT_DIR, "AUDIT-REPORT.md"),
    `# FC Stats Pro Visual Audit\n\n${report.join("\n")}`,
    "utf8"
  );

  console.log("✅ Auditoría generada en audit-results/");
})();