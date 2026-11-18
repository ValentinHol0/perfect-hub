# Plural rules for translators (CLDR + gettext)

Primary source: Unicode CLDR "Language Plural Rules" — https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html (checked 2026-11-12). The same data ships in every modern runtime: `new Intl.PluralRules('uk').resolvedOptions().pluralCategories` (Node 22.20 / ICU 77.1 / CLDR 47 returned the categories below). Operands: `n` absolute value, `i` integer digits, `v` number of visible fraction digits.

## Cardinal categories
| Locale | Category | CLDR rule | Integers (sample) | Example |
|---|---|---|---|---|
| **uk** | one | `v = 0 and i % 10 = 1 and i % 100 != 11` | 1, 21, 31, 101 | 1 день, 21 день |
| | few | `v = 0 and i % 10 = 2..4 and i % 100 != 12..14` | 2–4, 22–24, 102 | 2 дні |
| | many | `v = 0 and i % 10 = 0 or v = 0 and i % 10 = 5..9 or v = 0 and i % 100 = 11..14` | 0, 5–20, 25, 100 | 5 днів, 11 днів |
| | other | (fractions) | — | 1,5 дня |
| **pl** | one | `i = 1 and v = 0` | 1 only | 1 miesiąc |
| | few | `v = 0 and i % 10 = 2..4 and i % 100 != 12..14` | 2–4, 22–24 | 2 miesiące |
| | many | `v = 0 and i != 1 and i % 10 = 0..1 or v = 0 and i % 10 = 5..9 or v = 0 and i % 100 = 12..14` | 0, 5–21, 25, 100 | 5 miesięcy |
| | other | (fractions) | — | 1,5 miesiąca |
| **cs** | one / few / many / other | `i = 1 and v = 0` / `i = 2..4 and v = 0` / `v != 0` / rest | 1 / 2–4 / fractions / 0, 5+ | 1 den / 2 dny / 1,5 dne / 5 dní |
| **de**, **en** | one / other | `i = 1 and v = 0` / rest | 1 / everything else | 1 Tag, 2 Tage · 1 day, 2 days |
| **fr** | one / many / other | `i = 0..1` / millions / rest | 0, 1 / 1 000 000 / 2+ | 0 jour, 1 jour / 1 000 000 de jours / 2 jours |

Consequences:
- Ukrainian `one` is **not** "exactly 1": it also covers 21, 31, 101 … — the form must contain the number.
- Polish `one` is exactly 1, so «Jeden plik» without a number is safe there; Ukrainian «Один файл» is not.
- Ukrainian and Polish `other` is selected only for fractions (1,5 дня). It is still mandatory in ICU and i18next (fallback branch) — write the genitive-singular form used with fractions.
- Number words inflect too: «1 гривня, 2 гривні, 5 гривень, 1,5 гривні».

## Ordinal categories
| Locale | Categories | Rule / example |
|---|---|---|
| uk | few, other | few: `n % 10 = 3 and n % 100 != 13` («3-я дивізія, 3-є коло»); other: everything else |
| en | one, two, few, other | 1st, 2nd, 3rd, 4th (one: `n % 10 = 1 and n % 100 != 11`, two: `n % 10 = 2 and n % 100 != 12`, few: `n % 10 = 3 and n % 100 != 13`) |
| pl, de, cs | other | «15.» |

## How each format names the categories
| Format | Names | Source (checked 2026-11-12) |
|---|---|---|
| i18next ≥ v21 (JSON v4) | `key_one`, `key_few`, `key_many`, `key_other`; ordinals `key_ordinal_few`; variable must be `count` | https://www.i18next.com/translation-function/plurals |
| ICU MessageFormat | `{count, plural, one {…} few {…} many {…} other {…}}`, explicit `=0`; `#` = the number | https://unicode-org.github.io/icu/userguide/format_parse/messages/ |
| Android | `<item quantity="zero|one|two|few|many|other">` | https://developer.android.com/guide/topics/resources/string-resource |
| iOS String Catalog | "Vary by Plural" adds the target language's variations automatically | https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog |
| gettext | `msgstr[0..n-1]`, count and formula from the `Plural-Forms` header | see below |

## gettext: Ukrainian uses 3 forms, not 4
The established Ukrainian header (gettext's own example catalogue, GTK, Poedit and others):
```
"Plural-Forms: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\n"
```
msgstr[0] = one (1, 21, 31…), msgstr[1] = few (2–4, 22–24…), msgstr[2] = many (0, 5–20…). Fractions are not representable — gettext passes an integer `n`.
Sources: https://sources.debian.org/src/gettext/0.23.2-2/gettext-tools/examples/hello-java/po/uk.po · discussion of a 4-form variant with a separate n==1 in some GNOME/KDE teams: https://lists.fedoraproject.org/archives/list/trans-uk@lists.fedoraproject.org/thread/366W3WTEIJRVUSDTLULDTB64YQXC6G45/ — **keep whatever header the project already uses**; never change `nplurals` in a translation-only task.
Polish (common header, `[Unverified — compare with the project's header]`): `nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);`. German/English: `nplurals=2; plural=(n != 1);`.
