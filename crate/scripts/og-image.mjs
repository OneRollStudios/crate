// Renders the 1200x630 share image (Open Graph / Twitter) to public/og.png.
// Uses the site's own fonts and colors, so it can be regenerated after copy
// or brand changes: node scripts/og-image.mjs
// Uses Playwright's bundled Chromium, or CHROMIUM_PATH if set.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
// Embedded as data URLs: a page built with setContent cannot load file:// fonts.
const font = (file) => `data:font/ttf;base64,${readFileSync(`${root}public/fonts/ors/${file}`).toString("base64")}`;
const out = `${root}public/og.png`;

const chromiumPath = process.env.CHROMIUM_PATH || undefined;
if (chromiumPath && !existsSync(chromiumPath)) throw new Error(`CHROMIUM_PATH does not exist: ${chromiumPath}`);

// All text here is existing site copy. Copy rules apply: no em dashes, no stats.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Inter Display";src:url("${font("InterDisplay-Medium.ttf")}") format("truetype");font-weight:500}
@font-face{font-family:"Inter Display";src:url("${font("InterDisplay-ExtraBold.ttf")}") format("truetype");font-weight:800}
@font-face{font-family:"Inter";src:url("${font("Inter-Variable.ttf")}") format("truetype");font-weight:100 900}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#f6f4ed;color:#0a0e1a;font-family:"Inter",sans-serif;display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;position:relative;overflow:hidden}
.logo{font-family:"Inter Display";font-weight:800;font-size:58px;letter-spacing:-.06em;line-height:1}
.logo span{color:#6d831a}
h1{font-family:"Inter Display";font-weight:500;font-size:70px;letter-spacing:-.05em;line-height:1.05;max-width:640px}
h1 span{color:#607913}
p{font-size:26px;color:#4a5060;margin-top:22px;letter-spacing:-.01em}
.foot{display:flex;justify-content:space-between;align-items:center;font-size:20px;color:#4a5060}
.foot strong{color:#0a0e1a;font-weight:600}
.board{position:absolute;right:72px;top:150px;width:360px;display:flex;flex-direction:column;gap:18px}
.card{background:#fcfcf7;border:1px solid #cbd2ba;border-radius:3px;padding:20px 22px;box-shadow:0 10px 24px #20251b10;font-size:19px}
.dots{display:flex;gap:8px;align-items:center}
.dots i{width:10px;height:10px;border-radius:50%;background:#607913}
.dots b{font-weight:400;color:#4a5060;margin-left:10px}
.tool{display:flex;align-items:center;gap:12px;background:#eaece0;border-radius:3px;padding:12px 14px}
.tool i{width:18px;height:18px;border:2px solid #607913;border-right-color:transparent;border-radius:50%}
.lime{height:12px;background:#d4ff3d;position:absolute;left:0;right:0;bottom:0}
</style></head><body>
<div class="logo">crate<span>.</span></div>
<div><h1>Your AI Builds the Product.<br><span>Crate Brings the UI.</span></h1>
<p>Ready-made components for AI products.</p></div>
<div class="foot"><strong>crate.onerollstudios.com</strong><span>Made by One Roll Studios</span></div>
<div class="board">
<div class="card"><div class="dots"><i></i><i></i><i></i><b>Thinking…</b></div></div>
<div class="card"><div class="tool"><i></i>Searching the web…</div></div>
</div>
<div class="lime"></div>
</body></html>`;

const browser = await chromium.launch({ headless: true, executablePath: chromiumPath });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const face of ["500 70px \"Inter Display\"", "800 58px \"Inter Display\"", "400 26px Inter"]) {
      if (!document.fonts.check(face)) throw new Error(`Font did not load: ${face}`);
    }
  });
  await page.screenshot({ path: out, type: "png" });
  console.log(`Wrote ${out}`);
} finally {
  await browser.close();
}
