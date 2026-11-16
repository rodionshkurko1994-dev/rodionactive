/* Rodionactive — інструменти: генератор QR-кодів, калькулятор вартості сайту, калькулятор рутини.
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

  const APPS = { qr: qrTool, site: siteCalc, routine: routineCalc };
  $$("[data-tool-app]").forEach(el => { const f = APPS[el.dataset.toolApp]; if (f) f(el); });
})();
