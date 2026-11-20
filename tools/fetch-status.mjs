// Статус сервісів: збирає стан популярних сервісів і пише JSON.
// Запуск: node tools/fetch-status.mjs <вихідний-файл> [попередній-файл]
// Працює в GitHub Actions (.github/workflows/status.yml) кожні 15 хвилин,
// результат лежить у гілці `data` і читається сторінкою /instrumenty/status-servisiv/.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const OUT = process.argv[2] || "status.json";
const PREV = process.argv[3] || OUT;

// kind: "statuspage" — офіційна сторінка статусу (Atlassian Statuspage або сумісна, /api/v2/summary.json)
// kind: "probe"      — офіційної сторінки немає: перевіряємо, чи відповідає сам сервіс
const SERVICES = [
  { id: "chatgpt", name: "ChatGPT і OpenAI", group: "ai", kind: "statuspage", page: "https://status.openai.com" },
  { id: "claude", name: "Claude", group: "ai", kind: "statuspage", page: "https://status.claude.com" },
  { id: "gemini", name: "Gemini", group: "ai", kind: "probe", url: "https://gemini.google.com/" },
  { id: "telegram", name: "Telegram", group: "social", kind: "probe", url: "https://api.telegram.org/", page: "https://web.telegram.org/" },
  { id: "instagram", name: "Instagram", group: "social", kind: "probe", url: "https://www.instagram.com/" },
  { id: "whatsapp", name: "WhatsApp", group: "social", kind: "probe", url: "https://web.whatsapp.com/" },
  { id: "youtube", name: "YouTube", group: "social", kind: "probe", url: "https://www.youtube.com/" },
  { id: "discord", name: "Discord", group: "social", kind: "statuspage", page: "https://discordstatus.com" },
  { id: "monobank", name: "monobank", group: "ua", kind: "probe", url: "https://api.monobank.ua/bank/currency", page: "https://www.monobank.ua/" },
  { id: "privatbank", name: "ПриватБанк", group: "ua", kind: "probe", url: "https://privatbank.ua/" },
  { id: "novaposhta", name: "Нова пошта", group: "ua", kind: "probe", url: "https://novaposhta.ua/" },
  { id: "olx", name: "OLX", group: "ua", kind: "probe", url: "https://www.olx.ua/" },
  { id: "github", name: "GitHub", group: "work", kind: "statuspage", page: "https://www.githubstatus.com" },
  { id: "cloudflare", name: "Cloudflare", group: "work", kind: "statuspage", page: "https://www.cloudflarestatus.com" },
  { id: "zoom", name: "Zoom", group: "work", kind: "statuspage", page: "https://status.zoom.us" },
  { id: "figma", name: "Figma", group: "work", kind: "statuspage", page: "https://status.figma.com" },
  { id: "canva", name: "Canva", group: "work", kind: "statuspage", page: "https://www.canvastatus.com" },
  { id: "dropbox", name: "Dropbox", group: "work", kind: "statuspage", page: "https://status.dropbox.com" },
];

const UA = "Mozilla/5.0 (compatible; RodionactiveStatus/1.0; +https://rodionactive.com/instrumenty/status-servisiv/)";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function timed(url, opts = {}, ms = 12000) {
  const t0 = Date.now();
  const res = await fetch(url, { redirect: "manual", ...opts, headers: { "user-agent": UA, ...(opts.headers || {}) }, signal: AbortSignal.timeout(ms) });
  return { res, ms: Date.now() - t0 };
}

// ok | degraded | down | maintenance | unknown
async function checkStatuspage(s) {
  try {
    const { res } = await timed(`${s.page}/api/v2/summary.json`, { redirect: "follow", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    const ind = j.status?.indicator;
    const incidents = (j.incidents || []).filter(i => i.status !== "resolved" && i.status !== "postmortem").slice(0, 3)
      .map(i => ({ name: i.name, impact: i.impact, started: i.started_at || i.created_at, url: i.shortlink || `${s.page}/incidents/${i.id}` }));
    const maint = (j.scheduled_maintenances || []).some(m => m.status === "in_progress");
    const comps = (j.components || []).filter(c => !c.group && c.status && c.status !== "operational").map(c => c.name).slice(0, 4);
    let state = ind === "none" ? "ok" : ind === "minor" ? "degraded" : (ind === "major" || ind === "critical") ? "down" : ind === "maintenance" ? "maintenance" : "unknown";
    if (state === "ok" && maint) state = "maintenance";
    if (state === "ok" && incidents.length) state = "degraded";
    return { state, incidents, components: comps };
  } catch (e) {
    // сторінка статусу недоступна — чесно показуємо «невідомо», а не «збій»
    return { state: "unknown", error: String(e.message || e) };
  }
}

async function checkProbe(s) {
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { res, ms } = await timed(s.url);
      if (res.status < 500) return { state: ms > 8000 ? "degraded" : "ok", latency: ms };
      last = "HTTP " + res.status;
    } catch (e) {
      // сервер відповів, але із завеликими заголовками (буває в Google) — отже, він працює
      if (e.cause?.code === "UND_ERR_HEADERS_OVERFLOW") return { state: "ok" };
      last = e.name === "TimeoutError" ? "немає відповіді" : String(e.cause?.code || e.message || e);
    }
    await sleep(5000);
  }
  return { state: "down", error: last };
}

const prev = existsSync(PREV) ? (() => { try { return JSON.parse(readFileSync(PREV, "utf8")); } catch { return {}; } })() : {};
const prevById = Object.fromEntries((prev.services || []).map(s => [s.id, s]));
const now = new Date().toISOString();

const results = await Promise.all(SERVICES.map(async s => {
  const r = s.kind === "statuspage" ? await checkStatuspage(s) : await checkProbe(s);
  const p = prevById[s.id];
  // разова невдача читання сторінки статусу не «ламає» сервіс: протягом години показуємо останній відомий стан
  let lastKnown = now;
  if (r.state === "unknown" && p && p.state !== "unknown" && p.lastKnown && Date.now() - Date.parse(p.lastKnown) < 3600e3) {
    r.state = p.state; lastKnown = p.lastKnown;
  } else if (r.state === "unknown") lastKnown = p?.lastKnown;
  const since = p && p.state === r.state ? p.since : now;
  return {
    id: s.id, name: s.name, group: s.group, kind: s.kind,
    url: s.page || s.url,
    state: r.state, since,
    ...(r.latency !== undefined ? { latency: r.latency } : {}),
    ...(r.incidents?.length ? { incidents: r.incidents } : {}),
    ...(r.components?.length ? { components: r.components } : {}),
    ...(lastKnown ? { lastKnown } : {}),
    ...(r.error ? { error: r.error } : {}),
  };
}));

// журнал змін стану за останні 14 днів
const log = (prev.log || []).filter(e => Date.now() - Date.parse(e.at) < 14 * 864e5);
for (const r of results) {
  const p = prevById[r.id];
  if (p && p.state !== r.state) log.unshift({ id: r.id, name: r.name, from: p.state, to: r.state, at: now });
}

const out = { checked: now, services: results, log: log.slice(0, 200) };
mkdirSync(dirname(OUT) || ".", { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 1));
const bad = results.filter(r => r.state !== "ok").map(r => `${r.name}: ${r.state}${r.error ? " (" + r.error + ")" : ""}`);
console.log(`Перевірено ${results.length} сервісів. ${bad.length ? "Не в нормі: " + bad.join("; ") : "Усе працює."}`);
