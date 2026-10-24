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

## Статистика

Відвідування рахує [GoatCounter](https://www.goatcounter.com) (лічильник підключений у `<head>` усіх сторінок через `assets/js/build.js`, код сайту `rodionactive`).
Адмінка → вкладка «Статистика» читає дані через API GoatCounter: потрібен ключ із дозволом **Read statistics** (User → API у кабінеті GoatCounter).
Браузер, у якому відкривали адмінку, у статистиці не враховується.
