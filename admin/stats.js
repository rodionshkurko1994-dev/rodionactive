/* Rodionactive — статистика й заявки в адмінці.
   Дані беруться напряму з Google (вхід через ваш Google-акаунт, лише читання):
   • Google Analytics 4 — відвідування, сторінки, джерела, міста, пристрої, ключові дії;
   • Google Search Console — запити й сторінки в пошуку Google;
   • Google Таблиця — заявки з калькулятора вартості сайту (їх записує Apps Script, workers/leads/Code.gs).
   Токен доступу живе ~1 годину і зберігається лише в цьому браузері. */
(function () {
  "use strict";
  const CFG = {
    clientId: "55967838738-gq8qgquo6gmr0979sj9ok6d9qsusqghs.apps.googleusercontent.com",
    account: "rodionshkurko1994@gmail.com",
    ga4: "565923699",                 // ресурс GA4 «Rodionactive» (потік G-BGX5T51JQR)
    gaAccount: "274889981",
    scSite: "https://rodionactive.com/",
    sheet: "1ImW27ndPQFmg7MU1Cn_mmrL4dbi9NlWEGfJyvhcmsZE", // «Rodionactive — заявки калькулятора»
    clarity: "zjqatulujh",
  };
  const SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ];
  const TOKEN_KEY = "rodionactive-google-token";
  const LINKS = {
    ga: `https://analytics.google.com/analytics/web/#/a${CFG.gaAccount}p${CFG.ga4}/reports/intelligenthome`,
    sc: `https://search.google.com/search-console/performance/search-analytics?resource_id=${encodeURIComponent(CFG.scSite)}`,
    clarity: `https://clarity.microsoft.com/projects/view/${CFG.clarity}/dashboard`,
    sheet: `https://docs.google.com/spreadsheets/d/${CFG.sheet}/edit`,
  };

  // власні заходи з цього браузера не рахуються в аналітиці сайту (див. assets/js/analytics.js)
  try { localStorage.setItem("skipgc", "t"); } catch {}

  const $s = sel => document.querySelector(sel);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = n => Number(n || 0).toLocaleString("uk-UA");
  const pct = n => `${(Number(n || 0) * 100).toLocaleString("uk-UA", { maximumFractionDigits: 1 })}%`;
  const dur = s => { s = Math.round(Number(s) || 0); const m = Math.floor(s / 60); return m ? `${m} хв ${String(s % 60).padStart(2, "0")} с` : `${s} с`; };
  const MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];
  const dayLabel = k => { const [, m, d] = k.split("-").map(Number); return `${d} ${MONTHS[m - 1]}`; };
  const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const gaDay = s => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

  const state = { days: 28, view: "visits", loading: false, cache: {} };

  // ---------- вхід через Google ----------
  let token = (() => { try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); } catch { return null; } })();
  const signedIn = () => !!(token && token.exp > Date.now() + 60000);
  const saveToken = () => { try { token ? localStorage.setItem(TOKEN_KEY, JSON.stringify(token)) : localStorage.removeItem(TOKEN_KEY); } catch {} };
  let gisPromise = null;
  function loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (!gisPromise) gisPromise = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client"; s.async = true;
      s.onload = () => res(); s.onerror = () => { gisPromise = null; rej(new Error("Не вдалося завантажити вхід Google. Перевірте інтернет або блокувальник реклами.")); };
      document.head.appendChild(s);
    });
    return gisPromise;
  }
  let tokenClient = null, pending = null;
  function initClient() {
    if (tokenClient || !(window.google && google.accounts && google.accounts.oauth2)) return;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CFG.clientId, scope: SCOPES.join(" "), login_hint: CFG.account, include_granted_scopes: true,
      callback: r => {
        const p = pending; pending = null; if (!p) return;
        if (r.error) return p.rej(new Error(r.error_description || r.error));
        if (!google.accounts.oauth2.hasGrantedAllScopes(r, ...SCOPES)) return p.rej(new Error("Потрібно дозволити всі три пункти доступу (Analytics, Search Console, Таблиці). Увійдіть ще раз і залиште всі галочки."));
        token = { t: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 }; saveToken(); p.res();
      },
      error_callback: e => { const p = pending; pending = null; if (p) p.rej(new Error(e && e.type === "popup_closed" ? "Вікно входу закрито." : e && e.type === "popup_failed_to_open" ? "Браузер заблокував вікно входу. Дозвольте спливаючі вікна для цього сайту." : "Не вдалося увійти через Google.")); },
    });
  }
  function signIn() {
    initClient();
    if (!tokenClient) return Promise.reject(new Error("Вхід Google ще завантажується, натисніть ще раз."));
    return new Promise((res, rej) => { pending = { res, rej }; tokenClient.requestAccessToken({ prompt: token ? "" : "consent" }); });
  }
  function signOut() {
    if (token && window.google && google.accounts && google.accounts.oauth2) try { google.accounts.oauth2.revoke(token.t, () => {}); } catch {}
    token = null; saveToken(); state.cache = {};
  }

  class AuthError extends Error {}
  async function gapi(url, body) {
    if (!signedIn()) throw new AuthError("Потрібно увійти");
    const r = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token.t}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401) { token = null; saveToken(); throw new AuthError("Сеанс Google завершився"); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (j.error && j.error.message) || `Google відповів ${r.status}`;
      if (r.status === 403 && /scope|permission/i.test(msg)) { token = null; saveToken(); throw new AuthError(msg); }
      throw new Error(msg);
    }
    return j;
  }

  // ---------- GA4 ----------
  const range = () => ({ startDate: `${state.days - 1}daysAgo`, endDate: "today" });
  const prevRange = () => ({ startDate: `${state.days * 2 - 1}daysAgo`, endDate: `${state.days}daysAgo` });
  const ga = body => gapi(`https://analyticsdata.googleapis.com/v1beta/properties/${CFG.ga4}:batchRunReports`, body);
  const rowsOf = rep => (rep && rep.rows || []).map(r => ({ d: (r.dimensionValues || []).map(x => x.value), m: (r.metricValues || []).map(x => Number(x.value)) }));
  const inList = (name, values) => ({ filter: { fieldName: name, inListFilter: { values } } });

  const KEY_EVENTS = {
    generate_lead: "Заявки: Telegram, пошта, телефон",
    calc_complete: "Пройшли калькулятор вартості",
    click_channel: "Перехід у Telegram-канал",
    click_social: "Перехід в Instagram / Freelancehunt",
    form_submit: "Відправили форму",
    scroll: "Догортали сторінку до кінця",
    click: "Кліки на зовнішні посилання",
    file_download: "Завантаження файлів",
  };

  async function loadVisits() {
    const R = range();
    const [a, b] = await Promise.all([
      ga({ requests: [
        { dateRanges: [R, prevRange()], metrics: ["activeUsers", "newUsers", "sessions", "screenPageViews", "averageSessionDuration", "engagementRate"].map(name => ({ name })) },
        { dateRanges: [R], dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 400 },
        { dateRanges: [R], dimensions: [{ name: "pagePath" }, { name: "pageTitle" }], metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "userEngagementDuration" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 250 },
        { dateRanges: [R], dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
        { dateRanges: [R], dimensions: [{ name: "city" }, { name: "country" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 10 },
      ] }),
      ga({ requests: [
        { dateRanges: [R], dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] },
        { dateRanges: [R, prevRange()], dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], dimensionFilter: inList("eventName", Object.keys(KEY_EVENTS)) },
        { dateRanges: [R], dimensions: [{ name: "pagePath" }], metrics: [{ name: "eventCount" }], dimensionFilter: inList("eventName", ["generate_lead"]), orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 8 },
        { dateRanges: [R], dimensions: [{ name: "landingPage" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 8 },
        { dateRanges: [R], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }] },
      ] }),
    ]);
    let live = null;
    try { live = await gapi(`https://analyticsdata.googleapis.com/v1beta/properties/${CFG.ga4}:runRealtimeReport`, { metrics: [{ name: "activeUsers" }] }); } catch (e) { if (e instanceof AuthError) throw e; }
    return { a: a.reports || [], b: b.reports || [], live };
  }

  // ---------- Search Console ----------
  async function loadSearch() {
    const end = new Date(); const start = new Date(); start.setDate(start.getDate() - (state.days - 1));
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(CFG.scSite)}/searchAnalytics/query`;
    const base = { startDate: isoDay(start), endDate: isoDay(end), dataState: "all" };
    const [tot, daily, queries, pages] = await Promise.all([
      gapi(url, { ...base }),
      gapi(url, { ...base, dimensions: ["date"], rowLimit: 500 }),
      gapi(url, { ...base, dimensions: ["query"], rowLimit: 50 }),
      gapi(url, { ...base, dimensions: ["page"], rowLimit: 25 }),
    ]);
    return { tot: (tot.rows || [])[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 }, daily: daily.rows || [], queries: queries.rows || [], pages: pages.rows || [] };
  }

  // ---------- Заявки з таблиці ----------
  async function loadLeads() {
    const j = await gapi(`https://sheets.googleapis.com/v4/spreadsheets/${CFG.sheet}/values/A1:O5000?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`);
    const [head, ...rows] = j.values || [];
    if (!head) return [];
    const ix = name => head.indexOf(name);
    return rows.filter(r => r.length && r[ix("ID")]).map(r => {
      const serial = Number(r[ix("Дата")]) || 0;
      const wall = new Date(Math.round((serial - 25569) * 864e5)); // час за Києвом (часовий пояс таблиці), записаний як UTC
      const get = n => (ix(n) >= 0 ? String(r[ix(n)] ?? "") : "");
      return {
        wall, id: get("ID"), price: get("Вартість"), market: get("Ринкова ціна"), tg: get("Написав у Telegram") === "так",
        src: get("Джерело"), device: get("Пристрій"),
        rows: ["Тип сайту", "Дизайн", "Функції", "Мови", "Тексти", "SEO", "Платформа", "Терміни"].map(n => [n, get(n)]).filter(x => x[1]),
      };
    }).reverse();
  }

  // ---------- розмітка ----------
  const VIEWS = [["visits", "Відвідування"], ["search", "Пошук Google"], ["leads", "Заявки калькулятора"]];
  function shell() {
    $s("#stats").innerHTML = `
      <div class="st-head">
        <div>
          <p class="eyebrow">Статистика</p>
          <h2 data-st-title>Відвідування сайту</h2>
        </div>
        <div class="st-tools">
          <div class="tabs" role="group" aria-label="Період">
            ${[7, 28, 90].map(d => `<button class="tab" type="button" data-days="${d}" aria-pressed="${d === state.days}">${d} днів</button>`).join("")}
          </div>
          <button class="btn small ghost" type="button" data-st-refresh>Оновити</button>
        </div>
      </div>
      <div class="st-views" role="tablist">
        ${VIEWS.map(([k, t]) => `<button type="button" role="tab" data-view="${k}" aria-selected="${k === state.view}">${t}<span class="st-badge" data-badge="${k}" hidden></span></button>`).join("")}
        <span class="spacer"></span>
        <a class="st-ext" href="${LINKS.ga}" target="_blank" rel="noopener">Google Analytics ↗</a>
        <a class="st-ext" href="${LINKS.clarity}" target="_blank" rel="noopener">Clarity: теплові карти й записи ↗</a>
      </div>
      <div class="st-body"></div>`;
    $s("#stats").querySelectorAll("[data-days]").forEach(b => b.addEventListener("click", () => {
      state.days = +b.dataset.days; state.cache = {};
      $s("#stats").querySelectorAll("[data-days]").forEach(x => x.setAttribute("aria-pressed", x === b));
      load();
    }));
    $s("#stats").querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
    $s("[data-st-refresh]").addEventListener("click", () => { state.cache = {}; load(); });
  }
  function setView(v) {
    state.view = v;
    $s("#stats").querySelectorAll("[data-view]").forEach(x => x.setAttribute("aria-selected", x.dataset.view === v));
    $s("[data-st-title]").textContent = { visits: "Відвідування сайту", search: "Пошук Google", leads: "Заявки з калькулятора" }[v];
    load();
  }

  const body = html => { $s(".st-body").innerHTML = html; };
  const message = html => body(`<div class="panel st-msg">${html}</div>`);

  function loginPanel(note) {
    body(`<div class="panel st-msg st-login">
      ${note ? `<p class="st-warn">${esc(note)}</p>` : ""}
      <p><b>Увійдіть через Google, щоб бачити статистику і заявки.</b></p>
      <p class="muted">Використовуйте акаунт ${esc(CFG.account)} — на ньому Google Analytics, Search Console і таблиця із заявками. Доступ лише на читання, токен зберігається тільки в цьому браузері й діє близько години.</p>
      <p class="muted">Google попередить, що застосунок «Rodionactive Admin» не перевірений: це ваш власний застосунок. Натисніть «Продовжити» і залиште всі галочки доступу.</p>
      <div class="actions"><button class="btn" type="button" data-st-login>Увійти через Google <span class="arr">→</span></button></div>
    </div>`);
    loadGis().then(initClient).catch(() => {});
    $s("[data-st-login]").addEventListener("click", async e => {
      const btn = e.currentTarget; btn.disabled = true;
      try { await loadGis(); await signIn(); load(); }
      catch (err) { btn.disabled = false; loginPanel(err.message); }
    });
  }

  async function load() {
    if (!signedIn()) { loginPanel(); return; }
    if (state.loading) return;
    state.loading = true;
    const view = state.view, key = `${view}:${state.days}`;
    if (!state.cache[key]) message(`<div class="skeleton" style="height:120px"></div><p class="muted">Завантажую дані з Google…</p>`);
    try {
      const data = state.cache[key] || (state.cache[key] = await ({ visits: loadVisits, search: loadSearch, leads: loadLeads }[view])());
      if (state.view !== view) return;
      ({ visits: renderVisits, search: renderSearch, leads: renderLeads }[view])(data);
      bindChart();
    } catch (e) {
      delete state.cache[key];
      if (e instanceof AuthError) loginPanel(e.message === "Потрібно увійти" ? "" : `${e.message}. Увійдіть ще раз.`);
      else message(`<p><b>Не вдалося завантажити дані.</b></p><p class="muted">${esc(e.message)}</p><div class="actions"><button class="btn small ghost" type="button" data-st-retry>Спробувати ще раз</button></div>`), $s("[data-st-retry]").addEventListener("click", load);
    } finally { state.loading = false; }
    const out = $s("[data-st-logout]");
    if (out) out.addEventListener("click", () => { signOut(); loginPanel(); });
  }
  const footer = extra => `<p class="muted st-note">${extra || ""} <button type="button" class="link" data-st-logout>Вийти з Google</button></p>`;

  // ---------- графік по днях ----------
  function chart(list, label) {
    const W = 760, H = 220, L = 34, B = 26, T = 10;
    const max = Math.max(4, ...list.map(x => x[1]));
    const raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
    const top = Math.ceil(max / step) * step;
    const y = v => T + (H - T - B) * (1 - v / top);
    const bw = (W - L) / list.length, gap = Math.min(4, bw * 0.25);
    const every = Math.ceil(list.length / 8);
    let grid = "";
    for (let v = 0; v <= top; v += step) grid += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="st-grid"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="st-axis">${num(v)}</text>`;
    const bars = list.map(([k, v, tip], i) => {
      const x = L + i * bw + gap / 2, w = Math.max(1, bw - gap), h = Math.max(v ? 2 : 0, H - B - y(v));
      const r = Math.min(4, w / 2, h);
      const path = h ? `M${x},${H - B} V${H - B - h + r} Q${x},${H - B - h} ${x + r},${H - B - h} H${x + w - r} Q${x + w},${H - B - h} ${x + w},${H - B - h + r} V${H - B} Z` : "";
      return `<g class="st-bar" data-tip="${esc(dayLabel(k))}: ${esc(tip || num(v))}"><rect x="${L + i * bw}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent"/>${path ? `<path d="${path}"/>` : ""}${(i % every === 0 && list.length - 1 - i >= every / 2) || i === list.length - 1 ? `<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle" class="st-axis">${dayLabel(k)}</text>` : ""}</g>`;
    }).join("");
    return `<div class="st-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${grid}${bars}</svg><div class="st-tip" hidden></div></div>`;
  }
  function daysList(map, fmt) {
    const list = []; const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (state.days - 1));
    for (let i = 0; i < state.days; i++) { const k = isoDay(d); const v = map[k]; list.push([k, v ? v[0] : 0, v && fmt ? fmt(v) : ""]); d.setDate(d.getDate() + 1); }
    return list;
  }
  function bindChart() {
    document.querySelectorAll("#stats .st-chart").forEach(box => {
      const tip = box.querySelector(".st-tip");
      box.querySelectorAll(".st-bar").forEach(g => {
        g.addEventListener("mouseenter", () => {
          tip.textContent = g.dataset.tip; tip.hidden = false;
          const b = g.getBoundingClientRect(), c = box.getBoundingClientRect();
          tip.style.left = `${b.left - c.left + b.width / 2}px`;
        });
        g.addEventListener("mouseleave", () => (tip.hidden = true));
      });
    });
  }

  const tile = (label, value, delta, hint) => `<div class="panel st-tile"${hint ? ` title="${esc(hint)}"` : ""}><span>${label}</span><b>${value}</b>${delta || ""}</div>`;
  function delta(cur, prev, invert) {
    if (!prev && !cur) return "";
    if (!prev) return `<small class="st-delta up">нове</small>`;
    const p = (cur - prev) / prev; const up = p >= 0;
    return `<small class="st-delta ${(up !== !!invert) ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(Math.round(p * 100))}% <i>до попередніх ${state.days} дн.</i></small>`;
  }
  const listCard = (title, rows, empty, sub) => {
    const mx = Math.max(1, ...rows.map(r => r[1]));
    return `<div class="panel st-card">
      <h3>${title}${sub ? ` <small class="muted">${sub}</small>` : ""}</h3>
      ${rows.length ? `<ul class="st-list">${rows.map(([name, count, shown]) => `<li><span class="st-name" title="${esc(name)}">${esc(name)}</span><span class="st-num">${esc(shown ?? num(count))}</span><i style="--w:${Math.round(count / mx * 100)}%"></i></li>`).join("")}</ul>` : `<p class="muted">${empty || "Поки немає даних."}</p>`}
    </div>`;
  };
  const posts = () => (window.__adminPosts ? window.__adminPosts() : []).filter(p => !p.draft && p.slug);
  const norm = p => (p || "/").split("?")[0].replace(/\/index\.html$/, "/").replace(/([^/])$/, "$1/");
  function pageName(path, title) {
    const k = norm(path);
    if (k === "/") return "Головна";
    const post = posts().find(x => `/blog/${x.slug}/` === k);
    if (post) return post.title;
    const t = String(title || "").replace(/\s*[—|·-]\s*Rodionactive.*$/i, "").trim();
    return t && t !== "(not set)" ? t : k;
  }
  function sourceName(src, med) {
    if (src === "(direct)") return "Прямі заходи";
    const s = src.replace(/^(www\.|m\.|l\.|lm\.)/, "");
    const nice = { "t.me": "Telegram", "telegram.org": "Telegram", "instagram.com": "Instagram", "facebook.com": "Facebook", "threads.net": "Threads", "threads.com": "Threads", "google": "Google", "bing": "Bing", "freelancehunt.com": "Freelancehunt", "chatgpt.com": "ChatGPT", "perplexity.ai": "Perplexity", "claude.ai": "Claude" }[s] || s;
    if (med === "organic") return `${nice} (пошук)`;
    return nice;
  }
  const CHANNELS = { "Direct": "Прямі заходи", "Organic Search": "Пошук (Google, Bing…)", "Referral": "Переходи з інших сайтів", "Organic Social": "Соцмережі", "Paid Search": "Платний пошук", "Paid Social": "Реклама в соцмережах", "Email": "Пошта", "Unassigned": "Не визначено", "Organic Video": "Відео", "Display": "Медійна реклама" };
  const DEVICES = { mobile: "Телефон", desktop: "Комп'ютер", tablet: "Планшет", "smart tv": "Smart TV" };

  function renderVisits({ a, b, live }) {
    const [totR, dayR, pageR, srcR, cityR] = a, [devR, evR, leadPageR, landR, chanR] = b;
    const tot = (totR && totR.rows) || [];
    const cur = (tot.find(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value === "date_range_0") || tot[0] || { metricValues: [] }).metricValues.map(x => Number(x.value));
    const prev = ((tot.find(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value === "date_range_1") || { metricValues: [] }).metricValues || []).map(x => Number(x.value));
    const [users = 0, newU = 0, sessions = 0, views = 0, avgDur = 0, engaged = 0] = cur;
    const ev = {}, evPrev = {};
    rowsOf(evR).forEach(r => { (r.d[1] === "date_range_1" ? evPrev : ev)[r.d[0]] = r.m[0]; });
    const leads = ev.generate_lead || 0;
    const liveN = live && live.rows && live.rows[0] ? Number(live.rows[0].metricValues[0].value) : 0;
    const byDay = {}; rowsOf(dayR).forEach(r => { byDay[gaDay(r.d[0])] = [r.m[0], r.m[1]]; });
    const pages = rowsOf(pageR);
    const merged = {}; pages.forEach(r => { const k = norm(r.d[0]); const m = merged[k] || (merged[k] = { k, title: r.d[1], v: 0, u: 0, t: 0 }); m.v += r.m[0]; m.u += r.m[1]; m.t += r.m[2]; });
    const pageList = Object.values(merged).sort((x, y) => y.v - x.v);
    const postRows = posts().map(p => { const m = merged[`/blog/${p.slug}/`]; return [p, m ? m.v : 0, m && m.u ? m.t / m.u : 0]; }).sort((x, y) => y[1] - x[1] || (y[0].date || "").localeCompare(x[0].date || ""));
    const maxPost = Math.max(1, ...postRows.map(r => r[1]));
    const empty = !users && !views;

    body(`${empty ? `<div class="panel st-msg"><p><b>Google Analytics підключено.</b> За цей період даних ще немає: перші цифри з'являються протягом кількох годин після заходів на сайт. Ваш власний браузер (той, де відкрита адмінка) не рахується.</p></div>` : ""}
      <div class="st-tiles">
        ${tile("Відвідувачі", num(users), delta(users, prev[0]))}
        ${tile("Перегляди сторінок", num(views), delta(views, prev[3]))}
        ${tile("Заявки (Telegram, пошта, телефон)", num(leads), delta(leads, evPrev.generate_lead || 0), "Кліки на кнопки «Замовити / обговорити проєкт» та контакти")}
        ${tile(`<span class="st-live"></span>Зараз на сайті`, num(liveN), `<small class="st-delta">за останні 30 хв</small>`)}
        ${tile("Нові відвідувачі", num(newU), delta(newU, prev[1]))}
        ${tile("Сеанси", num(sessions), delta(sessions, prev[2]))}
        ${tile("Середній час сеансу", dur(avgDur), delta(avgDur, prev[4]))}
        ${tile("Залученість", pct(engaged), delta(engaged, prev[5]), "Частка сеансів довших за 10 с, з 2+ сторінками або ключовою дією")}
      </div>
      <div class="panel st-card">
        <h3>Відвідувачі по днях</h3>
        ${chart(daysList(byDay, v => `${num(v[0])} відвідувачів · ${num(v[1])} переглядів`), `Відвідувачі по днях за ${state.days} днів`)}
      </div>
      <div class="st-grid3">
        ${listCard("Звідки приходять", rowsOf(srcR).map(r => [sourceName(r.d[0], r.d[1]), r.m[0]]), "", "сеанси")}
        ${listCard("Канали", rowsOf(chanR).map(r => [CHANNELS[r.d[0]] || r.d[0], r.m[0]]), "", "сеанси")}
        ${listCard("Міста", rowsOf(cityR).map(r => [r.d[0] === "(not set)" ? (r.d[1] || "Невідомо") : `${r.d[0]}, ${r.d[1]}`, r.m[0]]), "", "відвідувачі")}
      </div>
      <div class="st-grid3">
        ${listCard("Ключові дії", Object.keys(KEY_EVENTS).filter(k => ev[k]).map(k => [KEY_EVENTS[k], ev[k]]), "Ключових дій ще не було.", "кількість")}
        ${listCard("Де натискають «Замовити»", rowsOf(leadPageR).map(r => [pageName(r.d[0], merged[norm(r.d[0])] && merged[norm(r.d[0])].title), r.m[0]]), "Заявок ще не було.", "сторінки")}
        ${listCard("Пристрої", rowsOf(devR).map(r => [DEVICES[r.d[0]] || r.d[0], r.m[0], users ? `${Math.round(r.m[0] / users * 100)}%` : num(r.m[0])]), "", "відвідувачі")}
      </div>
      <div class="st-grid2">
        ${listCard("Найпопулярніші сторінки", pageList.slice(0, 10).map(p => [pageName(p.k, p.title), p.v]), "", "перегляди")}
        ${listCard("Сторінки входу", rowsOf(landR).filter(r => r.d[0] !== "(not set)").map(r => [pageName(r.d[0], merged[norm(r.d[0])] && merged[norm(r.d[0])].title), r.m[0]]), "", "з якої сторінки почали")}
      </div>
      <div class="panel st-card">
        <h3>Статті блогу <small class="muted">${state.days} днів · від найпопулярніших</small></h3>
        <table class="st-table">
          <thead><tr><th>Стаття</th><th class="r">Перегляди</th><th class="r">Час читання</th></tr></thead>
          <tbody>${postRows.map(([p, c, t]) => `<tr><td><a href="/blog/${esc(p.slug)}/" target="_blank" rel="noopener">${esc(p.title)}</a><i style="--w:${Math.round(c / maxPost * 100)}%"></i></td><td class="r">${num(c)}</td><td class="r">${c ? dur(t) : "—"}</td></tr>`).join("") || `<tr><td colspan="3" class="muted">Статей поки немає.</td></tr>`}</tbody>
        </table>
      </div>
      ${footer(`Дані Google Analytics 4 оновлюються із затримкою до кількох годин; «Зараз на сайті» — в реальному часі. <a href="${LINKS.ga}" target="_blank" rel="noopener">Відкрити Google Analytics ↗</a>`)}`);
  }

  function renderSearch({ tot, daily, queries, pages }) {
    const byDay = {}; daily.forEach(r => { byDay[r.keys[0]] = [r.clicks, r.impressions]; });
    const pos = p => Number(p || 0).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
    const empty = !tot.impressions;
    body(`${empty ? `<div class="panel st-msg"><p><b>Search Console підключено.</b> За цей період Google ще не показав сайт у пошуку або дані ще не надійшли. Search Console віддає дані із затримкою 2–3 дні.</p></div>` : ""}
      <div class="st-tiles">
        ${tile("Кліки з Google", num(tot.clicks))}
        ${tile("Покази в пошуку", num(tot.impressions))}
        ${tile("CTR", pct(tot.ctr), "", "Частка показів, після яких людина перейшла на сайт")}
        ${tile("Середня позиція", tot.impressions ? pos(tot.position) : "—", "", "Чим менше число, тим вище сайт у видачі")}
      </div>
      <div class="panel st-card">
        <h3>Покази в пошуку по днях</h3>
        ${chart(daysList(Object.fromEntries(Object.entries(byDay).map(([k, v]) => [k, [v[1], v[0]]])), v => `${num(v[0])} показів · ${num(v[1])} кліків`), "Покази в Google по днях")}
      </div>
      <div class="panel st-card">
        <h3>Запити в Google <small class="muted">за якими знаходять сайт</small></h3>
        <table class="st-table">
          <thead><tr><th>Запит</th><th class="r">Кліки</th><th class="r">Покази</th><th class="r">CTR</th><th class="r">Позиція</th></tr></thead>
          <tbody>${queries.map(r => `<tr><td>${esc(r.keys[0])}</td><td class="r">${num(r.clicks)}</td><td class="r">${num(r.impressions)}</td><td class="r">${pct(r.ctr)}</td><td class="r">${pos(r.position)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Поки немає запитів.</td></tr>`}</tbody>
        </table>
      </div>
      <div class="panel st-card">
        <h3>Сторінки в пошуку</h3>
        <table class="st-table">
          <thead><tr><th>Сторінка</th><th class="r">Кліки</th><th class="r">Покази</th><th class="r">Позиція</th></tr></thead>
          <tbody>${pages.map(r => { const path = r.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/"; return `<tr><td><a href="${esc(r.keys[0])}" target="_blank" rel="noopener">${esc(pageName(path))}</a></td><td class="r">${num(r.clicks)}</td><td class="r">${num(r.impressions)}</td><td class="r">${pos(r.position)}</td></tr>`; }).join("") || `<tr><td colspan="4" class="muted">Поки немає даних.</td></tr>`}</tbody>
        </table>
      </div>
      ${footer(`Дані Google Search Console з'являються із затримкою 2–3 дні. <a href="${LINKS.sc}" target="_blank" rel="noopener">Відкрити Search Console ↗</a>`)}`);
  }

  const fmtWall = d => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  function renderLeads(all) {
    const now = new Date(); const kyivNow = new Date(now.getTime() + (now.getTimezoneOffset() * -60000)); // приблизно, для фільтра періоду
    const from = new Date(kyivNow); from.setUTCHours(0, 0, 0, 0); from.setUTCDate(from.getUTCDate() - (state.days - 1));
    const list = all.filter(l => l.wall >= from);
    const tg = list.filter(l => l.tg).length;
    const types = {}; list.forEach(l => { const t = (l.rows.find(r => r[0] === "Тип сайту") || [])[1] || "—"; types[t] = (types[t] || 0) + 1; });
    const typeRows = Object.entries(types).sort((x, y) => y[1] - x[1]);
    const srcs = {}; list.forEach(l => { const s = l.src || "невідомо"; srcs[s] = (srcs[s] || 0) + 1; });
    const byDay = {}; list.forEach(l => { const k = l.wall.toISOString().slice(0, 10); byDay[k] = [(byDay[k] ? byDay[k][0] : 0) + 1]; });
    const badge = $s('[data-badge="leads"]'); if (badge) { badge.textContent = all.length; badge.hidden = !all.length; }
    body(`<div class="st-tiles">
        ${tile("Заповнили калькулятор", num(list.length))}
        ${tile("Написали в Telegram", num(tg), list.length ? `<small class="st-delta">${Math.round(tg / list.length * 100)}% від заповнених</small>` : "")}
        ${tile("Найчастіше рахують", esc(typeRows[0] ? typeRows[0][0] : "—"))}
        ${tile("Усього за весь час", num(all.length))}
      </div>
      ${list.length ? `<div class="panel st-card"><h3>Заявки по днях</h3>${chart(daysList(byDay), "Заявки по днях")}</div>` : ""}
      <div class="panel st-card">
        <h3>Заповнені форми <small class="muted">${state.days} днів · нові зверху</small></h3>
        ${list.length ? `<div class="ld-list">${list.map(l => `
          <details class="ld-item">
            <summary>
              <span class="ld-date">${esc(fmtWall(l.wall))}</span>
              <span class="ld-type">${esc((l.rows.find(r => r[0] === "Тип сайту") || [])[1] || "Сайт")}</span>
              <span class="ld-price">${esc(l.price)}</span>
              ${l.tg ? `<span class="ld-tag ok">написав у Telegram</span>` : `<span class="ld-tag">не написав</span>`}
            </summary>
            <dl class="ld-dl">
              ${l.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}
              ${l.market ? `<div><dt>Ринкова ціна</dt><dd>${esc(l.market)}</dd></div>` : ""}
              <div><dt>Джерело</dt><dd>${esc(l.src || "—")}</dd></div>
              <div><dt>Пристрій</dt><dd>${esc(l.device || "—")}</dd></div>
            </dl>
          </details>`).join("")}</div>` : `<p class="muted">За цей період калькулятор ще ніхто не заповнив. Кожна пройдена до кінця форма на <a href="/instrumenty/kalkuliator-vartosti-saitu/" target="_blank" rel="noopener">калькуляторі вартості сайту</a> з'являється тут одразу.</p>`}
      </div>
      ${list.length ? `<div class="st-grid2">${listCard("Які сайти рахують", typeRows)}${listCard("Звідки прийшли", Object.entries(srcs).sort((x, y) => y[1] - x[1]))}</div>` : ""}
      ${footer(`Контактів у формі немає: калькулятор анонімний. «Написав у Telegram» — людина натиснула «Обговорити в Telegram» з готовим розрахунком; саме повідомлення шукайте в Telegram. <a href="${LINKS.sheet}" target="_blank" rel="noopener">Відкрити таблицю ↗</a>`)}`);
  }

  window.AdminStats = {
    show(view) {
      if (!$s("#stats .st-head")) shell();
      if (view && view !== state.view) setView(view); else load();
    },
  };
})();
