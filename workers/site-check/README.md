# Додаткові перевірки для «Аудиту сайту» (Cloudflare Worker)

Без воркера аудит уже працює: швидкість, SEO, доступність і якість рахує Google PageSpeed Insights.
Воркер додає у звіт блок «Базові налаштування сайту»: HTTPS і переадресацію з http, robots.txt,
sitemap.xml, H1, прев'ю для соцмереж (Open Graph), schema.org, favicon, кнопки зв'язку й аналітику.

Безкоштовного тарифу Cloudflare Workers (100 000 запитів на день) вистачає з великим запасом.

## Як увімкнути (≈10 хвилин, без командного рядка)

1. Зареєструйтеся на https://dash.cloudflare.com (безкоштовно).
2. **Workers & Pages** → **Create** → **Create Worker** → назва `site-check` → **Deploy**.
3. **Edit code** → замініть весь код вмістом файлу `worker.js` з цієї папки → **Deploy**.
4. Скопіюйте адресу воркера, наприклад `https://site-check.<ваш-піддомен>.workers.dev`.
5. В `assets/js/tools-app.js` знайдіть рядок `const SITE_CHECK = "";` і вставте адресу в лапки.
6. Збережіть файл у репозиторії — сайт оновиться за 1–2 хвилини.

Воркер приймає запити лише зі сторінок rodionactive.com (список `ALLOWED_ORIGINS` на початку
`worker.js`), тож використати його з інших сайтів не вийде.

## Ключ Google PageSpeed Insights (рекомендовано)

Без ключа перевірка працює зі спільним лімітом Google, і в години пік може відповідати
«забагато перевірок». Власний ключ дає 25 000 перевірок на день безкоштовно:

1. https://console.cloud.google.com → створіть проєкт (наприклад, `rodionactive`).
2. **APIs & Services** → **Library** → знайдіть **PageSpeed Insights API** → **Enable**.
3. **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
4. Відкрийте створений ключ:
   - **API restrictions** → **Restrict key** → лише **PageSpeed Insights API**;
   - **Application restrictions** → **Websites** → `https://rodionactive.com/*`.
5. Вставте ключ у `assets/js/tools-app.js`: `const PSI_KEY = "…";`.

Такий ключ безпечно тримати в коді сторінки: з обмеженнями він працює лише для PageSpeed і лише з вашого сайту.
