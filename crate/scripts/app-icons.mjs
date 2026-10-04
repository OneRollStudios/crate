// Renders the app icons from public/favicon.svg (the crate mark):
//   favicon.ico (16 and 32 px), apple-touch-icon.png (180), icon-192.png, icon-512.png
// Run after changing the mark: node scripts/app-icons.mjs
// Uses Playwright's bundled Chromium, or CHROMIUM_PATH if set.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const pub = fileURLToPath(new URL("../public/", import.meta.url));
const mark = readFileSync(`${pub}favicon.svg`, "utf8");
// iOS rounds the apple icon itself and fills transparent corners with black,
// so that one is drawn full bleed (square corners).
const fullBleed = mark.replace(/rx="[^"]*"/, 'rx="0"');

const chromiumPath = process.env.CHROMIUM_PATH || undefined;
if (chromiumPath && !existsSync(chromiumPath)) throw new Error(`CHROMIUM_PATH does not exist: ${chromiumPath}`);

async function render(page, svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  return page.locator("svg").screenshot({ omitBackground: true, type: "png" });
}

// ICO with PNG-encoded images (supported by all current browsers and Windows).
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.png)]);
}

const browser = await chromium.launch({ headless: true, executablePath: chromiumPath });
try {
  const page = await browser.newPage();
  const small = [];
  for (const size of [16, 32]) small.push({ size, png: await render(page, mark, size) });
  writeFileSync(`${pub}favicon.ico`, ico(small));
  writeFileSync(`${pub}apple-touch-icon.png`, await render(page, fullBleed, 180));
  writeFileSync(`${pub}icon-192.png`, await render(page, mark, 192));
  writeFileSync(`${pub}icon-512.png`, await render(page, mark, 512));
  console.log("Wrote favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png");
} finally {
  await browser.close();
}
