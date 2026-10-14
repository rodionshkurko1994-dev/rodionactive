/* Rodionactive — адмінка. Працює через GitHub Contents API, без сервера. */

const DEFAULTS = { owner: "rodionshkurko1994-dev", repo: "rodionactive", branch: "main", token: "" };
const LS_KEY = "rodionactive-admin";
const FILES = { posts: "data/posts.json", projects: "data/projects.json" };
const CATEGORIES = ["Розробка", "Дизайн", "Instagram", "Переклад"];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const state = {
  cfg: loadCfg(),
  tab: "posts",
  data: { posts: [], projects: [] },
  sha: { posts: null, projects: null },
  connected: false,
  current: null,     // індекс у масиві або -1 для нового
  draft: null,       // об'єкт, що редагується
  dirty: false,
  localImages: {},   // шлях → blob URL для щойно завантажених фото
  slugTouched: false,
};

function loadCfg() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LS_KEY) || "{}") }; } catch { return { ...DEFAULTS }; }
}
function saveCfg() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state.cfg)); } catch {}
}

// ---------- повідомлення ----------
let toastTimer;
function toast(msg, err = false) {
  const t = $("#toast");
  t.textContent = msg; t.classList.toggle("err", err); t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), err ? 6000 : 3800);
}
function setStatus(text, kind = "") {
  const s = $("#status"); s.textContent = text; s.className = "status " + kind;
}

// ---------- base64 з підтримкою кирилиці ----------
function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromB64(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

// ---------- GitHub API ----------
async function gh(path, opts = {}) {
  const { owner, repo, token } = state.cfg;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...opts,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", ...(opts.headers || {}) },
  });
  if (!res.ok) {
    let msg = `GitHub відповів ${res.status}`;
    if (res.status === 401) msg = "Токен недійсний або прострочений. Створіть новий у налаштуваннях.";
    if (res.status === 403) msg = "Токен не має права запису. Дайте йому Contents: Read and write.";
    if (res.status === 404) msg = "Репозиторій або файл не знайдено. Перевірте власника, назву й гілку.";
    if (res.status === 409) msg = "Файл змінився в репозиторії. Дані перезавантажено, повторіть збереження.";
    const e = new Error(msg); e.status = res.status; throw e;
  }
  return res.status === 204 ? null : res.json();
}

async function readFile(kind) {
  const r = await gh(`/contents/${FILES[kind]}?ref=${encodeURIComponent(state.cfg.branch)}`);
  state.sha[kind] = r.sha;
  return JSON.parse(fromB64(r.content));
}

async function writeFile(kind, message) {
  const body = { message, content: toB64(JSON.stringify(state.data[kind], null, 2) + "\n"), branch: state.cfg.branch };
  if (state.sha[kind]) body.sha = state.sha[kind];
  try {
    const r = await gh(`/contents/${FILES[kind]}`, { method: "PUT", body: JSON.stringify(body) });
    state.sha[kind] = r.content.sha;
  } catch (e) {
    if (e.status === 409 || e.status === 422) { await reloadKind(kind); }
    throw e;
  }
}

async function uploadImage(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 40) || "image";
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const path = `assets/uploads/${stamp}-${base}.${ext}`;
  const b64 = await new Promise((ok, fail) => {
    const fr = new FileReader();
    fr.onload = () => ok(String(fr.result).split(",")[1]);
    fr.onerror = fail; fr.readAsDataURL(file);
  });
  await gh(`/contents/${path}`, { method: "PUT", body: JSON.stringify({ message: `Фото: ${file.name}`, content: b64, branch: state.cfg.branch }) });
  state.localImages[path] = URL.createObjectURL(file);
  return path;
}

// ---------- завантаження даних ----------
async function reloadKind(kind) {
  if (state.connected) state.data[kind] = await readFile(kind);
  else {
    const r = await fetch(`../${FILES[kind]}`, { cache: "no-cache" });
    state.data[kind] = r.ok ? await r.json() : [];
  }
}

async function connect() {
  const { token, owner, repo } = state.cfg;
  renderBanner();
  if (!token) {
    state.connected = false;
    setStatus("Режим перегляду");
    await Promise.all([reloadKind("posts"), reloadKind("projects")]).catch(() => {});
    renderAll();
    return;
  }
  setStatus("Підключення…");
  try {
    state.connected = true;
    await Promise.all([reloadKind("posts"), reloadKind("projects")]);
    setStatus(`${owner}/${repo}`, "ok");
  } catch (e) {
    state.connected = false;
    setStatus("Помилка підключення", "err");
    toast(e.message, true);
    await Promise.all([reloadKind("posts"), reloadKind("projects")]).catch(() => {});
  }
  renderBanner();
  renderAll();
}

// ---------- допоміжні ----------
const TR = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia",ы:"y",э:"e",ё:"io",ъ:"","'":"","’":"","ʼ":"" };
function slugify(s) {
  return String(s).toLowerCase().split("").map(c => TR[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" }) : "без дати";
const previewSrc = p => !p ? "" : state.localImages[p] || (/^(https?:|data:|blob:)/.test(p) ? p : "../" + p);

function blank(kind) {
  return kind === "posts"
    ? { slug: "", title: "", date: today(), excerpt: "", cover: "", tags: [], body: "", draft: true }
    : { slug: "", title: "", category: CATEGORIES[0], year: String(new Date().getFullYear()), date: today(), summary: "", cover: "", url: "", tags: [], body: "", draft: true };
}

// ---------- рендер ----------
function renderBanner() {
  const box = $("#bannerBox");
  box.innerHTML = state.cfg.token && state.connected ? "" :
    `<div class="banner" style="margin-top:24px"><span>Зараз режим перегляду: зміни не збережуться. Підключіть GitHub, щоб публікувати пости й проєкти.</span><button class="btn small" type="button" data-open-settings>Підключити</button></div>`;
  box.querySelector("[data-open-settings]")?.addEventListener("click", () => openSettings());
}

function renderList() {
  const list = state.data[state.tab];
  $("#listTitle").textContent = state.tab === "posts" ? "Пости" : "Проєкти";
  const sorted = list.map((x, i) => [x, i]).sort((a, b) => (b[0].date || "").localeCompare(a[0].date || ""));
  $("#items").innerHTML = sorted.length ? sorted.map(([x, i]) => `
    <li><button class="item" data-i="${i}" aria-current="${state.current === i}">
      <strong>${esc(x.title || "Без назви")}</strong>
      <small><span>${fmtDate(x.date)}</span>${state.tab === "projects" ? `<span>${esc(x.category)}</span>` : ""}${x.draft ? '<span class="tag-draft">чернетка</span>' : ""}</small>
    </button></li>`).join("") : `<li class="empty" style="padding:16px">Поки порожньо. Натисніть «+ Новий».</li>`;
}

function renderEmptyEditor() {
  $("#editorPanel").innerHTML = `<div class="empty-editor">
    <h2>${state.tab === "posts" ? "Оберіть пост" : "Оберіть проєкт"}</h2>
    <p>Виберіть запис зліва, щоб редагувати, або створіть новий.</p>
    <button class="btn" type="button" data-new>${state.tab === "posts" ? "Написати пост" : "Додати проєкт"} <span class="arr">→</span></button>
  </div>`;
  $("[data-new]").addEventListener("click", newItem);
}

function field(id, label, value, { type = "text", hint = "", attrs = "" } = {}) {
  return `<div class="field"><label for="${id}">${label}</label><input type="${type}" id="${id}" value="${esc(value)}" ${attrs}>${hint ? `<small>${hint}</small>` : ""}</div>`;
}

function renderEditor() {
  const d = state.draft, isPost = state.tab === "posts", isNew = state.current === -1;
  if (!d) return renderEmptyEditor();
  $("#editorPanel").innerHTML = `
  <form class="editor" id="form" autocomplete="off">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
      <p class="eyebrow">${isNew ? (isPost ? "Новий пост" : "Новий проєкт") : (isPost ? "Редагування поста" : "Редагування проєкту")}</p>
      <span class="dirty" id="dirty" hidden>● не збережено</span>
    </div>
    <div class="field"><label for="f-title">Заголовок</label><input type="text" id="f-title" class="input-title" value="${esc(d.title)}" placeholder="${isPost ? "Про що цей пост?" : "Назва проєкту"}" required></div>
    <div class="row">
      ${field("f-slug", "Адреса (slug)", d.slug, { hint: `${isPost ? "post" : "project"}.html#<b>${esc(d.slug || "…")}</b>` })}
      ${field("f-date", "Дата", d.date, { type: "date" })}
      ${isPost ? "" : `<div class="field"><label for="f-category">Категорія</label><select id="f-category">${CATEGORIES.map(c => `<option${c === d.category ? " selected" : ""}>${c}</option>`).join("")}</select></div>`}
      ${isPost ? "" : field("f-year", "Рік", d.year)}
    </div>
    ${isPost
      ? `<div class="field"><label for="f-excerpt">Короткий опис</label><input type="text" id="f-excerpt" value="${esc(d.excerpt)}" placeholder="Одне-два речення для списку статей"></div>`
      : `<div class="field"><label for="f-summary">Короткий опис</label><input type="text" id="f-summary" value="${esc(d.summary)}" placeholder="Що це за проєкт, одним реченням"></div>
         ${field("f-url", "Посилання на живий сайт", d.url, { type: "url", attrs: 'placeholder="https://…"' })}`}
    ${field("f-tags", "Теги", (d.tags || []).join(", "), { hint: "Через кому" })}
    <div class="cover-box">
      <div class="cover-thumb" id="coverThumb" style="background-image:url('${esc(previewSrc(d.cover))}')"></div>
      <div class="field">
        <label for="f-cover">Обкладинка</label>
        <input type="text" id="f-cover" value="${esc(d.cover)}" placeholder="assets/uploads/… або https://…">
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small ghost" type="button" data-upload="cover">Завантажити фото</button>${d.cover ? `<button class="btn small ghost" type="button" data-clear-cover>Прибрати</button>` : ""}</div>
      </div>
    </div>
    <div class="field">
      <span class="lbl">Текст (Markdown)</span>
      <div class="md-bar">
        <button type="button" data-md="## " title="Підзаголовок">H2</button>
        <button type="button" data-md="**" title="Жирний">B</button>
        <button type="button" data-md="*" title="Курсив"><i>I</i></button>
        <button type="button" data-md="link" title="Посилання">🔗</button>
        <button type="button" data-md="- " title="Список">• список</button>
        <button type="button" data-md="> " title="Цитата">❝</button>
        <button type="button" data-upload="body" title="Вставити фото">+ фото</button>
        <span class="sep"></span>
        <button type="button" data-view="write" aria-pressed="true">Текст</button>
        <button type="button" data-view="preview" aria-pressed="false">Перегляд</button>
      </div>
      <textarea id="f-body" placeholder="Пишіть тут. ## — підзаголовок, **жирний**, - список">${esc(d.body)}</textarea>
      <div class="md-preview prose" id="preview" hidden></div>
    </div>
    <label class="switch"><input type="checkbox" id="f-draft"${d.draft ? " checked" : ""}> Чернетка (не показувати на сайті)</label>
    <div class="actions">
      <button class="btn" type="submit" id="saveBtn"${state.connected ? "" : " disabled"}>${d.draft ? "Зберегти чернетку" : "Опублікувати"} <span class="arr">→</span></button>
      <button class="btn ghost" type="button" id="revertBtn">Скасувати зміни</button>
      <span class="spacer"></span>
      ${isNew ? "" : `<button class="btn small danger" type="button" id="deleteBtn"${state.connected ? "" : " disabled"}>Видалити</button>`}
    </div>
  </form>`;
  bindEditor();
}

function renderAll() { renderList(); renderEditor(); }

// ---------- редактор ----------
function readForm() {
  const v = id => $(id)?.value ?? "";
  const d = state.draft;
  d.title = v("#f-title").trim();
  d.slug = slugify(v("#f-slug")) || slugify(d.title);
  d.date = v("#f-date");
  d.tags = v("#f-tags").split(",").map(s => s.trim()).filter(Boolean);
  d.cover = v("#f-cover").trim();
  d.body = v("#f-body");
  d.draft = $("#f-draft").checked;
  if (state.tab === "posts") d.excerpt = v("#f-excerpt").trim();
  else { d.summary = v("#f-summary").trim(); d.url = v("#f-url").trim(); d.category = v("#f-category"); d.year = v("#f-year").trim(); }
  return d;
}

function markDirty() {
  state.dirty = true; $("#dirty").hidden = false;
  const d = $("#f-draft").checked;
  $("#saveBtn").innerHTML = `${d ? "Зберегти чернетку" : "Опублікувати"} <span class="arr">→</span>`;
}

function renderPreview() {
  const md = $("#f-body").value.replace(/\]\((assets\/[^)\s]+)\)/g, (m, p) => `](${previewSrc(p)})`);
  $("#preview").innerHTML = DOMPurify.sanitize(marked.parse(md || "*Тут поки нічого немає.*"));
}

function insertMd(kind) {
  const ta = $("#f-body");
  const [s, e] = [ta.selectionStart, ta.selectionEnd];
  const sel = ta.value.slice(s, e);
  let ins;
  if (kind === "**" || kind === "*") ins = `${kind}${sel || "текст"}${kind}`;
  else if (kind === "link") ins = `[${sel || "текст посилання"}](https://)`;
  else {
    const lineStart = ta.value.lastIndexOf("\n", s - 1) + 1;
    ta.setRangeText(kind, lineStart, lineStart, "end");
    ta.focus(); markDirty(); return;
  }
  ta.setRangeText(ins, s, e, "end"); ta.focus(); markDirty();
}

function bindEditor() {
  const form = $("#form");
  form.addEventListener("input", e => {
    if (e.target.id === "f-slug") state.slugTouched = true;
    if (e.target.id === "f-title" && !state.slugTouched) $("#f-slug").value = slugify(e.target.value);
    if (e.target.id === "f-cover") $("#coverThumb").style.backgroundImage = `url('${previewSrc(e.target.value.trim())}')`;
    markDirty();
  });
  form.addEventListener("submit", e => { e.preventDefault(); save(); });
  $("#revertBtn").addEventListener("click", () => openItem(state.current));
  form.querySelectorAll("[data-md]").forEach(b => b.addEventListener("click", () => insertMd(b.dataset.md)));
  form.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => {
    const pv = b.dataset.view === "preview";
    form.querySelectorAll("[data-view]").forEach(x => x.setAttribute("aria-pressed", x === b));
    $("#f-body").hidden = pv; $("#preview").hidden = !pv;
    if (pv) renderPreview();
  }));
  form.querySelectorAll("[data-upload]").forEach(b => b.addEventListener("click", () => pickImage(b.dataset.upload)));
  $("[data-clear-cover]")?.addEventListener("click", () => { $("#f-cover").value = ""; $("#coverThumb").style.backgroundImage = ""; markDirty(); });
  const del = $("#deleteBtn");
  if (del) {
    let armed = false, timer;
    del.addEventListener("click", () => {
      if (!armed) { armed = true; del.classList.add("confirm"); del.textContent = "Точно видалити?"; timer = setTimeout(() => { armed = false; del.classList.remove("confirm"); del.textContent = "Видалити"; }, 3500); return; }
      clearTimeout(timer); remove();
    });
  }
}

function pickImage(target) {
  if (!state.connected) return toast("Щоб завантажувати фото, підключіть GitHub.", true);
  const input = $("#fileInput");
  input.value = "";
  input.onchange = async () => {
    const file = input.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast("Фото більше 5 МБ. Стисніть його, щоб сайт швидко завантажувався.", true);
    toast("Завантажую фото…");
    try {
      const path = await uploadImage(file);
      if (target === "cover") { $("#f-cover").value = path; $("#coverThumb").style.backgroundImage = `url('${previewSrc(path)}')`; }
      else { const ta = $("#f-body"); ta.setRangeText(`\n![](${path})\n`, ta.selectionStart, ta.selectionEnd, "end"); }
      markDirty(); toast("Фото завантажено");
    } catch (e) { toast(e.message, true); }
  };
  input.click();
}

function openItem(i) {
  state.current = i;
  state.draft = i === -1 ? blank(state.tab) : structuredClone(state.data[state.tab][i]);
  state.dirty = false;
  state.slugTouched = i !== -1;
  renderAll();
}

function newItem() {
  if (state.dirty && !leaveOk()) return;
  openItem(-1);
  $("#f-title")?.focus();
}

let leaveArmed = false;
function leaveOk() {
  if (leaveArmed) { leaveArmed = false; return true; }
  leaveArmed = true; setTimeout(() => leaveArmed = false, 4000);
  toast("Є незбережені зміни. Натисніть ще раз, щоб вийти без збереження.", true);
  return false;
}

async function save() {
  const d = readForm();
  if (!d.title) return toast("Додайте заголовок.", true);
  if (!d.slug) return toast("Не вдалося створити адресу. Заповніть поле slug латиницею.", true);
  const list = state.data[state.tab];
  const clash = list.findIndex((x, i) => x.slug === d.slug && i !== state.current);
  if (clash !== -1) return toast("Запис з такою адресою вже існує. Змініть slug.", true);

  const btn = $("#saveBtn"); btn.disabled = true; btn.textContent = "Зберігаю…";
  const backup = structuredClone(list);
  if (state.current === -1) list.push(structuredClone(d)); else list[state.current] = structuredClone(d);
  try {
    const what = state.tab === "posts" ? "Блог" : "Портфоліо";
    await writeFile(state.tab, `${what}: ${state.current === -1 ? "додано" : "оновлено"} «${d.title}»`);
    if (state.current === -1) state.current = list.length - 1;
    state.dirty = false;
    toast(d.draft ? "Чернетку збережено" : "Опубліковано. Сайт оновиться за 1–2 хвилини.");
    openItem(state.current);
  } catch (e) {
    if (e.status !== 409 && e.status !== 422) state.data[state.tab] = backup;
    toast(e.message, true);
    btn.disabled = false; btn.innerHTML = `Спробувати ще раз <span class="arr">→</span>`;
    renderList();
  }
}

async function remove() {
  const list = state.data[state.tab];
  const [gone] = list.splice(state.current, 1);
  try {
    await writeFile(state.tab, `${state.tab === "posts" ? "Блог" : "Портфоліо"}: видалено «${gone.title}»`);
    toast("Видалено");
    state.current = null; state.draft = null; state.dirty = false;
    renderAll();
  } catch (e) {
    list.splice(state.current, 0, gone);
    toast(e.message, true);
  }
}

// ---------- налаштування ----------
function openSettings(scroll = true) {
  $("#settings").hidden = false;
  $("#s-owner").value = state.cfg.owner; $("#s-repo").value = state.cfg.repo;
  $("#s-branch").value = state.cfg.branch; $("#s-token").value = state.cfg.token;
  if (scroll === true) $("#settings").scrollIntoView({ behavior: "smooth" });
}
$("#openSettings").addEventListener("click", () => openSettings());
$("#closeSettings").addEventListener("click", () => $("#settings").hidden = true);
$("#saveSettings").addEventListener("click", async () => {
  state.cfg = { owner: $("#s-owner").value.trim(), repo: $("#s-repo").value.trim(), branch: $("#s-branch").value.trim() || "main", token: $("#s-token").value.trim() };
  saveCfg();
  await connect();
  if (state.connected) { $("#settings").hidden = true; toast("Підключено до GitHub"); }
});
$("#logout").addEventListener("click", async () => {
  state.cfg.token = ""; saveCfg(); $("#s-token").value = "";
  await connect(); toast("Токен видалено з цього браузера");
});

// ---------- вкладки й список ----------
document.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => {
  if (t.dataset.tab === state.tab) return;
  if (state.dirty && !leaveOk()) return;
  state.tab = t.dataset.tab;
  document.querySelectorAll("[data-tab]").forEach(x => x.setAttribute("aria-selected", x === t));
  state.current = null; state.draft = null; state.dirty = false;
  renderAll();
}));
$("#items").addEventListener("click", e => {
  const b = e.target.closest("[data-i]"); if (!b) return;
  if (state.dirty && !leaveOk()) return;
  openItem(Number(b.dataset.i));
});
$("#newItem").addEventListener("click", newItem);
addEventListener("beforeunload", e => { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });

connect();
if (!state.cfg.token) openSettings(false);
