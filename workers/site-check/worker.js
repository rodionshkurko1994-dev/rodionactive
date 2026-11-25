// Cloudflare Worker для інструмента «Аудит сайту» (rodionactive.com/instrumenty/audyt-saitu/).
// Відкриває чужий сайт від імені сторінки (браузер не може зробити це сам через CORS) і повертає:
// HTML головної сторінки, наявність robots.txt і sitemap.xml, HTTPS і переадресацію з http.
// Сам аналіз HTML робиться в браузері відвідувача (assets/js/tools-app.js → auExtra).
//
// Захист від зловживань:
//  - запити приймаються лише зі сторінок rodionactive.com (заголовки Origin/Referer);
//  - лише http/https, стандартні порти, без IP-адрес, localhost і внутрішніх доменів;
//  - лише GET, не більше 5 переадресацій, тайм-аут 8 с на запит, HTML обрізається до 1,5 МБ;
//  - результат кешується на 10 хвилин, а з однієї IP — не більше 10 перевірок за хвилину.

const ALLOWED_ORIGINS = ["https://rodionactive.com", "https://www.rodionactive.com", "http://localhost:8765"];
const MAX_HTML = 1_500_000;
const TIMEOUT = 8000;
const UA = "Mozilla/5.0 (compatible; RodionactiveAudit/1.0; +https://rodionactive.com/instrumenty/audyt-saitu/)";

const hits = new Map(); // простий ліміт у межах одного екземпляра воркера

function cors(origin) {
  return {
    "access-control-allow-origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "access-control-allow-methods": "GET, OPTIONS",
    "vary": "Origin",
  };
}
const json = (data, status, origin, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...cors(origin), ...extra } });

function safeUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  if (u.port && !["80", "443"].includes(u.port)) return null;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost") || h === "localhost") return null;
  if (/^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return null; // жодних IP-адрес
  u.hash = "";
  return u;
}

async function get(url, { manual = false, limit = 0 } = {}) {
  let current = url, redirects = 0;
  for (;;) {
    const res = await fetch(current.href, { redirect: "manual", headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,*/*;q=0.8" }, signal: AbortSignal.timeout(TIMEOUT) });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      const next = safeUrl(new URL(loc, current).href);
      if (manual) return { res, location: next ? next.href : loc, url: current };
      if (!next || ++redirects > 5) return { res, url: current, redirects };
      current = next;
      continue;
    }
    let text = "";
    if (limit) {
      const reader = res.body && res.body.getReader();
      const chunks = []; let size = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); size += value.length;
        if (size >= limit) { reader.cancel(); break; }
      }
      const all = new Uint8Array(Math.min(size, limit)); let off = 0;
      for (const c of chunks) { const part = c.subarray(0, Math.max(0, all.length - off)); all.set(part, off); off += part.length; if (off >= all.length) break; }
      text = new TextDecoder("utf-8", { fatal: false }).decode(all);
    } else if (res.body) res.body.cancel();
    return { res, url: current, redirects, text };
  }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "GET") return json({ error: "method" }, 405, origin);

    const referer = request.headers.get("referer") || "";
    if (!ALLOWED_ORIGINS.some(o => origin === o || referer.startsWith(o + "/"))) return json({ error: "forbidden" }, 403, origin);

    const ip = request.headers.get("cf-connecting-ip") || "?";
    const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 60000);
    if (recent.length >= 10) return json({ error: "rate" }, 429, origin, { "retry-after": "60" });
    recent.push(now); hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();

    const target = safeUrl(new URL(request.url).searchParams.get("url") || "");
    if (!target) return json({ error: "url" }, 400, origin);

    const cacheKey = new Request(`https://site-check.cache/${encodeURIComponent(target.href)}`);
    const cached = await caches.default.match(cacheKey);
    if (cached) return json(await cached.json(), 200, origin, { "x-cache": "hit" });

    try {
      const page = await get(target, { limit: MAX_HTML });
      const final = page.url;
      const base = `${final.protocol}//${final.host}`;
      const [robots, sitemap, favicon, http] = await Promise.all([
        get(new URL("/robots.txt", base), { limit: 50_000 }).catch(() => null),
        get(new URL("/sitemap.xml", base), { limit: 2_000 }).catch(() => null),
        get(new URL("/favicon.ico", base)).catch(() => null),
        final.protocol === "https:" ? get(new URL(`http://${final.host}/`), { manual: true }).catch(() => null) : null,
      ]);
      // sitemap: /sitemap.xml або рядок Sitemap: у robots.txt
      let smFound = !!(sitemap && sitemap.res.status === 200 && /<(urlset|sitemapindex)/i.test(sitemap.text || ""));
      const robotsOk = !!(robots && robots.res.status === 200 && !/<html/i.test(robots.text || ""));
      if (!smFound && robotsOk && /^\s*sitemap:\s*\S+/im.test(robots.text)) smFound = true;
      const data = {
        url: target.href,
        finalUrl: final.href,
        status: page.res.status,
        https: final.protocol === "https:",
        httpRedirect: http ? !!(http.location && http.location.startsWith("https://")) : null,
        robots: { status: robotsOk ? 200 : (robots ? robots.res.status : 0) },
        sitemap: { found: smFound },
        favicon: !!(favicon && favicon.res.status === 200),
        html: /html|xml/i.test(page.res.headers.get("content-type") || "") ? page.text : "",
      };
      ctx.waitUntil(caches.default.put(cacheKey, new Response(JSON.stringify(data), { headers: { "content-type": "application/json", "cache-control": "max-age=600" } })));
      return json(data, 200, origin);
    } catch (e) {
      return json({ error: "unreachable" }, 502, origin);
    }
  },
};
