# Rodionactive

Особистий сайт: послуги (розробка сайтів, дизайн, переклади UA/EN/RU), портфоліо, блог і адмінка.
Статичний, без сервера й бази даних — працює на GitHub Pages.

## Структура

```
index.html                 головна (блоки між <!--build:...--> заповнює генератор)
blog/index.html            список статей            ┐
blog/<slug>/index.html     окрема сторінка статті   │ генеруються
blog/feed.xml              RSS-стрічка блогу        │ автоматично,
portfolio/index.html       список проєктів          │ вручну не редагувати
portfolio/<slug>/index.html сторінка проєкту        │
sitemap.xml                карта сайту для Google   ┘
robots.txt                 правила для пошукових роботів
data/posts.json            статті блогу (джерело)
data/projects.json         проєкти портфоліо (джерело)
assets/js/build.js         генератор сторінок (спільний для адмінки й Node)
assets/js/main.js          анімації, меню, фільтри + налаштування (пошта, Telegram, Instagram)
admin/                     адмінка
blog.html, portfolio.html, post.html, project.html   переадресації зі старих адрес
```

## SEO

- Кожна стаття й проєкт мають власну адресу (`/blog/<slug>/`) з повним текстом прямо в HTML.
- На кожній сторінці: title, description, canonical, Open Graph, Twitter Card, schema.org (BlogPosting, BreadcrumbList, Organization).
- `sitemap.xml` і `blog/feed.xml` оновлюються при кожному збереженні в адмінці.
- Після змін у шаблонах або стилях: змініть `ASSET_V` у `assets/js/build.js` і виконайте `npm install && npm run build`.

## Публікація на GitHub Pages

1. Створіть репозиторій, наприклад `rodionactive`, і завантажте в нього всі файли.
2. Settings → Pages → Source: **Deploy from a branch**, гілка `main`, папка `/ (root)`.
3. Сайт працює на домені **https://rodionactive.com** (файл `CNAME` у корені репозиторію).
4. DNS у реєстратора: чотири записи A для `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; CNAME `www` → `rodionshkurko1994-dev.github.io`.

> Сторінка 404 використовує шляхи від кореня (`/assets/...`), тож повністю коректно працює на власному домені або в репозиторії `<логін>.github.io`.

## Адмінка

Відкрийте `/admin/` на сайті.

1. Створіть **Fine-grained token**: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
   - Repository access: тільки репозиторій сайту
   - Permissions → Contents: **Read and write**
2. В адмінці → Налаштування: власник, репозиторій, гілка, токен → «Підключити».
3. Пишіть пости в Markdown, завантажуйте фото, додавайте проєкти. Кожне збереження — це коміт у репозиторій; сайт оновлюється за 1–2 хвилини.

Токен зберігається лише в браузері, де ви його ввели. Сторінка адмінки публічна, але без токена нічого змінити не можна.

## Що замінити

Контакти (Telegram, Instagram, Freelancehunt) задаються в блоці `SITE` у двох файлах: `assets/js/build.js` і `assets/js/main.js`, а також у блоці контактів в `index.html`.

## Статистика і заявки

- **Google Analytics 4** (`G-BGX5T51JQR`, ресурс 565923699) і **Microsoft Clarity** (`zjqatulujh`) підключені на всіх сторінках через `assets/js/analytics.js`. Там же ключові події: `generate_lead` (кнопки Telegram / пошта / телефон), `click_channel`, `click_social`, `form_submit`, `calc_complete`.
- **Заявки калькулятора вартості сайту** записуються в Google Таблицю «Rodionactive — заявки калькулятора» через Google Apps Script (код — `workers/leads/Code.gs`, адреса веб-застосунку — `LEADS_URL` у `assets/js/tools-app.js`).
- **Адмінка → «Статистика» / «Заявки»** читає GA4, Search Console і таблицю напряму з браузера після входу через Google (OAuth-клієнт «Rodionactive admin» у Google Cloud, проєкт `golden-medium-515811-p9`; доступ лише на читання). Налаштування — блок `CFG` на початку `admin/stats.js`.
- Браузер, у якому відкривали адмінку, у статистиці не враховується (прапорець `skipgc` у localStorage).

## Автопублікація статей

`node tools/publish-article.mjs article.json` додає статтю в блог: генерує фірмову обкладинку (`tools/cover.mjs`, шрифти в `tools/fonts`), записує її в `data/posts.json` (поле `sourceId` захищає від дублів, `description` іде в meta description) і перебудовує сайт. Далі лишається закомітити й запушити.
Цим користується запланована задача «Автопублікація статей на rodionactive.com» (3 статті на добу з дошки).

**Посилання між статтями.** Якщо нова стаття прямо повʼязана з уже опублікованою (продовження історії, та сама подія, детальний розбір згаданого), у `article.json` додається поле `links: [{"phrase": "слова з тексту", "slug": "slug-статті"}]` — скрипт ставить посилання `/blog/<slug>/` на першу згадку цих слів у тексті (не в підзаголовках), до 5 посилань, одне на статтю. Список статей для підбору: `node tools/publish-article.mjs --list`. В адмінці посилання ставиться вручну: `[слова](/blog/<slug>/)`. Якщо статтю, на яку посилаються, видалити, генератор перетворює посилання на звичайний текст.

## Сторінки послуг

`/services/` і `/services/<slug>/` генеруються з `assets/js/services.js` (тексти, переваги, етапи, порівняння, FAQ, ілюстрації). Розмітка schema.org: Service, FAQPage, BreadcrumbList. Картинки для соцмереж: `node tools/og-services.mjs` → `assets/img/services/`.

## IndexNow

Ключ IndexNow — у `SITE.indexnow` (`assets/js/build.js`) і у файлі `/<ключ>.txt` у корені. Адмінка після публікації (через ~90 с) повідомляє Bing та інших про змінені сторінки; автопублікація статей робить те саме. Вручну: `https://api.indexnow.org/indexnow?url=<адреса>&key=<ключ>`.

## Автопостинг у Telegram

Після кожної зміни `data/posts.json` GitHub Actions (`.github/workflows/telegram.yml` → `tools/telegram-post.mjs`) публікує нові статті в канал @rodionactive_online: чекає, поки сторінка з'явиться на сайті, і надсилає прев'ю статті, короткий зміст і підпис Rodionactive. Токен бота — секрет репозиторію `TELEGRAM_BOT_TOKEN`. Ручний запуск для однієї статті: Actions → «Нові статті в Telegram» → Run workflow → slug.

## Інструменти

`/instrumenty/` — безкоштовні інструменти: аудит сайту, генератор QR-кодів, калькулятор вартості сайту, статус сервісів, індекс ринку фрілансу. Тексти й SEO — `assets/js/tools.js`, логіка — `assets/js/tools-app.js` (ціни: ринок фрілансу × 0,8, константа `DISCOUNT`), бібліотека QR — `assets/js/vendor/qr-code-styling.js` (MIT). Розрахунок відкривається в Telegram з уже заповненим повідомленням (`t.me/rodionactive?text=…`). Картинки для соцмереж: `node tools/og-tools.mjs`. Папка `tools/` — це скрипти, не сторінки сайту.

## Статус сервісів та індекс ринку фрілансу

Два інструменти з живими даними: `/instrumenty/status-servisiv/` і `/instrumenty/indeks-rynku-frilansu/`.
Дані збирає GitHub Actions (`.github/workflows/data.yml`) і кладе в окрему гілку `data` (один коміт, перезаписується щоразу), тож `main` не засмічується, а сайт не перебудовується. Сторінки читають файли з `https://raw.githubusercontent.com/rodionshkurko1994-dev/rodionactive/data/…`.

- **Статус сервісів** — `tools/fetch-status.mjs`, кожні 15 хвилин. Список сервісів — масив `SERVICES` у скрипті: для тих, що мають офіційну сторінку статусу (Statuspage, `/api/v2/summary.json`), читається вона; для решти перевіряється, чи відповідає сам сайт.
- **Індекс ринку фрілансу** — `tools/fetch-freelance.mjs`, раз на добу. Потрібен секрет репозиторію `FREELANCEHUNT_TOKEN` (ключ API з https://freelancehunt.com/my/api2). Зберігаються лише дата, навички, бюджет і кількість ставок проєктів за 120 днів, без описів і замовників.
- Ручний запуск: Actions → «Дані для інструментів» → Run workflow.

