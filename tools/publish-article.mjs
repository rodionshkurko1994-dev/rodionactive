// Додає статтю в блог: фірмова обкладинка, запис у data/posts.json і повна перебудова сайту.
// Запуск: node tools/publish-article.mjs article.json
// article.json: {id, title, lead, metaDescription, tags[], text (Markdown), sources[{name,url}]}
// Коди виходу: 0 — опубліковано, 3 — стаття з таким id уже є, 1 — помилка/невалідні дані.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { renderCover } from "./cover.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fail = msg => { console.error("ПОМИЛКА: " + msg); process.exit(1); };

const a = JSON.parse(readFileSync(process.argv[2] || fail("не вказано файл статті"), "utf8"));
const ALLOWED = ["AI", "технології", "маркетинг", "навички", "англійська", "бізнес"];

const title = String(a.title || "").trim();
const text = String(a.text || "").trim();
const lead = String(a.lead || "").trim();
const description = String(a.metaDescription || "").trim();
if (!a.id) fail("немає id");
if (title.length < 10 || title.length > 110) fail(`довжина заголовка ${title.length}`);
if (text.length < 2500) fail(`текст закороткий (${text.length} символів)`);
if (!lead) fail("немає lead");
if (/https?:\/\//.test(text)) fail("у тексті є посилання");
const tags = [...new Set((a.tags || []).map(t => ALLOWED.find(x => x.toLowerCase() === String(t).trim().toLowerCase())).filter(Boolean))].slice(0, 3);
if (!tags.length) tags.push("технології");

const postsPath = join(root, "data/posts.json");
const posts = JSON.parse(readFileSync(postsPath, "utf8"));
if (posts.some(p => p.sourceId === a.id)) { console.log("ВЖЕ Є: " + a.id); process.exit(3); }

const TR = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia",ы:"y",э:"e",ё:"io",ъ:"","'":"","’":"","ʼ":"" };
const slugify = s => String(s).toLowerCase().split("").map(c => TR[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, "");
let slug = slugify(title) || "stattia";
for (let i = 2; posts.some(p => p.slug === slug); i++) slug = `${slugify(title).slice(0, 66)}-${i}`;

const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv" }).format(new Date());
const sources = (a.sources || []).filter(s => s && /^https:\/\//.test(s.url) && s.name);
const body = text + (sources.length
  ? "\n\n## Джерела\n\n" + sources.map(s => `- [${String(s.name).replace(/[[\]]/g, "")}](${s.url})`).join("\n")
  : "");

mkdirSync(join(root, "assets/uploads"), { recursive: true });
const cover = `assets/uploads/${date.replace(/-/g, "")}-${slug.slice(0, 50)}.jpg`;
await renderCover(title, tags[0], join(root, cover));

const post = {
  slug, title, date,
  excerpt: lead,
  ...(description ? { description: description.slice(0, 170) } : {}),
  cover, tags, body,
  draft: false,
  sourceId: a.id,
};
posts.unshift(post);
writeFileSync(postsPath, JSON.stringify(posts, null, 2) + "\n");
execFileSync("node", [join(root, "tools/build.mjs")], { stdio: "inherit", cwd: root });
console.log(`ОПУБЛІКОВАНО: https://rodionactive.com/blog/${slug}/`);
