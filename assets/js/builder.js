/* Rodionactive — конструктор сайту-візитки (rodionactive.com/instrumenty/konstruktor-saitu/).
   Шаблони: 3 ніші × 3 стилі; палітри, шрифти, варіанти першого екрана й блоки — налаштування.
   Усе працює в браузері: фото й логотип нікуди не завантажуються, превʼю будується з даних форми.
   window.RodionBuilder.render(state) повертає HTML сайту, .mount(el) малює форму з превʼю. */
(function () {
  "use strict";

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- налаштування ----------
  const STYLES = [
    ["soft", "Затишний"],
    ["bold", "Яскравий"],
    ["minimal", "Мінімалізм"],
  ];
  const PALETTES = [
    // [назва, фон, поверхня, текст, приглушений, акцент]
    ["Кава", "#f6efe7", "#fffaf4", "#2b1d14", "#76604f", "#a0522d"],
    ["Пудра", "#fbf1f0", "#ffffff", "#3a2328", "#86686d", "#c8606c"],
    ["М'ята", "#eff6f3", "#ffffff", "#15302a", "#566f68", "#23866a"],
    ["Океан", "#eef3fa", "#ffffff", "#10233d", "#54667d", "#2457d6"],
    ["Помаранч", "#fff6ee", "#ffffff", "#1f1a17", "#6b5f57", "#e8590c"],
    ["Ліс", "#f3f0e6", "#fffdf6", "#1e2a1c", "#5f6a58", "#46703a"],
    ["Графіт", "#f2f2ef", "#ffffff", "#141414", "#5f5f5f", "#f2b705"],
    ["Ніч", "#13151d", "#1d202c", "#f3f1ea", "#a5a8b6", "#e0b04a"],
  ];
  const FONTS = [
    // [назва, заголовки, текст, параметр Google Fonts]
    ["Класика", "Playfair Display", "Inter", "family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600"],
    ["Сучасний", "Unbounded", "Onest", "family=Unbounded:wght@500;700&family=Onest:wght@400;500;600"],
    ["Дружній", "Comfortaa", "Nunito", "family=Comfortaa:wght@600;700&family=Nunito:wght@400;600;700"],
    ["Строгий", "Oswald", "Roboto", "family=Oswald:wght@500;600&family=Roboto:wght@400;500"],
    ["Елегантний", "Cormorant Garamond", "Manrope", "family=Cormorant+Garamond:wght@600;700&family=Manrope:wght@400;500;600"],
  ];
  const HEROES = [["split", "Текст і картинка"], ["center", "По центру"], ["cover", "На весь екран"]];
  const BLOCKS = [["features", "Переваги"], ["steps", "Як ми працюємо"], ["gallery", "Галерея"], ["reviews", "Відгуки"], ["faq", "Питання й відповіді"], ["contacts", "Контакти"]];

  // ---------- ніші: тексти-приклади й іконки ----------
  const ICON = {
    cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9Z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c0 1.5 1.5 1.5 1.5 3M12 3c0 1.5 1.5 1.5 1.5 3"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z"/><path d="M5 19 13 11"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
    scissors: '<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="M8.5 8.5 20 18M8.5 15.5 20 6"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
    pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    send: '<path d="M21 3 3 10.5l7 2.5 2.5 7Z"/><path d="m10 13 4-4"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M9 7l1.5-3h3L15 7"/>',
  };
  const icon = (n, size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ""}</svg>`;

  const NICHES = {
    cafe: {
      label: "Кав'ярня",
      name: "Кав'ярня «Зерно»",
      slogan: "Спешелті-кава, домашня випічка і сніданки до обіду",
      city: "Київ, Поділ", address: "вул. Сагайдачного, 10", hours: "Пн–Пт 8:00–21:00, Сб–Нд 9:00–22:00",
      itemsTitle: "Меню", itemsNav: "Меню", cta: "Забронювати столик", cta2: "Дивитися меню",
      items: [
        ["Капучино", "75 грн", "Подвійний еспресо з нашої обсмажки та ніжна молочна пінка"],
        ["Флет вайт", "85 грн", "Більше кави, менше молока — для тих, хто любить смак зерна"],
        ["Матча-лате", "95 грн", "Японська матча на вівсяному чи звичайному молоці"],
        ["Круасан з мигдалем", "80 грн", "Печемо щоранку з вершкового масла"],
        ["Сирники зі сметаною", "160 грн", "З ягідним соусом і свіжими ягодами"],
        ["Авокадо-тост", "210 грн", "Хліб на заквасці, авокадо, яйце пашот, мікрозелень"],
      ],
      features: [["cup", "Своя обсмажка", "Обсмажуємо зерно щотижня, тому кава завжди свіжа"], ["leaf", "Сніданки весь день", "Сирники, тости й гранола — з 8 ранку й до закриття"], ["wifi", "Тихі столики й Wi-Fi", "Розетки біля кожного столика — зручно працювати"]],
      steps: [["Забронюйте", "Напишіть нам у Telegram або зателефонуйте"], ["Приходьте", "Столик чекатиме вас 15 хвилин"], ["Насолоджуйтеся", "Каву приготуємо, поки ви знімаєте пальто"]],
      reviews: [["Олена", "Найкращий флет вайт на Подолі, а сирники — як у бабусі."], ["Андрій", "Працюю тут щосуботи: тихо, смачно, привітні бариста."], ["Марія", "Замовляли торт на день народження — гості були в захваті."]],
      faq: [["Чи можна прийти з собакою?", "Так, ми pet-friendly: для хвостатих гостей є миска з водою й смаколики."], ["Чи є рослинне молоко?", "Так: вівсяне, мигдальне й кокосове без доплати."], ["Чи можна замовити торт?", "Так, приймаємо замовлення за 2 дні — напишіть нам у Telegram."]],
      art: "cup",
    },
    salon: {
      label: "Салон краси",
      name: "Салон краси «Lumi»",
      slogan: "Стрижки, фарбування й догляд від майстрів з 8-річним досвідом",
      city: "Київ, Печерськ", address: "вул. Велика Васильківська, 45", hours: "Щодня 9:00–21:00",
      itemsTitle: "Послуги та ціни", itemsNav: "Послуги", cta: "Записатися", cta2: "Послуги й ціни",
      items: [
        ["Жіноча стрижка", "від 600 грн", "Консультація, миття, стрижка й укладка"],
        ["Фарбування", "від 1800 грн", "Однотонне, AirTouch, балаяж — підберемо відтінок"],
        ["Манікюр з покриттям", "650 грн", "Апаратний манікюр і стійке гель-покриття"],
        ["Брови", "450 грн", "Корекція форми й фарбування"],
        ["Укладка", "500 грн", "На вечір, весілля чи фотосесію"],
        ["Догляд для волосся", "900 грн", "Відновлення й зволоження професійною косметикою"],
      ],
      features: [["star", "Досвідчені майстри", "Кожен майстер — від 5 років практики й регулярні навчання"], ["shield", "Професійна косметика", "Працюємо лише з сертифікованими засобами"], ["calendar", "Запис онлайн 24/7", "Оберіть зручний час у Telegram — без дзвінків"]],
      steps: [["Запишіться", "Оберіть послугу й зручний час"], ["Консультація", "Майстер підбере форму, відтінок і догляд"], ["Результат", "Підкажемо, як доглядати вдома"]],
      reviews: [["Ірина", "Нарешті знайшла свого майстра з фарбування — колір саме такий, як хотіла."], ["Катерина", "Затишно, чисто і завжди вчасно. Манікюр тримається 3 тижні."], ["Оксана", "Зробили укладку на весілля — трималася до ранку!"]],
      faq: [["Як записатися?", "Напишіть нам у Telegram або зателефонуйте — підберемо зручний час."], ["Чи можна скасувати запис?", "Так, просимо попередити щонайменше за 3 години."], ["Чи є подарункові сертифікати?", "Так, на будь-яку суму чи послугу."]],
      art: "scissors",
    },
    repair: {
      label: "Ремонт",
      name: "РемБуд Сервіс",
      slogan: "Ремонт квартир під ключ з фіксованим кошторисом і гарантією 2 роки",
      city: "Київ і область", address: "вул. Здолбунівська, 7", hours: "Пн–Сб 9:00–19:00",
      itemsTitle: "Що ми робимо", itemsNav: "Послуги", cta: "Отримати кошторис", cta2: "Наші послуги",
      items: [
        ["Косметичний ремонт", "від 2500 грн/м²", "Шпаклювання, фарбування, підлога й двері"],
        ["Капітальний ремонт", "від 6000 грн/м²", "Перепланування, стяжка, нова електрика й сантехніка"],
        ["Електрика", "від 800 грн/точка", "Проводка, щиток, освітлення за проєктом"],
        ["Сантехніка", "від 1200 грн/точка", "Розводка труб, бойлер, інсталяції"],
        ["Плитка", "від 650 грн/м²", "Ванні кімнати, кухні, тераси"],
        ["Дизайн-проєкт", "від 600 грн/м²", "Планування, візуалізації й креслення"],
      ],
      features: [["ruler", "Фіксований кошторис", "Ціна не зміниться після підписання договору"], ["camera", "Фотозвіт щотижня", "Бачите, як іде ремонт, навіть не приїжджаючи"], ["shield", "Гарантія 2 роки", "Безкоштовно виправимо, якщо щось піде не так"]],
      steps: [["Замір і консультація", "Безкоштовно приїдемо й оцінимо обсяг робіт"], ["Кошторис і договір", "Фіксуємо ціну, терміни й етапи"], ["Ремонт з фотозвітами", "Ви бачите кожен етап"], ["Здача й гарантія", "Приймаєте роботу й отримуєте гарантію"]],
      reviews: [["Сергій", "Зробили ванну за 3 тижні, як і обіцяли. Кошторис не змінився ні на гривню."], ["Наталія", "Фотозвіти щотижня — дуже зручно, коли живеш в іншому місті."], ["Віктор", "Акуратна бригада, після себе прибрали. Рекомендую."]],
      faq: [["Скільки коштує виїзд на замір?", "Замір і консультація безкоштовні в межах Києва."], ["Чи закуповуєте ви матеріали?", "Так, можемо закупити матеріали з нашою знижкою або працювати з вашими."], ["Скільки триває ремонт?", "Косметичний — від 2 тижнів, капітальний — від 2 місяців, залежно від площі."]],
      art: "house",
    },
  };

  // ---------- ілюстрації без фото (по одній на нішу) ----------
  function art(niche, A, S) {
    const n = NICHES[niche].art;
    const common = `viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"`;
    if (n === "cup") return `<svg ${common}><circle cx="200" cy="200" r="170" fill="${A}" opacity=".12"/><circle cx="200" cy="200" r="120" fill="${A}" opacity=".14"/>
      <path d="M118 170h150v62a75 75 0 0 1-75 75h0a75 75 0 0 1-75-75Z" fill="${S}" stroke="currentColor" stroke-width="6"/><path d="M268 190h18a30 30 0 0 1 0 60h-22" stroke="currentColor" stroke-width="6"/>
      <path d="M100 322h186" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M160 92c-10 16 10 24 0 44M196 80c-10 16 10 24 0 44M232 92c-10 16 10 24 0 44" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="193" cy="182" rx="62" ry="9" fill="${A}" opacity=".6"/></svg>`;
    if (n === "scissors") return `<svg ${common}><circle cx="200" cy="200" r="170" fill="${A}" opacity=".12"/><circle cx="200" cy="200" r="120" fill="${A}" opacity=".14"/>
      <g stroke="currentColor" stroke-width="6" stroke-linecap="round"><circle cx="140" cy="278" r="34" fill="${S}"/><circle cx="140" cy="122" r="34" fill="${S}"/><path d="M168 140 310 262M168 260 310 138"/></g>
      <circle cx="232" cy="200" r="8" fill="${A}"/><path d="M296 92l10 20 20 10-20 10-10 20-10-20-20-10 20-10Z" fill="${A}"/><path d="M90 200l6 12 12 6-12 6-6 12-6-12-12-6 12-6Z" fill="${A}" opacity=".7"/></svg>`;
    return `<svg ${common}><circle cx="200" cy="200" r="170" fill="${A}" opacity=".12"/><circle cx="200" cy="200" r="120" fill="${A}" opacity=".14"/>
      <path d="M92 188 200 100l108 88" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M114 176v130h172V176" fill="${S}" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
      <rect x="178" y="236" width="44" height="70" rx="4" fill="${A}"/><rect x="132" y="200" width="36" height="36" rx="3" stroke="currentColor" stroke-width="5"/><rect x="232" y="200" width="36" height="36" rx="3" stroke="currentColor" stroke-width="5"/>
      <path d="M300 300l40-40M318 252l30 30" stroke="${A}" stroke-width="10" stroke-linecap="round"/></svg>`;
  }

  // ---------- кольори ----------
  function hexRgb(h) { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  const lum = h => { const c = hexRgb(h); if (!c) return 0; const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const onColor = h => lum(h) > .35 ? "#141414" : "#ffffff";

  // ---------- стан за замовчуванням ----------
  function defaults(niche = "cafe") {
    const N = NICHES[niche];
    return {
      niche, style: "soft", palette: { cafe: 0, salon: 1, repair: 3 }[niche] || 0, accent: "", font: { cafe: 0, salon: 4, repair: 3 }[niche] || 0, hero: "split",
      blocks: { features: true, steps: niche === "repair", gallery: false, reviews: true, faq: true, contacts: true },
      name: N.name, slogan: N.slogan, city: N.city, address: N.address, hours: N.hours,
      phone: "+380 67 000 00 00", telegram: "", instagram: "",
      items: N.items.map(([title, price, desc]) => ({ title, price, desc })),
      logo: "", photos: [],
    };
  }

  // ---------- шаблон ----------
  function render(s) {
    const N = NICHES[s.niche] || NICHES.cafe;
    const P = PALETTES[clamp(+s.palette || 0, 0, PALETTES.length - 1)];
    const F = FONTS[clamp(+s.font || 0, 0, FONTS.length - 1)];
    const [, bg, surface, ink, muted] = P;
    const accent = hexRgb(s.accent) ? s.accent : P[5];
    const dark = lum(bg) < .2;
    const style = STYLES.some(x => x[0] === s.style) ? s.style : "soft";
    const hero = HEROES.some(x => x[0] === s.hero) ? s.hero : "split";
    const B = s.blocks || {};
    const items = (s.items || []).filter(i => i && (i.title || i.price));
    const photos = (s.photos || []).filter(Boolean);
    const tg = String(s.telegram || "").trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");
    const ig = String(s.instagram || "").trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    const tel = String(s.phone || "").replace(/[^\d+]/g, "");
    const ctaHref = tg ? `https://t.me/${encodeURIComponent(tg)}` : tel ? `tel:${tel}` : "#contacts";
    const year = new Date().getFullYear();
    const heroImg = photos[0];
    const brand = s.logo ? `<img class="logo" src="${s.logo}" alt="${esc(s.name)}">` : `<span class="brand-name">${esc(s.name)}</span>`;
    const visual = heroImg ? `<img class="hero-photo" src="${heroImg}" alt="">` : `<div class="hero-art">${art(s.niche, accent, surface)}</div>`;

    const css = `
:root{--bg:${bg};--surface:${surface};--ink:${ink};--muted:${muted};--accent:${accent};--on-accent:${onColor(accent)};--line:${dark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.1)"};--fd:'${F[1]}',Georgia,serif;--fb:'${F[2]}',system-ui,sans-serif}
*{box-sizing:border-box;margin:0}html{scroll-behavior:smooth}body{background:var(--bg);color:var(--ink);font:400 17px/1.6 var(--fb);-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit}
.w{width:min(1120px,100% - 40px);margin-inline:auto}
h1,h2,h3{font-family:var(--fd);line-height:1.12;font-weight:700}
h1{font-size:clamp(2.3rem,1.6rem + 3.6vw,4.4rem)}h2{font-size:clamp(1.8rem,1.4rem + 1.8vw,2.8rem);margin-bottom:28px}h3{font-size:1.2rem}
.eyebrow{font-size:.82rem;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:14px;display:block}
.btn{display:inline-flex;align-items:center;gap:8px;padding:15px 28px;background:var(--accent);color:var(--on-accent);text-decoration:none;font-weight:600;border:2px solid var(--accent);transition:transform .2s}
.btn:hover{transform:translateY(-2px)}.btn.ghost{background:transparent;color:var(--ink);border-color:var(--line)}
.nav{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nav .w{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:68px}
.brand-name{font-family:var(--fd);font-weight:700;font-size:1.2rem}.logo{max-height:42px;width:auto}
.nav nav{display:flex;gap:26px;font-size:.95rem}.nav nav a{text-decoration:none;color:var(--muted)}.nav nav a:hover{color:var(--ink)}
.nav .btn{padding:10px 18px;font-size:.9rem}
section{padding:clamp(56px,9vw,110px) 0}
.hero{padding-top:clamp(40px,7vw,90px)}.hero p.lead{font-size:clamp(1.05rem,1rem + .4vw,1.3rem);color:var(--muted);margin:22px 0 34px;max-width:36ch}
.hero .actions{display:flex;gap:12px;flex-wrap:wrap}.hero .meta{margin-top:28px;display:flex;gap:22px;flex-wrap:wrap;color:var(--muted);font-size:.92rem}.hero .meta span{display:inline-flex;gap:8px;align-items:center}
.hero-split .w{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
.hero-art{color:var(--ink);max-width:460px;margin-inline:auto;width:100%}.hero-photo{width:100%;aspect-ratio:4/5;object-fit:cover}
.hero-center{text-align:center}.hero-center p.lead{margin-inline:auto}.hero-center .actions,.hero-center .meta{justify-content:center}.hero-center .hero-art{max-width:300px;margin-top:40px}.hero-center .hero-photo{aspect-ratio:16/7;margin-top:44px}
.hero-cover{position:relative;min-height:88vh;display:grid;align-items:end;padding-bottom:clamp(48px,8vw,90px);color:#fff;overflow:hidden;background:${heroImg ? "#111" : `radial-gradient(circle at 80% 20%,color-mix(in srgb,var(--accent) 70%,#fff) 0,var(--accent) 35%,color-mix(in srgb,var(--accent) 50%,#000) 100%)`}}
.hero-cover .bgimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}.hero-cover .w{position:relative}.hero-cover p.lead,.hero-cover .meta{color:rgba(255,255,255,.88)}.hero-cover .eyebrow{color:#fff}
.hero-cover .btn{background:#fff;color:#111;border-color:#fff}.hero-cover .btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.6)}
.hero-cover .cover-art{position:absolute;right:-60px;top:40px;width:min(560px,70vw);color:#fff;opacity:.22}
.items{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.item{background:var(--surface);padding:24px;display:grid;gap:8px;align-content:start}
.item-top{display:flex;justify-content:space-between;gap:16px;align-items:baseline}.item .price{font-weight:600;color:var(--accent);white-space:nowrap}.item p{color:var(--muted);font-size:.95rem}
.feats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.feat{display:grid;gap:10px}.feat .ic{width:54px;height:54px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)}.feat p{color:var(--muted);font-size:.95rem}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:22px;counter-reset:st}.step{counter-increment:st;display:grid;gap:8px;padding-top:18px;border-top:2px solid var(--accent)}.step::before{content:"0" counter(st);font-family:var(--fd);font-size:2rem;color:var(--accent);font-weight:700}.step p{color:var(--muted);font-size:.95rem}
.gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.gallery>*{aspect-ratio:1;object-fit:cover;width:100%}.gallery .ph{background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 30%,var(--surface)),var(--surface));display:grid;place-items:center;color:var(--muted)}
.reviews{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.review{background:var(--surface);padding:26px;display:grid;gap:14px}.review .stars{color:var(--accent);letter-spacing:3px}.review b{font-family:var(--fd)}
.faq{display:grid;gap:10px;max-width:820px}.faq details{background:var(--surface);padding:18px 22px}.faq summary{cursor:pointer;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:16px}.faq summary::after{content:"+";color:var(--accent);font-size:1.4rem;line-height:1}.faq details[open] summary::after{content:"−"}.faq p{margin-top:10px;color:var(--muted)}
.contacts .w{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:start}.clist{display:grid;gap:16px}.clist a,.clist div{display:flex;gap:14px;align-items:flex-start;text-decoration:none}.clist .ic{color:var(--accent);flex:none;margin-top:2px}.clist small{display:block;color:var(--muted);font-size:.85rem}
.cta-box{background:var(--accent);color:var(--on-accent);padding:clamp(28px,4vw,44px);display:grid;gap:16px}.cta-box h3{font-size:1.7rem}.cta-box .btn{background:var(--on-accent);color:var(--accent);border-color:var(--on-accent);justify-self:start}
footer{padding:28px 0;border-top:1px solid var(--line);color:var(--muted);font-size:.85rem}footer .w{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}footer a{text-decoration:none}
.alt{background:var(--surface)}.alt .item,.alt .review,.alt .faq details{background:var(--bg)}
@media(max-width:820px){.nav nav{display:none}.nav .btn{padding:8px 14px;font-size:.78rem;white-space:nowrap}.brand-name{font-size:1rem;line-height:1.2}.logo{max-height:34px}.hero-split .w,.contacts .w{grid-template-columns:1fr}.hero-split .hero-art{max-width:320px}.feats,.reviews{grid-template-columns:1fr}.gallery{grid-template-columns:repeat(2,1fr)}.items{grid-template-columns:1fr}}
` + ({
      soft: `.btn,.item,.feat .ic,.review,.faq details,.cta-box,.hero-photo,.gallery>*{border-radius:22px}.btn{border-radius:999px}.feat .ic{border-radius:18px}
.item,.review{box-shadow:0 18px 40px -30px rgba(0,0,0,.35)}h1,h2{letter-spacing:-.01em}.eyebrow{text-transform:none;letter-spacing:0;font-size:.95rem}`,
      bold: `h1,h2{text-transform:uppercase;letter-spacing:-.02em}h1{font-size:clamp(2.6rem,1.6rem + 5vw,5.6rem);line-height:.98}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.06em;font-size:.88rem}.item,.review,.faq details{border:2px solid var(--ink);background:transparent}.alt .item,.alt .review,.alt .faq details{background:transparent}
.item .price{background:var(--accent);color:var(--on-accent);padding:2px 10px}.feat .ic{background:var(--accent);color:var(--on-accent)}
.alt{background:var(--ink);color:var(--bg)}.alt p,.alt .item p{color:color-mix(in srgb,var(--bg) 75%,transparent)}.alt .item,.alt .review,.alt .faq details{border-color:var(--bg)}
.hero-split h1{border-left:10px solid var(--accent);padding-left:22px}.step{border-top-width:6px}`,
      minimal: `.btn{border-radius:2px;padding:13px 24px}.btn.ghost{border-width:1px}.item,.review,.faq details{background:transparent;border-top:1px solid var(--line);padding:22px 0;border-radius:0}.alt .item,.alt .review,.alt .faq details{background:transparent}
.items{gap:0 48px}.feat .ic{background:transparent;border:1px solid var(--line);border-radius:50%}h1{font-weight:600;letter-spacing:-.02em}h2{font-weight:600}
.eyebrow{color:var(--muted);font-weight:500}.alt{background:transparent;border-block:1px solid var(--line)}.cta-box{border-radius:2px}.review .stars{display:none}`,
    })[style];

    const nav = `<header class="nav"><div class="w">${brand}<nav aria-label="Меню">${items.length ? `<a href="#items">${esc(N.itemsNav)}</a>` : ""}${B.features ? '<a href="#about">Про нас</a>' : ""}${B.reviews ? '<a href="#reviews">Відгуки</a>' : ""}${B.contacts ? '<a href="#contacts">Контакти</a>' : ""}</nav><a class="btn" href="${ctaHref}">${esc(N.cta)}</a></div></header>`;
    const meta = `<div class="meta">${s.city ? `<span>${icon("pin", 18)}${esc(s.city)}</span>` : ""}${s.hours ? `<span>${icon("clock", 18)}${esc(s.hours)}</span>` : ""}</div>`;
    const heroText = `<span class="eyebrow">${esc(s.city || N.label)}</span><h1>${esc(s.name)}</h1>${s.slogan ? `<p class="lead">${esc(s.slogan)}</p>` : ""}<div class="actions"><a class="btn" href="${ctaHref}">${esc(N.cta)} →</a>${items.length ? `<a class="btn ghost" href="#items">${esc(N.cta2)}</a>` : ""}</div>${meta}`;
    const heroHTML = hero === "cover"
      ? `<section class="hero hero-cover">${heroImg ? `<img class="bgimg" src="${heroImg}" alt="">` : `<div class="cover-art">${art(s.niche, "#ffffff", "transparent")}</div>`}<div class="w">${heroText}</div></section>`
      : hero === "center"
        ? `<section class="hero hero-center"><div class="w">${heroText}${visual}</div></section>`
        : `<section class="hero hero-split"><div class="w"><div>${heroText}</div>${visual}</div></section>`;

    let alt = false; // чергуємо фон секцій
    const sec = (id, eyebrow, title, inner) => { alt = !alt; return `<section id="${id}"${alt ? ' class="alt"' : ""}><div class="w"><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2>${inner}</div></section>`; };
    const parts = [];
    if (items.length) parts.push(sec("items", N.itemsNav, N.itemsTitle, `<div class="items">${items.map(i => `<div class="item"><div class="item-top"><h3>${esc(i.title)}</h3>${i.price ? `<span class="price">${esc(i.price)}</span>` : ""}</div>${i.desc ? `<p>${esc(i.desc)}</p>` : ""}</div>`).join("")}</div>`));
    if (B.features) parts.push(sec("about", "Чому ми", "Чому обирають нас", `<div class="feats">${N.features.map(([ic, t, d]) => `<div class="feat"><span class="ic">${icon(ic, 26)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>`));
    if (B.steps) parts.push(sec("steps", "Процес", "Як ми працюємо", `<div class="steps">${N.steps.map(([t, d]) => `<div class="step"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>`));
    if (B.gallery) parts.push(sec("gallery", "Галерея", "Як це виглядає", `<div class="gallery">${(photos.length > 1 ? photos.slice(1) : photos).concat(Array(4).fill(null)).slice(0, 4).map(p => p ? `<img src="${p}" alt="">` : `<div class="ph">${icon("camera", 30)}</div>`).join("")}</div>`));
    if (B.reviews) parts.push(sec("reviews", "Відгуки", "Що кажуть клієнти", `<div class="reviews">${N.reviews.map(([n, t]) => `<div class="review"><span class="stars">★★★★★</span><p>${esc(t)}</p><b>${esc(n)}</b></div>`).join("")}</div>`));
    if (B.faq) parts.push(sec("faq", "FAQ", "Часті питання", `<div class="faq">${N.faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`));
    if (B.contacts) {
      alt = !alt;
      parts.push(`<section id="contacts" class="contacts${alt ? " alt" : ""}"><div class="w"><div><span class="eyebrow">Контакти</span><h2>Як нас знайти</h2><div class="clist">
${s.address ? `<a href="https://www.google.com/maps/search/${encodeURIComponent([s.city, s.address].filter(Boolean).join(", "))}" target="_blank" rel="noopener"><span class="ic">${icon("pin")}</span><span>${esc(s.address)}<small>${esc(s.city)}</small></span></a>` : ""}
${s.hours ? `<div><span class="ic">${icon("clock")}</span><span>${esc(s.hours)}<small>Години роботи</small></span></div>` : ""}
${tel ? `<a href="tel:${tel}"><span class="ic">${icon("phone")}</span><span>${esc(s.phone)}<small>Телефон</small></span></a>` : ""}
${tg ? `<a href="https://t.me/${encodeURIComponent(tg)}" target="_blank" rel="noopener"><span class="ic">${icon("send")}</span><span>@${esc(tg)}<small>Telegram</small></span></a>` : ""}
${ig ? `<a href="https://instagram.com/${encodeURIComponent(ig)}" target="_blank" rel="noopener"><span class="ic">${icon("camera")}</span><span>@${esc(ig)}<small>Instagram</small></span></a>` : ""}
</div></div><div class="cta-box"><h3>${esc(N.cta)}</h3><p>Напишіть нам — відповімо протягом години в робочий час.</p><a class="btn" href="${ctaHref}">${esc(N.cta)} →</a></div></div></section>`);
    }

    return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(s.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${F[3]}&display=swap">
<style>${css}</style></head><body class="st-${style}">${nav}<main>${heroHTML}${parts.join("")}</main>
<footer><div class="w"><span>© ${year} ${esc(s.name)}</span><a href="https://rodionactive.com/instrumenty/konstruktor-saitu/" target="_blank" rel="noopener">Сайт: Rodionactive</a></div></footer></body></html>`;
  }


  // ---------- форма з превʼю ----------
  const TEXT = [["name", "Назва", "Кав'ярня «Зерно»"], ["slogan", "Слоган — одним реченням, що ви робите", ""], ["city", "Місто, район", ""], ["address", "Адреса", ""], ["hours", "Години роботи", ""], ["phone", "Телефон", "+380…"], ["telegram", "Telegram", "@username"], ["instagram", "Instagram", "@username"]];
  const MAX_ITEMS = 8, MAX_PHOTOS = 5;

  // стан у посиланні (без фото й логотипа — вони лише в браузері)
  const pack = s => { const { logo, photos, ...rest } = s; return btoa(unescape(encodeURIComponent(JSON.stringify(rest)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  function unpack(h) {
    try {
      const s = JSON.parse(decodeURIComponent(escape(atob(h.replace(/-/g, "+").replace(/_/g, "/")))));
      if (!s || !NICHES[s.niche]) return null;
      const d = defaults(s.niche);
      return { ...d, ...s, blocks: { ...d.blocks, ...(s.blocks || {}) }, items: Array.isArray(s.items) ? s.items.slice(0, MAX_ITEMS).map(i => ({ title: String(i.title || ""), price: String(i.price || ""), desc: String(i.desc || "") })) : d.items, logo: "", photos: [] };
    } catch { return null; }
  }
  function shrink(file, max, type) {
    return new Promise((ok, fail) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        ok(c.toDataURL(type, .82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); fail(new Error("image")); };
      img.src = url;
    });
  }
  const pick = (arr, not) => { const xs = arr.filter(x => x !== not); return xs[Math.floor(Math.random() * xs.length)]; };

  function mount(root) {
    const tg = root.dataset.tg || "https://t.me/rodionactive";
    let s = (location.hash.startsWith("#s=") && unpack(location.hash.slice(3))) || defaults("cafe");
    let dirty = {}, device = window.matchMedia("(max-width: 900px)").matches ? "phone" : "desktop", timer = 0, lastScroll = 0;

    const chips = (k, list, cur) => list.map(([v, l]) => `<button type="button" class="bd-chip" data-set="${k}" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${esc(l)}</button>`).join("");
    root.innerHTML = `<div class="bd">
      <div class="bd-form">
        <fieldset><legend>1. Ваша сфера</legend><div class="bd-chips" data-group="niche">${chips("niche", Object.entries(NICHES).map(([k, n]) => [k, n.label]), s.niche)}</div></fieldset>
        <fieldset><legend>2. Стиль</legend>
          <div class="bd-chips" data-group="style">${chips("style", STYLES, s.style)}</div>
          <p class="bd-sub">Кольори</p>
          <div class="bd-pal" data-group="palette">${PALETTES.map((p, i) => `<button type="button" data-set="palette" data-v="${i}" aria-pressed="${i === +s.palette && !s.accent}" title="${esc(p[0])}" style="--a:${p[5]};--b:${p[1]}"><span class="sr-only">${esc(p[0])}</span></button>`).join("")}
            <label class="bd-own" title="Свій колір"><input type="color" data-k="accent" value="${hexRgb(s.accent) ? s.accent : PALETTES[+s.palette][5]}"><span>Свій</span></label></div>
          <p class="bd-sub">Шрифти</p>
          <div class="bd-chips" data-group="font">${chips("font", FONTS.map((f, i) => [i, f[0]]), s.font)}</div>
          <p class="bd-sub">Перший екран</p>
          <div class="bd-chips" data-group="hero">${chips("hero", HEROES, s.hero)}</div>
        </fieldset>
        <fieldset><legend>3. Про вас</legend><div class="bd-fields">${TEXT.map(([k, l, ph]) => `<label><span>${esc(l)}</span><input type="text" data-k="${k}" value="${esc(s[k])}" placeholder="${esc(ph)}" maxlength="${k === "slogan" ? 140 : 80}"></label>`).join("")}</div></fieldset>
        <fieldset><legend>4. <span data-items-title>${esc(NICHES[s.niche].itemsTitle)}</span></legend><div class="bd-items"></div><button type="button" class="bd-add" data-add>+ Додати позицію</button></fieldset>
        <fieldset><legend>5. Логотип і фото</legend>
          <div class="bd-files">
            <label class="bd-file"><input type="file" accept="image/*" data-file="logo"><span>Логотип</span></label>
            <label class="bd-file"><input type="file" accept="image/*" multiple data-file="photos"><span>Фото (до ${MAX_PHOTOS})</span></label>
          </div>
          <div class="bd-thumbs"></div>
          <p class="bd-hint">Фото й логотип показуються лише у вашому браузері й нікуди не завантажуються. Перше фото стане головним.</p>
        </fieldset>
        <fieldset><legend>6. Блоки на сторінці</legend><div class="bd-checks">${BLOCKS.map(([k, l]) => `<label><input type="checkbox" data-block="${k}"${s.blocks[k] ? " checked" : ""}> ${esc(l)}</label>`).join("")}</div>
          <p class="bd-hint">Відгуки, переваги й відповіді в превʼю — приклад. На готовому сайті будуть ваші.</p></fieldset>
      </div>
      <div class="bd-side">
        <div class="bd-bar">
          <div class="bd-dev" role="group" aria-label="Пристрій"><button type="button" data-dev="phone">Телефон</button><button type="button" data-dev="desktop">Комп'ютер</button></div>
          <button type="button" class="bd-tool" data-surprise>Здивуй мене</button>
          <button type="button" class="bd-tool" data-open>На весь екран ↗</button>
        </div>
        <div class="bd-stage"><iframe title="Превʼю сайту" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div>
        <div class="bd-cta">
          <a class="btn" data-want target="_blank" rel="noopener">Хочу такий сайт — дізнатися ціну <span class="arr">→</span></a>
          <button type="button" class="qz-restart link" data-share>Скопіювати посилання на превʼю</button>
          <button type="button" class="qz-restart link" data-reset>Почати спочатку</button>
        </div>
      </div>
    </div>`;
    const $ = q => root.querySelector(q), $$ = q => [...root.querySelectorAll(q)];
    const frame = $("iframe"), stage = $(".bd-stage");

    function shareUrl() { return `${location.origin}${location.pathname}#s=${pack(s)}`; }
    function syncUI() {
      $$("[data-set]").forEach(b => {
        const k = b.dataset.set;
        b.setAttribute("aria-pressed", String(k === "palette" ? (+b.dataset.v === +s.palette && !s.accent) : String(s[k]) === b.dataset.v));
      });
      $(".bd-own").classList.toggle("on", !!s.accent);
      $$("[data-k]").forEach(i => { if (i.type === "color") { i.value = hexRgb(s.accent) ? s.accent : PALETTES[+s.palette][5]; } else if (document.activeElement !== i) i.value = s[i.dataset.k] || ""; });
      $$("[data-block]").forEach(c => { c.checked = !!s.blocks[c.dataset.block]; });
      $$("[data-dev]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.dev === device)));
      $("[data-items-title]").textContent = NICHES[s.niche].itemsTitle;
      $(".bd-items").innerHTML = s.items.map((it, i) => `<div class="bd-item" data-i="${i}">
        <input type="text" data-item="title" value="${esc(it.title)}" placeholder="Назва" maxlength="60" aria-label="Назва позиції ${i + 1}">
        <input type="text" data-item="price" value="${esc(it.price)}" placeholder="Ціна" maxlength="30" aria-label="Ціна позиції ${i + 1}">
        <input type="text" data-item="desc" value="${esc(it.desc)}" placeholder="Короткий опис" maxlength="120" aria-label="Опис позиції ${i + 1}">
        <button type="button" data-del="${i}" aria-label="Видалити позицію ${i + 1}">✕</button></div>`).join("");
      $("[data-add]").hidden = s.items.length >= MAX_ITEMS;
      $(".bd-thumbs").innerHTML = (s.logo ? [`<figure><img src="${s.logo}" alt="Логотип"><button type="button" data-rm="logo" aria-label="Прибрати логотип">✕</button></figure>`] : [])
        .concat(s.photos.map((p, i) => `<figure><img src="${p}" alt="Фото ${i + 1}"><button type="button" data-rm="${i}" aria-label="Прибрати фото ${i + 1}">✕</button></figure>`)).join("");
    }
    function fit() {
      const w = device === "phone" ? 390 : 1280, sw = stage.clientWidth, sh = stage.clientHeight;
      const k = Math.min(1, sw / w);
      frame.style.width = w + "px"; frame.style.height = sh / k + "px";
      frame.style.transform = `scale(${k})`;
      frame.style.left = device === "phone" ? `${Math.max(0, (sw - w * k) / 2)}px` : "0";
      stage.classList.toggle("phone", device === "phone");
    }
    function draw() {
      try { lastScroll = frame.contentWindow ? frame.contentWindow.scrollY : 0; } catch { lastScroll = 0; }
      frame.srcdoc = render(s);
      const msg = `Привіт! Зібрав(ла) сайт-візитку в конструкторі на rodionactive.com:\nСфера: ${NICHES[s.niche].label}\nНазва: ${s.name}\nСтиль: ${STYLES.find(x => x[0] === s.style)[1]}, кольори: ${s.accent || PALETTES[+s.palette][0]}, шрифти: ${FONTS[+s.font][0]}\n${NICHES[s.niche].itemsTitle}: ${s.items.length} позицій${s.logo || s.photos.length ? "\nМаю логотип/фото" : ""}\nПревʼю: ${shareUrl()}\nСкільки коштуватиме такий сайт і за скільки зробите?`;
      $("[data-want]").href = `${tg}?text=${encodeURIComponent(msg)}`;
    }
    frame.addEventListener("load", () => { try { if (lastScroll) frame.contentWindow.scrollTo(0, lastScroll); } catch { /* ignore */ } });
    const update = (ui = true) => { if (ui) syncUI(); clearTimeout(timer); timer = setTimeout(draw, 150); };

    function setNiche(n) {
      if (n === s.niche) return;
      const d = defaults(n), keep = {};
      Object.keys(dirty).forEach(k => { if (dirty[k]) keep[k] = s[k]; });
      s = { ...s, niche: n, items: dirty.items ? s.items : d.items, blocks: { ...s.blocks, steps: n === "repair" ? true : s.blocks.steps } };
      ["name", "slogan", "city", "address", "hours"].forEach(k => { if (!dirty[k]) s[k] = d[k]; });
      ["palette", "font"].forEach(k => { if (!dirty[k] && !s.accent) s[k] = d[k]; });
      Object.assign(s, keep);
    }

    root.addEventListener("click", e => {
      const t = e.target.closest("button, a"); if (!t || !root.contains(t)) return;
      if (t.dataset.set) {
        const k = t.dataset.set, v = t.dataset.v;
        if (k === "niche") setNiche(v);
        else if (k === "palette") { s.palette = +v; s.accent = ""; dirty.palette = true; }
        else if (k === "font") { s.font = +v; dirty.font = true; }
        else s[k] = v;
        update();
      } else if (t.dataset.dev) { device = t.dataset.dev; syncUI(); fit(); }
      else if (t.hasAttribute("data-surprise")) {
        s.style = pick(STYLES.map(x => x[0]), s.style); s.palette = pick(PALETTES.map((_, i) => i), +s.palette); s.accent = "";
        s.font = pick(FONTS.map((_, i) => i), +s.font); s.hero = pick(HEROES.map(x => x[0]), s.hero); dirty.palette = dirty.font = true; update();
      } else if (t.hasAttribute("data-open")) {
        const url = URL.createObjectURL(new Blob([render(s)], { type: "text/html" }));
        window.open(url, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else if (t.hasAttribute("data-share")) {
        const u = shareUrl(); history.replaceState(null, "", u.slice(location.origin.length));
        const done = () => { const x = t.textContent; t.textContent = "Скопійовано ✓"; setTimeout(() => (t.textContent = x), 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(u).then(done).catch(() => {}); else done();
      } else if (t.hasAttribute("data-reset")) { s = defaults(s.niche); dirty = {}; history.replaceState(null, "", location.pathname); update(); }
      else if (t.hasAttribute("data-add")) { s.items.push({ title: "", price: "", desc: "" }); dirty.items = true; update(); const last = $$(".bd-item input[data-item=title]").pop(); if (last) last.focus(); }
      else if (t.dataset.del !== undefined) { s.items.splice(+t.dataset.del, 1); dirty.items = true; update(); }
      else if (t.dataset.rm !== undefined) { if (t.dataset.rm === "logo") s.logo = ""; else s.photos.splice(+t.dataset.rm, 1); update(); }
    });
    root.addEventListener("input", e => {
      const t = e.target;
      if (t.dataset.k === "accent") { s.accent = t.value; dirty.palette = true; update(); return; }
      if (t.dataset.k) { s[t.dataset.k] = t.value; dirty[t.dataset.k] = true; update(false); return; }
      if (t.dataset.item) { const i = +t.closest("[data-i]").dataset.i; s.items[i][t.dataset.item] = t.value; dirty.items = true; update(false); }
    });
    root.addEventListener("change", async e => {
      const t = e.target;
      if (t.dataset.block) { s.blocks[t.dataset.block] = t.checked; update(); }
      if (t.dataset.file) {
        const files = [...(t.files || [])].filter(f => /^image\//.test(f.type));
        try {
          if (t.dataset.file === "logo" && files[0]) s.logo = await shrink(files[0], 480, "image/png");
          else for (const f of files.slice(0, MAX_PHOTOS - s.photos.length)) s.photos.push(await shrink(f, 1600, "image/jpeg"));
        } catch { /* битий файл — пропускаємо */ }
        t.value = ""; update();
      }
    });
    window.addEventListener("resize", fit);
    syncUI(); fit(); draw();
  }

  window.RodionBuilder = { mount, render, defaults, NICHES, STYLES, PALETTES, FONTS, HEROES, BLOCKS, esc, onColor };
})();
