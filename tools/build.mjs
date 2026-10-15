// Перебудовує статичні сторінки з data/*.json.
// Запуск: npm install && npm run build
// Адмінка робить те саме автоматично при кожному збереженні.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { marked } from "marked";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const SiteBuild = require(join(root, "assets/js/build.js"));
const read = p => readFileSync(join(root, p), "utf8");

const posts = JSON.parse(read("data/posts.json"));
const projects = JSON.parse(read("data/projects.json"));
const result = SiteBuild.build({ posts, projects, indexHtml: read("index.html"), markdown: md => marked.parse(md) });

// прибираємо сторінки записів, яких більше немає
for (const dir of ["blog", "portfolio"]) {
  if (!existsSync(join(root, dir))) continue;
  for (const name of readdirSync(join(root, dir), { withFileTypes: true })) {
    if (name.isDirectory() && !result.files[`${dir}/${name.name}/index.html`]) rmSync(join(root, dir, name.name), { recursive: true });
  }
}
for (const [path, content] of Object.entries(result.files)) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}
console.log(`Готово: ${Object.keys(result.files).length} файлів (${result.postPaths.length} статей, ${result.projectPaths.length} проєктів).`);
