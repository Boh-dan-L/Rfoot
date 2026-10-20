# FOOT V2 — зміни та налаштування

## Що змінено

- GTM замінено на `NEW_GTM_CONTAINER_ID` на лендингу та thank-you сторінці.
- `APP_CONFIG`/`dataLayer` тепер доступні GTM до завантаження контейнера.
- Перенесено актуальнішу логіку атрибуції з knee-лендингу:
  - справжній `_fbp` і `_fbc`;
  - `fbclid` first/last touch;
  - timestamp у **мілісекундах** (`Date.now()`);
  - UTM first/last touch.
- Перенесено актуальнішу оплату/tracking:
  - окремий `checkout_event_id` для InitiateCheckout;
  - окремий `purchase_event_id` для Purchase;
  - `meta_initiate_checkout` у `dataLayer`;
  - server-side `/checkout` для CAPI;
  - однаковий checkout event ID для browser/CAPI дедуплікації;
  - `/health` warm-up та діагностичні події.
- Thank-you продовжує пушити `meta_purchase` з `event_id`, `order_ref`, `value`, `currency` і захистом від повторного fire при F5.
- Таймер/ціна/акційний офер збережені. Таймер технічно переписаний на явні timestamp у мілісекундах, але його видима тривалість залишилась тією ж — `900000 ms = 15 хв`.
- Додано 2 продаючі блоки та пом'якшено надто категоричні медичні формулювання.

## GTM: події, які має слухати контейнер

### InitiateCheckout
Custom Event trigger:

`meta_initiate_checkout`

Data Layer Variables:

- `checkout.event_id`
- `checkout.order_ref`
- `checkout.value`
- `checkout.currency`

У browser Meta Pixel event `InitiateCheckout` Event ID має дорівнювати `checkout.event_id`.

### Purchase
Custom Event trigger на thank-you:

`meta_purchase`

Data Layer Variables:

- `purchase.event_id`
- `purchase.order_ref`
- `purchase.value`
- `purchase.currency`

У browser Meta Pixel event `Purchase` Event ID має дорівнювати `purchase.event_id`.

## КРИТИЧНО для нового Meta Pixel + CAPI

GTM керує **browser Pixel**, але server-side CAPI йде через Cloud Run і route `pixel_rfoot`.
У фронтенді навмисно залишено `pixel_key: "pixel_rfoot"`, бо це поточний відомий server route платіжного API.

Щоб CAPI також ішов у **новий Meta Pixel**, на backend потрібно перемапити `pixel_rfoot` на новий Pixel/Dataset ID + access token (або створити новий route і тоді змінити `pixel_key` у `index.html` та `thank-you/index.html`).

Не запускайте фінальний тест дедуплікації, доки browser Pixel у GTM і server route CAPI не вказують на один і той самий Meta Dataset.

## Швидка перевірка перед рекламою

1. GTM Preview: PageView завантажується з нового контейнера.
2. Клік на кнопку оплати: у dataLayer з'являється `meta_initiate_checkout`.
3. Meta Test Events: browser InitiateCheckout і server InitiateCheckout приходять з однаковим Event ID та дедуплікуються.
4. Тестова оплата: thank-you URL містить `event_id`, `order_ref`, `value`, `currency`.
5. На thank-you з'являється `meta_purchase`; browser Purchase і server Purchase мають один Event ID.
6. Повторне F5 thank-you не повинно повторно пушити Purchase у межах сесії.
