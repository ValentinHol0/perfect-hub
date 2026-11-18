# Antislop catalogue

Severity: **P0** blocks shipping (residue, fake or broken) · **P1** strong visible tell · **P2** weak tell, counted mainly in clusters. Detection: **R** regex in `antislop.mjs` · **H** heuristic · **N** needs the critic or the user. Rule ids match the scanner output; `DL-*` ids come from design-lint.

## 1. UI and visual
| Id | What | Fix |
|---|---|---|
| UI-PLACEHOLDER-AVATAR (P0) | pravatar, ui-avatars, randomuser, hotlinked Unsplash photos | real assets, or deliberate illustration |
| UI-LILA-HEX (P1) | the default AI purples (#7c3aed, #8b5cf6, #a855f7, #6366f1, #667eea→#764ba2…) | the brand hue from DESIGN.md |
| UI-SIDE-TAB (P1) | thick left/right accent border on cards | tinted surface, or nothing |
| UI-BLOB (P1) / UI-GLOW (P2) / UI-GRID-BG (P2) / UI-GLASS (P2) | blurred blobs, coloured glow, graph-paper backgrounds, glass cards everywhere | remove; depth from layout and type, not effects |
| UI-GHOST-CARD (P2) / UI-BIG-RADIUS (P2) | thin border + big shadow; 24 px+ radii on everything | one elevation method; a radius scale |
| UI-EYEBROW (P2) / UI-NUMBERED-LABELS (P2) | tracked-caps labels above every heading; 01/02/03 with no real sequence | delete unless they carry information |
| UI-ICON-TILE (P1) | icon in a tinted rounded tile above every card | drop tiles; icons only where they speed recognition |
| UI-GRAY-ON-COLOR (P1) / UI-PURE-BW (P2) | grey text on coloured surfaces; #000 on #fff | darker shade of the same hue; off-black/off-white tokens |
| UI-DEFAULT-FONT (P2) | Inter, Geist, Space Grotesk, Plus Jakarta, Fraunces… as the unexamined default | a deliberate pair with Cyrillic support (waived when DESIGN.md names it) |
| UI-TYPE-EXTREME / UI-BOUNCE / UI-PING / UI-Z-MAGIC / UI-KIT-DEFAULT (P2) | justified text, extreme tracking, bouncy easing, pulsing dots, z-index 9999, untouched kit tokens | type and motion tokens; customise the kit |
| UI-NO-REDUCED-MOTION (P1) | animations without a reduced-motion path | `prefers-reduced-motion` / `motion-safe:` |
| UI-FAKE-BROWSER (P2) | red/yellow/green "browser" dots around a fake screenshot | a real screenshot |
| DL-* (design-lint) | emoji icons, gradient text, lilac gradients, middle-dot meta, arrow links, lorem, 100vh/100vw, accessibility defects | see `absolute-designer/references/anti-slop.md` |

## 2. Layout clichés
| Id | What | Fix |
|---|---|---|
| LAY-SAAS-SEQUENCE (P1, H) | hero → "trusted by" → three features → stats → testimonials → three-tier pricing → FAQ → gradient CTA | structure from the user's job and the product's real proof |
| LAY-3-EQUAL-CARDS (P2, H) | a row of three identical icon + heading + text cards | asymmetric layout, a list, or prose |
| LAY-HERO-METRIC (P2, H) | three or more big numbers with tiny labels | proof in context, sourced |
| LAY-FAKE-CONTACT (P0) | 555 numbers, "123 Main St", "вул. Хрещатик, 1" | real details from the user, or marked demo data |
| LAY-FOOTER-SIGNOFF / LAY-STALE-YEAR (P2) | "Made with ♥", an old © year | cut; current year |
| Testimonials, logo walls (N) | quotes with stock names, "CEO at X", logos of companies that are not customers | real quotes with consent, real customers — or none. Invented ones are P0. |

## 3. Copy — English
| Id | What | Fix |
|---|---|---|
| EN-RESIDUE (P0) | "Certainly!", "I hope this helps", "[insert …]", `INSERT_X_HERE`, `2025-XX-XX`, citation leftovers | delete or fill |
| EN-SLOP-WORD (P1) | delve, seamless, elevate, empower, unleash, robust, pivotal, world-class, game-changer, cutting-edge… (literal senses exempt) | the concrete verb or fact |
| EN-STOCK-PHRASE (P1) | "in today's fast-paced world", "unlock the power of", "look no further", "at your fingertips", "X made simple" | what the product does, for whom |
| EN-NEG-PARALLEL (P1, budget 2) | "not just X, but Y", "it's not X, it's Y", "rather than simply" | the positive claim alone |
| EN-STAGED (P1) | "Here's the thing", "The best part?", "Let's dive in" | cut |
| EN-VAGUE-AUTHORITY (P1) / EN-FAKE-PROOF (P1, N) | "studies show", "industry-leading", "10x faster", "99.9%", "4.9/5" without a source | cite, or remove |
| EN-CAST-NAMES (P1) | John Doe, Sarah Chen, Acme Corp, Nexus Labs… | real data, or clearly marked demo |
| EN-2026-TELLS (P2, budget 2) / EN-PUFFERY / EN-ING-RIDER / EN-EMDASH (P2) | "this matters", "why X matters", "serves as", "a testament to", ", ensuring…", em-dash runs | the reason itself; is/has + fact; split sentences |
Rewrite rule: one claim per sentence, the specific noun instead of the category, a number with its source, the user's words for the problem.

## 4. Copy — Ukrainian
| Id | What | Fix |
|---|---|---|
| UK-RESIDUE (P0) | «Звичайно!», «Чудове питання», «Сподіваюся, це допоможе», «[Назва компанії]» | видалити або заповнити |
| UK-HYPE (P1) | інноваційний, революційний, унікальний, найкращий, ідеальне рішення, широкий асортимент, високоякісний, індивідуальний підхід, команда професіоналів, надійний партнер, неймовірний | конкретний факт: що, скільки, для кого |
| UK-STOCK (P1) | «у сучасному світі», «відкрийте для себе», «поринь у світ», «розкрийте потенціал», «на новий рівень», «все в одному місці», «у серці міста» | що саме це робить |
| UK-NEG-PARALLEL (P1) | «не просто X, а Y», «це не про X, це про Y» | пряме твердження |
| UK-CALQUE-EN (P1) | має сенс → слушно / доречно; на щоденній основі → щодня; в кінці дня → зрештою; бути здатним → могти; адресувати проблему → розв'язати; імплементувати → впровадити | природна форма |
| UK-RUSSIANISM (P1) | являється → є; приймати участь → брати участь; на протязі → протягом; слідуючий → наступний; співпадати → збігатися; міроприємство → захід; оточуюче середовище → довкілля; у відповідності до → відповідно до; вибачаюсь → перепрошую; даний → цей | нормативна форма |
| UK-PARTICIPLE (P2) | вражаючий, працюючий, оточуючий | підрядне речення або прикметник (вражальний) |
| UK-KANTSELYARYT (P2) | з метою, у рамках, шляхом, на сьогоднішній день, являє собою; ланцюжки віддієслівних іменників | дієслово; «сьогодні» |
| UK-QUOTES (P1) / UK-NUMBERS (P2) | "лапки" замість «ялинок»; 1,000; $; UAH | «…» („…“ всередині); 1 000; 250 грн |
| Title Case (N) | «Наші Послуги» | «Наші послуги» |
The Ukrainian tells are built from Ukrainian style norms (Український правопис 2019, Антоненко-Давидович) and mapped from English AI tells; no published list of Ukrainian AI-text tells exists yet — treat P2 items as signals, not proof.

## 5. Code
| Id | What | Fix |
|---|---|---|
| CODE-EMPTY-CATCH (P0) / CODE-ERROR-OBSCURE (P1) | swallowed errors; "Something went wrong"; `.catch(() => [])` | handle, rethrow with `{ cause }`, or return a typed error |
| CODE-STUB (P0) | "TODO: implement", "your logic here", "for now", "in a real app", NotImplementedError | implement or remove |
| CODE-ANY (P1) | `as any`, `: any`, `as unknown as`, `@ts-ignore`, blanket `eslint-disable` | `unknown` + a type guard |
| CODE-NARRATOR / CODE-HEDGE / CODE-DIVIDER (P2) | "This function handles…", "Step 1", "should work", `// ======`, "Generated by AI" | keep only comments that say *why* |
| CODE-EMOJI-LOG / CODE-STALE-API (P2) | emoji in logs; `ReactDOM.render`, `new Buffer`, `url.parse` | plain log levels; current API |
| CODE-TEST-SLOP (P1) | `expect(true).toBe(true)`, `.only` | real assertions; no focused tests |
For risk-level code issues (secrets, injection, silent failures in depth) run `code-scan.mjs --risks`.

## 6. Score
Weight per rule and file = severity (P0 10 · P1 4 · P2 1) × confidence (R 1 · H 0.6) × visibility (heading/title 1.5) × (1 + log2 repeats, max 4). Normalised per page (UI, layout), per 1 000 words (copy, minimum 300) and per KLOC (code); `S = 100 × (1 − e^(−R/20))`; overall = 0.6 × worst surface + 0.4 × mean. Budgeted rules count only beyond their budget.

Sources of ideas (patterns written independently): impeccable by Paul Bakaus (Apache-2.0), taste-skill (MIT), humanizer (MIT), stop-slop (MIT), slop-scan (MIT), Anthropic frontend-design (Apache-2.0), Wikipedia "Signs of AI writing" (CC BY-SA — ideas only).
