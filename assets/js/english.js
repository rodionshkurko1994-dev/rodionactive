/* Rodionactive — «Англійська щодня»: опівнічне оновлення за Києвом, таймер, вимова, «Перевір себе».
   HTML сторінки вже містить набір дня (для пошуковиків); скрипт лише підміняє його новим опівночі. */
(function () {
  "use strict";
  const root = document.querySelector("[data-en]");
  if (!root) return;
  const archive = root.hasAttribute("data-en-archive");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MONTHS = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  const WEEKDAYS = ["неділя", "понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота"];
  const POS_UK = { noun: "іменник", verb: "дієслово", adjective: "прикметник", adverb: "прислівник", "phrasal verb": "фразове дієслово", preposition: "прийменник", conjunction: "сполучник" };
  const kyiv = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kiev", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const label = d => { const [y, m, dd] = d.split("-").map(Number); return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]}, ${dd} ${MONTHS[m - 1]}`; };

  // мілісекунди до наступної опівночі за Києвом
  function msToMidnight() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kiev", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const g = t => +parts.find(p => p.type === t).value;
    return ((24 - g("hour") - 1) * 3600 + (60 - g("minute") - 1) * 60 + (60 - g("second"))) * 1000 - now.getMilliseconds();
  }

  const word = w => `<article class="en-card">
        <div class="en-top"><h3 lang="en">${esc(w.word)}</h3><span class="en-lvl">${esc(w.level)}</span></div>
        <p class="en-ipa"><span lang="en">${esc(w.ipa)}</span> · ${esc(POS_UK[w.pos] || w.pos)} <button type="button" class="en-say" data-say="${esc(w.word)}" aria-label="Послухати вимову: ${esc(w.word)}">🔊</button></p>
        <p class="en-uk">${esc(w.uk)}</p>
        <p class="en-ex"><span lang="en">${esc(w.example)}</span><em>${esc(w.example_uk)}</em></p>
      </article>`;
  const phrase = p => `<article class="en-card en-phrase">
        <div class="en-top"><h3 lang="en">${esc(p.phrase)}</h3><span class="en-lvl">${esc(p.level)}</span></div>
        <p class="en-uk">${esc(p.uk)} <button type="button" class="en-say" data-say="${esc(p.phrase)}" aria-label="Послухати вимову">🔊</button></p>
        <p class="en-use">${esc(p.usage)}</p>
        <p class="en-ex"><span lang="en">${esc(p.example)}</span><em>${esc(p.example_uk)}</em></p>
      </article>`;

  async function refresh() {
    const today = kyiv();
    if (root.dataset.date === today) return;
    try {
      const r = await fetch(`/data/english/days/${today}.json`, { cache: "no-cache" });
      if (!r.ok) return; // набір ще не готовий — лишаємо попередній
      const day = await r.json();
      root.querySelector("[data-en-words]").innerHTML = day.words.map(word).join("");
      root.querySelector("[data-en-phrases]").innerHTML = day.phrases.map(phrase).join("");
      root.dataset.date = today;
      const l = document.querySelector("[data-en-label]"); if (l) l.textContent = label(today);
      root.classList.add("en-new"); setTimeout(() => root.classList.remove("en-new"), 1600);
    } catch { /* офлайн — спробуємо пізніше */ }
  }

  if (!archive) {
    const next = root.querySelector("[data-en-next]"), timer = root.querySelector("[data-en-timer]");
    const tick = () => {
      const s = Math.max(0, Math.round(msToMidnight() / 1000));
      if (timer) timer.textContent = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, "0")).join(":");
      if (s === 0) setTimeout(refresh, 3000);
    };
    if (next) next.hidden = false;
    tick(); setInterval(tick, 1000);
    refresh();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  }

  // вимова через вбудований синтезатор браузера (безкоштовно, без сервера)
  const synth = window.speechSynthesis;
  if (!synth) root.classList.add("en-nosay");
  root.addEventListener("click", e => {
    const b = e.target.closest(".en-say");
    if (b && synth) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(b.dataset.say);
      u.lang = "en-GB"; u.rate = .9;
      const v = synth.getVoices().find(x => /^en-GB/i.test(x.lang)) || synth.getVoices().find(x => /^en/i.test(x.lang));
      if (v) u.voice = v;
      synth.speak(u);
      return;
    }
    const card = e.target.closest(".en-card");
    if (card && root.classList.contains("en-quizzing")) card.classList.toggle("en-open");
  });

  const quiz = root.querySelector("[data-en-quiz]");
  if (quiz) quiz.addEventListener("change", () => {
    root.classList.toggle("en-quizzing", quiz.checked);
    root.querySelectorAll(".en-open").forEach(c => c.classList.remove("en-open"));
  });
})();
