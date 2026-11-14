// Публікує нові статті блогу в Telegram-канал (запускає GitHub Actions після змін у data/posts.json).
// Змінні: TELEGRAM_BOT_TOKEN (секрет репозиторію), TELEGRAM_CHAT (@канал), BEFORE (попередній коміт),
// SLUG (ручний запуск для однієї статті), DRY_RUN=1 (лише показати текст).
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://rodionactive.com";
const CHANNEL_URL = "https://t.me/rodionactive_online";
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT: chat = "@rodionactive_online", BEFORE = "", SLUG = "", DRY_RUN } = process.env;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const live = list => list.filter(p => p && p.slug && !p.draft);

const posts = live(JSON.parse(readFileSync(join(root, "data/posts.json"), "utf8")));
let fresh;
if (SLUG) {
  fresh = posts.filter(p => p.slug === SLUG.trim());
  if (!fresh.length) { console.error("Статтю з таким slug не знайдено: " + SLUG); process.exit(1); }
} else {
  let old;
  try {
    if (!/^[0-9a-f]{40}$/.test(BEFORE) || /^0+$/.test(BEFORE)) throw new Error("немає попереднього коміту");
    old = live(JSON.parse(execFileSync("git", ["show", `${BEFORE}:data/posts.json`], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })));
  } catch (e) {
    console.log("Не вдалося прочитати попередню версію статей (" + e.message.split("\n")[0] + ") — нічого не публікую.");
    process.exit(0);
  }
  const known = new Set(old.map(p => p.slug));
  fresh = posts.filter(p => !known.has(p.slug)).reverse().slice(-3); // від старішої до новішої, не більше 3 за раз
}
if (!fresh.length) { console.log("Нових статей немає."); process.exit(0); }
if (!token && !DRY_RUN) { console.error("Немає секрету TELEGRAM_BOT_TOKEN: додайте його в Settings → Secrets and variables → Actions."); process.exit(1); }

async function waitLive(url) {
  for (let i = 0; i < 28; i++) {
    try { if ((await fetch(url, { redirect: "follow", cache: "no-store" })).ok) return true; } catch {}
    await sleep(15000);
  }
  return false;
}

let failed = 0;
for (const p of fresh) {
  const url = `${SITE}/blog/${p.slug}/`;
  const text = `<a href="${CHANNEL_URL}">Rodionactive</a>`; // назву й опис показує саме прев'ю
  if (DRY_RUN) { console.log(text + "\n---"); continue; }

  if (!(await waitLive(url))) { console.error("Сторінка ще не опублікована: " + url); failed++; continue; }
  await sleep(30000); // щоб Telegram точно побачив сторінку з обкладинкою
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat, text, parse_mode: "HTML",
      link_preview_options: { url, prefer_large_media: true, show_above_text: true },
    }),
  }).then(r => r.json()).catch(e => ({ ok: false, description: e.message }));
  if (res.ok) console.log("Опубліковано в Telegram: " + p.title);
  else { console.error(`Telegram відхилив «${p.title}»: ${res.description}`); failed++; }
  await sleep(3000);
}
process.exit(failed ? 1 : 0);
