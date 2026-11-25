/* Rodionactive — інструменти: аудит сайту, генератор QR-кодів, калькулятор вартості сайту, калькулятор рутини,
   статус сервісів і індекс ринку фрілансу (дані — з гілки data, див. .github/workflows/data.yml).
   Усе працює в браузері; дані нікуди не надсилаються, доки відвідувач сам не натисне «Обговорити в Telegram». */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = n => Math.round(n).toLocaleString("uk-UA").replace(/,/g, " ") + " грн";
  const round500 = n => Math.max(500, Math.round(n / 500) * 500);
  const DISCOUNT = 0.8; // моя ціна ≈ на 20% нижча за ринок фрілансу

  function tgLink(base, text) {
    return `${base}?text=${encodeURIComponent(text)}`;
  }
  function copy(text, btn) {
    const done = () => { const t = btn.textContent; btn.textContent = "Скопійовано ✓"; setTimeout(() => (btn.textContent = t), 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => {});
    else { const i = document.createElement("textarea"); i.value = text; document.body.appendChild(i); i.select(); try { document.execCommand("copy"); done(); } catch {} i.remove(); }
  }

  /* ===================== Квіз-движок ===================== */
  function quiz(root, { questions, compute, render }) {
    const answers = {};
    questions.forEach(q => {
      if (q.kind === "multi") answers[q.id] = [];
      else if (q.kind === "range" || q.kind === "number") answers[q.id] = q.value;
    });
    let step = 0;
    root.innerHTML = `<div class="qz" aria-live="polite">
      <div class="qz-top"><span class="qz-count"></span><div class="qz-bar"><i></i></div></div>
      <div class="qz-body"></div>
      <div class="qz-nav"><button type="button" class="btn ghost small qz-back">← Назад</button><button type="button" class="btn qz-next">Далі <span class="arr">→</span></button></div>
    </div>`;
    const body = $(".qz-body", root), next = $(".qz-next", root), back = $(".qz-back", root);

    function valid(q) {
      const v = answers[q.id];
      if (q.kind === "single") return v !== undefined;
      return true;
    }
    function draw() {
      if (step >= questions.length) return finish();
      const q = questions[step];
      $(".qz-count", root).textContent = `Питання ${step + 1} з ${questions.length}`;
      $(".qz-bar i", root).style.width = `${(step / questions.length) * 100}%`;
      let field = "";
      if (q.kind === "single" || q.kind === "multi") {
        const type = q.kind === "single" ? "radio" : "checkbox";
        field = `<div class="qz-opts${q.options.length > 5 ? " grid2" : ""}">${q.options.map(o => {
          const on = q.kind === "single" ? answers[q.id] === o.id : answers[q.id].includes(o.id);
          return `<label class="qz-opt${on ? " on" : ""}"><input type="${type}" name="${q.id}" value="${o.id}"${on ? " checked" : ""}><span class="qz-mark" aria-hidden="true"></span><span><b>${esc(o.label)}</b>${o.hint ? `<small>${esc(o.hint)}</small>` : ""}</span></label>`;
        }).join("")}</div>`;
      } else if (q.kind === "range") {
        field = `<div class="qz-range"><output>${q.format(answers[q.id])}</output><input type="range" min="${q.min}" max="${q.max}" step="${q.step || 1}" value="${answers[q.id]}" aria-label="${esc(q.title)}"><div class="qz-range-scale"><span>${q.format(q.min)}</span><span>${q.format(q.max)}</span></div></div>`;
      } else if (q.kind === "number") {
        field = `<label class="qz-num"><input type="number" inputmode="numeric" min="${q.min}" max="${q.max}" step="${q.step || 1}" value="${answers[q.id]}"><span>${esc(q.unit)}</span></label>`;
      }
      body.innerHTML = `<fieldset class="qz-q"><legend><h2>${esc(q.title)}</h2>${q.hint ? `<p>${esc(q.hint)}</p>` : ""}</legend>${field}</fieldset>`;
      back.style.visibility = step ? "visible" : "hidden";
      next.innerHTML = step === questions.length - 1 ? `Показати результат <span class="arr">→</span>` : `Далі <span class="arr">→</span>`;
      next.disabled = !valid(q);

      $$("input", body).forEach(inp => inp.addEventListener("input", () => {
        if (q.kind === "single") {
          answers[q.id] = inp.value;
          $$(".qz-opt", body).forEach(l => l.classList.toggle("on", l.contains(inp)));
          next.disabled = false;
          setTimeout(() => { if (answers[q.id] === inp.value && step < questions.length) { step++; draw(); } }, 260);
        } else if (q.kind === "multi") {
          answers[q.id] = $$("input:checked", body).map(i => i.value);
          $$(".qz-opt", body).forEach(l => l.classList.toggle("on", $("input", l).checked));
        } else {
          let v = Number(inp.value);
          if (q.kind === "number") v = Math.min(q.max, Math.max(q.min, v || q.value));
          answers[q.id] = v;
          const out = $("output", body); if (out) out.textContent = q.format(v);
        }
      }));
    }
    function finish() {
      $(".qz-count", root).textContent = "Ваш розрахунок";
      $(".qz-bar i", root).style.width = "100%";
      $(".qz-nav", root).hidden = true;
      const res = compute(answers);
      body.innerHTML = render(res, answers);
      $("[data-restart]", body).addEventListener("click", () => { step = 0; $(".qz-nav", root).hidden = false; draw(); });
      const cp = $("[data-copy]", body);
      if (cp) cp.addEventListener("click", () => copy(res.message, cp));
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    next.addEventListener("click", () => { if (valid(questions[step])) { step++; draw(); } });
    back.addEventListener("click", () => { if (step) { step--; draw(); } });
    draw();
  }

  const labelOf = (q, id) => (q.options.find(o => o.id === id) || {}).label || "";

  function resultCard({ title, range, market, rows, note, tg, message }) {
    return `<div class="qz-result">
      <p class="eyebrow">${esc(title)}</p>
      <p class="qz-price">${range}</p>
      ${market ? `<p class="qz-market">Середня ціна на ринку фрілансу: <s>${market}</s> <span class="qz-save">−20%</span></p>` : ""}
      <dl class="qz-sum">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      ${note ? `<p class="qz-note">${note}</p>` : ""}
      <div class="qz-cta">
        <a class="btn" href="${tgLink(tg, message)}" target="_blank" rel="noopener">Обговорити в Telegram <span class="arr">→</span></a>
        <button type="button" class="btn ghost" data-copy>Скопіювати розрахунок</button>
        <button type="button" class="link qz-restart" data-restart>Пройти ще раз</button>
      </div>
      <p class="qz-fine">У Telegram відкриється чат зі мною з уже заповненим повідомленням — ваші відповіді й розрахунок. Залишиться натиснути «Надіслати».</p>
    </div>`;
  }

  /* ===================== Калькулятор вартості сайту ===================== */
  function siteCalc(root) {
    const tg = root.dataset.tg;
    const Q = [
      { id: "type", kind: "single", title: "Який сайт вам потрібен?", options: [
        { id: "landing", label: "Лендинг", hint: "Одна сторінка під послугу чи продукт", base: 8000, time: "1–2 тижні" },
        { id: "card", label: "Сайт-візитка", hint: "2–5 сторінок: про вас, послуги, контакти", base: 15000, time: "2–3 тижні" },
        { id: "corp", label: "Корпоративний сайт", hint: "6–15 сторінок, послуги, кейси, блог", base: 28000, time: "3–5 тижнів" },
        { id: "shop", label: "Інтернет-магазин", hint: "Каталог, кошик, оформлення замовлення", base: 40000, time: "4–8 тижнів" },
        { id: "app", label: "Веб-сервіс або нестандартний проєкт", hint: "Кабінети, бази даних, ігри, карти", base: 60000, time: "від 6 тижнів", from: true },
      ] },
      { id: "design", kind: "single", title: "Який потрібен дизайн?", options: [
        { id: "template", label: "Готовий шаблон у ваших кольорах", hint: "Найшвидше й найдешевше", k: 0.7 },
        { id: "custom", label: "Індивідуальний дизайн", hint: "Макет саме під ваш бізнес", k: 1 },
        { id: "premium", label: "Індивідуальний з анімаціями", hint: "Ефектна подача, мікроанімації", k: 1.3 },
      ] },
      { id: "features", kind: "multi", title: "Які функції потрібні?", hint: "Можна обрати кілька або пропустити.", options: [
        { id: "form", label: "Форма заявки з повідомленням у Telegram", add: 1500 },
        { id: "booking", label: "Онлайн-запис або бронювання", add: 5000 },
        { id: "calc", label: "Калькулятор або квіз", add: 4000 },
        { id: "blog", label: "Блог або новини", add: 3000 },
        { id: "pay", label: "Онлайн-оплата", add: 5000 },
        { id: "catalog", label: "Каталог із фільтрами", add: 6000 },
        { id: "account", label: "Реєстрація та особистий кабінет", add: 15000 },
        { id: "crm", label: "Інтеграція з CRM", add: 8000 },
        { id: "admin", label: "Адмінка для самостійних змін", add: 4000 },
      ] },
      { id: "langs", kind: "single", title: "Скільки мовних версій?", options: [
        { id: "1", label: "Одна мова", k: 1 },
        { id: "2", label: "Дві мови", hint: "Наприклад, українська й англійська", k: 1.25 },
        { id: "3", label: "Три мови і більше", k: 1.45 },
      ] },
      { id: "texts", kind: "single", title: "Хто пише тексти для сайту?", options: [
        { id: "own", label: "Тексти є, дам свої" },
        { id: "need", label: "Потрібно написати", hint: "Структура й продаючі тексти під ваш бізнес" },
      ] },
      { id: "seo", kind: "single", title: "Що з просуванням у Google?", options: [
        { id: "basic", label: "Базового SEO достатньо", hint: "Мета-теги, швидкість, sitemap — входить завжди", add: 0 },
        { id: "pro", label: "Потрібна SEO-оптимізація під запити", hint: "Структура й тексти під пошукові запити клієнтів", add: 6000 },
      ] },
      { id: "platform", kind: "single", title: "На чому зробити сайт?", options: [
        { id: "weblium", label: "Weblium", hint: "Конструктор, редагуєте самі у візуальному редакторі" },
        { id: "code", label: "Claude + GitHub", hint: "Власний код, безкоштовний хостинг" },
        { id: "any", label: "Порадьте ви", hint: "Підберу варіант під задачу" },
      ] },
      { id: "urgency", kind: "single", title: "Коли потрібен сайт?", options: [
        { id: "normal", label: "У звичайні терміни", k: 1 },
        { id: "urgent", label: "Терміново", hint: "Робота в пріоритеті", k: 1.25 },
      ] },
    ];
    const by = id => Q.find(q => q.id === id);
    const opt = (id, a) => by(id).options.find(o => o.id === a[id]);

    quiz(root, {
      questions: Q,
      compute(a) {
        const type = opt("type", a);
        let price = type.base * opt("design", a).k;
        price += a.features.reduce((s, f) => s + by("features").options.find(o => o.id === f).add, 0);
        price *= opt("langs", a).k;
        if (a.texts === "need") price += Math.max(3000, price * 0.12);
        price += opt("seo", a).add;
        price *= opt("urgency", a).k;
        const market = round500(price);
        const mine = market * DISCOUNT;
        const lo = round500(mine * 0.92), hi = round500(mine * 1.08);
        const range = type.from ? `від ${money(lo)}` : `${money(lo).replace(" грн", "")} – ${money(hi)}`;
        const feats = a.features.map(f => labelOf(by("features"), f));
        const rows = [
          ["Тип сайту", type.label],
          ["Дизайн", opt("design", a).label],
          ["Функції", feats.length ? feats.join(", ") : "базові"],
          ["Мови", opt("langs", a).label],
          ["Тексти", opt("texts", a).label],
          ["SEO", opt("seo", a).label],
          ["Платформа", opt("platform", a).label],
          ["Терміни", (a.urgency === "urgent" ? "терміново, " : "") + "орієнтовно " + type.time],
        ];
        const message = ["Привіт! Розрахував вартість сайту на rodionactive.com:", ...rows.map(([k, v]) => `• ${k}: ${v}`), `Орієнтовна вартість: ${range}`, "Хочу обговорити деталі."].join("\n");
        const note = a.type === "shop" && a.platform === "code"
          ? "Для інтернет-магазину з онлайн-оплатою безкоштовний хостинг GitHub Pages не підходить за його правилами — підберу інший хостинг або платформу."
          : "Домен оплачується окремо. Остаточну ціну я фіксую після короткого обговорення задачі.";
        return { range, market: money(market), rows, message, note };
      },
      render(r) {
        return resultCard({ title: "Орієнтовна вартість вашого сайту", range: r.range, market: r.market, rows: r.rows, note: esc(r.note), tg, message: r.message });
      },
    });
  }

  /* ===================== Калькулятор рутини ===================== */
  function routineCalc(root) {
    const tg = root.dataset.tg;
    const h = v => `${v} ${v === 1 ? "година" : v < 5 ? "години" : "годин"} на тиждень`;
    const Q = [
      { id: "task", kind: "single", title: "Що забирає найбільше часу?", options: [
        { id: "content", label: "Контент і публікації", hint: "Пости, статті, розсилки, Telegram-канал" },
        { id: "reports", label: "Звіти й таблиці", hint: "Зведення, перенесення даних між таблицями" },
        { id: "mail", label: "Листи й заявки", hint: "Розбір пошти, відповіді, сортування заявок" },
        { id: "monitor", label: "Моніторинг", hint: "Новини, конкуренти, ціни, нові документи" },
        { id: "docs", label: "Документи", hint: "Перевірка, заповнення, витягування даних" },
        { id: "other", label: "Інше", hint: "Будь-яка повторювана робота" },
      ] },
      { id: "hours", kind: "range", title: "Скільки часу на тиждень це займає в однієї людини?", min: 1, max: 40, value: 5, format: h },
      { id: "people", kind: "range", title: "Скільки людей цим займаються?", min: 1, max: 10, value: 1, format: v => `${v} ${v === 1 ? "людина" : v < 5 ? "людини" : "людей"}` },
      { id: "rate", kind: "number", title: "Скільки коштує година роботи?", hint: "Ваша власна або вашого працівника. Якщо не знаєте — залиште як є.", min: 50, max: 5000, step: 10, value: 250, unit: "грн за годину" },
      { id: "services", kind: "single", title: "Скільки сервісів задіяно?", hint: "Пошта, Google Таблиці, Telegram, сайт, CRM тощо.", options: [
        { id: "1", label: "Один", base: 8000 },
        { id: "2", label: "Два-три", base: 15000 },
        { id: "4", label: "Чотири і більше", base: 25000 },
      ] },
      { id: "decisions", kind: "single", title: "Як часто в процесі потрібне рішення людини?", options: [
        { id: "rare", label: "Майже ніколи", hint: "Чіткі правила: що взяти, куди записати", share: 0.85, k: 1 },
        { id: "some", label: "Іноді", hint: "Час від часу треба перевірити чи вибрати", share: 0.65, k: 1.1 },
        { id: "often", label: "Часто", hint: "Багато рішень залежить від контексту", share: 0.4, k: 1.2 },
      ] },
    ];
    const by = id => Q.find(q => q.id === id);
    const opt = (id, a) => by(id).options.find(o => o.id === a[id]);

    quiz(root, {
      questions: Q,
      compute(a) {
        const hoursYear = a.hours * a.people * 48;
        const costYear = hoursYear * a.rate;
        const d = opt("decisions", a);
        const savedHours = Math.round(hoursYear * d.share);
        const savedMoney = savedHours * a.rate;
        const market = round500(opt("services", a).base * d.k);
        const mine = market * DISCOUNT;
        const lo = round500(mine * 0.92), hi = round500(mine * 1.08);
        const range = `${money(lo).replace(" грн", "")} – ${money(hi)}`;
        const months = savedMoney > 0 ? (lo + hi) / 2 / (savedMoney / 12) : Infinity;
        const payback = months < 1 ? "менше місяця" : months > 36 ? "понад 3 роки" : `≈ ${Math.ceil(months)} ${Math.ceil(months) === 1 ? "місяць" : Math.ceil(months) < 5 ? "місяці" : "місяців"}`;
        const rows = [
          ["Задача", opt("task", a).label],
          ["Обсяг", `${h(a.hours)} × ${a.people} ${a.people === 1 ? "людина" : a.people < 5 ? "людини" : "людей"}`],
          ["Вартість години", money(a.rate)],
          ["Сервіси", opt("services", a).label],
          ["Рішення людини", d.label],
          ["Рутина забирає на рік", `${hoursYear.toLocaleString("uk-UA")} год ≈ ${money(costYear)}`],
          ["Можна заощадити на рік", `${savedHours.toLocaleString("uk-UA")} год ≈ ${money(savedMoney)}`],
          ["Окупність налаштування", payback],
        ];
        const message = ["Привіт! Порахував рутину на rodionactive.com:", ...rows.map(([k, v]) => `• ${k}: ${v}`), `Орієнтовна вартість автоматизації: ${range}`, "Хочу обговорити автоматизацію."].join("\n");
        return { range, market: money(market), rows, message, hoursYear, costYear, savedHours, savedMoney };
      },
      render(r) {
        const big = `<div class="qz-stats">
          <div><span>Рутина забирає на рік</span><b>${r.hoursYear.toLocaleString("uk-UA")} год</b><em>≈ ${money(r.costYear)}</em></div>
          <div class="hl"><span>Автоматизація заощадить</span><b>${r.savedHours.toLocaleString("uk-UA")} год</b><em>≈ ${money(r.savedMoney)} на рік</em></div>
        </div>`;
        return big + resultCard({ title: "Вартість налаштування автоматизації", range: r.range, market: r.market, rows: r.rows.slice(0, 5).concat([r.rows[7]]), note: "Окремо оплачується підписка на сервіси, які використовує автоматизація, наприклад тариф Claude від 20 доларів на місяць. Точну ціну я називаю після обговорення процесу.", tg, message: r.message });
      },
    });
  }

  /* ===================== Генератор QR-кодів ===================== */
  function qrTool(root) {
    if (typeof QRCodeStyling !== "function") { root.innerHTML = "<p>Не вдалося завантажити генератор. Оновіть сторінку.</p>"; return; }
    const TYPES = {
      url: { label: "Посилання", fields: [["url", "Адреса сторінки", "https://", "url"]], data: f => f.url.trim() },
      text: { label: "Текст", fields: [["text", "Текст", "Будь-який текст", "textarea"]], data: f => f.text },
      wifi: { label: "Wi-Fi", fields: [["ssid", "Назва мережі (SSID)", "MyWiFi", "text"], ["pass", "Пароль", "", "text"], ["enc", "Захист", "WPA", "select:WPA|WPA/WPA2;WEP|WEP;nopass|Без пароля"]],
        data: f => { const e = s => String(s).replace(/([\\;,:"])/g, "\\$1"); return f.ssid ? `WIFI:T:${f.enc === "nopass" ? "nopass" : f.enc};S:${e(f.ssid)};${f.enc === "nopass" ? "" : `P:${e(f.pass)};`};` : ""; } },
      vcard: { label: "Контакт", fields: [["first", "Ім'я", "", "text"], ["last", "Прізвище", "", "text"], ["org", "Компанія", "", "text"], ["tel", "Телефон", "+380", "tel"], ["email", "Email", "", "email"], ["site", "Сайт", "https://", "url"]],
        data: f => (f.first || f.last || f.tel) ? ["BEGIN:VCARD", "VERSION:3.0", `N:${f.last};${f.first};;;`, `FN:${[f.first, f.last].filter(Boolean).join(" ")}`, f.org && `ORG:${f.org}`, f.tel && `TEL;TYPE=CELL:${f.tel}`, f.email && `EMAIL:${f.email}`, f.site && `URL:${f.site}`, "END:VCARD"].filter(Boolean).join("\n") : "" },
      tel: { label: "Телефон", fields: [["tel", "Номер телефону", "+380", "tel"]], data: f => f.tel.replace(/[^\d+]/g, "") ? `tel:${f.tel.replace(/[^\d+]/g, "")}` : "" },
      email: { label: "Email", fields: [["to", "Адреса", "name@example.com", "email"], ["subject", "Тема листа", "", "text"], ["body", "Текст листа", "", "textarea"]],
        data: f => f.to ? `mailto:${f.to}${f.subject || f.body ? "?" + [f.subject && `subject=${encodeURIComponent(f.subject)}`, f.body && `body=${encodeURIComponent(f.body)}`].filter(Boolean).join("&") : ""}` : "" },
    };
    const state = { type: "url", f: { url: "https://rodionactive.com" }, dot: "#383e65", bg: "#ffffff", corner: "#ff6e27", dots: "rounded", corners: "extra-rounded", logo: null, size: 1024 };

    root.innerHTML = `<div class="qr">
      <div class="qr-form">
        <div class="qr-tabs" role="tablist">${Object.entries(TYPES).map(([k, t]) => `<button type="button" role="tab" data-type="${k}" aria-selected="${k === state.type}">${t.label}</button>`).join("")}</div>
        <div class="qr-fields"></div>
        <details class="qr-style" open><summary>Вигляд</summary>
          <div class="qr-grid">
            <label>Колір точок<input type="color" data-k="dot" value="${state.dot}"></label>
            <label>Колір кутів<input type="color" data-k="corner" value="${state.corner}"></label>
            <label>Фон<input type="color" data-k="bg" value="${state.bg}"></label>
            <label>Форма точок<select data-k="dots"><option value="square">Квадрати</option><option value="rounded" selected>Закруглені</option><option value="dots">Крапки</option><option value="classy-rounded">Класичні</option><option value="extra-rounded">М'які</option></select></label>
            <label>Форма кутів<select data-k="corners"><option value="square">Квадрат</option><option value="extra-rounded" selected>Закруглені</option><option value="dot">Коло</option></select></label>
            <label>Розмір PNG<select data-k="size"><option value="512">512 px</option><option value="1024" selected>1024 px</option><option value="2048">2048 px</option></select></label>
          </div>
          <div class="qr-logo"><label class="btn ghost small">Додати логотип<input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden></label><button type="button" class="link" data-nologo hidden>Прибрати логотип</button></div>
        </details>
      </div>
      <div class="qr-preview">
        <div class="qr-canvas" aria-label="Попередній перегляд QR-коду"></div>
        <p class="qr-warn" hidden></p>
        <div class="qr-dl"><button type="button" class="btn" data-dl="png">Завантажити PNG</button><button type="button" class="btn ghost" data-dl="svg">SVG для друку</button></div>
      </div>
    </div>`;

    const opts = (size, data) => ({
      width: size, height: size, type: "svg", margin: Math.round(size / 24), data: data || " ",
      image: state.logo || undefined,
      qrOptions: { errorCorrectionLevel: state.logo ? "H" : "Q" },
      dotsOptions: { color: state.dot, type: state.dots },
      cornersSquareOptions: { color: state.corner, type: state.corners },
      cornersDotOptions: { color: state.corner, type: state.corners === "square" ? "square" : "dot" },
      backgroundOptions: { color: state.bg },
      imageOptions: { crossOrigin: "anonymous", margin: Math.round(size / 80), imageSize: 0.32, hideBackgroundDots: true },
    });
    const qr = new QRCodeStyling(opts(300, TYPES.url.data(state.f)));
    qr.append($(".qr-canvas", root));

    const lum = hex => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    function update() {
      const data = TYPES[state.type].data(state.f);
      const warn = $(".qr-warn", root);
      const l1 = lum(state.dot), l2 = lum(state.bg);
      const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
      warn.hidden = !(l1 > l2 || ratio < 3 || !data);
      warn.textContent = !data ? "Заповніть поле, щоб створити QR-код." : l1 > l2 ? "Світлі точки на темному фоні багато телефонів не прочитають — зробіть точки темнішими за фон." : "Замалий контраст між точками і фоном — код може погано скануватися.";
      $$("[data-dl]", root).forEach(b => (b.disabled = !data));
      qr.update(opts(300, data));
    }
    function drawFields() {
      $(".qr-fields", root).innerHTML = TYPES[state.type].fields.map(([k, label, ph, kind]) => {
        const v = esc(state.f[k] || "");
        if (kind === "textarea") return `<label>${label}<textarea data-f="${k}" rows="3" placeholder="${esc(ph)}">${v}</textarea></label>`;
        if (kind.startsWith("select:")) { const o = kind.slice(7).split(";").map(x => x.split("|")); if (!state.f[k]) state.f[k] = o[0][0]; return `<label>${label}<select data-f="${k}">${o.map(([val, t]) => `<option value="${val}"${state.f[k] === val ? " selected" : ""}>${t}</option>`).join("")}</select></label>`; }
        return `<label>${label}<input data-f="${k}" type="${kind}" placeholder="${esc(ph)}" value="${v}" autocomplete="off"></label>`;
      }).join("");
      $$("[data-f]", root).forEach(i => i.addEventListener("input", () => { state.f[i.dataset.f] = i.value; update(); }));
      TYPES[state.type].fields.forEach(([k]) => { if (state.f[k] === undefined) state.f[k] = ""; });
    }
    $$(".qr-tabs button", root).forEach(b => b.addEventListener("click", () => {
      state.type = b.dataset.type; state.f = {};
      $$(".qr-tabs button", root).forEach(x => x.setAttribute("aria-selected", x === b));
      drawFields(); update(); const first = $("[data-f]", root); if (first) first.focus();
    }));
    $$("[data-k]", root).forEach(i => i.addEventListener("input", () => { state[i.dataset.k] = i.dataset.k === "size" ? Number(i.value) : i.value; update(); }));
    const file = $(".qr-logo input", root), nologo = $("[data-nologo]", root);
    file.addEventListener("change", () => {
      const f = file.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => { state.logo = r.result; nologo.hidden = false; update(); }; r.readAsDataURL(f);
    });
    nologo.addEventListener("click", () => { state.logo = null; file.value = ""; nologo.hidden = true; update(); });
    $$("[data-dl]", root).forEach(b => b.addEventListener("click", () => {
      const data = TYPES[state.type].data(state.f); if (!data) return;
      const ext = b.dataset.dl;
      const big = new QRCodeStyling({ ...opts(ext === "svg" ? 1024 : state.size, data), type: ext === "svg" ? "svg" : "canvas" });
      big.download({ name: "qr-code-rodionactive", extension: ext });
    }));
    drawFields(); update();
  }

  /* ===================== Дані з гілки data (GitHub Actions) ===================== */
  const DATA = "https://raw.githubusercontent.com/rodionshkurko1994-dev/rodionactive/data/";
  const getData = file => fetch(`${DATA}${file}?t=${Math.floor(Date.now() / 120000)}`, { cache: "no-store" }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  const num = n => Math.round(n).toLocaleString("uk-UA").replace(/,/g, " ");
  const pad = n => String(n).padStart(2, "0");
  function when(iso) {
    const d = new Date(iso), now = new Date();
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (d.toDateString() === now.toDateString()) return `сьогодні о ${t}`;
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return `вчора о ${t}`;
    return `${d.getDate()} ${["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"][d.getMonth()]}. о ${t}`;
  }
  function ago(iso) {
    const m = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
    if (m < 60) return `${m} хв`;
    const h = Math.round(m / 60);
    if (h < 48) return `${h} год`;
    return `${Math.round(h / 24)} дн.`;
  }
  const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };

  /* ===================== Статус сервісів ===================== */
  function statusTool(root) {
    const STATE = {
      ok: ["Працює", "✓"],
      degraded: ["Частковий збій", "!"],
      down: ["Не працює", "✕"],
      maintenance: ["Технічні роботи", "⚙"],
      unknown: ["Невідомо", "?"],
    };
    const GROUPS = [["all", "Усі"], ["ai", "ШІ"], ["social", "Месенджери й соцмережі"], ["ua", "Українські сервіси"], ["work", "Робочі інструменти"]];
    let data = null, group = "all", query = "";
    root.innerHTML = `<div class="st" aria-live="polite">
      <div class="st-top"><div class="st-summary"><b>Завантажуємо статус…</b><span></span></div>
        <label class="st-search"><span class="sr-only">Пошук сервісу</span><input type="search" placeholder="Пошук: ChatGPT, Telegram…" autocomplete="off"></label></div>
      <div class="filters st-filters" role="group" aria-label="Категорії">${GROUPS.map(([id, l]) => `<button type="button" class="filter" data-g="${id}" aria-pressed="${id === "all"}">${l}</button>`).join("")}</div>
      <ul class="st-list"></ul>
      <div class="st-log"></div>
    </div>`;
    const list = $(".st-list", root), sum = $(".st-summary", root), logEl = $(".st-log", root);

    function draw() {
      if (!data) return;
      const items = data.services.filter(s => (group === "all" || s.group === group) && (!query || s.name.toLowerCase().includes(query)));
      list.innerHTML = items.map(s => {
        const [label, icon] = STATE[s.state] || STATE.unknown;
        const inc = (s.incidents || []).map(i => `<a class="st-inc" href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.name)}</a>`).join("");
        const comps = s.components ? `<small class="st-comp">Зачеплено: ${esc(s.components.join(", "))}</small>` : "";
        const since = s.state === "ok" ? `без збоїв ${ago(s.since)}` : `з ${when(s.since)}`;
        return `<li class="st-row is-${s.state}">
          <span class="st-dot" aria-hidden="true">${icon}</span>
          <span class="st-name"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>
            <small>${s.kind === "statuspage" ? "офіційна сторінка статусу" : "перевірка доступності"}${s.latency ? ` · ${(s.latency / 1000).toFixed(1)} с` : ""}</small>${inc}${comps}</span>
          <span class="st-state"><b>${label}</b><small>${since}</small></span>
        </li>`;
      }).join("") || `<li class="st-empty">Нічого не знайдено. Спробуйте іншу назву.</li>`;
    }
    function drawSummary() {
      const bad = data.services.filter(s => s.state === "down" || s.state === "degraded");
      const total = data.services.length;
      sum.className = `st-summary${bad.length ? " is-bad" : ""}`;
      sum.innerHTML = `<b>${bad.length ? `${plural(bad.length, "Проблема", "Проблеми", "Проблеми")} у ${bad.length} з ${total}: ${esc(bad.map(s => s.name).join(", "))}` : `Усі ${total} сервісів працюють`}</b><span>Перевірено ${when(data.checked)} · оновлення кожні 15 хвилин</span>`;
      const events = (data.log || []).filter(e => e.to !== "ok" && e.to !== "unknown").slice(0, 12);
      logEl.innerHTML = `<h2>Збої за останні 14 днів</h2>${events.length ? `<ol>${events.map(e => {
        const end = (data.log || []).find(x => x.id === e.id && x.at > e.at && x.to === "ok");
        const lasted = end ? ` · тривало ${ago(new Date(Date.now() - (Date.parse(end.at) - Date.parse(e.at))).toISOString())}` : " · триває";
        return `<li><time datetime="${e.at}">${when(e.at)}</time><b>${esc(e.name)}</b><span>${(STATE[e.to] || STATE.unknown)[0]}${lasted}</span></li>`;
      }).join("")}</ol>` : `<p class="st-muted">Збоїв не зафіксовано.</p>`}`;
    }
    function load() {
      getData("status.json").then(j => { data = j; drawSummary(); draw(); })
        .catch(() => { if (!data) sum.innerHTML = `<b>Дані тимчасово недоступні</b><span>Спробуйте оновити сторінку за кілька хвилин.</span>`; });
    }
    root.addEventListener("click", e => {
      const b = e.target.closest("[data-g]"); if (!b) return;
      group = b.dataset.g;
      $$("[data-g]", root).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
    $(".st-search input", root).addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); draw(); });
    load();
    setInterval(() => { if (!document.hidden) load(); }, 5 * 60000);
  }

  /* ===================== Індекс ринку фрілансу ===================== */
  function freelanceTool(root) {
    root.innerHTML = `<div class="fx" aria-live="polite"><p class="st-muted">Завантажуємо індекс…</p></div>`;
    const box = $(".fx", root);
    const uah = n => n ? `${num(n)} грн` : "—";
    const trend = t => t === null || t === undefined ? "" : `<span class="fx-trend ${t >= 0 ? "up" : "down"}">${t >= 0 ? "↑" : "↓"} ${Math.abs(t)}%</span>`;
    // горизонтальні смуги: одна величина — один колір, значення завжди підписане текстом
    const bars = (rows, val, fmt, extra = () => "") => {
      const max = Math.max(...rows.map(val), 1);
      return `<div class="fx-bars">${rows.map(r => `<div class="fx-bar" title="${esc(r.name || r.label)}: ${esc(fmt(r))}">
        <span class="fx-bar-name">${esc(r.name || r.label)}</span>
        <span class="fx-bar-track"><i style="width:${Math.max(2, val(r) / max * 100)}%"></i></span>
        <span class="fx-bar-val">${fmt(r)}${extra(r)}</span></div>`).join("")}</div>`;
    };
    const table = (rows, cols) => `<div class="fx-table-wrap"><table class="fx-table"><thead><tr>${cols.map(c => `<th scope="col"${c.num ? ' class="n"' : ""}>${c.h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${cols.map((c, i) => i ? `<td class="${c.num ? "n" : ""}">${c.v(r)}</td>` : `<th scope="row">${c.v(r)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;

    getData("freelance-index.json").then(d => {
      if (!d.total || !d.total.count) throw new Error("empty");
      const t = d.total;
      const weeksMax = Math.max(...d.weeks.map(w => w.count), 1);
      const fmtWeek = w => { const x = new Date(w + "T12:00:00"); return `${x.getDate()}.${pad(x.getMonth() + 1)}`; };
      box.innerHTML = `
        <p class="fx-meta">Оновлено ${when(d.updated)} · останні ${d.period} днів · джерело: ${esc(d.source)}</p>
        <div class="qz-stats fx-stats">
          <div class="hl"><span>Нових проєктів за ${d.period} днів</span><b>${num(t.count)}</b><em>≈ ${num(t.perDay)} на день ${trend(t.trend)}</em></div>
          <div><span>Медіанний бюджет</span><b>${uah(t.medianBudget)}</b><em>бюджет вказано в ${String(t.withBudget).replace(".", ",")}% проєктів</em></div>
          <div><span>Ставок на один проєкт</span><b>${String(t.avgBids).replace(".", ",")}</b><em>у середньому</em></div>
        </div>

        <section class="fx-sec"><h2>Попит за напрямками</h2>
          <p class="st-muted">Частка проєктів напрямку, медіанний бюджет і конкуренція. Проєкт із кількома навичками враховується в кожному своєму напрямку.</p>
          ${table(d.groups, [
            { h: "Напрямок", v: g => esc(g.name) },
            { h: "Частка", v: g => `<span class="fx-cell-bar"><i style="width:${Math.min(100, g.share / Math.max(...d.groups.map(x => x.share)) * 100)}%"></i></span>${String(g.share).replace(".", ",")}%` },
            { h: "Проєктів", num: true, v: g => num(g.count) + (d.hasTrend ? " " + trend(g.trend) : "") },
            { h: "Медіана бюджету", num: true, v: g => uah(g.medianBudget) },
            { h: "Ставок", num: true, v: g => String(g.avgBids).replace(".", ",") },
          ])}
        </section>

        ${d.weeks.length > 1 ? `<section class="fx-sec"><h2>Нових проєктів за тижнями</h2>
          <div class="fx-cols" role="img" aria-label="Кількість нових проєктів за тижнями: ${d.weeks.map(w => `${fmtWeek(w.week)} — ${w.count}`).join(", ")}">
            ${d.weeks.map((w, i) => `<div class="fx-col${i === d.weeks.length - 1 ? " last" : ""}" title="Тиждень з ${fmtWeek(w.week)}: ${num(w.count)} проєктів"><b>${num(w.count)}</b><i style="height:${Math.max(2, w.count / weeksMax * 85)}%"></i><span>${fmtWeek(w.week)}</span></div>`).join("")}
          </div></section>` : ""}

        <section class="fx-sec"><h2>Топ-15 навичок</h2>
          ${bars(d.topSkills, s => s.count, s => `${num(s.count)}`, s => ` <small>· ${uah(s.medianBudget)} · ${String(s.avgBids).replace(".", ",")} ставок</small>`)}
        </section>

        <div class="fx-two">
          <section class="fx-sec"><h2>Найменше конкуренції</h2><p class="st-muted">Найменше ставок на проєкт серед навичок, де достатньо замовлень.</p>
            ${bars(d.lowCompetition, s => s.avgBids, s => `${String(s.avgBids).replace(".", ",")} ставок`)}</section>
          <section class="fx-sec"><h2>Найвищі бюджети</h2><p class="st-muted">Медіанний бюджет за навичкою.</p>
            ${bars(d.topPaid, s => s.medianBudget, s => uah(s.medianBudget))}</section>
        </div>

        <section class="fx-sec"><h2>Розподіл бюджетів</h2><p class="st-muted">Серед проєктів із вказаним бюджетом, у гривнях.</p>
          ${bars(d.budgets, b => b.share, b => `${String(b.share).replace(".", ",")}%`)}
        </section>

        <p class="fx-meta">Дані збираються з ${d.since ? new Date(d.since + "T12:00:00").toLocaleDateString("uk-UA") : "—"}. Бюджети в USD та EUR переведено за курсом НБУ (${String(d.rates.USD).replace(".", ",")} і ${String(d.rates.EUR).replace(".", ",")} грн).${d.hasTrend ? "" : " Тренди з'являться, коли накопичиться два місяці даних."}</p>`;
    }).catch(() => {
      box.innerHTML = `<p><b>Індекс ще збирається.</b></p><p class="st-muted">Перші дані з'являться після найближчого щоденного оновлення. Загляньте трохи пізніше.</p>`;
    });
  }

  /* ===================== Аудит сайту ===================== */
  // Ключ Google PageSpeed Insights API: Google Cloud → APIs & Services → Credentials.
  // Ключ безпечно тримати в коді сторінки, якщо в ньому дозволено лише PageSpeed Insights API.
  // Без ключа перевірка теж працює, але зі спільним і значно меншим лімітом.
  const PSI_KEY = "";
  // Адреса Cloudflare Worker з папки workers/site-check (додаткові перевірки: sitemap, robots,
  // HTTPS, Open Graph, schema.org). Поки порожньо — цей блок звіту просто не показується.
  const SITE_CHECK = "";

  const AU_CATS = [
    ["performance", "Швидкість"],
    ["seo", "SEO"],
    ["accessibility", "Доступність"],
    ["best-practices", "Якість"],
  ];
  // Пояснення найчастіших проблем без жаргону: [що не так, чому це важливо]
  const AU_PLAIN = {
    "first-contentful-paint": ["Довго видно порожній екран", "Відвідувач з телефону бачить білу сторінку кілька секунд і часто просто закриває вкладку."],
    "largest-contentful-paint": ["Головний вміст з'являється повільно", "Це ключовий показник Google: якщо головний блок вантажиться довше 2,5 секунди, сайт програє в пошуку швидшим конкурентам."],
    "total-blocking-time": ["Сторінка «зависає» на натискання", "Поки браузер виконує скрипти, кнопки й меню не реагують — людина тисне, нічого не відбувається."],
    "cumulative-layout-shift": ["Вміст «стрибає» під час завантаження", "Через зсуви відвідувач натискає не туди. Google враховує це в рейтингу."],
    "speed-index": ["Сторінка повільно промальовується", "Вміст з'являється частинами, і сайт здається повільним навіть на хорошому інтернеті."],
    "interactive": ["Сторінка довго стає робочою", "Сайт уже видно, але натискати на кнопки ще не можна."],
    "uses-optimized-images": ["Зображення завеликі", "Картинки зазвичай становлять більшу частину ваги сторінки. Стиснення прискорює сайт на телефоні в рази."],
    "modern-image-formats": ["Зображення в застарілих форматах", "Формати WebP чи AVIF важать у 2–3 рази менше за JPG і PNG за тієї ж якості."],
    "uses-responsive-images": ["На телефон вантажаться картинки для великих екранів", "Телефон завантажує зайві мегабайти, які все одно не видно на маленькому екрані."],
    "offscreen-images": ["Картинки вантажаться заздалегідь", "Зображення внизу сторінки варто підвантажувати, лише коли до них догортають."],
    "image-delivery-insight": ["Зображення можна суттєво полегшити", "Стиснення, сучасні формати і правильний розмір картинок — найпростіший спосіб пришвидшити сайт."],
    "render-blocking-resources": ["Скрипти й стилі блокують показ сторінки", "Браузер чекає на ці файли, перш ніж показати хоч щось."],
    "render-blocking-insight": ["Скрипти й стилі блокують показ сторінки", "Браузер чекає на ці файли, перш ніж показати хоч щось."],
    "unused-javascript": ["На сторінці багато зайвого JavaScript", "Телефон завантажує й обробляє код, який на цій сторінці не використовується."],
    "unused-css-rules": ["На сторінці багато зайвих стилів", "Зайвий CSS сповільнює перший показ сторінки."],
    "unminified-javascript": ["Код JavaScript не стиснутий", "Мінімізація коду — швидке виправлення, яке зменшує вагу сторінки."],
    "unminified-css": ["Код стилів не стиснутий", "Мінімізація CSS — швидке виправлення, яке зменшує вагу сторінки."],
    "uses-text-compression": ["На сервері не ввімкнено стиснення", "Gzip або Brotli зменшують розмір коду сторінки в кілька разів одним налаштуванням."],
    "server-response-time": ["Сервер повільно відповідає", "Повільний хостинг або важка CMS додають затримку ще до того, як почне вантажитися сторінка."],
    "document-latency-insight": ["Сервер повільно відповідає", "Повільний хостинг, переадресації чи відсутність стиснення додають затримку ще до показу сторінки."],
    "redirects": ["Зайві переадресації", "Кожна переадресація додає затримку, особливо на мобільному інтернеті."],
    "total-byte-weight": ["Сторінка важить забагато", "Великий обсяг даних — це повільне завантаження і витрата мобільного трафіку відвідувачів."],
    "third-party-summary": ["Сторонні сервіси гальмують сайт", "Віджети чатів, пікселі, вбудовані відео та інші сторонні скрипти уповільнюють сторінку."],
    "third-parties-insight": ["Сторонні сервіси гальмують сайт", "Віджети чатів, пікселі, вбудовані відео та інші сторонні скрипти уповільнюють сторінку."],
    "font-display": ["Шрифти затримують показ тексту", "Поки вантажиться шрифт, текст невидимий."],
    "font-display-insight": ["Шрифти затримують показ тексту", "Поки вантажиться шрифт, текст невидимий."],
    "uses-long-cache-ttl": ["Браузер не запам'ятовує файли сайту", "Під час повторного візиту все вантажиться заново, хоча могло б відкриватися миттєво."],
    "cache-insight": ["Браузер не запам'ятовує файли сайту", "Під час повторного візиту все вантажиться заново, хоча могло б відкриватися миттєво."],
    "dom-size": ["Сторінка надто складна", "Тисячі елементів сповільнюють прокручування й реакцію на дії на слабких телефонах."],
    "dom-size-insight": ["Сторінка надто складна", "Тисячі елементів сповільнюють прокручування й реакцію на дії на слабких телефонах."],
    "mainthread-work-breakdown": ["Телефон довго обробляє сторінку", "Важкі скрипти й стилі навантажують процесор, і сайт відгукується із запізненням."],
    "bootup-time": ["Скрипти довго запускаються", "Телефон витрачає секунди на обробку JavaScript, перш ніж сторінка стане робочою."],
    "largest-contentful-paint-element": ["Головний блок вантажиться пізно", "Найбільший елемент першого екрана варто показувати якомога раніше."],
    "lcp-discovery-insight": ["Головне зображення вантажиться пізно", "Браузер дізнається про головну картинку надто пізно — її варто завантажувати першою."],
    "lcp-phases-insight": ["Головний блок вантажиться пізно", "Найбільший елемент першого екрана варто показувати якомога раніше."],
    "prioritize-lcp-image": ["Головне зображення вантажиться пізно", "Головну картинку першого екрана варто завантажувати першою."],
    "layout-shifts": ["Елементи зсуваються під час завантаження", "Через зсуви відвідувач натискає не туди. Google враховує це в рейтингу."],
    "cls-culprits-insight": ["Елементи зсуваються під час завантаження", "Через зсуви відвідувач натискає не туди. Google враховує це в рейтингу."],
    "unsized-images": ["У картинок не вказано розміри", "Через це текст «стрибає», коли картинка довантажується."],
    "legacy-javascript": ["Застарілий код для старих браузерів", "Сучасні телефони завантажують зайвий код, який їм не потрібен."],
    "legacy-javascript-insight": ["Застарілий код для старих браузерів", "Сучасні телефони завантажують зайвий код, який їм не потрібен."],
    "duplicated-javascript": ["Однаковий код завантажується двічі", "Одні й ті самі бібліотеки підключені кілька разів."],
    "duplicated-javascript-insight": ["Однаковий код завантажується двічі", "Одні й ті самі бібліотеки підключені кілька разів."],
    "network-dependency-tree-insight": ["Файли вантажаться ланцюжком", "Браузер чекає на один файл, щоб дізнатися про наступний, — це додає затримку."],
    "forced-reflow-insight": ["Скрипти змушують сторінку перемальовуватися", "Це сповільнює реакцію сайту на дії відвідувача."],
    "viewport-insight": ["Сайт не налаштований під телефон", "Без тегу viewport сторінка на телефоні виглядає як зменшена версія для комп'ютера."],
    "document-title": ["Немає заголовка сторінки (title)", "Саме його Google показує в результатах пошуку. Без нього сторінку важко знайти і на неї рідко натискають."],
    "meta-description": ["Немає опису для Google (meta description)", "Опис — це текст під посиланням у пошуку. Без нього Google підставить випадковий шматок сторінки."],
    "http-status-code": ["Сторінка віддає код помилки", "Google не індексує сторінки, які повідомляють про помилку."],
    "is-crawlable": ["Сторінку заборонено показувати в Google", "Налаштування сторінки забороняють пошуковим системам її індексувати."],
    "robots-txt": ["Помилки у файлі robots.txt", "Через помилки пошукові системи можуть неправильно обходити сайт."],
    "link-text": ["Посилання без змісту («детальніше», «тут»)", "Google і люди з програмами читання екрана не розуміють, куди веде таке посилання."],
    "crawlable-anchors": ["Посилання, якими Google не може перейти", "Сторінки, на які ведуть лише такі посилання, можуть не потрапити в пошук."],
    "hreflang": ["Помилки в мовних версіях сайту", "Google може показувати відвідувачам не ту мовну версію."],
    "canonical": ["Помилка в головній адресі сторінки (canonical)", "Google може вважати сторінку дублікатом і не показувати її в пошуку."],
    "font-size": ["Дрібний текст на телефоні", "Відвідувачам доводиться збільшувати сторінку пальцями, щоб прочитати текст."],
    "tap-targets": ["Кнопки й посилання задрібні для пальця", "Легко натиснути не туди, особливо в меню й формах."],
    "image-alt": ["Картинки без текстових підписів (alt)", "Google не розуміє, що на зображенні, і не показує його в пошуку картинок."],
    "color-contrast": ["Слабкий контраст тексту", "Світлий текст на світлому фоні важко читати, особливо на телефоні на сонці."],
    "button-name": ["Кнопки без назви", "Програми читання екрана і пошукові роботи не розуміють, що робить кнопка."],
    "link-name": ["Посилання без тексту", "Посилання-іконки без підпису незрозумілі для пошуку і програм читання екрана."],
    "label": ["Поля форм без підписів", "Незрозуміло, що вводити в поле, — люди частіше кидають заповнення форми."],
    "html-has-lang": ["Не вказано мову сторінки", "Браузер і Google не знають, якою мовою сайт, — страждають переклад і озвучення."],
    "html-lang-valid": ["Неправильно вказано мову сторінки", "Браузер і Google неправильно визначають мову сайту."],
    "heading-order": ["Порушено порядок заголовків", "Заголовки йдуть не по черзі (наприклад, після H1 одразу H4), і структура сторінки незрозуміла."],
    "meta-viewport": ["Заборонено збільшувати сторінку на телефоні", "Людям із поганим зором неможливо збільшити текст."],
    "target-size": ["Кнопки й посилання задрібні для пальця", "Легко натиснути не туди, особливо в меню й формах."],
    "document-title-a11y": ["Немає заголовка сторінки", "Заголовок потрібен і для пошуку, і для вкладок браузера."],
    "image-redundant-alt": ["Підписи картинок дублюють текст", "Програми читання екрана повторюють той самий текст двічі."],
    "aria-allowed-attr": ["Помилки в розмітці для доступності", "Програми читання екрана неправильно озвучують частину сторінки."],
    "list": ["Помилки в розмітці списків", "Списки неправильно озвучуються програмами читання екрана."],
    "frame-title": ["Вбудовані блоки без назви", "Вбудовані карти, відео чи форми незрозумілі для програм читання екрана."],
    "is-on-https": ["Сайт працює без захищеного з'єднання", "Браузер позначає такий сайт як «Не захищено», а Google опускає його в пошуку."],
    "redirects-http": ["Немає переадресації з http на https", "Частина відвідувачів потрапляє на незахищену версію сайту."],
    "errors-in-console": ["На сторінці є помилки коду", "Частина функцій сайту може не працювати: форми, кнопки, аналітика."],
    "image-aspect-ratio": ["Картинки спотворені", "Зображення розтягнуті або сплюснуті — сайт виглядає неохайно."],
    "image-size-responsive": ["Картинки розмиті на телефоні", "Зображення замалі для сучасних екранів і виглядають нечітко."],
    "deprecations": ["Використовуються застарілі функції браузера", "З оновленнями браузерів частина сайту може перестати працювати."],
    "inspector-issues": ["Браузер знайшов проблеми на сторінці", "Попередження щодо безпеки, cookie або змішаного вмісту."],
    "third-party-cookies": ["Сторонні cookie", "Браузери поступово блокують сторонні cookie — частина віджетів і аналітики може перестати працювати."],
    "paste-preventing-inputs": ["Заборонено вставляти текст у поля", "Людям незручно вставляти пароль чи email у форму."],
    "doctype": ["Немає DOCTYPE", "Браузер може відображати сторінку в режимі сумісності з помилками верстки."],
    "charset": ["Не вказано кодування", "Текст може відображатися «кракозябрами»."],
    "notification-on-start": ["Сайт одразу просить дозвіл на сповіщення", "Такі запити дратують відвідувачів і частіше їх відганяють."],
    "geolocation-on-start": ["Сайт одразу просить доступ до геолокації", "Запит без пояснення відлякує відвідувачів."],
  };
  const auClean = s => String(s || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`/g, "").replace(/\s+/g, " ").trim();
  const auFirstSentence = s => { const t = auClean(s); const m = t.match(/^.{20,220}?[.!?](\s|$)/); return m ? m[0].trim() : t.slice(0, 220); };
  const auColor = sc => sc >= 90 ? "good" : sc >= 50 ? "mid" : "bad";

  // Розбирає відповідь PageSpeed Insights у компактний звіт (окрема функція — щоб її легко перевіряти)
  function auParse(json) {
    const lh = json.lighthouseResult;
    if (!lh) throw new Error("NO_RESULT");
    if (lh.runtimeError && lh.runtimeError.code && lh.runtimeError.code !== "NO_ERROR") {
      const e = new Error(lh.runtimeError.code); e.detail = lh.runtimeError.message; throw e;
    }
    const A = lh.audits || {};
    const scores = AU_CATS.map(([id, name]) => {
      const c = lh.categories && lh.categories[id];
      return { id, name, score: c && c.score !== null && c.score !== undefined ? Math.round(c.score * 100) : null };
    });
    const known = scores.filter(s => s.score !== null);
    const overall = known.length ? Math.round(known.reduce((a, s) => a + s.score, 0) / known.length) : null;

    const metric = id => A[id] ? { value: A[id].displayValue || "—", tone: A[id].score === null || A[id].score === undefined ? "" : auColor(A[id].score * 100) } : null;
    const metrics = [
      ["largest-contentful-paint", "Головний вміст", "LCP"],
      ["first-contentful-paint", "Перший вміст", "FCP"],
      ["total-blocking-time", "Блокування", "TBT"],
      ["cumulative-layout-shift", "Зсуви", "CLS"],
    ].map(([id, name, abbr]) => ({ id, name, abbr, ...(metric(id) || {}) })).filter(m => m.value);

    const issues = new Map();
    let passed = 0;
    for (const [catId, catName] of AU_CATS) {
      const c = lh.categories && lh.categories[catId];
      if (!c) continue;
      for (const ref of c.auditRefs || []) {
        const a = A[ref.id];
        if (!a || a.score === null || a.score === undefined) continue;
        if (["notApplicable", "manual", "informative", "error"].includes(a.scoreDisplayMode)) continue;
        if (ref.group === "metrics" && catId !== "performance") continue;
        if (a.score >= 0.9) { passed++; continue; }
        const savings = (a.details && a.details.overallSavingsMs) || (a.metricSavings ? Object.values(a.metricSavings).reduce((x, y) => x + (y || 0), 0) : 0);
        if (!ref.weight && catId === "performance" && a.score >= 0.5 && savings < 150) continue; // дрібниці не показуємо
        const priority = (1 - a.score) * ((ref.weight || 0) + 3) * (catId === "seo" ? 2 : 1) + Math.min(savings / 300, 8);
        const plain = AU_PLAIN[ref.id];
        const key = plain ? plain[0] : ref.id;
        const prev = issues.get(key);
        const item = {
          id: ref.id, cat: catName,
          title: plain ? plain[0] : auClean(a.title),
          why: plain ? plain[1] : auFirstSentence(a.description),
          value: a.displayValue ? auClean(a.displayValue) : "",
          severity: a.score < 0.5 ? "bad" : "mid",
          priority,
        };
        if (!prev || prev.priority < priority) issues.set(key, item);
      }
    }
    const list = [...issues.values()].sort((a, b) => b.priority - a.priority);
    const shot = A["final-screenshot"] && A["final-screenshot"].details && A["final-screenshot"].details.data;
    return {
      url: lh.finalDisplayedUrl || lh.finalUrl || lh.requestedUrl || json.id,
      requested: lh.requestedUrl || json.id,
      fetched: lh.fetchTime || json.analysisUTCTimestamp,
      device: (lh.configSettings && lh.configSettings.formFactor) === "desktop" ? "desktop" : "mobile",
      scores, overall, metrics, issues: list, passed,
      screenshot: typeof shot === "string" && shot.startsWith("data:image/") ? shot : null,
    };
  }

  // Додаткові перевірки за даними воркера: HTML сторінки, robots.txt, sitemap, https
  function auExtra(w) {
    const out = [];
    const add = (ok, title, why) => out.push({ ok, title, why });
    let doc = null;
    try { doc = new DOMParser().parseFromString(w.html || "", "text/html"); } catch { /* ignore */ }
    const meta = n => doc && (doc.querySelector(`meta[property="${n}"]`) || doc.querySelector(`meta[name="${n}"]`));
    add(!!w.https, w.https ? "Сайт працює на HTTPS" : "Сайт без HTTPS", w.https ? "З'єднання захищене." : "Браузери позначають такі сайти як «Не захищено».");
    if (w.httpRedirect !== null && w.httpRedirect !== undefined) add(!!w.httpRedirect, w.httpRedirect ? "http:// переадресовує на https://" : "Немає переадресації з http:// на https://", w.httpRedirect ? "Усі відвідувачі потрапляють на захищену версію." : "Частина відвідувачів і Google можуть потрапляти на незахищену версію.");
    add(w.robots && w.robots.status === 200, w.robots && w.robots.status === 200 ? "Є файл robots.txt" : "Немає файлу robots.txt", "Він підказує пошуковим системам, які сторінки обходити.");
    const sm = w.sitemap || {};
    add(!!sm.found, sm.found ? "Є карта сайту (sitemap.xml)" : "Немає карти сайту (sitemap.xml)", sm.found ? "Google швидше знаходить нові сторінки." : "Без неї Google довше знаходить нові сторінки сайту.");
    if (doc) {
      const h1 = doc.querySelectorAll("h1").length;
      add(h1 === 1, h1 === 1 ? "Один головний заголовок H1" : h1 ? `Заголовків H1 на сторінці: ${h1}` : "Немає головного заголовка H1", "H1 підказує Google, про що сторінка. Він має бути один.");
      const og = meta("og:title") && meta("og:image");
      add(!!og, og ? "Є прев'ю для соцмереж (Open Graph)" : "Немає прев'ю для соцмереж (Open Graph)", og ? "Посилання в Telegram, Facebook і Viber показуються з картинкою і назвою." : "Посилання на сайт у месенджерах показуються без картинки — на них менше натискають.");
      const ld = [...doc.querySelectorAll('script[type="application/ld+json"]')];
      add(ld.length > 0, ld.length ? "Є структуровані дані schema.org" : "Немає структурованих даних schema.org", ld.length ? "Google краще розуміє, що це за бізнес чи сторінка." : "Розмітка schema.org допомагає отримати розширені сніпети в Google: рейтинг, ціни, FAQ.");
      const icon = doc.querySelector('link[rel~="icon"]');
      add(!!icon || !!w.favicon, icon || w.favicon ? "Є іконка сайту (favicon)" : "Немає іконки сайту (favicon)", "Іконку видно у вкладці браузера та в результатах пошуку Google на телефоні.");
      const contact = doc.querySelector('a[href^="tel:"], a[href*="t.me/"], a[href^="viber:"], a[href*="wa.me/"], a[href^="mailto:"], a[href*="m.me/"]');
      add(!!contact, contact ? "Є кнопки зв'язку (телефон чи месенджер)" : "Не знайдено кнопок зв'язку", contact ? "Клієнт може зв'язатися в один дотик з телефону." : "Посилання tel: чи на месенджер дозволяють написати чи подзвонити в один дотик.");
      const html = w.html || "";
      const analytics = /googletagmanager\.com|google-analytics\.com|gtag\(|goatcounter|plausible|mc\.yandex|clarity\.ms|fbq\(|connect\.facebook\.net/.test(html);
      add(analytics, analytics ? "Підключено аналітику" : "Не знайдено аналітики відвідувань", analytics ? "Ви бачите, звідки приходять відвідувачі." : "Без аналітики неможливо зрозуміти, звідки приходять клієнти і що працює.");
    }
    return out;
  }

  function auditTool(root) {
    const tg = root.dataset.tg || "https://t.me/rodionactive";
    const params = new URLSearchParams(location.search);
    let device = params.get("device") === "desktop" ? "desktop" : "mobile";
    let busy = false, last = null;

    root.innerHTML = `<div class="au">
      <form class="au-form" novalidate>
        <label class="au-url"><span class="sr-only">Адреса сайту</span><input type="url" inputmode="url" autocomplete="url" placeholder="https://вашсайт.com.ua" required></label>
        <div class="au-dev" role="group" aria-label="Пристрій">
          <button type="button" data-dev="mobile" aria-pressed="${device === "mobile"}">Телефон</button>
          <button type="button" data-dev="desktop" aria-pressed="${device === "desktop"}">Комп'ютер</button>
        </div>
        <button type="submit" class="btn">Перевірити <span class="arr">→</span></button>
        <p class="au-err" role="alert" hidden></p>
      </form>
      <div class="au-out" aria-live="polite"></div>
    </div>`;
    const form = $(".au-form", root), input = $("input", form), err = $(".au-err", form), out = $(".au-out", root);

    function normalize(v) {
      v = String(v || "").trim();
      if (!v) return null;
      if (!/^https?:\/\//i.test(v)) v = "https://" + v.replace(/^\/+/, "");
      try {
        const u = new URL(v);
        if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".") || /^(localhost|127\.|10\.|192\.168\.|0\.)/.test(u.hostname)) return null;
        return u.href;
      } catch { return null; }
    }
    function showErr(t) { err.textContent = t; err.hidden = !t; }

    const STEPS = ["Відкриваю сайт як телефон у мобільній мережі…", "Вимірюю швидкість завантаження…", "Перевіряю SEO: заголовки, опис, індексацію…", "Перевіряю доступність і контраст…", "Шукаю помилки в коді сторінки…", "Збираю звіт…"];
    function progress() {
      out.innerHTML = `<div class="au-wait"><div class="au-spin" aria-hidden="true"></div><p><b>Перевіряю сайт</b><span class="au-step">${STEPS[0]}</span></p><div class="qz-bar"><i></i></div><small>Зазвичай це займає 20–40 секунд. Не закривайте сторінку.</small></div>`;
      const step = $(".au-step", out), bar = $(".qz-bar i", out), t0 = Date.now();
      const timer = setInterval(() => {
        const s = (Date.now() - t0) / 1000;
        if (step) step.textContent = STEPS[Math.min(STEPS.length - 1, Math.floor(s / 6))];
        if (bar) bar.style.width = `${Math.round(95 * (1 - Math.exp(-s / 16)))}%`;
      }, 400);
      return () => clearInterval(timer);
    }

    async function runPSI(url) {
      const q = new URLSearchParams({ url, strategy: device, locale: "uk" });
      AU_CATS.forEach(([id]) => q.append("category", id.toUpperCase().replace("-", "_")));
      if (PSI_KEY) q.set("key", PSI_KEY);
      const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: AbortSignal.timeout ? AbortSignal.timeout(120000) : undefined });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json.error && json.error.message) || "";
        const e = new Error(res.status === 429 ? "QUOTA" : /FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS|NO_FCP|unable to resolve|Unable to process/i.test(msg) ? "UNREACHABLE" : "API");
        e.detail = msg; throw e;
      }
      return auParse(json);
    }
    async function runExtra(url) {
      if (!SITE_CHECK) return null;
      try {
        const r = await fetch(`${SITE_CHECK}?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined });
        if (!r.ok) return null;
        return auExtra(await r.json());
      } catch { return null; }
    }

    const gauge = (s, big) => {
      const r = big ? 52 : 34, c = 2 * Math.PI * r, v = s.score === null ? 0 : s.score, size = (r + 8) * 2;
      return `<div class="au-g ${s.score === null ? "" : auColor(v)}${big ? " big" : ""}">
        <svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="fg" stroke-dasharray="${(c * v / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>
        <b>${s.score === null ? "—" : v}</b><span>${esc(s.name)}</span></div>`;
    };
    const verdict = o => o >= 90 ? ["Відмінно", "Сайт швидкий і технічно в хорошому стані. Залишилися дрібниці."]
      : o >= 70 ? ["Добре, але є що покращити", "Сайт працює непогано, проте кілька проблем коштують вам відвідувачів і позицій у Google."]
      : o >= 50 ? ["Сайт втрачає відвідувачів", "Частина людей іде, не дочекавшись завантаження, а Google показує сайт нижче за конкурентів."]
      : ["Серйозні проблеми", "Сайт повільний або має критичні помилки — це помітно і клієнтам, і пошуковим системам."];

    function message(r) {
      const host = new URL(r.url).hostname;
      const top = r.issues.slice(0, 3).map((i, n) => `${n + 1}. ${i.title}`).join("\n");
      return `Привіт! Перевірив сайт ${host} аудитом на rodionactive.com (${r.device === "desktop" ? "комп'ютер" : "телефон"}).\nЗагальна оцінка: ${r.overall}/100 — ${r.scores.map(s => `${s.name.toLowerCase()} ${s.score ?? "—"}`).join(", ")}.${top ? `\nГоловні проблеми:\n${top}` : ""}\nПідкажіть, що виправити в першу чергу і скільки це коштуватиме?`;
    }

    function render(r, extra) {
      const [vt, vd] = verdict(r.overall);
      const host = new URL(r.url).hostname;
      const date = new Date(r.fetched || Date.now()).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      const crit = r.issues.filter(i => i.severity === "bad"), warn = r.issues.filter(i => i.severity !== "bad");
      const item = i => `<li class="au-i ${i.severity}"><span class="au-dot" aria-hidden="true"></span><div><b>${esc(i.title)}</b>${i.value ? ` <em>${esc(i.value)}</em>` : ""}<p>${esc(i.why)}</p><small>${esc(i.cat)}</small></div></li>`;
      const SHOW = 8;
      const all = [...crit, ...warn];
      const msg = message(r);
      out.innerHTML = `<article class="au-report">
        <div class="au-brand"><b>Rodionactive<i>.</i></b><span>Звіт аудиту сайту · rodionactive.com/instrumenty/audyt-saitu</span></div>
        <header class="au-head">
          <div class="au-sum">
            ${gauge({ name: "Загалом", score: r.overall }, true)}
            <div><p class="au-host">${esc(host)} · ${r.device === "desktop" ? "комп'ютер" : "телефон"} · ${esc(date)}</p><h2>${esc(vt)}</h2><p>${esc(vd)}</p></div>
          </div>
          ${r.screenshot ? `<figure class="au-shot ${r.device}"><img src="${r.screenshot}" alt="Як сайт виглядає на ${r.device === "desktop" ? "комп'ютері" : "телефоні"}"></figure>` : ""}
        </header>
        <div class="au-gs">${r.scores.map(s => gauge(s)).join("")}</div>
        ${r.metrics.length ? `<div class="au-ms">${r.metrics.map(m => `<div class="${m.tone}"><span>${esc(m.name)} <abbr>${m.abbr}</abbr></span><b>${esc(m.value)}</b></div>`).join("")}</div>` : ""}

        <section class="au-sec"><h3>Що варто виправити${all.length ? ` <span>${all.length}</span>` : ""}</h3>
          ${all.length ? `<ol class="au-list">${all.slice(0, SHOW).map(item).join("")}</ol>
            ${all.length > SHOW ? `<details class="au-more"><summary>Показати ще ${all.length - SHOW}</summary><ol class="au-list">${all.slice(SHOW).map(item).join("")}</ol></details>` : ""}`
          : `<p class="st-muted">Суттєвих проблем не знайдено — так тримати!</p>`}
          <p class="au-passed">✓ Пройдено перевірок без зауважень: ${r.passed}</p>
        </section>

        ${extra && extra.length ? `<section class="au-sec"><h3>Базові налаштування сайту</h3><ul class="au-checks">${extra.map(c => `<li class="${c.ok ? "ok" : "no"}"><span aria-hidden="true">${c.ok ? "✓" : "✕"}</span><div><b>${esc(c.title)}</b><p>${esc(c.why)}</p></div></li>`).join("")}</ul></section>` : ""}

        <section class="au-cta">
          <div><h3>Хочете виправити?</h3><p>Надішліть звіт мені в Telegram — підкажу, з чого почати, і скільки це коштуватиме. Або збережіть PDF для свого розробника.</p></div>
          <div class="qz-cta">
            <a class="btn" href="${tgLink(tg, msg)}" target="_blank" rel="noopener">Обговорити в Telegram <span class="arr">→</span></a>
            <button type="button" class="btn ghost" data-pdf>Зберегти PDF</button>
            <button type="button" class="qz-restart link" data-copy>Скопіювати посилання на звіт</button>
          </div>
          <p class="au-brand-foot">Telegram: ${esc(tg.replace(/^https?:\/\//, ""))} · rodionactive.com</p>
          <p class="qz-fine">Оцінки розраховує Google Lighthouse через PageSpeed Insights. Результат швидкості може відрізнятися на кілька балів між перевірками.</p>
        </section>
      </article>`;
      $("[data-pdf]", out).addEventListener("click", () => {
        $$("details", out).forEach(d => (d.open = true));
        document.documentElement.classList.add("au-print");
        const done = () => { document.documentElement.classList.remove("au-print"); window.removeEventListener("afterprint", done); };
        window.addEventListener("afterprint", done);
        window.print();
        setTimeout(done, 1500);
      });
      const cp = $("[data-copy]", out);
      cp.addEventListener("click", () => copy(location.href, cp));
    }

    function fail(e) {
      const code = e && e.message;
      const text = code === "QUOTA" ? "Зараз забагато перевірок. Спробуйте ще раз за хвилину."
        : code === "UNREACHABLE" || /DOCUMENT|DNS|NO_FCP|NO_NAVSTART|PAGE_HUNG|INSECURE/.test(code || "") ? "Не вдалося відкрити сайт. Перевірте адресу: можливо, сайт недоступний, закритий паролем або блокує автоматичні перевірки."
        : code === "TimeoutError" || (e && e.name === "TimeoutError") ? "Перевірка триває надто довго — схоже, сайт відповідає дуже повільно. Спробуйте ще раз."
        : "Сервіс перевірки тимчасово не відповів. Спробуйте ще раз за хвилину.";
      out.innerHTML = `<div class="au-fail"><b>Перевірка не вдалася</b><p>${esc(text)}</p><button type="button" class="btn ghost small" data-retry>Спробувати ще раз</button></div>`;
      $("[data-retry]", out).addEventListener("click", () => run(last));
    }

    async function run(url) {
      if (busy || !url) return;
      busy = true; last = url;
      const btn = $("button[type=submit]", form); btn.disabled = true;
      const q = new URLSearchParams({ url }); if (device === "desktop") q.set("device", "desktop");
      history.replaceState(null, "", `${location.pathname}?${q}`);
      const stop = progress();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        const [r, extra] = await Promise.all([runPSI(url), runExtra(url)]);
        render(r, extra);
      } catch (e) { fail(e); } finally { stop(); busy = false; btn.disabled = false; }
    }

    form.addEventListener("submit", e => {
      e.preventDefault();
      const url = normalize(input.value);
      if (!url) return showErr("Введіть адресу сайту, наприклад example.com.ua");
      showErr(""); input.value = url; run(url);
    });
    root.addEventListener("click", e => {
      const b = e.target.closest("[data-dev]"); if (!b) return;
      device = b.dataset.dev;
      $$("[data-dev]", root).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    });
    const start = normalize(params.get("url"));
    if (start) { input.value = start; run(start); }
  }
  // для перевірки в Node
  if (typeof module === "object" && module.exports) module.exports = { auParse, auExtra };

  const APPS = { qr: qrTool, site: siteCalc, routine: routineCalc, status: statusTool, freelance: freelanceTool, audit: auditTool };
  $$("[data-tool-app]").forEach(el => { const f = APPS[el.dataset.toolApp]; if (f) f(el); });
})();
