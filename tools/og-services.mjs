// Картинки для соцмереж (Open Graph) сторінок послуг: node tools/og-services.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { SERVICES, ILLU } = require(join(root, "assets/js/services.js"));
const font = f => "data:font/woff2;base64," + readFileSync(join(root, "tools/fonts", f)).toString("base64");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const css = `
@font-face{font-family:Unbounded;src:url(${font("unbounded-cyrillic-600-normal.woff2")});unicode-range:U+0400-04FF}
@font-face{font-family:Unbounded;src:url(${font("unbounded-latin-600-normal.woff2")})}
@font-face{font-family:O;src:url(${font("onest-cyrillic-500-normal.woff2")});unicode-range:U+0400-04FF}
@font-face{font-family:O;src:url(${font("onest-latin-500-normal.woff2")})}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:#fff;font-family:O,sans-serif;position:relative;overflow:hidden}
.brand{position:absolute;left:72px;top:64px;font:600 30px Unbounded;color:#383e65;letter-spacing:-.02em}.brand i{font-style:normal;color:#ff6e27}
.code{position:absolute;left:72px;top:150px;font:500 20px monospace;color:#5d6286;letter-spacing:.12em}
h1{position:absolute;left:72px;top:190px;width:560px;font:600 54px/1.12 Unbounded;letter-spacing:-.03em;color:#000}
.url{position:absolute;left:72px;bottom:62px;font-size:22px;color:#383e65;padding:12px 22px;background:#f4f5f9;border-radius:999px}
.ill{position:absolute;right:48px;top:50%;transform:translateY(-50%);width:520px;height:440px;background:#f4f5f9;border-radius:28px;padding:30px}
.ill svg{width:100%;height:100%}`;
const { chromium } = require("playwright");
mkdirSync(join(root, "assets/img/services"), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const x of SERVICES) {
  await page.setContent(`<html><head><style>${css}</style></head><body><div class="brand">Rodionactive<i>.</i></div><div class="code">${esc(x.code)}</div><h1>${esc(x.h1)}</h1><div class="url">rodionactive.com/services</div><div class="ill">${ILLU[x.illu]}</div></body></html>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    const h = document.querySelector("h1"); let s = 54;
    while (h.offsetHeight > 280 && s > 34) h.style.fontSize = (s -= 2) + "px";
  });
  await page.screenshot({ path: join(root, `assets/img/services/${x.slug}.png`) });
  console.log(x.slug);
}
await browser.close();
