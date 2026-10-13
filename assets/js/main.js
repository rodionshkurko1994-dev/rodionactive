/* Rodionactive — спільний код сайту */

// ===== Налаштування сайту (зміни під себе) =====
const SITE = {
  name: "Rodionactive",
  email: "hello@rodionactive.com",          // TODO: заміни на свою пошту
  telegram: "https://t.me/rodionactive",     // TODO: заміни на свій Telegram
  github: "https://github.com/rodionshkurko1994-dev",
};

document.documentElement.classList.add("js");

// ----- шапка й підвал -----
const page = document.body.dataset.page || "";
const root = document.body.dataset.root || "";
const NAV = [
  ["index.html#services", "Послуги", "services"],
  ["portfolio.html", "Портфоліо", "portfolio"],
  ["blog.html", "Блог", "blog"],
  ["index.html#contact", "Контакти", "contact"],
];

function logoMarkup() {
  return [...SITE.name].map(c => `<span>${c}</span>`).join("") + '<span class="dot" aria-hidden="true"></span>';
}

const header = document.querySelector("[data-site-header]");
if (header) {
  header.className = "site-header";
  header.innerHTML = `
    <div class="wrap bar">
      <a class="logo" href="${root}index.html" aria-label="${SITE.name} — на головну">${logoMarkup()}</a>
      <nav class="nav" id="nav">
        ${NAV.map(([href, label, key]) => `<a href="${root}${href}"${key === page ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
        <a class="nav-cta link" href="${root}index.html#contact">Обговорити проєкт →</a>
      </nav>
      <a class="btn small header-cta" href="${root}index.html#contact">Обговорити проєкт <span class="arr">→</span></a>
      <button class="menu-btn" aria-label="Меню" aria-expanded="false" aria-controls="nav"><i></i><i></i><i></i></button>
    </div>
    <div class="progress" aria-hidden="true"></div>`;
  const btn = header.querySelector(".menu-btn");
  btn.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    btn.setAttribute("aria-expanded", open);
  });
  header.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
}

const footer = document.querySelector("[data-site-footer]");
if (footer) {
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap row">
      <a class="logo" href="${root}index.html">${logoMarkup()}</a>
      <nav>
        <a class="link" href="${root}portfolio.html">Портфоліо</a>
        <a class="link" href="${root}blog.html">Блог</a>
        <a class="link" href="${SITE.telegram}" target="_blank" rel="noopener">Telegram</a>
        <a class="link" href="${SITE.github}" target="_blank" rel="noopener">GitHub</a>
      </nav>
      <small>© ${new Date().getFullYear()} ${SITE.name} · Київ</small>
    </div>`;
}

// ----- прогрес прокрутки та тінь шапки -----
const progress = document.querySelector(".progress");
function onScroll() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  if (progress) progress.style.setProperty("--p", max > 0 ? (h.scrollTop / max).toFixed(4) : 0);
  header && header.classList.toggle("is-scrolled", h.scrollTop > 8);
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ----- поява блоків при прокрутці -----
const io = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" })
  : null;
function observeReveal(scope = document) {
  scope.querySelectorAll(".reveal:not(.in)").forEach(el => io ? io.observe(el) : el.classList.add("in"));
}
observeReveal();

// ----- дані -----
const cache = {};
async function loadJSON(name) {
  if (!cache[name]) {
    cache[name] = fetch(`${root}data/${name}.json`, { cache: "no-cache" })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(list => list.filter(x => !x.draft).sort((a, b) => (b.date || "").localeCompare(a.date || "")));
  }
  return cache[name];
}

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "";
const img = src => !src ? "" : /^(https?:|data:)/.test(src) ? src : root + src;

function renderMarkdown(md) {
  if (window.marked) {
    const html = marked.parse(md || "");
    return window.DOMPurify ? DOMPurify.sanitize(html) : html;
  }
  return (md || "").split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join("");
}

function projectCard(p) {
  return `
    <a class="project reveal" href="${root}project.html#${esc(p.slug)}" data-cat="${esc(p.category)}">
      <div class="cover">
        ${p.cover ? `<img src="${esc(img(p.cover))}" alt="" loading="lazy">` : ""}
        <span class="badge">${esc(p.category)}</span>
        <span class="view" aria-hidden="true">↗</span>
      </div>
      <div class="meta"><h3>${esc(p.title)}</h3><span class="year">${esc(p.year || "")}</span></div>
      <p>${esc(p.summary)}</p>
    </a>`;
}

function postRow(p) {
  return `
    <a class="post-row reveal" href="${root}post.html#${esc(p.slug)}">
      <time datetime="${esc(p.date)}">${fmtDate(p.date)}</time>
      <div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
        ${p.tags?.length ? `<div class="tags">${p.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join("")}</div>` : ""}
      </div>
      <span class="arrow" aria-hidden="true">→</span>
    </a>`;
}

async function fill(el, name, render, { limit, empty } = {}) {
  if (!el) return [];
  try {
    let list = await loadJSON(name);
    if (limit) list = list.slice(0, limit);
    el.innerHTML = list.length ? list.map(render).join("") : `<p class="empty">${empty}</p>`;
    observeReveal(el);
    return list;
  } catch (e) {
    el.innerHTML = `<p class="empty">Не вдалося завантажити дані. Онови сторінку.</p>`;
    return [];
  }
}

// ----- герой: слово, що перекладається -----
const swap = document.querySelector("[data-swap]");
if (swap) {
  const words = [["Привіт", "UA"], ["Hello", "EN"], ["Привет", "RU"]];
  const langs = document.querySelectorAll("[data-lang]");
  let i = 0;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const show = () => {
    const [w, l] = words[i];
    swap.innerHTML = [...w].map((c, k) => `<span class="ch" style="--i:${k}">${c}</span>`).join("");
    langs.forEach(x => x.toggleAttribute("data-on", x.dataset.lang === l));
    langs.forEach(x => x.innerHTML = x.dataset.lang === l ? `<b>${x.dataset.lang}</b>` : x.dataset.lang);
  };
  show();
  if (!reduce) setInterval(() => { i = (i + 1) % words.length; show(); }, 2600);
}

// ----- контакти -----
document.querySelectorAll("[data-email]").forEach(a => { a.href = "mailto:" + SITE.email; a.querySelector("b").textContent = SITE.email; });
document.querySelectorAll("[data-telegram]").forEach(a => { a.href = SITE.telegram; a.querySelector("b").textContent = "@" + SITE.telegram.split("/").pop(); });
document.querySelectorAll("[data-github]").forEach(a => { a.href = SITE.github; a.querySelector("b").textContent = SITE.github.replace("https://", ""); });
document.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(SITE.email); b.textContent = "Скопійовано ✓"; }
  catch { b.textContent = SITE.email; }
  setTimeout(() => b.innerHTML = 'Скопіювати пошту <span class="arr">→</span>', 2200);
}));
