# Merchant Center feed checklist (checked 2026-11-12)

Source: Product data specification, https://support.google.com/merchants/answer/7052112 ; country support: https://support.google.com/merchants/answer/160637 (Ukraine supported, UAH).

## Required / key attributes
| Attribute | Rule | Common Ukrainian-store mistake |
|---|---|---|
| `id` | unique per product, max 50 chars, never reused | changing IDs on CMS migration resets history |
| `title` | max 150 chars | promo words, CAPS; put type + brand + model + key spec first |
| `description` | max 5000 chars | copy-paste with delivery/contacts |
| `link` | starts with http/https; landing shows the same product and price | price differs from the page (disapproval) |
| `image_link` | ≥ 500×500 px for all products from 31.01.2027; JPEG/WebP/PNG/GIF (non-animated)/BMP/TIFF; no upscaled images or thumbnails | text or watermark on the main image |
| `availability` | `in_stock`, `out_of_stock`, `preorder`, `backorder` (`availability_date` required for preorder, ≤ 1 year ahead) | "in stock" for items shipped from China |
| `price` | numeric + ISO 4217, dot as decimal: `799.00 UAH` | price with VAT inconsistent with the page |
| `brand` | required for new products (max 70) | "No brand" vs actual brand |
| `gtin` | strongly recommended when it exists; max 14 digits per value, no dashes/spaces | inventing GTINs for white-label goods |
| `mpn` | required only without a manufacturer GTIN; max 70 | |
| `identifier_exists` | `no` only when no GTIN/MPN/brand exists (custom, handmade, white-label) | |
| `condition` | required for used/refurbished | |
| `shipping` | account or feed level; Nova Poshta cost if the buyer pays | missing shipping → disapprovals in some countries `[Unverified]` for UA |

## Feed hygiene routine
1. Diagnostics tab weekly: fix item-level errors before warnings.
2. Price and availability changes must reach the feed the same day (scheduled fetch or API) — mismatches lead to disapprovals and account warnings.
3. Use `custom_label_0..4` for margin tier, bestseller, seasonality — then split PMax/Shopping budgets by margin.
4. Marketplace sellers: Rozetka notes that text on the main photo excludes items from Google Shopping ads — keep main images clean everywhere.
Feed generation code (XML/CSV export, API sync) → core `/absolute`.
