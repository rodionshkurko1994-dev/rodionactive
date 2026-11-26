/* Rodionactive — аналітика: Google Analytics 4 + Microsoft Clarity.
   Підключена на всіх публічних сторінках (поряд із GoatCounter).
   Щоб увімкнути — впишіть ID нижче. Порожній ID = сервіс не вантажиться.
   Власні заходи не рахуються: у браузері, де відкривали адмінку, стоїть прапорець skipgc. */
(function () {
  "use strict";
  const GA4_ID = "G-BGX5T51JQR";      // формат G-XXXXXXXXXX  (analytics.google.com → Адміністратор → Потоки даних)
  const CLARITY_ID = "zjqatulujh";  // формат ~10 символів (clarity.microsoft.com → Settings → Overview → Project ID)

  try { if (localStorage.getItem("skipgc") === "t") return; } catch {}
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  // ---------- Google Analytics 4 ----------
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (GA4_ID) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA4_ID, { page_type: document.body ? document.body.dataset.page || "" : "" });
  }

  // ---------- Microsoft Clarity (теплові карти, записи сесій) ----------
  if (CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  // ---------- ключові події ----------
  // Надсилаються в GA4 (у Clarity — як мітки сесії, щоб фільтрувати записи).
  function track(name, params) {
    if (GA4_ID) gtag("event", name, params || {});
    if (CLARITY_ID && window.clarity) { try { window.clarity("event", name); } catch {} }
  }
  window.raTrack = track; // для інструментів: raTrack("tool_use", { tool: "qr" })

  const page = () => location.pathname;
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const label = (a.textContent || "").trim().slice(0, 60);
    if (/t\.me\/rodionactive\/?($|\?)/.test(href)) track("generate_lead", { method: "telegram", link_text: label, page: page() });
    else if (/t\.me\/rodionactive_online/.test(href)) track("click_channel", { page: page() });
    else if (/instagram\.com/.test(href)) track("click_social", { network: "instagram", page: page() });
    else if (/freelancehunt\.com/.test(href)) track("click_social", { network: "freelancehunt", page: page() });
    else if (/^mailto:/.test(href)) track("generate_lead", { method: "email", page: page() });
    else if (/^tel:/.test(href)) track("generate_lead", { method: "phone", page: page() });
  }, true);

  document.addEventListener("submit", e => {
    const f = e.target;
    track("form_submit", { form: f.id || f.getAttribute("name") || f.className || "form", page: page() });
  }, true);
})();
