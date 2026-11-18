#!/usr/bin/env node
// antislop-ignore-file  (the rule table below would match itself)
// antislop — finds the template traces of AI-generated work in sites and apps: UI (all design-lint rules + glow, blobs,
// glass, side tabs, default fonts, purple hexes, eyebrows, icon tiles, motion without reduced-motion…), layout
// clichés, copy in English and Ukrainian (residue, hype, stock phrases, negative parallelism, calques, Russianisms,
// bureaucratese, wrong quotes, Title Case), and code (empty catches, stubs, any, narrator comments, stale APIs…).
// Scores each surface 0-100 (higher = more slop) and gives an overall score with a ship gate (no P0 and S <= 25).
//
// Usage: node antislop.mjs <file|dir> [...] [--json] [--only ui,layout,en,uk,code] [--gate] [--baseline prev.json]
//   --gate      exit 1 unless 0 P0 and overall score <= 25 (default exit: 1 only when a P0 exists)
//   --baseline  compare with an earlier --json report: added / resolved findings by fingerprint
// Waivers: `antislop-disable-line [ID]`, `antislop-disable-next-line [ID]` in the line, or .antislop/waivers.json
// [{ "id": "UI-DEFAULT-FONT", "path": "src/", "reason": "brand font" }]. Waived findings are listed, not scored.
// Sources of ideas (paraphrased, own patterns): impeccable (Apache-2.0), taste-skill (MIT), humanizer (MIT),
// stop-slop (MIT), slop-scan (MIT), Wikipedia "Signs of AI writing" (CC BY-SA, ideas only).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, resolve, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { lintText } from './design-lint.mjs';

const MARKUP = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const STYLE = new Set(['.css', '.scss']);
const COPY = new Set(['.md', '.mdx', '.txt']);
const CODE = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.vue', '.svelte']);
const SKIP = new Set(['node_modules', 'dist', 'build', '.next', 'out', 'coverage', '.git', '.planning', '.visual-review', 'vendor']);
const SEV = { P0: 10, P1: 4, P2: 1 };
const CONF = { R: 1, H: 0.6 };
const YEAR = new Date().getFullYear();

// [id, category, severity, detection, regex | (line, ctx) => bool, message, opts]
const LINE_RULES = [
  // ---------- UI ----------
  ['UI-PLACEHOLDER-AVATAR', 'ui', 'P0', 'R', /i\.pravatar\.cc|ui-avatars\.com|randomuser\.me|images\.unsplash\.com\/photo/i, 'placeholder or hotlinked stock image — use real assets', { markupOrStyle: true }],
  ['UI-LILA-HEX', 'ui', 'P1', 'R', /#(7c3aed|8b5cf6|a855f7|9333ea|7e22ce|6d28d9|6366f1|764ba2|667eea)\b/i, 'the default AI purple — choose the brand hue', { markupOrStyle: true }],
  ['UI-SIDE-TAB', 'ui', 'P1', 'R', /\bborder-(?:l|r|s|e)-(?:[4-9]|\d{2})\b|border-(?:left|right|inline-start)(?:-width)?\s*:\s*[3-9]px/, 'thick side-accent border on a card — use a tinted surface or nothing', { markupOrStyle: true, unless: /<(blockquote|nav|pre|code)\b/i }],
  ['UI-DEFAULT-FONT', 'ui', 'P2', 'R', /font-family\s*:[^;]*\b(Inter|Roboto|Open Sans|Lato|Montserrat|Geist|Space Grotesk|Plus Jakarta Sans|Instrument Sans|Instrument Serif|Mona Sans|Fraunces|Recoleta)\b|family=(Inter|Roboto|Open\+Sans|Lato|Montserrat|Space\+Grotesk|Plus\+Jakarta\+Sans|Instrument\+S(ans|erif)|Fraunces)\b|next\/font\/google[^\n]*\b(Inter|Roboto|Geist|Space_Grotesk|Plus_Jakarta_Sans|Fraunces)\b/, 'default AI font — pick a deliberate pair (waived when DESIGN.md names it)', { markupOrStyle: true, code: true, designWaiver: true }],
  ['UI-GLOW', 'ui', 'P2', 'R', /\bshadow-(purple|violet|indigo|cyan|fuchsia|pink|blue|emerald|lime)-\d{3}(\/\d+)?\b|drop-shadow-\[0_0_|box-shadow\s*:[^;]*\b0\s+0\s+\d{2,}px\s+rgba?\(\s*(?!0\s*,\s*0\s*,\s*0\b)/, 'coloured glow — tinted shadow or none', { markupOrStyle: true }],
  ['UI-BLOB', 'ui', 'P1', 'R', /\bblur-(?:2xl|3xl)\b[^"'`]*\brounded-full\b|\brounded-full\b[^"'`]*\bblur-(?:2xl|3xl)\b/, 'blurred gradient blob behind the hero — remove', { markupOrStyle: true }],
  ['UI-GRID-BG', 'ui', 'P2', 'R', /linear-gradient\([^)]*1px,\s*transparent\s+1px|\bbg-grid\b/, 'graph-paper background — plain surface', { markupOrStyle: true }],
  ['UI-GLASS', 'ui', 'P2', 'R', /backdrop-blur[^"'`]*\bbg-white\/(?:5|10)\b|\bbg-white\/(?:5|10)\b[^"'`]*backdrop-blur/, 'glass card — only where layering needs it', { markupOrStyle: true }],
  ['UI-GHOST-CARD', 'ui', 'P2', 'R', /(?:^|["'`\s])border(?=["'`\s])[^"'`]*\bshadow-(?:lg|xl|2xl)\b/, 'thin border plus large shadow on one element — choose one', { markup: true }],
  ['UI-BIG-RADIUS', 'ui', 'P2', 'R', /\brounded-3xl\b|border-radius\s*:\s*(?:2[4-9]|[3-9]\d)px/, 'oversized card radius — use the radius scale', { markupOrStyle: true }],
  ['UI-EYEBROW', 'ui', 'P2', 'R', /\buppercase\b[^"'`]*\btracking-(?:widest|\[0\.\d+em\])\b|\btracking-(?:widest|\[0\.\d+em\])\b[^"'`]*\buppercase\b/, 'tracked-caps eyebrow label — delete unless it carries information', { markup: true }],
  ['UI-PURE-BW', 'ui', 'P2', 'R', /\bbg-black\b[^"'`]*\btext-white\b|background(?:-color)?\s*:\s*#000(?:000)?\b/, 'pure black/white — off-black/off-white tokens', { markupOrStyle: true }],
  ['UI-GRAY-ON-COLOR', 'ui', 'P1', 'R', /\btext-(?:gray|slate|zinc|neutral|stone)-\d00\b[^"'`]*\bbg-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[5-9]00\b|\bbg-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[5-9]00\b[^"'`]*\btext-(?:gray|slate|zinc|neutral|stone)-\d00\b/, 'grey text on a coloured surface — darker shade of the same hue', { markup: true }],
  ['UI-TYPE-EXTREME', 'ui', 'P2', 'R', /\btext-justify\b|text-align\s*:\s*justify|tracking-\[-0\.(?:0[5-9]|[1-9])/, 'justified text or extreme negative tracking', { markupOrStyle: true }],
  ['UI-BOUNCE', 'ui', 'P2', 'R', /\banimate-bounce\b|cubic-bezier\([^)]*,\s*(?:1\.[2-9]|-0\.[2-9])/, 'bouncy easing — ease-out, 150-250 ms', { markupOrStyle: true }],
  ['UI-PING', 'ui', 'P2', 'R', /\banimate-ping\b/, 'pulsing "live" dot — remove unless it signals real live state', { markup: true }],
  ['UI-Z-MAGIC', 'ui', 'P2', 'R', /\bz-\[\d{3,}\]|z-index\s*:\s*9{3,}/, 'magic z-index — use a z scale', { markupOrStyle: true }],
  ['UI-KIT-DEFAULT', 'ui', 'P2', 'R', /--radius\s*:\s*0\.625rem/, 'untouched UI-kit default tokens — customise', { markupOrStyle: true }],
  // ---------- layout ----------
  ['LAY-FOOTER-SIGNOFF', 'layout', 'P2', 'R', /made with (?:♥|❤|love)|crafted with (?:care|love)/i, 'template footer sign-off — cut', { markup: true }],
  ['LAY-STALE-YEAR', 'layout', 'P2', 'R', new RegExp(`©\\s*(?:20(?:0\\d|1\\d|2[0-${Math.max(0, (YEAR % 10) - 1)}]))\\b`), 'stale © year — current year or a range', { markup: true }],
  ['LAY-FAKE-CONTACT', 'layout', 'P0', 'R', /\(555\)\s?\d{3}-\d{4}|\b555-01\d\d\b|\b123 Main St(?:reet)?\b|(?<!\p{L})вул\.\s*Хрещатик,?\s*1(?!\d)/iu, 'invented contact details — ask the user or mark as demo data', { text: true }],
  // ---------- copy EN (visible text) ----------
  ['EN-RESIDUE', 'en', 'P0', 'R', /\b(?:certainly!|i hope this helps|as an ai\b|great question|would you like me to)|\[(?:insert|your|add) [^\]]{1,30}\]|INSERT_\w+_HERE|\b\d{4}-XX-XX\b|oaicite|utm_source=(?:chatgpt|openai|copilot)/i, 'chat residue or unfilled placeholder', { text: true, rawToo: true }],
  ['EN-SLOP-WORD', 'en', 'P1', 'R', /\b(?:delve|tapestry|testament|elevate|unleash|empower(?:s|ing)?|harness(?:es|ing)?|seamless(?:ly)?|effortless(?:ly)?|transformative|holistic|world-class|bespoke|synerg(?:y|ies)|leverage|robust|pivotal|crucial|vibrant|showcase|underscores?|game-?changer|cutting-edge|revolutioni[sz]e|supercharge|next-level|best-in-class|state-of-the-art)\b|\bunlock(?!s?\s+(?:the|your|a)\s+(?:door|car|phone|screen|bike))\b/i, 'AI vocabulary — say what it does, concretely', { text: true }],
  ['EN-STOCK-PHRASE', 'en', 'P1', 'R', /\bin today'?s (?:fast-paced|digital|modern)\b|\bunlock the (?:power|potential)\b|\blook no further\b|\bsay goodbye to\b|\bwhether you'?re an? \w+|\bjoin (?:thousands|millions) of\b|\bimagine a world\b|\btake [\w ]{1,20} to the next level\b|\bjust a few clicks\b|\bat your fingertips\b|\b\w+ made (?:simple|easy)\b/i, 'stock phrase — state the function', { text: true }],
  ['EN-NEG-PARALLEL', 'en', 'P1', 'R', /\bnot (?:just|only|merely)\b.{1,60}\bbut\b|\bit'?s not .{1,40}, it'?s\b|\brather than simply\b/i, '"not X but Y" staging — make the positive claim', { text: true, budget: 2 }],
  ['EN-STAGED', 'en', 'P1', 'R', /\b(?:the result\?|the best part\?|here'?s the thing|let that sink in|let'?s dive in|why does this matter\?)/i, 'staged rhetorical set-up — cut', { text: true }],
  ['EN-2026-TELLS', 'en', 'P2', 'R', /\b(?:this matters|why \w+ matters|is more than an? \w+|adds another layer|looking ahead|what comes next)\b/i, 'current AI cadence — give the concrete reason', { text: true, budget: 2 }],
  ['EN-PUFFERY', 'en', 'P2', 'R', /\b(?:serves as|stands as|plays an? (?:key|pivotal|crucial|vital) role|a testament to|in the heart of|evolving landscape)\b/i, 'puffery — is/has + a fact', { text: true }],
  ['EN-ING-RIDER', 'en', 'P2', 'R', /,\s(?:ensuring|enabling|fostering|highlighting|showcasing|empowering)\b/i, 'trailing -ing clause — split or cut', { text: true }],
  ['EN-VAGUE-AUTHORITY', 'en', 'P1', 'R', /\b(?:experts say|studies show|industry-leading|award-winning|trusted by (?:thousands|millions))\b/i, 'unsourced authority — cite or cut', { text: true }],
  ['EN-FAKE-PROOF', 'en', 'P1', 'R', /\b\d+x faster\b|\b\d{2,}[kK]?\+ (?:users|teams|customers|companies)\b|\b99\.9+%|\b4\.9\/5\b/, 'proof figure — real and sourced, or remove', { text: true }],
  ['EN-CAST-NAMES', 'en', 'P1', 'R', /\b(?:John|Jane) Doe\b|\bSarah Chen\b|\bAcme(?: Corp| Inc)?\b|\b(?:Nexus|Lumen|Nimbus|Zenith|Apex|Vertex|Northwind|Kestrel|Halcyon) (?:Labs|Inc|Corp|AI|Studio)\b/, 'stock fictional name or company — real data or clearly marked demo', { text: true }],
  ['EN-EMDASH', 'en', 'P2', 'R', (t) => (t.match(/—/g) || []).length > 2, 'em-dash run — commas, colons or full stops', { text: true }],
  // ---------- copy UK (visible text) ----------
  ['UK-RESIDUE', 'uk', 'P0', 'R', /Звичайно!|Чудове питання|Сподіваюся, це допоможе|Як мовна модель|\[(?:Назва|Ваше|Вставте)[^\]]*\]/, 'залишки чату або незаповнений плейсхолдер', { text: true, rawToo: true }],
  ['UK-HYPE', 'uk', 'P1', 'R', /інноваційн|революційн|унікальн|найкращ|ідеальне рішення|широкий (?:спектр|асортимент)|високоякісн|індивідуальний підхід|команда професіоналів|надійний партнер|безшовн|незабутні враження|неймовірн/i, 'рекламна вата — конкретний факт замість епітета', { text: true }],
  ['UK-STOCK', 'uk', 'P1', 'R', /у сучасному (?:швидкоплинному |цифровому )?світі|відкрийте для себе|поринь(?:те)? у світ|розкрий(?:те)? (?:свій )?потенціал|на новий рівень|незалежно від того, чи|приєднуйтес[ья] до тисяч|все в одному місці|кілька клік|у серці міста/iu, 'штампована фраза — скажіть, що саме це робить', { text: true }],
  ['UK-NEG-PARALLEL', 'uk', 'P1', 'R', /(?<!\p{L})не просто .{1,40}, а(?!\p{L})|(?<!\p{L})це не (?:про|лише) .{1,40}, це(?!\p{L})/iu, 'конструкція «не просто X, а Y» — пряме твердження', { text: true, budget: 1 }],
  ['UK-PUFFERY', 'uk', 'P2', 'R', /відіграє (?:ключову|важливу) роль|є свідченням|підкреслює важливість|варто (?:зазначити|відзначити)|важливо пам['ʼ’]ятати/i, 'пустий пафос — факт і просте дієслово', { text: true }],
  ['UK-CALQUE-EN', 'uk', 'P1', 'R', /(?:має|робить) сенс|на (?:щоденній|регулярній) основі|в кінці дня|бути здатн\p{L}*|давайте (?:зануримось|розберемося)|адресувати проблем|імплементува/iu, 'калька з англійської — природна українська форма', { text: true }],
  ['UK-RUSSIANISM', 'uk', 'P1', 'R', /(?<!\p{L})явля(?:ється|ються|є)(?!\p{L})(?! собою)|приймати участь|на протязі|слідуюч\p{L}*|співпада\p{L}*|міроприємств|оточуюч\p{L}*|у відповідності (?:до|з)|вибачаюсь|(?<!\p{L})дан(?:ий|ого|ому|им)(?!\p{L})|по питанню/iu, 'русизм — нормативна форма (є, брати участь, протягом, наступний, збігатися, захід, довкілля, відповідно до, перепрошую, цей, з питання)', { text: true }],
  ['UK-PARTICIPLE', 'uk', 'P2', 'R', (t) => [...t.matchAll(/(?<!\p{L})([\p{L}'ʼ’]+(?:ючий|учий|ячий|юча|уча|яча|юче|уче|яче|ючі|учі|ячі))(?!\p{L})/giu)].some((m) => !/^(?:блискуч|гаряч|колюч|живуч|сидяч|лежач|стояч|висяч|могуч|летюч|плавуч|балакуч|кипуч|пекуч|смердюч|ходяч|невсипущ|сяюч)/iu.test(m[1])), 'активний дієприкметник на -учий/-ючий — підрядне речення або прикметник (вражальний)', { text: true }],
  ['UK-KANTSELYARYT', 'uk', 'P2', 'R', /(?<!\p{L})(?:з метою|у рамках|шляхом|на сьогоднішній день|являє собою)(?!\p{L})/iu, 'канцелярит — дієслово і коротше', { text: true }],
  ['UK-QUOTES', 'uk', 'P1', 'R', /"[А-ЯІЇЄҐа-яіїєґ][^"]{0,80}"|“[^”]{1,80}”/, 'лапки в українському тексті — «ялинки» („лапки“ всередині)', { text: true }],
  ['UK-NUMBERS', 'uk', 'P2', 'R', /\b\d,\d{3}\b|\$\s?\d|\bUAH\b/, 'формат чисел — 1 000; 250 грн', { text: true }],
  // ---------- code ----------
  ['CODE-EMPTY-CATCH', 'code', 'P0', 'R', /catch\s*(?:\([^)]*\))?\s*\{\s*\}|\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*\{\s*\}\s*\)|except[^:\n]*:\s*pass\b/, 'error swallowed — handle it or let it surface', { code: true }],
  ['CODE-ERROR-OBSCURE', 'code', 'P1', 'R', /new Error\(\s*['"`](?:Something went wrong|An error occurred|Error|Oops)[.!]?['"`]\s*\)|\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*(?:\[\]|null|\{\})\s*\)/i, 'error obscured — keep the cause and say what failed', { code: true }],
  ['CODE-STUB', 'code', 'P0', 'R', /(?:\/\/|#|\/\*).*(?:TODO:?\s*implement|your (?:logic|code) here|not implemented|in a real (?:app|implementation)|\bfor now\b|temporary fix|simplified version)|NotImplementedError|todo!\(\)/i, 'stub or deferral shipped as done — implement or cut', { code: true }],
  ['CODE-ANY', 'code', 'P1', 'R', /\bas any\b|:\s*any\b(?![-\w])|\bas unknown as\b|@ts-(?:ignore|nocheck)\b|\/\*\s*eslint-disable\s*\*\//, 'type escape — unknown + a type guard', { code: true, exts: ['.ts', '.tsx', '.mts', '.cts', '.vue', '.svelte'] }],
  ['CODE-NARRATOR', 'code', 'P2', 'R', /\/\/\s*(?:This (?:function|component|hook|method|class) (?:handles|is responsible|will)|Step \d+\b|Initiali[sz]e (?:the )?\w+$|Import (?:the )?\w+$|Define (?:the )?\w+$)/i, 'narrator comment — keep only the "why"', { code: true }],
  ['CODE-HEDGE', 'code', 'P2', 'R', /(?:\/\/|#).*\b(?:should work|hopefully|might need|not sure if|I think)\b/i, 'hedging comment — verify, then state', { code: true }],
  ['CODE-DIVIDER', 'code', 'P2', 'R', /\/\/\s*[=\-*#]{8,}|Generated (?:by|with) (?:ChatGPT|Claude|Copilot|an? AI|AI)\b/i, 'divider or AI attribution comment — remove', { code: true }],
  ['CODE-EMOJI-LOG', 'code', 'P2', 'R', /console\.\w+\([^)]*[\u2705\u274C\u2728\u{1F300}-\u{1FAFF}]/u, 'emoji in logs — plain log levels', { code: true }],
  ['CODE-STALE-API', 'code', 'P2', 'R', /new Buffer\(|\burl\.parse\(|bodyParser\.json\(|\bcomponentWillMount\b|ReactDOM\.render\(/, 'outdated API — current equivalent', { code: true }],
  ['CODE-TEST-SLOP', 'code', 'P1', 'R', /expect\(\s*true\s*\)\.toBe\(\s*true\s*\)|\b(?:it|test|describe)\.only\(/, 'test that proves nothing or skips the suite', { code: true }],
];

// File-level heuristics: [id, category, severity, detection, (text, ctx) => line|null, message]
const FILE_RULES = [
  ['UI-NO-REDUCED-MOTION', 'ui', 'P1', 'R', (t) => /@keyframes|\banimate-(?!none)\w|whileInView|framer-motion|from ['"]motion/.test(t) && !/prefers-reduced-motion|motion-safe|motion-reduce|useReducedMotion/.test(t) ? 1 : null, 'animation without a reduced-motion path'],
  ['UI-ICON-TILE', 'ui', 'P1', 'H', (t) => (t.match(/\b(?:size|w|h)-(?:10|11|12|14)\b[^"'`]*\brounded-(?:lg|xl|2xl)\b[^"'`]*\bbg-\w+-(?:50|100)\b/g) || []).length >= 3 ? 1 : null, 'icon-in-a-tinted-tile above every card — drop the tiles'],
  ['UI-NUMBERED-LABELS', 'ui', 'P2', 'R', (t) => (t.match(/>\s*0[1-9]\s*</g) || []).length >= 3 ? 1 : null, '01/02/03 section labels without a real sequence'],
  ['UI-FAKE-BROWSER', 'ui', 'P2', 'H', (t) => /bg-red-[45]00[^"'`]*rounded-full|rounded-full[^"'`]*bg-red-[45]00/.test(t) && /bg-(?:yellow|amber)-[34]00/.test(t) && /bg-green-[45]00/.test(t) ? 1 : null, 'fake browser chrome dots — use a real screenshot'],
  ['LAY-3-EQUAL-CARDS', 'layout', 'P2', 'H', (t) => /\b(?:md:|lg:)?grid-cols-3\b/.test(t) && (t.match(/<h3\b/g) || []).length >= 3 ? 1 : null, 'row of three identical feature cards'],
  ['LAY-HERO-METRIC', 'layout', 'P2', 'H', (t) => (t.match(/>\s*\d+(?:[.,]\d+)?\s?(?:%|x|\+|K|M|k)\s*</g) || []).length >= 3 ? 1 : null, 'big-number stat strip — put proof in context'],
  ['LAY-SAAS-SEQUENCE', 'layout', 'P1', 'H', (t) => [/trusted by|нам довіряють/i, /features|можливості|переваги/i, /testimonial|відгуки/i, /pricing|most popular|тарифи|ціни/i, /\bFAQ\b|часті питання|питання та відповіді/i, /get started|почати|спробувати безкоштовно/i].filter((re) => re.test(t)).length >= 5 ? 1 : null, 'the default SaaS landing sequence — structure from the user\'s job'],
];

const isTest = (f) => /(^|[\\/])(tests?|__tests__|spec|e2e|fixtures?)[\\/]|\.(test|spec)\.[a-z]+$/i.test(f);
const fingerprint = (id, file, snippet) => createHash('sha1').update(`${id}|${file}|${snippet.replace(/\s+/g, ' ').trim().toLowerCase()}`).digest('hex').slice(0, 12);

// Visible text of a markup line: strip tags, attribute strings and JSX expressions.
export function visibleText(line) {
  return line.replace(/<!--.*?-->/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\{[^{}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
}
export const langOf = (t) => { const letters = t.match(/\p{L}/gu) || []; if (letters.length < 3) return null; const cyr = letters.filter((c) => /[\u0400-\u04FF]/.test(c)).length; return cyr / letters.length > 0.4 ? 'uk' : 'en'; };

function loadWaivers(rootDir) {
  const p = join(rootDir, '.antislop', 'waivers.json');
  try { return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : []; } catch { return []; }
}

export function scanText(text, file, { only, designText = '' } = {}) {
  const ext = extname(file).toLowerCase();
  const markup = MARKUP.has(ext); const style = STYLE.has(ext); const copy = COPY.has(ext); const codeFile = CODE.has(ext);
  const want = (cat) => !only || only.has(cat);
  const out = [];
  if (/antislop-ignore-file/.test(text.slice(0, 2000))) return out;
  const lines = text.split(/\r?\n/);
  let inFence = false; let inScriptOrStyle = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const prev = lines[i - 1] || '';
    if (copy && /^```/.test(raw)) { inFence = !inFence; continue; }
    if (markup) { if (/<(script|style)\b/i.test(raw) && !/<\/(script|style)>/i.test(raw)) inScriptOrStyle = true; if (/<\/(script|style)>/i.test(raw)) { inScriptOrStyle = false; } }
    const disabled = (id) => {
      const m = raw.match(/antislop-disable-line(?:\s+([A-Z][\w-]*))?/); const n = prev.match(/antislop-disable-next-line(?:\s+([A-Z][\w-]*))?/);
      return !!((m && (!m[1] || m[1] === id)) || (n && (!n[1] || n[1] === id)));
    };
    const vis = markup ? (inScriptOrStyle ? '' : visibleText(raw)) : copy ? (inFence ? '' : raw.replace(/`[^`]*`/g, ' ')) : '';
    const lang = vis ? langOf(vis) : null;
    const heading = /<h[1-3]\b|^#{1,3}\s|<title\b/i.test(raw);
    for (const [id, cat, sev, det, test, msg, o = {}] of LINE_RULES) {
      if (!want(cat)) continue;
      let subject = null;
      if (o.text) {                                   // visible copy in markup and text files
        if (!(markup || copy)) continue;
        if ((cat === 'en' || cat === 'uk') && !o.rawToo && lang !== cat) continue;
        subject = o.rawToo ? `${vis} ${raw}` : vis;
        if (!subject.trim()) continue;
      } else {                                        // source lines
        const applies = (o.markup && markup) || (o.markupOrStyle && (markup || style)) || (o.code && codeFile && (!o.exts || o.exts.includes(ext)));
        if (!applies) continue;
        if (cat === 'code' && isTest(file) && id !== 'CODE-TEST-SLOP') continue; // fixtures and test doubles are not shipped code
        subject = raw;
      }
      if (o.unless && o.unless.test(raw)) continue;
      const hit = typeof test === 'function' ? test(subject) : test.test(subject);
      if (!hit) continue;
      if (o.designWaiver && designText) { const m = raw.match(test); const fam = m && (m[1] || m[2] || m[3]); if (fam && designText.toLowerCase().includes(fam.replace(/[+_]/g, ' ').toLowerCase())) continue; }
      if (disabled(id)) continue;
      out.push({ id, category: cat, severity: sev, det, line: i + 1, message: msg, snippet: (subject || raw).trim().slice(0, 120), visible: heading ? 1.5 : 1, budget: o.budget || 0 });
    }
  }
  // design-lint (UI and accessibility rules) for markup and styles
  if ((markup || style) && want('ui')) for (const f of lintText(text, ext)) out.push({ id: f.id, category: 'ui', severity: f.severity, det: 'R', line: f.line, message: f.message, snippet: (lines[f.line - 1] || '').trim().slice(0, 120), visible: 1, budget: 0 });
  if (markup || style) for (const [id, cat, sev, det, test, msg] of FILE_RULES) {
    if (!want(cat)) continue;
    const line = test(text); if (line) out.push({ id, category: cat, severity: sev, det, line, message: msg, snippet: basename(file), visible: 1, budget: 0 });
  }
  // budgets: the first N hits of a budgeted rule are reported but not scored
  const seen = {};
  for (const f of out) { seen[f.id] = (seen[f.id] || 0) + 1; f.scored = !(f.budget && seen[f.id] <= f.budget); }
  return out.map((f) => ({ ...f, file, fingerprint: fingerprint(f.id, file, f.snippet) }));
}

export function score(findings, sizes) {
  const cats = ['ui', 'layout', 'en', 'uk', 'code'];
  const R = Object.fromEntries(cats.map((c) => [c, 0]));
  const groups = new Map();
  for (const f of findings) {
    if (f.waived || !f.scored) continue;
    const k = `${f.category}|${f.file}|${f.id}`;
    const g = groups.get(k) || { cat: f.category, w: 0, n: 0 };
    g.w = Math.max(g.w, SEV[f.severity] * (CONF[f.det] || 1) * (f.visible || 1)); g.n++; groups.set(k, g);
  }
  for (const g of groups.values()) R[g.cat] += g.w * Math.min(4, 1 + Math.log2(g.n));
  const norm = {
    ui: sizes.pages ? R.ui / sizes.pages : 0,
    layout: sizes.pages ? R.layout / sizes.pages : 0,
    en: sizes.enWords ? (R.en * 1000) / Math.max(sizes.enWords, 300) : 0,
    uk: sizes.ukWords ? (R.uk * 1000) / Math.max(sizes.ukWords, 300) : 0,
    code: sizes.codeLines ? R.code / Math.max(sizes.codeLines / 1000, 1) : 0,
  };
  const S = (r) => Math.round(100 * (1 - Math.exp(-r / 20)));
  const sub = Object.fromEntries(cats.filter((c) => (c === 'ui' || c === 'layout' ? sizes.pages : c === 'en' ? sizes.enWords : c === 'uk' ? sizes.ukWords : sizes.codeLines)).map((c) => [c, S(norm[c])]));
  const vals = Object.values(sub);
  const overall = vals.length ? Math.round(0.6 * Math.max(...vals) + 0.4 * (vals.reduce((a, b) => a + b, 0) / vals.length)) : 0;
  const band = overall <= 14 ? 'clean' : overall <= 34 ? 'minor' : overall <= 59 ? 'suspicious' : 'heavy';
  return { overall, band, sub };
}

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isFile()) { out.push(p); return out; }
  for (const n of readdirSync(p)) { if (SKIP.has(n)) continue; walk(join(p, n), out); }
  return out;
}

export function scanPaths(paths, { only, rootDir = process.cwd() } = {}) {
  const designPath = ['DESIGN.md', 'design.md'].map((n) => join(rootDir, n)).find(existsSync);
  const designText = designPath ? readFileSync(designPath, 'utf8') : '';
  const waivers = loadWaivers(rootDir);
  const files = paths.flatMap((p) => walk(resolve(p))).filter((f) => { const e = extname(f).toLowerCase(); return MARKUP.has(e) || STYLE.has(e) || COPY.has(e) || CODE.has(e); });
  const sizes = { pages: 0, enWords: 0, ukWords: 0, codeLines: 0 };
  const findings = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8'); const ext = extname(f).toLowerCase(); const rel = relative(rootDir, f).split('\\').join('/');
    if (/antislop-ignore-file/.test(text.slice(0, 2000))) continue;
    if (MARKUP.has(ext)) sizes.pages++;
    if (MARKUP.has(ext) || COPY.has(ext)) for (const line of text.split(/\r?\n/)) { const v = MARKUP.has(ext) ? visibleText(line) : line; const words = (v.match(/\p{L}+/gu) || []).length; const l = langOf(v); if (l === 'uk') sizes.ukWords += words; else if (l === 'en') sizes.enWords += words; }
    if (CODE.has(ext) && !MARKUP.has(ext)) sizes.codeLines += text.split('\n').filter((l) => l.trim()).length;
    for (const fd of scanText(text, rel, { only, designText })) {
      const w = waivers.find((x) => x.id === fd.id && (!x.path || rel.includes(x.path)));
      findings.push(w ? { ...fd, waived: w.reason || true } : fd);
    }
  }
  const order = { P0: 0, P1: 1, P2: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
  return { files: files.length, sizes, findings, ...score(findings, sizes) };
}

function main() {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  const valued = new Set(['--only', '--baseline']);
  const paths = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
  if (!paths.length) { console.error('Usage: node antislop.mjs <file|dir> [...] [--json] [--only ui,layout,en,uk,code] [--gate] [--baseline prev.json]'); process.exit(2); }
  for (const p of paths) if (!existsSync(p)) { console.error(`antislop: ${p} does not exist`); process.exit(2); }
  const only = opt('only') ? new Set(opt('only').split(',')) : null;
  const r = scanPaths(paths, { only });
  if (opt('baseline') && existsSync(opt('baseline'))) {
    const prev = new Set(JSON.parse(readFileSync(opt('baseline'), 'utf8')).findings.map((f) => f.fingerprint));
    const now = new Set(r.findings.map((f) => f.fingerprint));
    r.delta = { added: r.findings.filter((f) => !prev.has(f.fingerprint)).length, resolved: [...prev].filter((x) => !now.has(x)).length };
  }
  const p0 = r.findings.filter((f) => f.severity === 'P0' && !f.waived).length;
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    const L = [`antislop: ${r.overall}/100 (${r.band}) · ${r.files} files · ${r.findings.length} findings · P0 ${p0}`, `by surface: ${Object.entries(r.sub).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}${r.delta ? ` · since baseline: +${r.delta.added} / −${r.delta.resolved}` : ''}`, ''];
    for (const f of r.findings.slice(0, 60)) L.push(`${f.severity} ${f.id.padEnd(22)} ${f.file}:${f.line}  ${f.message}${f.waived ? ` [waived: ${f.waived}]` : ''}${f.scored ? '' : ' [within budget]'}`);
    if (r.findings.length > 60) L.push(`… ${r.findings.length - 60} more (--json)`);
    L.push('', r.overall <= 25 && !p0 ? 'gate: PASS (no P0, score ≤ 25)' : `gate: FAIL (${p0 ? `${p0} P0` : ''}${p0 && r.overall > 25 ? ', ' : ''}${r.overall > 25 ? `score ${r.overall} > 25` : ''})`);
    console.log(L.join('\n'));
  }
  process.exit(p0 || (args.includes('--gate') && r.overall > 25) ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
