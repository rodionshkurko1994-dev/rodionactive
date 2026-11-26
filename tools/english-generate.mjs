// «Англійська щодня»: генерує набір (5 слів + 5 висловів) на сьогодні й завтра за Києвом,
// якщо його ще немає, і записує data/english/days/<дата>.json та data/english/index.json.
//
// Ключ: ANTHROPIC_API_KEY (Claude) або OPENAI_API_KEY (+ OPENAI_MODEL). Модель Claude: ENGLISH_MODEL.
// Запуск: node tools/english-generate.mjs [--date 2026-12-01] [--dry]
// ENGLISH_API — інша адреса API (для тестів).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data/english/days");
mkdirSync(dir, { recursive: true });
const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const DRY = process.argv.includes("--dry");

const kyivDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kiev", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const LEVELS = ["A2", "A2", "B1", "B1", "B2"]; // мікс рівнів: 2 простіші, 2 середні, 1 складніше
const norm = s => String(s || "").toLowerCase().replace(/[^a-z' ]/g, "").trim();

function history() {
  const files = existsSync(dir) ? readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
  const days = files.map(f => JSON.parse(readFileSync(join(dir, f), "utf8")));
  return {
    dates: files.map(f => f.slice(0, 10)),
    words: new Set(days.flatMap(d => d.words.map(w => norm(w.word)))),
    phrases: new Set(days.flatMap(d => d.phrases.map(p => norm(p.phrase)))),
    recentWords: days.slice(-120).flatMap(d => d.words.map(w => w.word)),
    recentPhrases: days.slice(-60).flatMap(d => d.phrases.map(p => p.phrase)),
  };
}

function prompt(date, h, avoidExtra = []) {
  return `Ти — досвідчений викладач англійської для українців. Склади набір «Англійська щодня» на ${date}.

Потрібно рівно 5 англійських слів і рівно 5 англійських висловів (фраз, ідіом, розмовних конструкцій), корисних у реальному житті: робота, подорожі, побут, спілкування, технології, покупки, здоров'я, емоції. Обирай різні теми в межах дня.
Рівні по порядку для слів: ${LEVELS.join(", ")}. Для висловів так само: ${LEVELS.join(", ")}.

Вимоги:
- Британська вимова в IPA у косих дужках, наприклад "/ˈʃedjuːl/".
- Переклад — природна сучасна українська, без русизмів і кальок; кілька значень через кому.
- Приклад англійською — коротке живе речення (до 14 слів), бажано з українськими реаліями; приклад_uk — його природний переклад.
- usage для висловів — одне коротке речення українською: коли це кажуть.
- pos — одне з: noun, verb, adjective, adverb, phrasal verb, preposition, conjunction.
- Не використовуй ці слова: ${[...h.recentWords, ...avoidExtra].join(", ") || "—"}.
- Не використовуй ці вислови: ${h.recentPhrases.join(" | ") || "—"}.
- Жодних образливих, політичних чи релігійних тем.

Відповідь — ЛИШЕ JSON без пояснень і без markdown, у форматі:
{"words":[{"word":"","ipa":"","pos":"","level":"","uk":"","example":"","example_uk":""}],"phrases":[{"phrase":"","level":"","uk":"","usage":"","example":"","example_uk":""}]}`;
}

async function ask(text) {
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch(process.env.ENGLISH_API || "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ENGLISH_MODEL || "claude-haiku-5-5", max_tokens: 3000, messages: [{ role: "user", content: text }] }),
      signal: AbortSignal.timeout(120000),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${(j.error && j.error.message) || ""}`);
    return (j.content || []).map(c => c.text || "").join("");
  }
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch(process.env.ENGLISH_API || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", messages: [{ role: "user", content: text }], response_format: { type: "json_object" } }),
      signal: AbortSignal.timeout(120000),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${(j.error && j.error.message) || ""}`);
    return j.choices[0].message.content;
  }
  throw new Error("NO_KEY");
}

const str = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
function validate(data, h) {
  const errs = [];
  if (!data || !Array.isArray(data.words) || data.words.length !== 5) errs.push("потрібно рівно 5 слів");
  if (!data || !Array.isArray(data.phrases) || data.phrases.length !== 5) errs.push("потрібно рівно 5 висловів");
  if (errs.length) return { errs };
  const words = data.words.map((w, i) => ({
    word: String(w.word || "").trim(), ipa: String(w.ipa || "").trim(), pos: String(w.pos || "").trim().toLowerCase(),
    level: LEVELS[i], uk: String(w.uk || "").trim(), example: String(w.example || "").trim(), example_uk: String(w.example_uk || "").trim(),
  }));
  const phrases = data.phrases.map((p, i) => ({
    phrase: String(p.phrase || "").trim(), level: LEVELS[i], uk: String(p.uk || "").trim(), usage: String(p.usage || "").trim(),
    example: String(p.example || "").trim(), example_uk: String(p.example_uk || "").trim(),
  }));
  const dupes = [];
  words.forEach((w, i) => {
    if (!str(w.word, 40) || !/^[A-Za-z' -]+$/.test(w.word)) errs.push(`слово ${i + 1}: некоректне`);
    if (!/^\/.+\/$/.test(w.ipa) || w.ipa.length > 40) errs.push(`слово ${i + 1}: транскрипція`);
    if (!str(w.uk, 100) || !/[а-яіїєґ]/i.test(w.uk)) errs.push(`слово ${i + 1}: переклад`);
    if (!str(w.example, 140) || !str(w.example_uk, 180)) errs.push(`слово ${i + 1}: приклад`);
    if (!w.example.toLowerCase().includes(w.word.toLowerCase().split(" ")[0].slice(0, Math.max(3, w.word.length - 3)))) errs.push(`слово ${i + 1}: приклад без слова`);
    if (h.words.has(norm(w.word))) dupes.push(w.word);
  });
  phrases.forEach((p, i) => {
    if (!str(p.phrase, 80) || !/^[A-Za-z0-9'’.,!?…\- ]+$/.test(p.phrase)) errs.push(`вислів ${i + 1}: некоректний`);
    if (!str(p.uk, 120) || !str(p.usage, 160) || !str(p.example, 160) || !str(p.example_uk, 200)) errs.push(`вислів ${i + 1}: неповний`);
    if (h.phrases.has(norm(p.phrase))) dupes.push(p.phrase);
  });
  if (new Set(words.map(w => norm(w.word))).size < 5) errs.push("повтор слів у наборі");
  if (dupes.length) errs.push(`уже були: ${dupes.join(", ")}`);
  return { errs, dupes, words, phrases };
}

async function generate(date) {
  const h = history();
  let avoid = [];
  for (let attempt = 1; attempt <= 4; attempt++) {
    const raw = await ask(prompt(date, h, avoid));
    let data = null;
    try { data = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); } catch { /* нижче */ }
    const v = validate(data, h);
    if (!v.errs.length) return { date, source: "ai", words: v.words, phrases: v.phrases };
    console.log(`  спроба ${attempt}: ${v.errs.slice(0, 4).join("; ")}`);
    avoid = avoid.concat(v.dupes || []);
  }
  throw new Error(`не вдалося отримати коректний набір на ${date}`);
}

const today = kyivDate();
const targets = arg("--date") ? [arg("--date")] : [today, addDays(today, 1)];
let made = 0, failed = 0;
for (const date of targets) {
  const file = join(dir, `${date}.json`);
  if (existsSync(file)) { console.log(`${date}: уже є`); continue; }
  try {
    const day = await generate(date);
    if (!DRY) writeFileSync(file, JSON.stringify(day, null, 1) + "\n");
    console.log(`${date}: ${day.words.map(w => w.word).join(", ")} | ${day.phrases.map(p => p.phrase).join(" | ")}`);
    made++;
  } catch (e) {
    console.error(`${date}: ${e.message === "NO_KEY" ? "немає ключа API (ANTHROPIC_API_KEY або OPENAI_API_KEY)" : e.message}`);
    failed++;
    if (e.message === "NO_KEY") break;
  }
}
const dates = readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort();
if (!DRY) writeFileSync(join(root, "data/english/index.json"), JSON.stringify({ _readme: "Англійська щодня: data/english/days/<дата>.json генерує tools/english-generate.mjs (GitHub Action english.yml).", dates }, null, 1) + "\n");
console.log(`Згенеровано: ${made}, помилок: ${failed}. Днів у архіві: ${dates.length}.`);
// помилка генерації не валить збірку: сторінка покаже останній доступний день
if (failed && !made && !dates.includes(today)) process.exitCode = 1;
