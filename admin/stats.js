/* Rodionactive — статистика відвідувань в адмінці.
   Дані збирає GoatCounter (лічильник підключений на всіх сторінках сайту),
   адмінка читає їх через API GoatCounter прямо з браузера. */
(function () {
  "use strict";
  const LS = "rodionactive-stats";
  // власні заходи з цього браузера не рахуються (GoatCounter перевіряє цей прапорець)
  try { localStorage.setItem("skipgc", "t"); } catch {}
  const $s = sel => document.querySelector(sel);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = n => Number(n || 0).toLocaleString("uk-UA");
  const MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];
  const dayLabel = d => { const [, m, day] = d.split("-").map(Number); return `${day} ${MONTHS[m - 1]}`; };

  const cfg = (() => { try { return { code: "rodionactive", key: "", ...JSON.parse(localStorage.getItem(LS) || "{}") }; } catch { return { code: "rodionactive", key: "" }; } })();
  const saveCfg = () => { try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch {} };
  let days = 30, loading = false;

  async function api(path, params = {}) {
    const url = new URL(`https://${cfg.code}.goatcounter.com/api/v0${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url, { headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" } });
    if (r.status === 401) throw new Error("Ключ API не підходить. Перевірте його в налаштуваннях статистики.");
    if (r.status === 403) throw new Error("У ключа API немає права «Read statistics». Створіть ключ із цим дозволом.");
    if (r.status === 404) return null; // у щойно створеного сайту ще немає даних
    if (r.status === 429) throw new Error("GoatCounter просить зачекати кілька секунд. Оновіть статистику трохи пізніше.");
    if (!r.ok) throw new Error(`GoatCounter відповів ${r.status}.`);
    return r.json();
  }
  const pause = ms => new Promise(r => setTimeout(r, ms));

  function range() {
    const end = new Date();
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // ---------- розмітка ----------
  function shell() {
    $s("#stats").innerHTML = `
      <div class="st-head">
        <div>
          <p class="eyebrow">Статистика</p>
          <h2>Відвідування сайту</h2>
        </div>
        <div class="st-tools">
          <div class="tabs" role="group" aria-label="Період">
            ${[7, 30, 90].map(d => `<button class="tab" type="button" data-days="${d}" aria-pressed="${d === days}">${d} днів</button>`).join("")}
          </div>
          <button class="btn small ghost" type="button" data-st-refresh>Оновити</button>
          <button class="btn small ghost" type="button" data-st-setup>Налаштування</button>
        </div>
      </div>
      <div class="st-setup panel" hidden></div>
      <div class="st-body"></div>`;
    $s("#stats").querySelectorAll("[data-days]").forEach(b => b.addEventListener("click", () => {
      days = +b.dataset.days;
      $s("#stats").querySelectorAll("[data-days]").forEach(x => x.setAttribute("aria-pressed", x === b));
      load();
    }));
    $s("[data-st-refresh]").addEventListener("click", load);
    $s("[data-st-setup]").addEventListener("click", () => setup(true));
  }

  function setup(open) {
    const box = $s(".st-setup");
    box.hidden = !open;
    if (!open) return;
    box.innerHTML = `
      <div class="settings" style="padding:clamp(18px,3vw,28px);max-width:760px">
        <h3 style="font-size:var(--step-1)">Підключення статистики</h3>
        <div class="note">
          Статистику збирає безкоштовний сервіс <b>GoatCounter</b>. Лічильник уже стоїть на всіх сторінках сайту, потрібно лише один раз створити акаунт:
          <ol>
            <li>Зареєструйтеся на <a href="https://www.goatcounter.com/signup" target="_blank" rel="noopener">goatcounter.com/signup</a>. У полі <b>Code</b> вкажіть <b>rodionactive</b>, у <b>Site domain</b> — <b>rodionactive.com</b>.</li>
            <li>У кабінеті GoatCounter відкрийте <b>User → API</b> і створіть ключ із дозволом <b>Read statistics</b>.</li>
            <li>Вставте код сайту й ключ нижче. Ключ зберігається лише в цьому браузері.</li>
          </ol>
        </div>
        <div class="row">
          <div class="field"><label for="st-code">Код сайту на GoatCounter</label><input type="text" id="st-code" value="${esc(cfg.code)}" autocomplete="off"><small>${esc(cfg.code || "код")}.goatcounter.com</small></div>
          <div class="field"><label for="st-key">Ключ API</label><input type="password" id="st-key" value="${esc(cfg.key)}" autocomplete="off" placeholder="ключ з розділу User → API"></div>
        </div>
        <div class="actions">
          <button class="btn" type="button" data-st-save>Показати статистику <span class="arr">→</span></button>
          ${cfg.key ? `<button class="btn ghost" type="button" data-st-close>Закрити</button>` : ""}
          <span class="spacer"></span>
          ${cfg.key ? `<button class="btn small danger" type="button" data-st-forget>Забути ключ</button>` : ""}
        </div>
      </div>`;
    box.querySelector("[data-st-save]").addEventListener("click", () => {
      cfg.code = $s("#st-code").value.trim().toLowerCase().replace(/\.goatcounter\.com.*$/, "").replace(/^https?:\/\//, "");
      cfg.key = $s("#st-key").value.trim();
      saveCfg(); setup(false); load();
    });
    box.querySelector("[data-st-close]")?.addEventListener("click", () => setup(false));
    box.querySelector("[data-st-forget]")?.addEventListener("click", () => { cfg.key = ""; saveCfg(); setup(true); $s(".st-body").innerHTML = ""; });
  }

  function message(html) { $s(".st-body").innerHTML = `<div class="panel st-msg">${html}</div>`; }

  // ---------- завантаження ----------
  async function load() {
    if (!cfg.key) { setup(true); message("Підключіть GoatCounter, щоб побачити статистику відвідувань і переглядів статей."); return; }
    if (loading) return;
    loading = true;
    message(`<div class="skeleton" style="height:120px"></div>`);
    try {
      const r = range();
      const soft = p => p.catch(e => { if (/Ключ API|Read statistics/.test(e.message)) throw e; return null; });
      const total = await api("/stats/total", r); await pause(300);
      const hits = await api("/stats/hits", { ...r, limit: 100 }); await pause(300);
      const refs = await soft(api("/stats/toprefs", { ...r, limit: 8 })); await pause(300);
      const locs = await soft(api("/stats/locations", { ...r, limit: 8 }));
      render(total || { total: 0, stats: [] }, hits || { hits: [] }, refs || { stats: [] }, locs || { stats: [] }, !total && !hits);
    } catch (e) {
      message(`<p><b>Не вдалося завантажити статистику.</b></p><p class="muted">${esc(e.message)}</p>`);
    } finally { loading = false; }
  }

  // ---------- графік по днях ----------
  function chart(stats) {
    const byDay = {}; (stats || []).forEach(s => { byDay[s.day] = (byDay[s.day] || 0) + (s.daily || 0); });
    const list = [];
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (days - 1));
    for (let i = 0; i < days; i++) { const k = d.toISOString().slice(0, 10); list.push([k, byDay[k] || 0]); d.setDate(d.getDate() + 1); }
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
    const bars = list.map(([k, v], i) => {
      const x = L + i * bw + gap / 2, w = Math.max(1, bw - gap), h = Math.max(v ? 2 : 0, H - B - y(v));
      const r = Math.min(4, w / 2, h);
      const path = h ? `M${x},${H - B} V${H - B - h + r} Q${x},${H - B - h} ${x + r},${H - B - h} H${x + w - r} Q${x + w},${H - B - h} ${x + w},${H - B - h + r} V${H - B} Z` : "";
      return `<g class="st-bar" data-tip="${dayLabel(k)}: ${num(v)}"><rect x="${L + i * bw}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent"/>${path ? `<path d="${path}"/>` : ""}${(i % every === 0 && list.length - 1 - i >= every / 2) || i === list.length - 1 ? `<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle" class="st-axis">${dayLabel(k)}</text>` : ""}</g>`;
    }).join("");
    return `<div class="st-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Відвідувачі по днях за ${days} днів">${grid}${bars}</svg><div class="st-tip" hidden></div></div>`;
  }

  function bindChart() {
    const box = $s(".st-chart"); if (!box) return;
    const tip = box.querySelector(".st-tip");
    box.querySelectorAll(".st-bar").forEach(g => {
      g.addEventListener("mouseenter", () => {
        tip.textContent = g.dataset.tip; tip.hidden = false;
        const b = g.getBoundingClientRect(), c = box.getBoundingClientRect();
        tip.style.left = `${b.left - c.left + b.width / 2}px`;
      });
      g.addEventListener("mouseleave", () => tip.hidden = true);
    });
  }

  const listCard = (title, rows, empty) => `
    <div class="panel st-card">
      <h3>${title}</h3>
      ${rows.length ? `<ul class="st-list">${rows.map(([name, count, max]) => `<li><span class="st-name" title="${esc(name)}">${esc(name)}</span><span class="st-num">${num(count)}</span><i style="--w:${max ? Math.round(count / max * 100) : 0}%"></i></li>`).join("")}</ul>` : `<p class="muted">${empty}</p>`}
    </div>`;

  function render(total, hits, refs, locs, empty) {
    const all = hits.hits || [];
    const norm = p => (p || "").replace(/\/index\.html$/, "/").replace(/([^/])$/, "$1/");
    const byPath = {}; all.forEach(h => { const k = norm(h.path); byPath[k] = (byPath[k] || 0) + (h.count || 0); });
    const posts = (window.__adminPosts ? window.__adminPosts() : []).filter(p => !p.draft && p.slug);
    const postRows = posts.map(p => [p, byPath[`/blog/${p.slug}/`] || 0]).sort((a, b) => b[1] - a[1] || (b[0].date || "").localeCompare(a[0].date || ""));
    const postViews = postRows.reduce((s, r) => s + r[1], 0);
    const today = new Date(); today.setHours(12); const todayKey = today.toISOString().slice(0, 10);
    const todayCount = (total.stats || []).filter(s => s.day === todayKey).reduce((s, x) => s + (x.daily || 0), 0);
    const maxPost = Math.max(1, ...postRows.map(r => r[1]));
    const pages = all.filter(h => !h.event).slice().sort((a, b) => b.count - a.count).slice(0, 8);
    const titleFor = p => { const k = norm(p.path); if (k === "/") return "Головна"; if (k === "/blog/") return "Блог (список)"; if (k === "/portfolio/") return "Портфоліо (список)"; const post = posts.find(x => `/blog/${x.slug}/` === k); return post ? post.title : (p.title || p.path); };
    const refRows = (refs.stats || []).map(x => [x.name || "Прямі заходи", x.count]);
    const locRows = (locs.stats || []).map(x => [x.name || x.id || "Невідомо", x.count]);
    const mx = rows => Math.max(1, ...rows.map(r => r[1]));

    $s(".st-body").innerHTML = `${empty ? `<div class="panel st-msg"><p><b>Статистика підключена.</b> Відвідувань поки не зафіксовано: дані з'являться після перших заходів на сайт. Ваш власний браузер (той, де відкрита адмінка) не рахується, тож для перевірки відкрийте rodionactive.com з телефона.</p></div>` : ""}
      <div class="st-tiles">
        <div class="panel st-tile"><span>Відвідувачі за ${days} днів</span><b>${num(total.total)}</b></div>
        <div class="panel st-tile"><span>Сьогодні</span><b>${num(todayCount)}</b></div>
        <div class="panel st-tile"><span>У середньому за день</span><b>${num(Math.round((total.total || 0) / days))}</b></div>
        <div class="panel st-tile"><span>Перегляди статей</span><b>${num(postViews)}</b></div>
      </div>
      <div class="panel st-card">
        <h3>Відвідувачі по днях</h3>
        ${chart(total.stats)}
      </div>
      <div class="panel st-card">
        <h3>Статті блогу <small class="muted">${days} днів · від найпопулярніших</small></h3>
        <table class="st-table">
          <thead><tr><th>Стаття</th><th class="r">Перегляди</th></tr></thead>
          <tbody>${postRows.map(([p, c]) => `<tr><td><a href="/blog/${esc(p.slug)}/" target="_blank" rel="noopener">${esc(p.title)}</a><i style="--w:${Math.round(c / maxPost * 100)}%"></i></td><td class="r">${num(c)}</td></tr>`).join("") || `<tr><td colspan="2" class="muted">Статей поки немає.</td></tr>`}</tbody>
        </table>
      </div>
      <div class="st-grid3">
        ${listCard("Найпопулярніші сторінки", pages.map(p => [titleFor(p), p.count]).map((r, i, a) => [...r, mx(a)]), "Поки немає даних.")}
        ${listCard("Звідки приходять", refRows.map(r => [...r, mx(refRows)]), "Поки немає даних.")}
        ${listCard("Країни", locRows.map(r => [...r, mx(locRows)]), "Поки немає даних.")}
      </div>
      <p class="muted st-note">Рахуються унікальні відвідувачі: повторні перегляди тієї самої сторінки однією людиною протягом дня не додаються. Дані оновлюються щохвилини. <a href="https://${esc(cfg.code)}.goatcounter.com" target="_blank" rel="noopener">Повна статистика на GoatCounter ↗</a></p>`;
    bindChart();
  }

  window.AdminStats = {
    show() { if (!$s("#stats .st-head")) shell(); load(); },
  };
})();
