/* Rodionactive — рейтинг швидкості сайтів: фільтр за категоріями і сортування таблиці.
   Таблиця вже є в HTML (для пошуковиків), скрипт лише ховає/переставляє рядки. */
(function () {
  "use strict";
  const table = document.querySelector(".rt-table");
  if (!table) return;
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  let cat = "", key = "rank", dir = 1;

  // за замовчуванням: місце й час завантаження — за зростанням, решта оцінок — від кращої до гіршої
  const ASC = { rank: true, lcp: true };

  function apply() {
    const sorted = rows.slice().sort((a, b) => (Number(a.dataset[key]) - Number(b.dataset[key])) * dir || Number(a.dataset.rank) - Number(b.dataset.rank));
    sorted.forEach(r => { r.hidden = !!cat && r.dataset.cat !== cat; tbody.appendChild(r); });
    table.querySelectorAll("th[data-sort]").forEach(th => {
      if (th.dataset.sort === key) th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
      else th.removeAttribute("aria-sort");
    });
  }

  document.querySelectorAll(".rt-filter button").forEach(b => b.addEventListener("click", () => {
    cat = b.dataset.cat;
    document.querySelectorAll(".rt-filter button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  }));

  table.querySelectorAll("th[data-sort]").forEach(th => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rt-sort";
    while (th.firstChild) btn.appendChild(th.firstChild);
    th.appendChild(btn);
    btn.addEventListener("click", () => {
      const k = th.dataset.sort;
      if (k === key) dir = -dir; else { key = k; dir = ASC[k] ? 1 : -1; }
      apply();
    });
  });
})();
