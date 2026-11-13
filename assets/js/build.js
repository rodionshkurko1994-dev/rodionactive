/* Rodionactive — генератор статичних сторінок для пошукових систем.
   Працює і в браузері (адмінка), і в Node (node tools/build.mjs).
   Кожна стаття й проєкт отримують окрему HTML-сторінку з повним текстом,
   мета-тегами, Open Graph, schema.org; також генеруються sitemap.xml і RSS. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./services.js"));
  else root.SiteBuild = factory(root.SiteServices);
})(typeof self !== "undefined" ? self : this, function (SiteServices) {
  "use strict";

  const ASSET_V = "202611131210";
  const SITE = {
    indexnow: "12cba8b8fd8282671bc005a053c7c109",
    name: "Rodionactive",
    url: "https://rodionactive.com",
    locale: "uk_UA",
    description: "Сайти під ключ, графічний дизайн, автоматизація процесів на базі Claude і переклади українською, англійською та російською. 50+ запущених сайтів, 8+ років досвіду.",
    shortDescription: "Сайти під ключ, графічний дизайн, автоматизація з Claude і переклади UA · EN · RU.",
    image: "/assets/img/og-image.png",
    logo: "/assets/img/logo-512.png",
    telegram: "https://t.me/rodionactive",
    instagram: "https://www.instagram.com/rodionactive.io",
    freelancehunt: "https://freelancehunt.com/freelancer/rodionskipper.html",
    goatcounter: "https://rodionactive.goatcounter.com/count",
    city: "Київ",
  };
  const FONTS = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Onest:wght@400;500;600&family=Unbounded:wght@500;600;700&display=swap";

  // ---------- допоміжні ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const xml = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
  const MONTHS = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  const fmtDate = d => { if (!d) return ""; const [y, m, day] = d.split("-").map(Number); return `${day} ${MONTHS[m - 1]} ${y} р.`; };
  const abs = p => !p ? "" : /^https?:/.test(p) ? p : SITE.url + "/" + p.replace(/^\//, "");
  const rel = p => !p ? "" : /^(https?:|data:)/.test(p) ? p : "/" + p.replace(/^\//, "");
  const postUrl = p => `/blog/${p.slug}/`;
  const projectUrl = p => `/portfolio/${p.slug}/`;
  const visible = list => (list || []).filter(x => !x.draft && x.slug).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const stripMd = md => String(md || "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*_`~-]+/g, " ").replace(/\s+/g, " ").trim();
  function clip(text, n = 158) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    if (t.length <= n) return t;
    const cut = t.slice(0, n - 1);
    return cut.slice(0, Math.max(cut.lastIndexOf(" "), n * 0.6)).replace(/[\s,.;:—–-]+$/, "") + "…";
  }
  const rfc822 = d => new Date((d || "2026-01-01") + "T09:00:00+03:00").toUTCString();
  const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

  // ---------- спільні шматки сторінки ----------
  const NAV = [["/services/", "Послуги", "services"], ["/portfolio/", "Портфоліо", "portfolio"], ["/blog/", "Блог", "blog"], ["/#contact", "Контакти", "contact"]];
  const logo = () => [...SITE.name].map(c => `<span>${c}</span>`).join("") + '<span class="dot" aria-hidden="true"></span>';

  function headerHTML(page) {
    return `<header class="site-header" data-site-header>
  <div class="wrap bar">
    <a class="logo" href="/" aria-label="${SITE.name} — на головну">${logo()}</a>
    <nav class="nav" id="nav" aria-label="Головне меню">
      ${NAV.map(([href, label, key]) => `<a href="${href}"${key === page ? ' aria-current="page"' : ""}>${label}</a>`).join("\n      ")}
      <a class="nav-cta link" href="${SITE.telegram}" target="_blank" rel="noopener">Обговорити проєкт →</a>
      <a class="nav-cta link" href="https://cyber-kyiv.online" target="_blank" rel="noopener">Cyber Kyiv ↗</a>
      <a class="nav-cta link" href="https://projectx.vision" target="_blank" rel="noopener">Project X ↗</a>
    </nav>
    <div class="header-actions">
      <a class="btn small ghost header-cta" href="https://cyber-kyiv.online" target="_blank" rel="noopener">Cyber Kyiv <span class="arr">↗</span></a>
      <a class="btn small ghost header-cta" href="https://projectx.vision" target="_blank" rel="noopener">Project X <span class="arr">↗</span></a>
      <a class="btn small header-cta" href="${SITE.telegram}" target="_blank" rel="noopener">Обговорити проєкт <span class="arr">→</span></a>
    </div>
    <button class="menu-btn" type="button" aria-label="Меню" aria-expanded="false" aria-controls="nav"><i></i><i></i><i></i></button>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>`;
  }

  function footerHTML() {
    return `<footer class="site-footer" data-site-footer>
  <div class="wrap row">
    <a class="logo" href="/">${logo()}</a>
    <nav aria-label="Посилання в підвалі">
      <a class="link" href="/services/">Послуги</a>
      <a class="link" href="/portfolio/">Портфоліо</a>
      <a class="link" href="/blog/">Блог</a>
      <a class="link" href="${SITE.telegram}" target="_blank" rel="noopener">Telegram</a>
      <a class="link" href="${SITE.instagram}" target="_blank" rel="noopener">Instagram</a>
      <a class="link" href="${SITE.freelancehunt}" target="_blank" rel="noopener">Freelancehunt</a>
    </nav>
    <small>© <span data-year>${new Date().getFullYear()}</span> ${SITE.name} · ${SITE.city}</small>
  </div>
</footer>`;
  }

  function headHTML({ title, description, path, type = "website", image, jsonld = [], extra = "", robots = "index, follow, max-image-preview:large, max-snippet:-1" }) {
    const url = SITE.url + path;
    const img = abs(image || SITE.image);
    return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<meta name="google-site-verification" content="32UPPDQ_Ts-Mc-xpi0cvKzvlzNxCqrRBnDDTLUDRvx0">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="${SITE.locale}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(img)}">
${extra}<link rel="alternate" type="application/rss+xml" title="Блог ${SITE.name}" href="/blog/feed.xml">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon-48.png" type="image/png" sizes="48x48">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<meta name="theme-color" content="#383e65">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/css/style.css?v=${ASSET_V}">
<script data-goatcounter="${SITE.goatcounter}" async src="https://gc.zgo.at/count.js"></script>
${jsonld.map(ld).join("\n")}`;
  }

  function page({ head, page, body }) {
    return `<!doctype html>
<html lang="uk">
<head>
${head}
</head>
<body data-page="${page}" data-root="/">
${headerHTML(page)}

<main class="wrap">
${body}
</main>

${footerHTML()}

<script src="/assets/js/main.js?v=${ASSET_V}"></script>
</body>
</html>
`;
  }

  // ---------- schema.org ----------
  const ORG_ID = SITE.url + "/#org";
  const orgRef = { "@id": ORG_ID };
  function orgLD() {
    return {
      "@type": ["Organization", "ProfessionalService"],
      "@id": ORG_ID,
      name: SITE.name,
      url: SITE.url + "/",
      logo: { "@type": "ImageObject", url: abs(SITE.logo), width: 512, height: 512 },
      image: abs(SITE.image),
      description: SITE.description,
      address: { "@type": "PostalAddress", addressLocality: SITE.city, addressCountry: "UA" },
      areaServed: ["UA", "Worldwide"],
      knowsLanguage: ["uk", "en", "ru"],
      sameAs: [SITE.telegram, SITE.instagram, SITE.freelancehunt],
    };
  }
  const crumbs = items => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE.url + path })),
  });

  // ---------- картки (та сама розмітка, що й у main.js) ----------
  function postRow(p) {
    return `<a class="post-row reveal" href="${postUrl(p)}" data-tags="${esc((p.tags || []).join("|"))}">
      <time datetime="${esc(p.date)}">${fmtDate(p.date)}</time>
      <div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
        ${p.tags && p.tags.length ? `<div class="tags">${p.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join("")}</div>` : ""}
      </div>
      <span class="arrow" aria-hidden="true">→</span>
    </a>`;
  }

  function projectCard(p) {
    return `<a class="project reveal" href="${projectUrl(p)}" data-cat="${esc(p.category)}">
      <div class="cover">
        ${p.cover ? `<img src="${esc(rel(p.cover))}" alt="${esc(p.title)} — ${esc(p.summary || p.category)}" loading="lazy" decoding="async">` : ""}
        <span class="badge">${esc(p.category)}</span>
        <span class="view" aria-hidden="true">↗</span>
      </div>
      <div class="meta"><h3>${esc(p.title)}</h3><span class="year">${esc(p.year || "")}</span></div>
      <p>${esc(p.summary)}</p>
    </a>`;
  }

  function asideCard(p, hidden) {
    return `<a class="aside-card" href="${postUrl(p)}"${hidden ? " hidden" : ""}>
          ${p.cover ? `<span class="aside-thumb"><img src="${esc(rel(p.cover))}" alt="" loading="lazy" decoding="async"></span>` : ""}
          <time datetime="${esc(p.date)}">${fmtDate(p.date)}</time>
          <span class="aside-title">${esc(p.title)}</span>
        </a>`;
  }

  // ---------- сторінка статті ----------
  function renderPost(p, posts, md) {
    const html = md(p.body || "");
    const text = stripMd(p.body);
    const description = clip(p.description || p.excerpt || text);
    const modified = p.updated || p.date;
    const idx = posts.indexOf(p);
    const next = posts[idx + 1];
    const related = posts.filter(x => x !== p && x !== next && (x.tags || []).some(t => (p.tags || []).includes(t))).slice(0, 3);
    // превʼю справа від тексту: спершу статті з тими самими темами, потім найсвіжіші.
    // Кількість підганяє main.js під висоту тексту; тут лише орієнтовна для показу без JS.
    const sameTopic = x => (x.tags || []).some(t => (p.tags || []).includes(t));
    const aside = [...posts.filter(x => x !== p && sameTopic(x)), ...posts.filter(x => x !== p && !sameTopic(x))].slice(0, 12);
    const asideVisible = Math.max(1, Math.min(aside.length, Math.floor(String(p.body || "").length / 900)));
    const path = postUrl(p);
    // якщо анонс дослівно повторює початок статті, не показуємо його двічі
    const norm = t => String(t || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const leadRepeats = !!p.excerpt && norm(p.body).startsWith(norm(p.excerpt));
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "BlogPosting",
          "@id": SITE.url + path + "#article",
          mainEntityOfPage: SITE.url + path,
          headline: p.title.slice(0, 110),
          description,
          image: p.cover ? [abs(p.cover)] : [abs(SITE.image)],
          datePublished: p.date,
          dateModified: modified,
          inLanguage: "uk",
          author: orgRef,
          publisher: orgRef,
          keywords: (p.tags || []).join(", "),
          articleSection: (p.tags || [])[0] || "Блог",
          wordCount: text.split(/\s+/).filter(Boolean).length,
          isPartOf: { "@id": SITE.url + "/blog/#blog" },
        },
        crumbs([["Головна", "/"], ["Блог", "/blog/"], [p.title, path]]),
      ],
    }];
    const extra = `<meta property="article:published_time" content="${esc(p.date)}">
<meta property="article:modified_time" content="${esc(modified)}">
${(p.tags || []).map(t => `<meta property="article:tag" content="${esc(t)}">`).join("\n")}${(p.tags || []).length ? "\n" : ""}`;
    const head = headHTML({ title: `${p.title} | ${SITE.name}`, description, path, type: "article", image: p.cover, jsonld, extra });
    const body = `  <article>
    <header class="article-head post-head">
      <a class="back rise" href="/blog/"><span>←</span> Усі статті</a>
      <div class="info rise" style="--d:1"><time datetime="${esc(p.date)}">${fmtDate(p.date)}</time>${(p.tags || []).map(t => `<a class="chip" href="/blog/#${encodeURIComponent(t)}">#${esc(t)}</a>`).join("")}</div>
      <h1 class="rise" style="--d:2">${esc(p.title)}</h1>
      ${p.excerpt && !leadRepeats ? `<p class="lead rise" style="--d:3">${esc(p.excerpt)}</p>` : ""}
    </header>
    ${p.cover ? `<figure class="article-cover rise" style="--d:4"><img src="${esc(rel(p.cover))}" alt="${esc(p.title)}" fetchpriority="high" decoding="async"></figure>` : ""}
    <div class="post-layout">
      <div class="prose">
${html}
      </div>
      ${aside.length ? `<aside class="post-aside" aria-labelledby="aside-title" data-fit-aside>
        <h2 id="aside-title" class="eyebrow">Інші статті</h2>
        ${aside.map((x, i) => asideCard(x, i >= asideVisible)).join("\n        ")}
      </aside>` : ""}
    </div>
  </article>
  ${next ? `<nav aria-label="Наступна стаття"><a class="post-row reveal" href="${postUrl(next)}" style="border-top:1px solid var(--ink)"><span class="eyebrow">Далі</span><div><h3>${esc(next.title)}</h3></div><span class="arrow" aria-hidden="true">→</span></a></nav>` : ""}
  ${related.length ? `<section class="related" aria-labelledby="related-title" style="padding-block:48px 0">
    <h2 id="related-title" class="eyebrow" style="font-family:var(--f-mono);font-size:var(--step--1);font-weight:400;margin-bottom:16px">Читайте також</h2>
    <div class="posts">
      ${related.map(postRow).join("\n      ")}
    </div>
  </section>` : ""}`;
    return page({ head, page: "blog", body });
  }

  // ---------- сторінка проєкту ----------
  function renderProject(p, projects, md) {
    const html = md(p.body || "");
    const description = clip(p.summary || stripMd(p.body));
    const path = projectUrl(p);
    const showCover = p.cover && !(p.body || "").includes(p.cover);
    const others = projects.filter(x => x !== p).slice(0, 3);
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "CreativeWork",
          "@id": SITE.url + path + "#work",
          name: p.title,
          headline: p.title,
          description,
          url: SITE.url + path,
          image: p.cover ? abs(p.cover) : abs(SITE.image),
          genre: p.category,
          keywords: (p.tags || []).join(", "),
          dateCreated: p.date,
          inLanguage: "uk",
          creator: orgRef,
          ...(p.url ? { sameAs: p.url } : {}),
        },
        crumbs([["Головна", "/"], ["Портфоліо", "/portfolio/"], [p.title, path]]),
      ],
    }];
    const head = headHTML({ title: `${p.title} — ${p.category ? p.category.toLowerCase() + " · " : ""}портфоліо ${SITE.name}`, description, path, type: "article", image: p.cover, jsonld });
    const body = `  <article>
    <header class="article-head">
      <a class="back rise" href="/portfolio/"><span>←</span> Усі проєкти</a>
      <div class="info rise" style="--d:1"><span class="chip lang">${esc(p.category)}</span>${p.year ? `<span>${esc(p.year)}</span>` : ""}${(p.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>
      <h1 class="rise" style="--d:2">${esc(p.title)}</h1>
      <p class="lead rise" style="--d:3;max-width:52ch">${esc(p.summary)}</p>
      ${p.url ? `<div class="rise" style="--d:4"><a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">Відкрити сайт <span class="arr">↗</span></a></div>` : ""}
    </header>
    ${showCover ? `<figure class="article-cover rise" style="--d:4"><img src="${esc(rel(p.cover))}" alt="${esc(p.title)}" fetchpriority="high" decoding="async"></figure>` : ""}
    <div class="prose">
${html}
    </div>
  </article>
  ${others.length ? `<section aria-labelledby="more-title" style="padding-block:24px 0">
    <h2 id="more-title" class="eyebrow" style="font-family:var(--f-mono);font-size:var(--step--1);font-weight:400;margin-bottom:24px">Інші проєкти</h2>
    <div class="grid-projects">
      ${others.map(projectCard).join("\n      ")}
    </div>
  </section>` : ""}`;
    return page({ head, page: "portfolio", body });
  }

  // ---------- список статей ----------
  function renderBlog(posts) {
    const tags = [...new Set(posts.flatMap(p => p.tags || []))];
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "Blog",
          "@id": SITE.url + "/blog/#blog",
          name: `Блог ${SITE.name}`,
          description: "Статті про штучний інтелект, технології, маркетинг і вивчення англійської.",
          url: SITE.url + "/blog/",
          inLanguage: "uk",
          publisher: orgRef,
          blogPost: posts.map(p => ({ "@type": "BlogPosting", headline: p.title.slice(0, 110), url: SITE.url + postUrl(p), datePublished: p.date, image: p.cover ? abs(p.cover) : undefined })),
        },
        crumbs([["Головна", "/"], ["Блог", "/blog/"]]),
      ],
    }];
    const head = headHTML({ title: `Блог ${SITE.name}: AI, технології, маркетинг і англійська`, description: "Статті Rodionactive про штучний інтелект, технології, SEO й маркетинг, а також поради з вивчення англійської мови.", path: "/blog/", jsonld });
    const body = `  <section class="article-head" style="padding-bottom:0">
    <p class="eyebrow rise">Блог</p>
    <h1 class="rise" style="--d:1;font-size:var(--step-4)">Статті</h1>
    <p class="lead rise" style="--d:2">Про штучний інтелект, технології, маркетинг і вивчення англійської.</p>
  </section>

  <section style="padding-top:40px">
    ${tags.length ? `<div class="filters" role="group" aria-label="Фільтр за темою" data-filter-group="tags" style="margin-bottom:28px">
      <button class="filter" type="button" aria-pressed="true" data-filter="">Усі</button>
      ${tags.map(t => `<button class="filter" type="button" aria-pressed="false" data-filter="${esc(t)}">#${esc(t)}</button>`).join("\n      ")}
    </div>` : ""}
    <div class="posts" data-filter-list="tags">
      ${posts.length ? posts.map(postRow).join("\n      ") : `<p class="empty">Перші статті вже в роботі.</p>`}
    </div>
  </section>`;
    return page({ head, page: "blog", body });
  }

  // ---------- список проєктів ----------
  function renderPortfolio(projects) {
    const cats = [...new Set(projects.map(p => p.category).filter(Boolean))];
    const n = projects.length;
    const word = n % 10 === 1 && n % 100 !== 11 ? "проєкт" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "проєкти" : "проєктів";
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "CollectionPage",
          name: `Портфоліо ${SITE.name}`,
          url: SITE.url + "/portfolio/",
          inLanguage: "uk",
          about: orgRef,
          mainEntity: { "@type": "ItemList", itemListElement: projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE.url + projectUrl(p), name: p.title })) },
        },
        crumbs([["Головна", "/"], ["Портфоліо", "/portfolio/"]]),
      ],
    }];
    const head = headHTML({ title: `Портфоліо ${SITE.name}: сайти під ключ і дизайн`, description: clip(`Приклади робіт Rodionactive: ${projects.slice(0, 5).map(p => p.title).join(", ")}. Сайти під ключ на Weblium, дизайн і переклади.`), path: "/portfolio/", jsonld });
    const body = `  <section class="article-head" style="padding-bottom:0">
    <p class="eyebrow rise">Портфоліо</p>
    <h1 class="rise" style="--d:1;font-size:var(--step-4)">Роботи</h1>
    <p class="lead rise" style="--d:2">Сайти, розроблені на Weblium, та інші проєкти. Відкрийте проєкт, щоб побачити деталі.</p>
  </section>

  <section style="padding-top:40px">
    <div class="section-head" style="margin-bottom:28px">
      ${cats.length > 1 ? `<div class="filters" role="group" aria-label="Фільтр за категорією" data-filter-group="cat">
        <button class="filter" type="button" aria-pressed="true" data-filter="">Усі</button>
        ${cats.map(c => `<button class="filter" type="button" aria-pressed="false" data-filter="${esc(c)}">${esc(c)}</button>`).join("\n        ")}
      </div>` : "<div></div>"}
      <span class="eyebrow" data-count>${n} ${word}</span>
    </div>
    <div class="grid-projects" data-filter-list="cat">
      ${projects.length ? projects.map(projectCard).join("\n      ") : `<p class="empty">Проєкти скоро з'являться.</p>`}
    </div>
  </section>`;
    return page({ head, page: "portfolio", body });
  }

  // ---------- головна: оновлюємо лише позначені блоки ----------
  function replaceBlock(html, name, content) {
    const re = new RegExp(`(<!--build:${name}-->)[\\s\\S]*?(<!--/build:${name}-->)`);
    if (!re.test(html)) throw new Error(`У index.html немає блоку build:${name}`);
    return html.replace(re, (_, a, b) => `${a}\n${content}\n${b}`);
  }

  function renderIndex(html, posts, projects) {
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", "@id": SITE.url + "/#website", name: SITE.name, url: SITE.url + "/", inLanguage: "uk", publisher: orgRef },
        {
          ...orgLD(),
          makesOffer: SERVICES.length ? SERVICES.map(x => ({ "@type": "Offer", url: SITE.url + serviceUrl(x), itemOffered: { "@type": "Service", name: x.name, description: x.description, url: SITE.url + serviceUrl(x), provider: orgRef } })) : [
            ["Розробка сайтів", "Лендінги, багатосторінкові сайти, онлайн-магазини та портфоліо на Weblium або Claude+GitHub під ключ: дизайн, верстка, інтеграції, SEO, домен."],
            ["Графічний дизайн", "Логотипи, фірмовий стиль, креативи для соцмереж, поліграфія та упаковка."],
            ["Автоматизація процесів", "Автоматизації на базі Claude: автопостинг і контент, звіти й моніторинг, обробка документів і даних, інтеграції з Gmail, Google Drive і Telegram."],
            ["Переклад", "Переклад текстів, документів, сайтів і презентацій: українська, англійська, російська."],
          ].map(([name, description]) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, description, provider: orgRef } })),
        },
      ],
    }];
    const head = headHTML({ title: `${SITE.name} — сайти під ключ, дизайн, автоматизація і переклади`, description: SITE.description, path: "/", jsonld });
    html = replaceBlock(html, "head", head);
    html = replaceBlock(html, "header", headerHTML("home"));
    html = replaceBlock(html, "footer", footerHTML());
    html = replaceBlock(html, "home-projects", "      " + (projects.slice(0, 3).map(projectCard).join("\n      ") || `<p class="empty">Проєкти скоро з'являться.</p>`));
    html = replaceBlock(html, "home-posts", "      " + (posts.slice(0, 3).map(postRow).join("\n      ") || `<p class="empty">Перші статті вже в роботі.</p>`));
    html = html.replace(/(style\.css|main\.js)\?v=\d+/g, `$1?v=${ASSET_V}`);
    return html;
  }

  // ---------- сторінки послуг ----------
  const { SERVICES, ILLU } = SiteServices || { SERVICES: [], ILLU: {} };
  const SERVICES_UPDATED = "2026-11-13";
  const serviceUrl = x => `/services/${x.slug}/`;
  const serviceImg = x => `assets/img/services/${x.slug}.png`;

  function serviceCTA(title, text) {
    return `<section class="svc-cta reveal" aria-label="Замовити">
      <div>
        <p class="eyebrow">Обговоримо?</p>
        <h2>${title}</h2>
        <p>${text}</p>
      </div>
      <div class="svc-cta-actions">
        <a class="btn" href="${SITE.telegram}" target="_blank" rel="noopener">Написати в Telegram <span class="arr">→</span></a>
        <a class="link" href="${SITE.instagram}" target="_blank" rel="noopener">або в Instagram</a>
      </div>
    </section>`;
  }

  function renderService(x, posts, projects) {
    const path = serviceUrl(x);
    const works = projects.filter(x.portfolio || (() => false)).slice(0, 3);
    const related = posts.filter(p => !p.sourceId && (p.tags || []).some(t => (x.postTags || []).includes(t))).slice(0, 4);
    const others = SERVICES.filter(s => s !== x);
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "Service",
          "@id": SITE.url + path + "#service",
          name: x.h1,
          serviceType: x.name,
          description: x.description,
          url: SITE.url + path,
          image: abs(serviceImg(x)),
          provider: orgRef,
          areaServed: [{ "@type": "Country", name: "Україна" }, "Worldwide"],
          availableLanguage: ["uk", "en", "ru"],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: x.name,
            itemListElement: x.included.map(([name, description]) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, description } })),
          },
        },
        {
          "@type": "FAQPage",
          "@id": SITE.url + path + "#faq",
          mainEntity: x.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        },
        crumbs([["Головна", "/"], ["Послуги", "/services/"], [x.name, path]]),
      ],
    }];
    const head = headHTML({ title: `${x.title} | ${SITE.name}`, description: x.description, path, image: serviceImg(x), jsonld });
    const body = `  <nav class="crumbs rise" aria-label="Навігація"><a href="/">Головна</a><span>/</span><a href="/services/">Послуги</a><span>/</span><span aria-current="page">${esc(x.name)}</span></nav>
  <header class="svc-hero">
    <div class="svc-hero-text">
      <p class="eyebrow rise" style="--d:1">${esc(x.code)}</p>
      <h1 class="rise" style="--d:2">${esc(x.h1)}</h1>
      <p class="lead rise" style="--d:3">${esc(x.lead)}</p>
      ${x.pairs ? `<div class="pairs rise" style="--d:4">${x.pairs.map(p => `<span class="pair">${esc(p).replace("⇄", "<i>⇄</i>")}</span>`).join("")}</div>`
        : `<ul class="svc-chips rise" style="--d:4">${x.chips.map(c => `<li class="chip">${esc(c)}</li>`).join("")}</ul>`}
      <div class="svc-actions rise" style="--d:5">
        <a class="btn" href="${SITE.telegram}" target="_blank" rel="noopener">Обговорити задачу <span class="arr">→</span></a>
        <a class="btn ghost" href="#faq">Часті питання</a>
      </div>
    </div>
    <figure class="svc-illu rise" style="--d:3">${ILLU[x.illu] || ""}</figure>
  </header>

  <section class="svc-section" aria-labelledby="inc-title">
    <div class="section-head"><div><p class="eyebrow">Що входить</p><h2 id="inc-title">Що входить у послугу</h2></div></div>
    <div class="svc-grid">
      ${x.included.map(([t, d], i) => `<article class="svc-card reveal"><span class="svc-num">${String(i + 1).padStart(2, "0")}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join("\n      ")}
    </div>
  </section>

  ${x.kinds ? `<section class="svc-section" aria-labelledby="kinds-title">
    <div class="section-head"><div><p class="eyebrow">Детальніше</p><h2 id="kinds-title">${esc(x.kinds.title)}</h2></div></div>
    <div class="svc-kinds">
      ${x.kinds.items.map(([t, d]) => `<div class="svc-kind reveal"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("\n      ")}
    </div>
  </section>` : ""}

  ${x.compare ? `<section class="svc-section" aria-labelledby="cmp-title">
    <div class="section-head"><div><p class="eyebrow">Порівняння</p><h2 id="cmp-title">${esc(x.compare.title)}</h2></div></div>
    <p class="svc-intro">${esc(x.compare.intro)}</p>
    <div class="svc-table-wrap reveal"><table class="svc-table">
      <thead><tr>${x.compare.cols.map((c, i) => i ? `<th scope="col">${esc(c)}</th>` : `<td></td>`).join("")}</tr></thead>
      <tbody>
        ${x.compare.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("\n        ")}
      </tbody>
    </table></div>
  </section>` : ""}

  <section class="svc-section" aria-labelledby="steps-title">
    <div class="section-head"><div><p class="eyebrow">Процес</p><h2 id="steps-title">Як проходить робота</h2></div></div>
    <ol class="svc-steps">
      ${x.steps.map(([t, d]) => `<li class="reveal"><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("\n      ")}
    </ol>
  </section>

  ${works.length ? `<section class="svc-section" aria-labelledby="works-title">
    <div class="section-head"><div><p class="eyebrow">Портфоліо</p><h2 id="works-title">Приклади робіт</h2></div><a class="link" href="/portfolio/">Усі проєкти →</a></div>
    <div class="grid-projects">
      ${works.map(projectCard).join("\n      ")}
    </div>
  </section>` : ""}

  <section class="svc-section" id="faq" aria-labelledby="faq-title">
    <div class="section-head"><div><p class="eyebrow">FAQ</p><h2 id="faq-title">Часті питання</h2></div></div>
    <div class="svc-faq">
      ${x.faq.map(([q, a], i) => `<details class="reveal"${i === 0 ? " open" : ""}><summary><h3>${esc(q)}</h3><span class="plus" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join("\n      ")}
    </div>
  </section>

  ${related.length ? `<section class="svc-section" aria-labelledby="posts-title">
    <div class="section-head"><div><p class="eyebrow">Блог</p><h2 id="posts-title">Корисно почитати</h2></div><a class="link" href="/blog/">Усі статті →</a></div>
    <div class="posts">
      ${related.map(postRow).join("\n      ")}
    </div>
  </section>` : ""}

  ${serviceCTA(`Розкажіть про <em>задачу</em>`, "Опишіть кількома реченнями, що потрібно, — я відповім протягом дня з ідеями, вартістю і термінами.")}

  <nav class="svc-others" aria-label="Інші послуги">
    <p class="eyebrow">Інші послуги</p>
    <div>${others.map(s => `<a class="svc-other" href="${serviceUrl(s)}"><span>${esc(s.code)}</span><b>${esc(s.name)}</b><i aria-hidden="true">→</i></a>`).join("")}</div>
  </nav>`;
    return page({ head, page: "services", body });
  }

  function renderServices(posts) {
    const path = "/services/";
    const description = "Послуги Rodionactive: розробка сайтів під ключ, графічний дизайн і фірмовий стиль, автоматизація процесів з ШІ Claude, переклади UA · EN · RU.";
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "CollectionPage",
          "@id": SITE.url + path + "#page",
          name: "Послуги",
          description,
          url: SITE.url + path,
          inLanguage: "uk",
          isPartOf: { "@id": SITE.url + "/#website" },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: SERVICES.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: SITE.url + serviceUrl(x), name: x.h1 })),
          },
        },
        crumbs([["Головна", "/"], ["Послуги", path]]),
      ],
    }];
    const head = headHTML({ title: `Послуги: сайти, дизайн, автоматизація з Claude, переклади | ${SITE.name}`, description, path, jsonld });
    const body = `  <header class="article-head">
    <p class="eyebrow rise">Послуги</p>
    <h1 class="rise" style="--d:1">Що я можу зробити <span style="color:var(--orange)">для вас</span></h1>
    <p class="lead rise" style="--d:2;max-width:60ch">Сайти під ключ, дизайн, автоматизація процесів з Claude і переклади трьома мовами. Оберіть послугу, щоб дізнатися, що входить, як проходить робота і відповіді на часті питання.</p>
  </header>
  <div class="svc-list">
    ${SERVICES.map((x, i) => `<a class="svc-tile reveal" href="${serviceUrl(x)}" style="--i:${i}">
      <span class="svc-tile-illu" aria-hidden="true">${(ILLU[x.illu] || "").replace(/ role="img" aria-label="[^"]*"/, "")}</span>
      <span class="svc-tile-body">
        <span class="code">${esc(x.code)}</span>
        <h2>${esc(x.h1)}</h2>
        <p>${esc(x.description)}</p>
        <span class="link">Детальніше <span class="arr">→</span></span>
      </span>
    </a>`).join("\n    ")}
  </div>
  ${serviceCTA(`Не знаєте, з чого <em>почати</em>?`, "Напишіть, яку задачу хочете вирішити, — підкажу, яка послуга підійде і скільки це коштуватиме.")}`;
    return page({ head, page: "services", body });
  }

  // ---------- sitemap і RSS ----------
  function sitemap(posts, projects) {
    const latest = (list, k = "date") => list.map(x => x.updated || x[k] || "").sort().pop() || "";
    const all = [
      ["/", latest([...posts, ...projects]), "weekly", "1.0"],
      ["/blog/", latest(posts), "weekly", "0.9"],
      ["/portfolio/", latest(projects), "monthly", "0.8"],
      ["/services/", SERVICES_UPDATED, "monthly", "0.9"],
      ...SERVICES.map(x => [serviceUrl(x), SERVICES_UPDATED, "monthly", "0.9", serviceImg(x)]),
      ...posts.map(p => [postUrl(p), p.updated || p.date, "monthly", "0.7", p.cover]),
      ...projects.map(p => [projectUrl(p), p.updated || p.date, "yearly", "0.6", p.cover]),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${all.map(([loc, mod, freq, pr, img]) => `  <url>
    <loc>${xml(SITE.url + loc)}</loc>${mod ? `\n    <lastmod>${xml(mod)}</lastmod>` : ""}
    <changefreq>${freq}</changefreq>
    <priority>${pr}</priority>${img ? `\n    <image:image><image:loc>${xml(abs(img))}</image:loc></image:image>` : ""}
  </url>`).join("\n")}
</urlset>
`;
  }

  function feed(posts, md) {
    const items = posts.slice(0, 30);
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>Блог ${SITE.name}</title>
  <link>${SITE.url}/blog/</link>
  <atom:link href="${SITE.url}/blog/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Статті про штучний інтелект, технології, маркетинг і вивчення англійської.</description>
  <language>uk</language>${items[0] ? `\n  <lastBuildDate>${rfc822(items[0].updated || items[0].date)}</lastBuildDate>` : ""}
${items.map(p => `  <item>
    <title>${xml(p.title)}</title>
    <link>${SITE.url}${postUrl(p)}</link>
    <guid isPermaLink="true">${SITE.url}${postUrl(p)}</guid>
    <pubDate>${rfc822(p.date)}</pubDate>
    <description>${xml(p.excerpt || clip(stripMd(p.body), 300))}</description>
${(p.tags || []).map(t => `    <category>${xml(t)}</category>`).join("\n")}${(p.tags || []).length ? "\n" : ""}    <content:encoded><![CDATA[${(p.cover ? `<p><img src="${abs(p.cover)}" alt=""></p>` : "") + md(p.body || "").replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded>
  </item>`).join("\n")}
</channel>
</rss>
`;
  }

  // ---------- усе разом ----------
  // input: { posts, projects, indexHtml?, markdown(md) -> html }
  // output: { files: {path: content}, postPaths: [...], projectPaths: [...] }
  function build({ posts, projects, indexHtml, markdown }) {
    const P = visible(posts), J = visible(projects);
    const files = {};
    P.forEach(p => { files[`blog/${p.slug}/index.html`] = renderPost(p, P, markdown); });
    J.forEach(p => { files[`portfolio/${p.slug}/index.html`] = renderProject(p, J, markdown); });
    files["blog/index.html"] = renderBlog(P);
    files["portfolio/index.html"] = renderPortfolio(J);
    files["services/index.html"] = renderServices(P);
    SERVICES.forEach(x => { files[`${serviceUrl(x).slice(1)}index.html`] = renderService(x, P, J); });
    files["blog/feed.xml"] = feed(P, markdown);
    files["sitemap.xml"] = sitemap(P, J);
    if (indexHtml) files["index.html"] = renderIndex(indexHtml, P, J);
    return { files, postPaths: P.map(p => `blog/${p.slug}/index.html`), projectPaths: J.map(p => `portfolio/${p.slug}/index.html`) };
  }

  // які згенеровані сторінки треба видалити (запис прибрали, перейменували або зробили чернеткою)
  function stalePaths(prevPosts, prevProjects, result) {
    const keep = new Set(Object.keys(result.files));
    const old = [
      ...(prevPosts || []).filter(x => x.slug).map(p => `blog/${p.slug}/index.html`),
      ...(prevProjects || []).filter(x => x.slug).map(p => `portfolio/${p.slug}/index.html`),
    ];
    return [...new Set(old)].filter(p => !keep.has(p));
  }

  return { build, stalePaths, ASSET_V, SITE };
});
