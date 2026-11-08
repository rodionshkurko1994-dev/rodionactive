// Фірмова обкладинка статті (1600×840, JPEG): назва + тематичний предмет праворуч (власні SVG, без чужих фото).
// Запуск: node tools/cover.mjs "Назва статті" "тег" assets/uploads/file.jpg
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { DEFS, objectSvg, OBJECT_NAMES } from "./cover-objects.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const font = f => "data:font/woff2;base64," + readFileSync(join(root, "tools/fonts", f)).toString("base64");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function html(title, tag, object) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:U;font-weight:600;src:url(${font("unbounded-cyrillic-600-normal.woff2")}) format("woff2");unicode-range:U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
@font-face{font-family:U;font-weight:600;src:url(${font("unbounded-latin-600-normal.woff2")}) format("woff2")}
@font-face{font-family:O;font-weight:500;src:url(${font("onest-cyrillic-500-normal.woff2")}) format("woff2");unicode-range:U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
@font-face{font-family:O;font-weight:500;src:url(${font("onest-latin-500-normal.woff2")}) format("woff2")}
*{box-sizing:border-box;margin:0}
body{width:1600px;height:840px;overflow:hidden;background:#383e65;color:#fff;font-family:O,sans-serif;position:relative}
.grid{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.13) 1.5px,transparent 1.6px);background-size:40px 40px;mask-image:linear-gradient(100deg,transparent 30%,#000 85%)}
svg.hud{position:absolute;right:-60px;top:50%;transform:translateY(-50%);width:760px;height:760px;opacity:.75}
.glow{position:absolute;right:30px;top:50%;width:640px;height:640px;transform:translateY(-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,110,39,.42) 0%,rgba(255,110,39,.16) 38%,rgba(255,110,39,0) 68%)}
svg.obj{position:absolute;right:70px;top:50%;transform:translateY(-52%);width:520px;height:520px;filter:drop-shadow(0 34px 34px rgba(10,12,30,.55)) drop-shadow(0 0 26px rgba(255,140,80,.35))}
.brand{position:absolute;left:96px;top:72px;font:600 34px U,sans-serif;letter-spacing:-.02em}
.brand i{font-style:normal;color:#ff6e27}
h1{position:absolute;left:96px;top:170px;width:860px;height:470px;display:flex;align-items:center;font:600 72px/1.12 U,sans-serif;letter-spacing:-.025em;text-wrap:balance}
.foot{position:absolute;left:96px;right:96px;bottom:68px;display:flex;justify-content:space-between;align-items:center;font-size:28px}
.chip{border:2px solid #ff6e27;color:#ff6e27;border-radius:999px;padding:10px 26px}
.url{opacity:.7}
.bar{position:absolute;left:96px;top:146px;width:120px;height:6px;background:#ff6e27;border-radius:3px}
</style></head><body>
<div class="grid"></div>
<svg class="hud" viewBox="0 0 200 200" fill="none" stroke-linecap="round">
  <circle cx="100" cy="100" r="96" stroke="rgba(255,255,255,.12)" stroke-width=".6"/>
  <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,.18)" stroke-width="1.2" stroke-dasharray="2 4"/>
  <path d="M100 36 A64 64 0 0 1 164 100" stroke="#ff6e27" stroke-width="3"/>
  <path d="M36 100 A64 64 0 0 1 60 50" stroke="#ff6e27" stroke-width="1.5" opacity=".7"/>
  <circle cx="100" cy="100" r="46" stroke="rgba(255,255,255,.25)" stroke-width=".8"/>
  <path d="M100 54 A46 46 0 0 0 54 100" stroke="#fff" stroke-width="1.6" opacity=".55"/>
</svg>
<div class="glow"></div>
<svg class="obj" viewBox="0 0 400 400"><defs>${DEFS}</defs>${objectSvg(object)}</svg>
<div class="brand">Rodionactive<i>.</i></div>
<div class="bar"></div>
<h1 id="t">${esc(title)}</h1>
<div class="foot">${tag ? `<span class="chip">#${esc(tag)}</span>` : "<span></span>"}<span class="url">rodionactive.com/blog</span></div>
</body></html>`;
}

export async function renderCover(title, tag, out, object) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 840 } });
    await page.setContent(html(title, tag, object), { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const h = document.getElementById("t");
      let size = 76;
      h.style.alignItems = "flex-start";
      while (size > 40 && (h.scrollHeight > h.clientHeight || h.scrollWidth > h.clientWidth)) {
        size -= 2;
        h.style.fontSize = size + "px";
      }
      h.style.alignItems = "center";
    });
    await page.screenshot({ path: out, type: "jpeg", quality: 86 });
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === "--list") { console.log(OBJECT_NAMES.join("\n")); process.exit(0); }
  const [title, tag, out, object] = process.argv.slice(2);
  if (!title || !out) { console.error('Використання: node tools/cover.mjs "Назва" "тег" out.jpg [предмет]   (список: --list)'); process.exit(1); }
  await renderCover(title, tag, resolve(out), object);
  console.log(out);
}
