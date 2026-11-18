// Tests for scripts/check-i18n.mjs — run: node --test scripts/tests/translate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  compare, parseIcu, icuInfo, extractPlaceholders, flattenJson, parsePo, pluralCategories,
  inferLocale, pluralFormsFunction, looksIcu,
} from '../check-i18n.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'check-i18n.mjs');
const json = (o) => ({ format: 'json', map: flattenJson(o) });
const codes = (list) => list.map((x) => x.code);
const run = (src, tgt, extra = {}) => compare(json(src), json(tgt), { sourceLocale: 'en', targetLocale: 'uk', ...extra });

function tmpFiles(files) {
  const dir = mkdtempSync(join(tmpdir(), 'check-i18n-'));
  for (const [name, content] of Object.entries(files)) {
    const p = join(dir, name);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }
  return dir;
}
const cli = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

test('CLDR plural categories come from Intl (uk = one/few/many/other, de = one/other)', () => {
  assert.deepEqual(pluralCategories('uk'), ['one', 'few', 'many', 'other']);
  assert.deepEqual(pluralCategories('pl'), ['one', 'few', 'many', 'other']);
  assert.deepEqual(pluralCategories('de'), ['one', 'other']);
  assert.deepEqual(pluralCategories('uk', 'ordinal'), ['few', 'other']);
});

test('nested and flat JSON: missing keys are errors, extra keys are warnings', () => {
  const r = run({ nav: { home: 'Home', cart: 'Cart' }, 'flat.key': 'Save' }, { nav: { home: 'Головна', blog: 'Блог' }, 'flat.key': 'Зберегти' });
  assert.deepEqual(r.errors.map((e) => [e.code, e.key]), [['missing', 'nav.cart']]);
  assert.ok(r.warnings.some((w) => w.code === 'extra' && w.key === 'nav.blog'));
});

test('placeholder mismatches: {name}, {{name}}, %s/%d order, %1$s, <tags>', () => {
  const r = run(
    { a: 'Hello, {name}!', b: 'Hi {{user}}', c: '%s has %d items', d: 'Click <b>here</b>', e: '%1$s of %2$s' },
    { a: 'Привіт, {імʼя}!', b: 'Привіт', c: '%d товарів у %s', d: 'Натисніть <b>тут', e: '%2$s з %1$s' },
  );
  const byKey = Object.fromEntries(r.errors.map((e) => [e.key, e.code]));
  assert.equal(byKey.a, 'placeholder');
  assert.equal(byKey.b, 'placeholder');
  assert.equal(byKey.c, 'placeholder-order');
  assert.equal(byKey.d, 'tags');
  assert.equal(byKey.e, undefined, 'positional printf may be reordered');
});

test('i18next plurals: uk needs _one/_few/_many/_other', () => {
  const src = { items_one: '{{count}} item', items_other: '{{count}} items' };
  const bad = run(src, { items_one: '{{count}} товар', items_other: '{{count}} товару' });
  assert.deepEqual(codes(bad.errors), ['plural-missing']);
  assert.match(bad.errors[0].message, /_few \(2, 3, 4, 22\).*_many \(0, 5, 6, 7\)/);
  const good = run(src, { items_one: '{{count}} товар', items_few: '{{count}} товари', items_many: '{{count}} товарів', items_other: '{{count}} товару' });
  assert.deepEqual(good.errors, []);
});

test('i18next plurals: uk "one" also covers 21, so it must keep {{count}}', () => {
  const r = run(
    { files_one: 'One file', files_other: '{{count}} files' },
    { files_one: 'Один файл', files_few: '{{count}} файли', files_many: '{{count}} файлів', files_other: '{{count}} файлу' },
  );
  assert.deepEqual(r.errors.map((e) => [e.code, e.key]), [['count-missing', 'files_one']]);
  const de = compare(json({ files_one: 'One file', files_other: '{{count}} files' }), json({ files_one: 'Eine Datei', files_other: '{{count}} Dateien' }), { sourceLocale: 'en', targetLocale: 'de' });
  assert.deepEqual(de.errors, [], 'German "one" is only 1 — dropping the count is fine');
});

test('ICU MessageFormat plural: missing uk branches and missing # are errors', () => {
  const src = { cart: 'You have {count, plural, one {# item} other {# items}} in {place}' };
  const bad = run(src, { cart: 'У вас {count, plural, one {один товар} other {# товару}} у {place}' });
  assert.deepEqual(codes(bad.errors).sort(), ['count-missing', 'plural-missing']);
  const good = run(src, { cart: 'У вас {count, plural, one {# товар} few {# товари} many {# товарів} other {# товару}} у {place}' });
  assert.deepEqual(good.errors, []);
  const syntax = run(src, { cart: 'У вас {count, plural, one {# товар} other {# товару} у {place}' });
  assert.deepEqual(codes(syntax.errors), ['icu-syntax']);
});

test('ICU parser: apostrophe quoting, select, selectordinal, offset', () => {
  const ast = parseIcu("It''s '{literal}' {g, select, female {вона} other {він}} {n, selectordinal, few {#-тя} other {#-ма}} {c, plural, offset:1 =0 {нікого} other {#}}");
  const info = icuInfo(ast);
  assert.deepEqual([...info.names].sort(), ['c', 'g', 'n']);
  assert.match(info.text, /It's \{literal\}/);
  assert.ok(looksIcu('{n, plural, other {#}}'));
  assert.throws(() => parseIcu('{n, plural, one {#}'), /unterminated/);
  const r = run({ place: '{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}' }, { place: '{n, selectordinal, few {#-тє} other {#-те}}' });
  assert.deepEqual(r.errors, []);
});

test('identical strings and length ratio are warnings; --allow-identical silences', () => {
  const src = { title: 'Delivery and payment', ok: 'OK', btn: 'Buy' };
  const r = run(src, { title: 'Delivery and payment', ok: 'OK', btn: 'Придбати зараз зі знижкою' });
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.code === 'identical' && w.key === 'title'));
  assert.ok(!r.warnings.some((w) => w.key === 'ok'), 'short acronyms are not flagged');
  assert.ok(r.warnings.some((w) => w.code === 'length' && w.key === 'btn'));
  const allowed = run(src, { title: 'Delivery and payment', ok: 'OK', btn: 'Купити' }, { allowIdentical: ['ti*'] });
  assert.deepEqual(allowed.warnings, []);
});

test('Ukrainian checks: Russian letters, mixed scripts, straight quotes, mixed apostrophes', () => {
  const r = run(
    { a: 'Save', b: 'Kyiv', c: 'Press "Save"', d: 'Five', e: 'Family' },
    { a: 'Сохранить ещё', b: 'Kиїв', c: 'Натисніть "Зберегти"', d: "п'ять", e: 'сім’я' },
  );
  const w = codes(r.warnings);
  assert.ok(w.includes('ru-letters'));
  assert.ok(w.includes('mixed-script'));
  assert.ok(w.includes('typography-quotes'));
  assert.ok(w.includes('apostrophe-mixed'));
});

test('extractPlaceholders ignores %% and percent signs in prose', () => {
  const p = extractPlaceholders('Save 50% now, 100%% sure, {{count}} left, %(name)s');
  assert.deepEqual(p.ordered, []);
  assert.deepEqual(p.named.sort(), ['%(name)s', '{{count}}']);
});

test('gettext .po: header, plurals vs nplurals, fuzzy, missing, placeholders', () => {
  const pot = `msgid ""\nmsgstr ""\n"Content-Type: text/plain; charset=UTF-8\\n"\n\n#: a.c:1\nmsgid "Hello, %s"\nmsgstr ""\n\nmsgctxt "menu"\nmsgid "Open"\nmsgstr ""\n\nmsgid "%d file"\nmsgid_plural "%d files"\nmsgstr[0] ""\nmsgstr[1] ""\n\nmsgid "Gone"\nmsgstr ""\n`;
  const po = `msgid ""\nmsgstr ""\n"Language: uk\\n"\n"Plural-Forms: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\\n"\n\nmsgid "Hello, %s"\nmsgstr "Привіт"\n\n#, fuzzy\nmsgctxt "menu"\nmsgid "Open"\nmsgstr "Відкрити"\n\nmsgid "%d file"\nmsgid_plural "%d files"\nmsgstr[0] "один файл"\nmsgstr[1] "%d файли"\n\n#~ msgid "Old"\n#~ msgstr "Старе"\n`;
  const s = parsePo(pot);
  const t = parsePo(po);
  assert.equal(t.header.Language, 'uk');
  assert.equal(s.entries.length, 4);
  assert.equal(t.entries.length, 3, 'obsolete #~ entries are skipped');
  const r = compare({ format: 'po', ...s }, { format: 'po', ...t }, { sourceLocale: 'en', targetLocale: 'uk' });
  const e = r.errors.map((x) => `${x.code}:${x.key}`);
  assert.ok(e.includes('placeholder-order:Hello, %s'));
  assert.ok(e.includes('plural-missing:%d file'));
  assert.ok(e.includes('count-missing:%d file[0]'));
  assert.ok(e.includes('missing:Gone'));
  assert.ok(r.warnings.some((w) => w.code === 'fuzzy' && w.key === 'menu|Open'));
});

test('pluralFormsFunction evaluates gettext expressions and rejects anything else', () => {
  const f = pluralFormsFunction('nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);');
  assert.deepEqual([1, 2, 5, 11, 21, 22, 25].map(f), [0, 1, 2, 2, 0, 1, 2]);
  assert.equal(pluralFormsFunction('nplurals=2; plural=process.exit(1);'), null);
});

test('locale inference from file names and folders', () => {
  assert.equal(inferLocale('locales/en.json'), 'en');
  assert.equal(inferLocale('i18n/uk/common.json'), 'uk');
  assert.equal(inferLocale('messages.pl-PL.json'), 'pl-PL');
  assert.equal(inferLocale('strings/common.json'), null);
  assert.equal(inferLocale('src/strings.json'), null, '"src" is not Sardinian');
});

test('CLI: exit 1 on errors, 0 when clean, 2 on usage; --json and --strict', () => {
  const dir = tmpFiles({
    'en.json': { greet: 'Hello, {{name}}', items_one: '{{count}} item', items_other: '{{count}} items', faq: 'Frequently asked questions' },
    'uk.json': { greet: 'Вітаємо, {{name}}', items_one: '{{count}} товар', items_few: '{{count}} товари', items_many: '{{count}} товарів', items_other: '{{count}} товару', faq: 'Frequently asked questions' },
    'bad/uk.json': { greet: 'Вітаємо', items_one: '{{count}} товар', items_other: '{{count}} товару' },
  });
  const ok = cli([join(dir, 'en.json'), join(dir, 'uk.json')]);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /one\/few\/many\/other/);
  const strict = cli([join(dir, 'en.json'), join(dir, 'uk.json'), '--strict']);
  assert.equal(strict.status, 1, 'identical "faq" becomes an error in strict mode');
  const bad = cli([join(dir, 'en.json'), join(dir, 'bad', 'uk.json'), '--json']);
  assert.equal(bad.status, 1);
  const report = JSON.parse(bad.stdout);
  assert.equal(report.targetLocale, 'uk');
  assert.deepEqual(report.errors.map((x) => x.code).sort(), ['missing', 'placeholder', 'plural-missing']);
  assert.equal(cli([join(dir, 'en.json')]).status, 2);
  assert.equal(cli([join(dir, 'en.json'), join(dir, 'nope.json')]).status, 2);
});
