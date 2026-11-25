// Рейтинг швидкості сайтів України: збирає оцінки Google Lighthouse (PageSpeed Insights, мобільна версія)
// для сайтів з data/rating/sites.json і записує data/rating/<рік-місяць>.json та data/rating/latest.json.
//
// Кожен сайт перевіряється RUNS разів, у рейтинг іде медіанний результат (швидкість коливається між запусками).
// Запуск: node tools/rating-collect.mjs            (усі сайти)
//         node tools/rating-collect.mjs --limit 5  (перші 5 — для перевірки)
// Ключ: змінна PSI_KEY або ключ з assets/js/tools-app.js (він обмежений сайтом rodionactive.com,
// тому запити йдуть із заголовком Referer цього сайту).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data/rating");
const RUNS = Number(process.env.RATING_RUNS || 3);
const CONCURRENCY = Number(process.env.RATING_CONCURRENCY || 5);
const TIMEOUT = 150_000;
const API = process.env.PSI_API || "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const KEY = process.env.PSI_KEY || (readFileSync(join(root, "assets/js/tools-app.js"), "utf8").match(/const PSI_KEY = "([^"]*)"/) || [])[1] || "";
const CATS = ["performance", "seo", "accessibility", "best-practices"];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const median = xs => { const s = xs.filter(x => typeof x === "number").sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

async function psi(url) {
  const q = new URLSearchParams({ url, strategy: "mobile" });
  CATS.forEach(c => q.append("category", c.toUpperCase().replace("-", "_")));
  if (KEY) q.set("key", KEY);
  for (let attempt = 0; ; attempt++) {
    let res, json;
    try {
      res = await fetch(`${API}?${q}`, { headers: { referer: "https://rodionactive.com/reitynh-saitiv/" }, signal: AbortSignal.timeout(TIMEOUT) });
      json = await res.json().catch(() => ({}));
    } catch (e) {
      if (attempt < 2) { await sleep(15000); continue; }
      throw new Error(e.name === "TimeoutError" ? "TIMEOUT" : "NETWORK");
    }
    if (res.ok) {
      const lh = json.lighthouseResult || {};
      if (lh.runtimeError && lh.runtimeError.code && lh.runtimeError.code !== "NO_ERROR") throw new Error(lh.runtimeError.code);
      const A = lh.audits || {}, C = lh.categories || {};
      const score = id => C[id] && typeof C[id].score === "number" ? Math.round(C[id].score * 100) : null;
      const num = id => A[id] && typeof A[id].numericValue === "number" ? A[id].numericValue : null;
      // сайт віддав Google сторінку-заглушку (блок за країною, капча, «доступ заборонено»):
      // код помилки або заборона індексації — така сторінка «швидка», але це не сам сайт
      if ((A["http-status-code"] && A["http-status-code"].score === 0) || (A["is-crawlable"] && A["is-crawlable"].score === 0)) throw new Error("BLOCKED");
      if (score("performance") === null) throw new Error("NO_SCORE");
      return {
        perf: score("performance"), seo: score("seo"), a11y: score("accessibility"), bp: score("best-practices"),
        lcp: num("largest-contentful-paint"), fcp: num("first-contentful-paint"), tbt: num("total-blocking-time"),
        cls: num("cumulative-layout-shift"), si: num("speed-index"),
        finalUrl: lh.finalDisplayedUrl || lh.finalUrl || url, lighthouse: lh.lighthouseVersion || "",
      };
    }
    const msg = (json.error && json.error.message) || `HTTP ${res.status}`;
    // сайт не відкрився в Lighthouse — повторювати запит до API марно
    const code = (msg.match(/\b(FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS_FAILURE|NO_FCP|NOT_HTML|PAGE_HUNG|INSECURE_DOCUMENT_REQUEST|NO_NAVSTART|ERRORED_REQUIRED_ARTIFACT)\b/) || [])[1];
    // 429 і решта 5xx — тимчасово: чекаємо й пробуємо ще
    if (!code && (res.status === 429 || res.status >= 500) && attempt < 3) { await sleep(res.status === 429 ? 60000 : 20000 * (attempt + 1)); continue; }
    throw new Error(code || (res.status === 400 && /API key/i.test(msg) ? "API_KEY" : `HTTP_${res.status}`));
  }
}

async function checkSite(site) {
  const runs = [], errors = [];
  for (let i = 0; i < RUNS; i++) {
    try { runs.push(await psi(site.url)); } catch (e) {
      errors.push(e.message);
      if (e.message === "API_KEY") throw e;
      if (e.message === "BLOCKED") break; // заглушка не зміниться від повтору
      if (!runs.length && i === 1) break; // двічі поспіль не відкрився — далі не мучимо
    }
  }
  if (!runs.length) return { ...site, ok: false, error: errors[errors.length - 1] || "UNKNOWN" };
  // базовий запуск — той, що має медіанну оцінку швидкості; його метрики беремо цілком, щоб вони були узгоджені
  const sorted = runs.slice().sort((a, b) => (a.perf ?? -1) - (b.perf ?? -1));
  const mid = sorted[Math.floor((sorted.length - 1) / 2)];
  const r1 = v => v === null ? null : Math.round(v);
  return {
    ...site, ok: true, runs: runs.length,
    perf: mid.perf, seo: median(runs.map(r => r.seo)), a11y: median(runs.map(r => r.a11y)), bp: median(runs.map(r => r.bp)),
    lcp: r1(mid.lcp), fcp: r1(mid.fcp), tbt: r1(mid.tbt), si: r1(mid.si), cls: mid.cls === null ? null : Math.round(mid.cls * 1000) / 1000,
    finalUrl: mid.finalUrl !== site.url ? mid.finalUrl : undefined,
    _lh: mid.lighthouse,
  };
}

const list = JSON.parse(readFileSync(join(dir, "sites.json"), "utf8"));
const sites = list.categories.flatMap(c => c.sites.map(s => ({ name: s.name, url: s.url, cat: c.name }))).slice(0, LIMIT);
const prev = existsSync(join(dir, "latest.json")) ? JSON.parse(readFileSync(join(dir, "latest.json"), "utf8")) : null;
console.log(`Сайтів: ${sites.length}, запусків на сайт: ${RUNS}, паралельно: ${CONCURRENCY}${KEY ? "" : " (без ключа API!)"}`);

const results = new Array(sites.length);
let next = 0, done = 0;
const t0 = Date.now();
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, sites.length) }, async () => {
  while (next < sites.length) {
    const i = next++;
    results[i] = await checkSite(sites[i]);
    done++;
    const r = results[i];
    console.log(`[${done}/${sites.length}] ${r.ok ? String(r.perf).padStart(3) : "  ✕"}  ${r.name} — ${r.ok ? `LCP ${(r.lcp / 1000).toFixed(1)} с` : r.error}  (${Math.round((Date.now() - t0) / 1000)} с)`);
  }
}));

const ok = results.filter(r => r.ok);
if (!ok.length) { console.error("Жоден сайт не перевірено — рейтинг не оновлюю."); process.exit(1); }
if (ok.length < results.length * 0.5) { console.error(`Перевірено лише ${ok.length} з ${results.length} — схоже на збій API, рейтинг не оновлюю.`); process.exit(1); }

const now = new Date();
const month = now.toISOString().slice(0, 7);
const prevByUrl = new Map(prev && prev.month !== month ? prev.sites.filter(s => s.ok).map(s => [s.url, s.perf]) : (prev && prev.prevByUrl ? Object.entries(prev.prevByUrl) : []));
const lighthouse = ok.map(r => r._lh).find(Boolean) || "";
const data = {
  month,
  generated: now.toISOString(),
  strategy: "mobile",
  runs: RUNS,
  lighthouse,
  prevMonth: prev ? (prev.month !== month ? prev.month : prev.prevMonth || null) : null,
  // оцінки попереднього місяця зберігаємо, щоб повторний запуск у тому ж місяці не втрачав порівняння
  prevByUrl: Object.fromEntries(prevByUrl),
  sites: results.map(({ _lh, ...r }) => ({ ...r, prev: r.ok && prevByUrl.has(r.url) ? prevByUrl.get(r.url) : undefined })),
};
mkdirSync(dir, { recursive: true });
const text = JSON.stringify(data, null, 1) + "\n";
writeFileSync(join(dir, `${month}.json`), text);
writeFileSync(join(dir, "latest.json"), text);
console.log(`Готово за ${Math.round((Date.now() - t0) / 60000)} хв: перевірено ${ok.length}, не вдалося ${results.length - ok.length}. Записано data/rating/${month}.json`);
