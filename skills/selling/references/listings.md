# Selling — Marketplace Listings (Rozetka, Prom, Epicentr)

Platform rules with source links and update dates: `${CLAUDE_PLUGIN_ROOT}/skills/selling/references/listings/marketplace-rules.md`. Rules change: if the reference is older than 90 days, open the seller help page in the browser and re-check before writing.

## 1. Inputs
Product facts (brand, model, SKU/barcode, dimensions, weight, material, colour, set contents, warranty, country of origin), the chosen category on each marketplace, photos available, price and stock status, and the target search queries (from Prom/Rozetka search suggestions and competitor titles — collect them with the browser).

## 2. Title — by platform
| Platform | Formula | Limit | Never |
|---|---|---|---|
| Rozetka | Тип товару + Бренд + Модель + Колір + Характеристики (Артикул) | 255 chars, SEO-optimal ≤ 60 | promo words ("Акція", "Хіт", "Новинка", "Від виробника"), store name, URLs, CAPS-only, special symbols (★ ™ @), "Оригінал" (except listed categories), several product types in one title |
| Prom | key product noun + brand/model + 2–3 decisive characteristics, most important first (first ~70 chars visible) | 110 chars | SEO words ("купити", "оптом"), lists of keywords, regions, contacts, emoji, CAPS-only, variant characteristics when the item is a variant |
| Epicentr | follow the category's existing best listings; type + brand + model + key characteristic | `[Unverified]` — check the cabinet | same as Rozetka until verified |
Clothes and shoes on Rozetka: size in the title (children's: height). Brand in the title must equal the brand field.

Examples (Rozetka formula):
- `Масажер для шиї [Бренд] G20 сірий 4 режими ([артикул])`
- `Пилка для п'ят електрична [Бренд] CR2 USB-C 3 швидкості ([артикул])`
- Prom: `Електрична пилка для п'ят [Бренд] CR2 з USB-C, 3 швидкості, 2 ролики` (≤ 110)

## 3. Attributes before prose
Fill every category attribute the platform offers: filters are built from them and Prom reports ~3× higher conversion for items with filled characteristics (Prom seller help). Colour, size and set contents go into attributes and variants, not the description. One variant (size/colour) = one offer.

## 4. Description
Structure (Ukrainian; Russian copy separately in `name`/`description` vs `name_ua`/`description_ua` for Rozetka XML):
1. What it is and the main result in 1–2 sentences (first 160–500 characters carry the decision on Prom).
2. 4–6 bullets: feature → benefit, with numbers (battery mAh, minutes, cm).
3. Set contents ("Комплектація").
4. How to use / care (short).
5. Specifications table only if the category has no attribute for it.
Banned in descriptions (both platforms): links, contacts, messengers, prices, discounts and promo, delivery/payment info, emoji (Rozetka), keyword stuffing, text copied from other sites. Rozetka allows a limited HTML subset via CDATA in XML (`p, br, b, strong, ul, ol, li, h1–h6, table, tbody, tr, td, th, div, span`); max 50,000 chars on both.

## 5. Photo brief
| Rule | Rozetka | Prom |
|---|---|---|
| Count | 1–15 (3–6 recommended) | ≥ 1; 3+ for clothes and footwear |
| Size / format | 400×400 to 4000×4000 px, 1000×1000 optimal, ≥ 720×630 for zoom; JPG/PNG/WebP/GIF ≤ 10 MB; HTTPS URLs without Cyrillic or spaces | ≤ 10 MB, JPG/GIF/PNG; above 1280 px auto-compressed |
| Main photo | product out of the box, not cropped, white/light plain background, no text, badges or watermark (text kills Google Shopping eligibility) | no text, logos of others, contacts, QR codes, subjective claims |
| Extra photos | angles in rotation order, then lifestyle; infographics allowed (not as main) | real product only, no placeholders |
For Google Shopping via the marketplace, images must be ≥ 500×500 px from 31.01.2027.
Photo production brief → `perfect-hub:brand` (shot list, background, angles, infographic texts in Ukrainian).

## 6. Price, stock, delivery
- Prices in UAH, current; no 1 UAH "technical" prices; "В наявності" on Prom only if you ship within 3 days — otherwise "Під замовлення" with the real term.
- Marketplace economics differ from a landing page: commission by category (Epicentr 5–25% on completed orders; Rozetka and Prom by tariff/category — read the seller cabinet), platform payment options (Prom "Пром-оплата", Rozetka payment) shift the prepaid share. Run `references/unit-economics.md` with `marketplaceCommissionPct`, `prepaidShare` and `ads.cpa` for marketplace ads before listing at a price.
- Epicentr does not accept dropshipping; seller must be FOP group 2/3 or a legal entity.

## 7. Moderation self-check (run before submitting)
- [ ] Title matches the platform formula and limit; brand = brand field; no banned words.
- [ ] Category is the most specific one (Prom "…загальна" categories get less traffic and minimum-price checks).
- [ ] All required attributes filled; variants split.
- [ ] Description contains no contacts, links, prices, delivery terms or emoji.
- [ ] Main photo clean; sizes and formats valid; HTTPS image URLs.
- [ ] Price and stock status truthful.
- [ ] Product is allowed in the category (restricted goods lists on each platform) and you can show documents (invoice, certificate) if asked.

## 8. Output
Per platform: title (with character count), attribute table, description (UA, plus RU if requested), photo brief, XML/import field mapping (Rozetka `name`, `name_ua`, `description`, `description_ua`, `vendor`, `vendorCode`, `param`…; Prom import columns as in the user's template). Save to `deliverables/selling/<slug>/listings/<platform>.md`. A feed generator or bulk XML tool is code → core `/absolute`.
