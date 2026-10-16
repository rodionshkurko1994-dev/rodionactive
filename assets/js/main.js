/* Rodionactive — спільний код сайту */

// ===== Налаштування сайту (зміни під себе) =====
const SITE = {
  name: "Rodionactive",
  email: "",                                 // додай пошту, якщо хочеш показувати її на сайті
  telegram: "https://t.me/rodionactive",
  instagram: "https://www.instagram.com/rodionactive.io",
  freelancehunt: "https://freelancehunt.com/freelancer/rodionskipper.html",
};

document.documentElement.classList.add("js");

// ----- шапка й підвал -----
// На згенерованих сторінках шапка й підвал уже є в HTML (так їх бачить Google).
// Якщо сторінка без них (404, переадресації), будуємо їх тут.
const page = document.body.dataset.page || "";
const NAV = [["/#services", "Послуги", "services"], ["/portfolio/", "Портфоліо", "portfolio"], ["/blog/", "Блог", "blog"], ["/#contact", "Контакти", "contact"]];
const logoMarkup = () => [...SITE.name].map(c => `<span>${c}</span>`).join("") + '<span class="dot" aria-hidden="true"></span>';

const header = document.querySelector("[data-site-header]");
if (header && !header.children.length) {
  header.className = "site-header";
  header.innerHTML = `
    <div class="wrap bar">
      <a class="logo" href="/" aria-label="${SITE.name} — на головну">${logoMarkup()}</a>
      <nav class="nav" id="nav">
        ${NAV.map(([href, label, key]) => `<a href="${href}"${key === page ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
        <a class="nav-cta link" href="${SITE.telegram}" target="_blank" rel="noopener">Обговорити проєкт →</a>
        <a class="nav-cta link" href="https://svitlo-kyiv.online" target="_blank" rel="noopener">Svitlo Kyiv ↗</a>
      </nav>
      <div class="header-actions">
        <a class="btn small ghost header-cta" href="https://svitlo-kyiv.online" target="_blank" rel="noopener">Svitlo Kyiv <span class="arr">↗</span></a>
        <a class="btn small header-cta" href="${SITE.telegram}" target="_blank" rel="noopener">Обговорити проєкт <span class="arr">→</span></a>
      </div>
      <button class="menu-btn" type="button" aria-label="Меню" aria-expanded="false" aria-controls="nav"><i></i><i></i><i></i></button>
    </div>
    <div class="progress" aria-hidden="true"></div>`;
}
if (header) {
  const btn = header.querySelector(".menu-btn");
  btn && btn.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    btn.setAttribute("aria-expanded", open);
  });
  header.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
}

const footer = document.querySelector("[data-site-footer]");
if (footer && !footer.children.length) {
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap row">
      <a class="logo" href="/">${logoMarkup()}</a>
      <nav>
        <a class="link" href="/portfolio/">Портфоліо</a>
        <a class="link" href="/blog/">Блог</a>
        <a class="link" href="${SITE.telegram}" target="_blank" rel="noopener">Telegram</a>
        <a class="link" href="${SITE.instagram}" target="_blank" rel="noopener">Instagram</a>
        <a class="link" href="${SITE.freelancehunt}" target="_blank" rel="noopener">Freelancehunt</a>
      </nav>
      <small>© <span data-year></span> ${SITE.name} · Київ</small>
    </div>`;
}
document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

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

// ----- фільтри в блозі й портфоліо -----
document.querySelectorAll("[data-filter-group]").forEach(group => {
  const kind = group.dataset.filterGroup;
  const list = document.querySelector(`[data-filter-list="${kind}"]`);
  const count = document.querySelector("[data-count]");
  if (!list) return;
  const items = [...list.children].filter(el => el.matches("a"));
  const plural = n => n % 10 === 1 && n % 100 !== 11 ? "проєкт" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "проєкти" : "проєктів";
  const apply = value => {
    let n = 0;
    group.querySelectorAll("[data-filter]").forEach(b => b.setAttribute("aria-pressed", b.dataset.filter === value));
    items.forEach(el => {
      const values = kind === "tags" ? (el.dataset.tags || "").split("|") : [el.dataset.cat];
      const show = !value || values.includes(value);
      el.hidden = !show;
      if (show) { n++; el.classList.add("in"); }
    });
    if (count && kind === "cat") count.textContent = `${n} ${plural(n)}`;
  };
  group.addEventListener("click", e => {
    const b = e.target.closest("[data-filter]");
    if (b) apply(b.dataset.filter);
  });
  let fromHash = "";
  try { fromHash = decodeURIComponent(location.hash.slice(1)); } catch {}
  if (fromHash && group.querySelector(`[data-filter="${CSS.escape(fromHash)}"]`)) apply(fromHash);
});

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
document.querySelectorAll("[data-email]").forEach(a => {
  if (!SITE.email) { a.hidden = true; return; }
  a.href = "mailto:" + SITE.email; a.querySelector("b").textContent = SITE.email;
});
document.querySelectorAll("[data-telegram]").forEach(a => { a.href = SITE.telegram; const b = a.querySelector("b"); if (b) b.textContent = "@" + SITE.telegram.split("/").pop(); });
document.querySelectorAll("[data-instagram]").forEach(a => { a.href = SITE.instagram; const b = a.querySelector("b"); if (b) b.textContent = "@" + SITE.instagram.replace(/\/$/, "").split("/").pop(); });

// ----- лічильники в цифрах -----
(function () {
  const els = document.querySelectorAll("[data-count-to]");
  if (!els.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  els.forEach(el => {
    const to = +el.dataset.countTo, t0 = performance.now(), dur = 1400;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e) + "+";
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})();

// ----- превʼю інших статей справа: стільки, скільки вміщується поруч із текстом -----
(function () {
  const asides = document.querySelectorAll("[data-fit-aside]");
  if (!asides.length) return;
  const fit = () => asides.forEach(aside => {
    const prose = aside.parentElement.querySelector(".prose");
    const cards = [...aside.querySelectorAll(".aside-card")];
    if (!prose || getComputedStyle(aside).display === "none") return;
    cards.forEach(c => c.hidden = false);
    const limit = prose.getBoundingClientRect().bottom;
    let shown = 0;
    cards.forEach(c => {
      const fits = c.getBoundingClientRect().bottom <= limit + 1;
      if (!fits && shown > 0) c.hidden = true; else shown++;
    });
  });
  let t;
  const later = () => { clearTimeout(t); t = setTimeout(fit, 120); };
  fit();
  addEventListener("resize", later);
  addEventListener("load", fit);
  document.fonts && document.fonts.ready.then(fit);
  document.querySelectorAll(".prose img, .aside-card img").forEach(img => img.complete || img.addEventListener("load", later));
})();
