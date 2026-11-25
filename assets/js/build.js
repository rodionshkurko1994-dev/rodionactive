/* Rodionactive — генератор статичних сторінок для пошукових систем.
   Працює і в браузері (адмінка), і в Node (node tools/build.mjs).
   Кожна стаття й проєкт отримують окрему HTML-сторінку з повним текстом,
   мета-тегами, Open Graph, schema.org; також генеруються sitemap.xml і RSS. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./services.js"), require("./tools.js"));
  else root.SiteBuild = factory(root.SiteServices, root.SiteTools);
})(typeof self !== "undefined" ? self : this, function (SiteServices, SiteTools) {
  "use strict";

  const ASSET_V = "202611201700";
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
    channel: "https://t.me/rodionactive_online",
    instagram: "https://www.instagram.com/rodionactive.io",
    freelancehunt: "https://freelancehunt.com/freelancer/rodionactive_com.html",
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
  // внутрішні посилання між статтями: [слова](/blog/<slug>/).
  // Посилання на статтю, якої вже немає (видалена чи чернетка), перетворюється на звичайний текст;
  // absolute=true — повна адреса (для RSS).
  function blogLinks(md, posts, absolute) {
    const live = new Set((posts || []).map(x => x.slug));
    return String(md || "").replace(/(!?)\[([^\]]+)\]\(\/blog\/([a-z0-9-]+)\/?\)/g, (m, img, label, slug) =>
      img ? m : live.has(slug) ? `[${label}](${absolute ? SITE.url : ""}/blog/${slug}/)` : label);
  }
  function clip(text, n = 158) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    if (t.length <= n) return t;
    const cut = t.slice(0, n - 1);
    return cut.slice(0, Math.max(cut.lastIndexOf(" "), n * 0.6)).replace(/[\s,.;:—–-]+$/, "") + "…";
  }
  const rfc822 = d => new Date((d || "2026-01-01") + "T09:00:00+03:00").toUTCString();
  const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

  // ---------- спільні шматки сторінки ----------
  const NAV = [["/services/", "Послуги", "services"], ["/instrumenty/", "Інструменти", "tools"], ["/portfolio/", "Портфоліо", "portfolio"], ["/blog/", "Блог", "blog"], ["/#contact", "Контакти", "contact"]];
  const logo = () => [...SITE.name].map(c => `<span>${c}</span>`).join("") + '<span class="dot" aria-hidden="true"></span>';

  function headerHTML(page) {
    return `<header class="site-header" data-site-header>
  <div class="wrap bar">
    <a class="logo" href="/" aria-label="${SITE.name} — на головну">${logo()}</a>
    <nav class="nav" id="nav" aria-label="Головне меню">
      ${NAV.map(([href, label, key]) => `<a href="${href}"${key === page ? ' aria-current="page"' : ""}>${label}</a>`).join("\n      ")}
      <a class="nav-cta link" href="${SITE.telegram}" target="_blank" rel="noopener">Обговорити проєкт →</a>
      <a class="nav-cta link" href="https://cyber-kyiv.online" target="_blank" rel="noopener">Cyber Kyiv ↗</a>
    </nav>
    <div class="header-actions">
      <a class="btn small ghost header-cta" href="https://cyber-kyiv.online" target="_blank" rel="noopener">Cyber Kyiv <span class="arr">↗</span></a>
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
      <a class="link" href="/instrumenty/">Інструменти</a>
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

  function page({ head, page, body, scripts = [] }) {
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
${scripts.map(src => `<script src="${src}"></script>`).join("\n")}${scripts.length ? "\n" : ""}</body>
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
      sameAs: [SITE.telegram, SITE.channel, SITE.instagram, SITE.freelancehunt],
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
    const html = md(blogLinks(p.body, posts));
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
        ${postEnd(p)}
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
    const fresh = posts.slice(0, 3);
    const ticker = posts.slice(0, 8).map(p => `<a href="${postUrl(p)}">${esc(p.title)}</a>`).join("");
    const plane = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M21.5 3.5 2.8 10.7c-.9.4-.9 1.6 0 1.9l4.6 1.6 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.4 4.6 3.4c.6.4 1.4.1 1.6-.6l3.1-15.1c.2-.9-.7-1.6-1.6-1.4Z" fill="currentColor"/><path d="m7.6 14 10.6-7.4-8.4 9.1-.4 3.2" fill="none" stroke="var(--navy)" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    const banner = `<aside class="blog-banner rise" aria-label="Telegram-канал Rodionactive | Tech">
      <div class="bb-grid" aria-hidden="true"></div>
      <div class="bb-orb" aria-hidden="true"></div>
      <span class="bb-corner tl" aria-hidden="true"></span><span class="bb-corner tr" aria-hidden="true"></span>
      <div class="bb-main">
        <p class="eyebrow"><span class="bb-live">Live</span> Telegram · Rodionactive | Tech</p>
        <h2>Новини AI і технологій — <em>щодня</em> у Telegram</h2>
        <p class="bb-lead">Нові статті з блогу приходять у канал одразу після публікації. Коротко, з прев'ю, без спаму.</p>
        <div class="bb-actions">
          <a class="btn" href="${SITE.channel}" target="_blank" rel="noopener">Підписатися <span class="arr">→</span></a>
          <span class="bb-count"><b>${posts.length}</b> ${posts.length % 10 === 1 && posts.length % 100 !== 11 ? "стаття" : [2, 3, 4].includes(posts.length % 10) && ![12, 13, 14].includes(posts.length % 100) ? "статті" : "статей"} уже в блозі</span>
        </div>
      </div>
      ${fresh.length ? `<div class="bb-chat" aria-hidden="true">
        <div class="bb-chat-head"><span class="bb-ava">${plane}</span><div><b>Rodionactive | Tech</b><small>канал · онлайн</small></div></div>
        ${fresh.map((p, i) => `<div class="bb-msg" style="--i:${i}"><span>${esc(p.title)}</span><small>${fmtDate(p.date)} · Rodionactive</small></div>`).join("\n        ")}
        <div class="bb-typing"><i></i><i></i><i></i></div>
      </div>` : ""}
      ${ticker ? `<div class="bb-ticker"><div class="bb-track">${ticker}${ticker.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ')}</div></div>` : ""}
    </aside>`;
    const body = `  <section class="article-head blog-head" style="padding-bottom:0">
    ${banner}
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

  // Кінець статті: «Поділитися» і підписка на Telegram-канал
  function postEnd(p) {
    const url = SITE.url + postUrl(p);
    const u = encodeURIComponent(url), t = encodeURIComponent(p.title);
    const links = [
      ["Telegram", `https://t.me/share/url?url=${u}&text=${t}`],
      ["Threads", `https://www.threads.net/intent/post?text=${t}%20${u}`],
      ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ];
    return `<div class="post-end">
          <div class="share" aria-label="Поділитися статтею">
            <span class="share-label">Поділитися</span>
            ${links.map(([n, h]) => `<a class="share-btn" href="${h}" target="_blank" rel="noopener nofollow">${n}</a>`).join("\n            ")}
            <button class="share-btn" type="button" data-copy-link="${esc(url)}">Скопіювати посилання</button>
          </div>
          <aside class="subscribe" aria-label="Telegram-канал">
            <div>
              <p class="subscribe-title">Нові статті — у Telegram</p>
              <p class="subscribe-text">Технології, ШІ та бізнес простими словами. Кожна нова стаття одразу з'являється в каналі.</p>
            </div>
            <a class="btn" href="${SITE.channel}" target="_blank" rel="noopener">Підписатися <span class="arr">→</span></a>
          </aside>
        </div>`;
  }

  // ---------- сторінки послуг ----------
  const { SERVICES, ILLU, NICHES = [] } = SiteServices || { SERVICES: [], ILLU: {} };
  const SERVICES_UPDATED = "2026-11-19";
  const NICHES_UPDATED = "2026-11-19";
  const nicheUrl = n => `/services/rozrobka-saitiv/${n.slug}/`;
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

  ${x.slug === "rozrobka-saitiv" && NICHES.length ? `<section class="svc-section" aria-labelledby="niches-title">
    <div class="section-head"><div><p class="eyebrow">Галузі</p><h2 id="niches-title">Сайти для вашої галузі</h2></div></div>
    <div class="svc-kinds">
      ${NICHES.map(n => `<a class="svc-kind reveal" href="${nicheUrl(n)}"><h3>${esc(n.h1)} →</h3><p>${esc(n.chips.join(" · "))}</p></a>`).join("\n      ")}
    </div>
  </section>` : ""}

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

  // Сторінка «сайт для ніші»: /services/rozrobka-saitiv/<slug>/
  function renderNiche(n, projects) {
    const web = SERVICES.find(s => s.slug === "rozrobka-saitiv");
    const path = nicheUrl(n);
    const works = projects.filter(n.portfolio || (() => false)).slice(0, 3);
    const others = NICHES.filter(o => o !== n);
    const faq = [...n.faq, ...(web ? web.faq.filter(([q]) => /сам змінювати|домен|потрібно від мене/.test(q)) : [])];
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "Service",
          "@id": SITE.url + path + "#service",
          name: n.h1,
          serviceType: "Розробка сайтів",
          description: n.description,
          url: SITE.url + path,
          image: abs(web ? serviceImg(web) : SITE.image),
          provider: orgRef,
          audience: { "@type": "BusinessAudience", name: n.name },
          areaServed: [{ "@type": "Country", name: "Україна" }, "Worldwide"],
          availableLanguage: ["uk", "en", "ru"],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: n.h1,
            itemListElement: n.blocks.map(([name, description]) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, description } })),
          },
        },
        {
          "@type": "FAQPage",
          "@id": SITE.url + path + "#faq",
          mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        },
        crumbs([["Головна", "/"], ["Послуги", "/services/"], ["Розробка сайтів", "/services/rozrobka-saitiv/"], [n.name, path]]),
      ],
    }];
    const head = headHTML({ title: `${n.title} | ${SITE.name}`, description: n.description, path, image: web ? serviceImg(web) : SITE.image, jsonld });
    const body = `  <nav class="crumbs rise" aria-label="Навігація"><a href="/">Головна</a><span>/</span><a href="/services/">Послуги</a><span>/</span><a href="/services/rozrobka-saitiv/">Розробка сайтів</a><span>/</span><span aria-current="page">${esc(n.name)}</span></nav>
  <header class="svc-hero">
    <div class="svc-hero-text">
      <p class="eyebrow rise" style="--d:1">&lt;/&gt; WEB</p>
      <h1 class="rise" style="--d:2">${esc(n.h1)}</h1>
      <p class="lead rise" style="--d:3">${esc(n.lead)}</p>
      <ul class="svc-chips rise" style="--d:4">${n.chips.map(c => `<li class="chip">${esc(c)}</li>`).join("")}</ul>
      <div class="svc-actions rise" style="--d:5">
        <a class="btn" href="${SITE.telegram}" target="_blank" rel="noopener">Обговорити сайт <span class="arr">→</span></a>
        <a class="btn ghost" href="/instrumenty/kalkuliator-vartosti-saitu/">Порахувати вартість</a>
      </div>
    </div>
    <figure class="svc-illu rise" style="--d:3">${ILLU.web || ""}</figure>
  </header>

  <section class="svc-section" aria-labelledby="inc-title">
    <div class="section-head"><div><p class="eyebrow">Структура</p><h2 id="inc-title">Що буде на сайті</h2></div></div>
    <div class="svc-grid">
      ${n.blocks.map(([t, d], i) => `<article class="svc-card reveal"><span class="svc-num">${String(i + 1).padStart(2, "0")}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join("\n      ")}
    </div>
  </section>

  <section class="svc-section" aria-labelledby="why-title">
    <div class="section-head"><div><p class="eyebrow">Навіщо</p><h2 id="why-title">Що дає власний сайт</h2></div></div>
    <div class="svc-kinds">
      ${n.why.map(([t, d]) => `<div class="svc-kind reveal"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("\n      ")}
    </div>
  </section>

  ${web ? `<section class="svc-section" aria-labelledby="steps-title">
    <div class="section-head"><div><p class="eyebrow">Процес</p><h2 id="steps-title">Як проходить робота</h2></div></div>
    <ol class="svc-steps">
      ${web.steps.map(([t, d]) => `<li class="reveal"><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("\n      ")}
    </ol>
  </section>` : ""}

  ${works.length ? `<section class="svc-section" aria-labelledby="works-title">
    <div class="section-head"><div><p class="eyebrow">Портфоліо</p><h2 id="works-title">Приклади робіт</h2></div><a class="link" href="/portfolio/">Усі проєкти →</a></div>
    <div class="grid-projects">
      ${works.map(projectCard).join("\n      ")}
    </div>
  </section>` : ""}

  <section class="svc-section" id="faq" aria-labelledby="faq-title">
    <div class="section-head"><div><p class="eyebrow">FAQ</p><h2 id="faq-title">Часті питання</h2></div></div>
    <div class="svc-faq">
      ${faq.map(([q, a], i) => `<details class="reveal"${i === 0 ? " open" : ""}><summary><h3>${esc(q)}</h3><span class="plus" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join("\n      ")}
    </div>
  </section>

  ${serviceCTA(`Обговоримо <em>ваш</em> сайт?`, "Напишіть кількома реченнями про ваш бізнес — я відповім протягом дня з ідеями, вартістю і термінами.")}

  <nav class="svc-others" aria-label="Сайти для інших галузей">
    <p class="eyebrow">Інші галузі</p>
    <div>${others.map(o => `<a class="svc-other" href="${nicheUrl(o)}"><span>WEB</span><b>${esc(o.name)}</b><i aria-hidden="true">→</i></a>`).join("")}<a class="svc-other" href="/services/rozrobka-saitiv/"><span>&lt;/&gt; WEB</span><b>Розробка сайтів під ключ</b><i aria-hidden="true">→</i></a></div>
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

  // ---------- розділ «Інструменти» ----------
  const { TOOLS, ILLU: TOOL_ILLU } = SiteTools || { TOOLS: [], ILLU: {} };
  const TOOLS_UPDATED = "2026-11-20";
  const toolUrl = t => `/instrumenty/${t.slug}/`;
  const toolImg = t => `assets/img/tools/${t.slug}.png`;

  function renderTool(t) {
    const path = toolUrl(t);
    const svc = SERVICES.find(s => s.slug === t.service);
    const others = TOOLS.filter(x => x !== t);
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "WebApplication",
          "@id": SITE.url + path + "#app",
          name: t.h1,
          alternateName: t.name,
          description: t.description,
          url: SITE.url + path,
          image: abs(toolImg(t)),
          applicationCategory: t.appCategory,
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          inLanguage: "uk",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "UAH" },
          featureList: t.features,
          creator: orgRef,
          provider: orgRef,
        },
        {
          "@type": "FAQPage",
          "@id": SITE.url + path + "#faq",
          mainEntity: t.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        },
        crumbs([["Головна", "/"], ["Інструменти", "/instrumenty/"], [t.name, path]]),
      ],
    }];
    const head = headHTML({ title: `${t.title} | ${SITE.name}`, description: t.description, path, image: toolImg(t), jsonld });
    const body = `  <nav class="crumbs rise" aria-label="Навігація"><a href="/">Головна</a><span>/</span><a href="/instrumenty/">Інструменти</a><span>/</span><span aria-current="page">${esc(t.name)}</span></nav>
  <header class="tool-head">
    <p class="eyebrow rise" style="--d:1">${esc(t.code)} · безкоштовно</p>
    <h1 class="rise" style="--d:2">${esc(t.h1)}</h1>
    <p class="lead rise" style="--d:3">${esc(t.lead)}</p>
    <ul class="tool-feats rise" style="--d:4">${t.features.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
  </header>

  <section class="tool-app rise" style="--d:5" aria-label="${esc(t.name)}" data-tool-app="${t.app}" data-tg="${SITE.telegram}">
    <noscript><p>Щоб скористатися інструментом, увімкніть JavaScript у браузері.</p></noscript>
  </section>

  <section class="svc-section" aria-labelledby="how-title">
    <div class="section-head"><div><p class="eyebrow">Як користуватися</p><h2 id="how-title">Як це працює</h2></div></div>
    <ol class="svc-steps tool-steps">
      ${t.steps.map(([a, b]) => `<li class="reveal"><h3>${esc(a)}</h3><p>${esc(b)}</p></li>`).join("\n      ")}
    </ol>
  </section>

  <section class="svc-section tool-text" aria-label="Корисно знати">
    ${t.sections.map(([h, p]) => `<div class="reveal"><h2>${esc(h)}</h2><p>${esc(p)}</p></div>`).join("\n    ")}
  </section>

  <section class="svc-section" id="faq" aria-labelledby="faq-title">
    <div class="section-head"><div><p class="eyebrow">FAQ</p><h2 id="faq-title">Часті питання</h2></div></div>
    <div class="svc-faq">
      ${t.faq.map(([q, a], i) => `<details class="reveal"${i === 0 ? " open" : ""}><summary><h3>${esc(q)}</h3><span class="plus" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join("\n      ")}
    </div>
  </section>

  ${svc ? `<section class="svc-cta reveal" aria-label="Послуга">
      <div>
        <p class="eyebrow">Послуга</p>
        <h2>${esc(svc.h1)}</h2>
        <p>${esc(t.serviceText)}</p>
      </div>
      <div class="svc-cta-actions">
        <a class="btn" href="${serviceUrl(svc)}">Детальніше про послугу <span class="arr">→</span></a>
        <a class="link" href="${SITE.telegram}" target="_blank" rel="noopener">або напишіть у Telegram</a>
      </div>
    </section>` : ""}

  <nav class="svc-others" aria-label="Інші інструменти">
    <p class="eyebrow">Інші інструменти</p>
    <div>${others.map(s => `<a class="svc-other" href="${toolUrl(s)}"><span>${esc(s.code)}</span><b>${esc(s.name)}</b><i aria-hidden="true">→</i></a>`).join("")}<a class="svc-other" href="/services/"><span>ПОСЛУГИ</span><b>Сайти, дизайн, автоматизація</b><i aria-hidden="true">→</i></a></div>
  </nav>`;
    const scripts = (t.app === "qr" ? ["/assets/js/vendor/qr-code-styling.js"] : []).concat([`/assets/js/tools-app.js?v=${ASSET_V}`]);
    return page({ head, page: "tools", body, scripts });
  }

  function renderTools() {
    const path = "/instrumenty/";
    const description = "Безкоштовні онлайн-інструменти: генератор QR-кодів, калькулятор вартості сайту, калькулятор рутини, статус сервісів (чи працює ChatGPT, Telegram, monobank) та індекс ринку фрілансу.";
    const jsonld = [{
      "@context": "https://schema.org",
      "@graph": [
        orgLD(),
        {
          "@type": "CollectionPage",
          "@id": SITE.url + path + "#page",
          name: "Безкоштовні інструменти",
          description,
          url: SITE.url + path,
          inLanguage: "uk",
          isPartOf: { "@id": SITE.url + "/#website" },
          mainEntity: { "@type": "ItemList", itemListElement: TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: SITE.url + toolUrl(t), name: t.h1 })) },
        },
        crumbs([["Головна", "/"], ["Інструменти", path]]),
      ],
    }];
    const head = headHTML({ title: `Безкоштовні онлайн-інструменти: QR-коди, вартість сайту, статус сервісів, ринок фрілансу | ${SITE.name}`, description, path, jsonld });
    const body = `  <header class="article-head">
    <p class="eyebrow rise">Інструменти</p>
    <h1 class="rise" style="--d:1">Безкоштовні <span style="color:var(--orange)">інструменти</span></h1>
    <p class="lead rise" style="--d:2;max-width:60ch">Корисні інструменти для бізнесу: працюють прямо в браузері, без реєстрації й безкоштовно. Створіть QR-код, дізнайтеся вартість сайту, порахуйте, скільки коштує ваша рутина, перевірте, чи працюють популярні сервіси, або подивіться, що зараз замовляють на ринку фрілансу.</p>
  </header>
  <div class="svc-list tool-list">
    ${TOOLS.map((t, i) => `<a class="svc-tile reveal" href="${toolUrl(t)}" style="--i:${i}">
      <span class="svc-tile-illu" aria-hidden="true">${(TOOL_ILLU[t.illu] || "").replace(/ role="img" aria-label="[^"]*"/, "")}</span>
      <span class="svc-tile-body">
        <span class="code">${esc(t.code)}</span>
        <h2>${esc(t.h1)}</h2>
        <p>${esc(t.short)}</p>
        <span class="link">Відкрити <span class="arr">→</span></span>
      </span>
    </a>`).join("\n    ")}
  </div>
  ${serviceCTA(`Потрібно щось <em>своє</em>?`, "Калькулятор для вашого сайту, квіз чи автоматизація під ваші процеси — напишіть, і я підкажу, як це зробити.")}`;
    return page({ head, page: "tools", body });
  }

  // ---------- sitemap і RSS ----------
  function sitemap(posts, projects) {
    const latest = (list, k = "date") => list.map(x => x.updated || x[k] || "").sort().pop() || "";
    const all = [
      ["/", latest([...posts, ...projects]), "weekly", "1.0"],
      ["/blog/", latest(posts), "weekly", "0.9"],
      ["/portfolio/", latest(projects), "monthly", "0.8"],
      ["/services/", SERVICES_UPDATED, "monthly", "0.9"],
      ["/instrumenty/", TOOLS_UPDATED, "monthly", "0.8"],
      ...TOOLS.map(t => [toolUrl(t), TOOLS_UPDATED, "monthly", "0.8", toolImg(t)]),
      ...SERVICES.map(x => [serviceUrl(x), SERVICES_UPDATED, "monthly", "0.9", serviceImg(x)]),
      ...NICHES.map(n => [nicheUrl(n), NICHES_UPDATED, "monthly", "0.8"]),
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
${(p.tags || []).map(t => `    <category>${xml(t)}</category>`).join("\n")}${(p.tags || []).length ? "\n" : ""}    <content:encoded><![CDATA[${(p.cover ? `<p><img src="${abs(p.cover)}" alt=""></p>` : "") + md(blogLinks(p.body, posts, true)).replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded>
  </item>`).join("\n")}
</channel>
</rss>
`;
  }

  // llms.txt — короткий опис сайту для ШІ-асистентів (ChatGPT, Claude, Perplexity, Gemini)
  function llmsTxt(posts, projects) {
    const line = (title, url, desc) => `- [${title}](${SITE.url}${url})${desc ? `: ${desc}` : ""}`;
    const own = posts.filter(p => !p.sourceId).slice(0, 15);
    return `# ${SITE.name}

> ${SITE.name} — фрілансер з Києва (Україна): сайти під ключ, графічний дизайн, автоматизація бізнес-процесів на базі ШІ Claude і переклади українською, англійською та російською. 50+ запущених сайтів, 8+ років досвіду. Працює з клієнтами з України та з-за кордону, віддалено.

Мови спілкування: українська, англійська, російська. Замовлення і питання — в Telegram: ${SITE.telegram}. Ціни й терміни називаються після короткого брифу; орієнтовну вартість сайту можна порахувати в калькуляторі на сайті.

## Послуги

${SERVICES.map(x => line(x.h1, serviceUrl(x), x.description)).join("\n")}

## Сайти для конкретних галузей

${NICHES.map(n => line(n.h1, nicheUrl(n), n.description)).join("\n")}

## Безкоштовні інструменти

${TOOLS.map(t => line(t.name, toolUrl(t), t.description)).join("\n")}

## Портфоліо

${projects.map(p => line(p.title, projectUrl(p), [p.url, clip(p.summary || p.excerpt || p.description || stripMd(String(p.body || "").replace(/^#+.*$/gm, "")), 160)].filter(Boolean).join(" — "))).join("\n")}

## Блог

${own.map(p => line(p.title, postUrl(p), clip(p.excerpt || p.description || "", 160))).join("\n")}
- [Усі статті (RSS)](${SITE.url}/blog/feed.xml)

## Контакти

- Telegram (замовлення): ${SITE.telegram}
- Telegram-канал Rodionactive | Tech: ${SITE.channel}
- Instagram: ${SITE.instagram}
- Freelancehunt (відгуки): ${SITE.freelancehunt}
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
    files["instrumenty/index.html"] = renderTools();
    TOOLS.forEach(t => { files[`${toolUrl(t).slice(1)}index.html`] = renderTool(t); });
    SERVICES.forEach(x => { files[`${serviceUrl(x).slice(1)}index.html`] = renderService(x, P, J); });
    NICHES.forEach(n => { files[`${nicheUrl(n).slice(1)}index.html`] = renderNiche(n, J); });
    files["llms.txt"] = llmsTxt(P, J);
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
