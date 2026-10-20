# Rfoot

Незалежна копія сайту курсу «Стопа» для `https://rfoot.pro/foot/`.
Дизайн, ресурси, сторінки, ціна 370 UAH і Telegram-посилання збережені з резервної копії bohdan-foot від 2026-10-16.

## Конфігурація

| Параметр | Значення |
|---|---|
| GitHub | Boh-dan-L/Rfoot |
| GitHub Pages source | main /docs |
| Домен | rfoot.pro |
| GTM | GTM-WLRCGQ6M |
| Meta Pixel | 1467134061942781 |
| product_id | rfoot_370 |
| landing_id / site_id | rfoot |
| pixel_key | pixel_rfoot |
| orderReference | RFOOT- + random ID |
| Спільний Cloud Run | bayer, europe-west1, tracking-core-488421 |
| Telegram | https://telegram.me/FootRehabBot?start=26fot |

## Статус запуску

Оплата ввімкнена через `APP_CONFIG.payments_enabled: true` у `docs/foot/index.html` після явного погодження користувача 20.10.2026.
Спільний bayer оновлено до revision `bayer-00085-pig`; HTTPS активний, новий Secret Manager binding підключений. Контрольна неоплачена форма WayForPay на 370 UAH відкрилася успішно, після чого сесію скасовано. Успішна оплата, Approved webhook і Telegram access ще не перевірені реальним платежем.
Серверний код і секрети в цьому репозиторії відсутні.

## GitHub Pages і DNS

Settings → Pages → Deploy from a branch → main → /docs. Файл `docs/CNAME` містить `rfoot.pro`.
DNS та HTTPS перевірити перед запуском. `www` налаштовувати лише якщо він потрібен; GTM і сервер допускають обидві адреси.
Головна сторінка `/` веде на `/foot/`; внутрішні URL збережені.

## Аналітика

Новий GTM побудовано виключно з опублікованої версії 4 GTM-PFHVJTZL.
Meta PageView/Purchase/InitiateCheckout адресовані лише Pixel 1467134061942781 через `trackSingle`.
Теги мають перевірку hostname rfoot.pro/www.rfoot.pro. Старий TikTok прибрано.
Clarity-тег скопійовано призупиненим; потрібний окремий Clarity Project ID. GA4 у джерелі відсутній.
Purchase event_id зберігається в order та повертається сервером на thank-you для браузерної/CAPI дедуплікації.
Вихідна логіка thank-you довіряє query-параметрам; це не самостійне підтвердження оплати.

## Перевірка

`node tests/tracking.test.cjs` — offline-перевірка тегів і браузерних Purchase, без запитів до Meta чи WayForPay.
Локальний перегляд: `python3 -m http.server 8765 --bind 127.0.0.1 --directory docs`.
