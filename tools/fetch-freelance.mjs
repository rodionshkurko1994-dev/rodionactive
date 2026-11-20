// Індекс ринку фрілансу: щодня збирає нові проєкти з Freelancehunt API і рахує статистику.
// Запуск: FREELANCEHUNT_TOKEN=... node tools/fetch-freelance.mjs <папка-з-даними>
// У папці зберігаються freelance-projects.json (сирі дані за 120 днів, лише цифри й навички,
// без описів і замовників) і freelance-index.json (готова статистика для сторінки
// /instrumenty/indeks-rynku-frilansu/). Працює в GitHub Actions (.github/workflows/data.yml).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = process.argv[2] || ".";
const TOKEN = process.env.FREELANCEHUNT_TOKEN;
const RAW = join(DIR, "freelance-projects.json");
const OUT = join(DIR, "freelance-index.json");
const KEEP_DAYS = 120, MAX_PAGES = 60;
const DAY = 864e5;

if (!TOKEN) {
  console.log("::warning::Немає секрету FREELANCEHUNT_TOKEN — індекс ринку фрілансу не оновлено. Створіть ключ на https://freelancehunt.com/my/api2 і додайте його в Settings → Secrets → Actions.");
  process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { authorization: `Bearer ${TOKEN}`, "accept-language": "uk", accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    if (res.status === 429) { await sleep(60000); continue; }
    if (!res.ok) throw new Error(`Freelancehunt API: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
  throw new Error("Freelancehunt API: забагато запитів (429)");
}

// курси НБУ для переведення бюджетів у гривні
async function rates() {
  const r = { UAH: 1, USD: 41.5, EUR: 48 };
  try {
    const res = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json", { signal: AbortSignal.timeout(15000) });
    for (const x of await res.json()) if (x.cc && x.rate) r[x.cc] = x.rate;
  } catch (e) { console.log("Курси НБУ недоступні, беру запасні:", e.message); }
  return r;
}

const store = existsSync(RAW) ? JSON.parse(readFileSync(RAW, "utf8")) : { projects: [] };
const byId = new Map(store.projects.map(p => [p.id, p]));
const lastRun = store.updated ? Date.parse(store.updated) : 0;

// ---------- збір ----------
let url = "https://api.freelancehunt.com/v2/projects", pages = 0, added = 0;
while (url && pages < MAX_PAGES) {
  const j = await api(url);
  pages++;
  const items = j.data || [];
  let oldest = Infinity, allKnown = true;
  for (const it of items) {
    const a = it.attributes || {};
    const t = Date.parse(a.published_at || "");
    if (!t) continue;
    oldest = Math.min(oldest, t);
    const rec = {
      id: it.id,
      t: a.published_at.slice(0, 10),
      s: (a.skills || []).map(s => s.name).filter(Boolean),
      b: a.budget?.amount || 0,
      c: a.budget?.currency || "",
      n: a.bid_count || 0,
    };
    if (!byId.has(rec.id)) { added++; allKnown = false; }
    byId.set(rec.id, rec); // оновлюємо кількість ставок
  }
  if (!items.length) break;
  // зупиняємося, коли дійшли до проєктів, які вже бачили минулого разу
  if (lastRun && allKnown && oldest < lastRun - DAY) break;
  if (Date.now() - oldest > KEEP_DAYS * DAY) break;
  url = j.links?.next || "";
  await sleep(400);
}

const cutoff = new Date(Date.now() - KEEP_DAYS * DAY).toISOString().slice(0, 10);
const projects = [...byId.values()].filter(p => p.t >= cutoff).sort((a, b) => b.t.localeCompare(a.t) || b.id - a.id);
mkdirSync(DIR, { recursive: true });
writeFileSync(RAW, JSON.stringify({ updated: new Date().toISOString(), projects }));
console.log(`Сторінок API: ${pages}, нових проєктів: ${added}, у базі: ${projects.length}.`);

// ---------- статистика ----------
const R = await rates();
const uah = p => p.b && R[p.c] ? Math.round(p.b * R[p.c]) : 0;
const median = arr => { const a = arr.filter(x => x > 0).sort((x, y) => x - y); if (!a.length) return 0; const m = a.length >> 1; return Math.round(a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2); };
const avg = arr => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length * 10) / 10 : 0;
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : 0;

const GROUPS = [
  ["sites", "Сайти та веброзробка", /сайт|веб|web|wordpress|tilda|лендін|лендин|landing|інтернет-магаз|интернет-магаз|html|css|верст|frontend|front-end|cms|opencart|shopify|wix|woocommerce/i],
  ["design", "Дизайн і графіка", /дизайн|логотип|ілюстр|иллюстр|банер|баннер|фірмов|фирмен|поліграф|полиграф|\bui\b|\bux\b|3d|презентац|інфографік|инфографик|фото/i],
  ["texts", "Тексти й переклади", /переклад|перевод|копірайт|копирайт|рерайт|текст|редагув|редактир|статт|стате|локалізац|локализац/i],
  ["marketing", "Маркетинг і просування", /smm|seo|реклам|маркетинг|просуван|продвижен|таргет|соцмереж|соцсет|e-mail|email|контент-менедж/i],
  ["ai", "ШІ, боти й автоматизація", /штучн|искусствен|\bai\b|нейромереж|нейросет|chatgpt|gpt|бот|автоматиз|machine learning|машинн|парсинг/i],
  ["dev", "Програмування", /програм|программ|python|php|javascript|typescript|java\b|c\+\+|c#|node|бази даних|баз данн|1с|1c|backend|back-end|devops|адмініструв|администрир/i],
  ["mobile", "Мобільні застосунки", /мобільн|мобильн|android|ios|flutter|react native|swift|kotlin/i],
  ["video", "Відео, аудіо й анімація", /відео|видео|аудіо|аудио|анімац|анимац|монтаж|motion|озвуч/i],
];
const groupsOf = p => { const g = GROUPS.filter(([, , re]) => p.s.some(s => re.test(s))).map(([id]) => id); return g.length ? g : ["other"]; };

const today = Date.now();
const inRange = (p, from, to) => { const t = Date.parse(p.t); return t >= today - from * DAY && t < today - to * DAY; };
const cur = projects.filter(p => inRange(p, 30, -1));
const prev = projects.filter(p => inRange(p, 60, 30));
const firstDate = projects.length ? projects[projects.length - 1].t : null;
const hasPrev = firstDate && Date.parse(firstDate) <= today - 58 * DAY;

function summary(list) {
  return {
    count: list.length,
    withBudget: pct(list.filter(p => uah(p)).length, list.length),
    medianBudget: median(list.map(uah)),
    avgBids: avg(list.map(p => p.n)),
  };
}

const groups = [...GROUPS.map(([id, name]) => [id, name]), ["other", "Інше"]].map(([id, name]) => {
  const c = cur.filter(p => groupsOf(p).includes(id));
  const pv = prev.filter(p => groupsOf(p).includes(id));
  return { id, name, ...summary(c), share: pct(c.length, cur.length), trend: hasPrev && pv.length ? Math.round((c.length / pv.length - 1) * 100) : null };
}).filter(g => g.count).sort((a, b) => b.count - a.count);

const skillMap = new Map();
for (const p of cur) for (const s of p.s) { if (!skillMap.has(s)) skillMap.set(s, []); skillMap.get(s).push(p); }
const skills = [...skillMap].map(([name, list]) => ({ name, ...summary(list), share: pct(list.length, cur.length) }))
  .sort((a, b) => b.count - a.count);
const topSkills = skills.slice(0, 15);
// де найменше конкуренції: навички з достатньою кількістю проєктів і найменшою кількістю ставок
const minN = Math.max(8, Math.round(cur.length / 200));
const lowCompetition = skills.filter(s => s.count >= minN).sort((a, b) => a.avgBids - b.avgBids).slice(0, 8);
const topPaid = skills.filter(s => s.count >= minN && s.medianBudget).sort((a, b) => b.medianBudget - a.medianBudget).slice(0, 8);

// проєктів за тижнями (понеділок — початок тижня), останні 12 тижнів
const weekStart = d => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const weeksMap = new Map();
for (const p of projects) { const w = weekStart(p.t); weeksMap.set(w, (weeksMap.get(w) || 0) + 1); }
const thisWeek = weekStart(new Date().toISOString().slice(0, 10));
const weeks = [...weeksMap].filter(([w]) => w < thisWeek && (!firstDate || w >= weekStart(firstDate)) && w > weekStart(firstDate))
  .sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([week, count]) => ({ week, count }));

const BUCKETS = [[0, 1000, "до 1 000"], [1000, 3000, "1–3 тис."], [3000, 10000, "3–10 тис."], [10000, 30000, "10–30 тис."], [30000, Infinity, "понад 30 тис."]];
const withB = cur.filter(p => uah(p));
const budgets = BUCKETS.map(([lo, hi, label]) => ({ label, share: pct(withB.filter(p => uah(p) >= lo && uah(p) < hi).length, withB.length) }));

const dow = Array(7).fill(0);
for (const p of cur) dow[(new Date(p.t + "T12:00:00Z").getUTCDay() + 6) % 7]++;

const index = {
  updated: new Date().toISOString(),
  source: "Freelancehunt API",
  period: 30,
  since: firstDate,
  hasTrend: !!hasPrev,
  total: { ...summary(cur), perDay: Math.round(cur.length / 30), trend: hasPrev && prev.length ? Math.round((cur.length / prev.length - 1) * 100) : null },
  groups, topSkills, lowCompetition, topPaid, weeks, budgets,
  weekdays: dow.map(n => pct(n, cur.length)),
  rates: { USD: R.USD, EUR: R.EUR },
};
writeFileSync(OUT, JSON.stringify(index, null, 1));
console.log(`Індекс: ${cur.length} проєктів за 30 днів, медіанний бюджет ${index.total.medianBudget} грн, у середньому ${index.total.avgBids} ставок.`);
