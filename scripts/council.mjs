#!/usr/bin/env node
// council — files and arithmetic for /absolute-council (the orchestrator holds paths, seats return text, this script
// keeps the protocol honest): blind R1 proposals, anonymised R2 packets without the reader's own proposal, schema
// validation, R3 packets with only the critiques of one's own proposal, weighted scores without self-scores,
// reasoning-overlap check, and the DECISION.md skeleton. Zero dependencies, Node >= 18.
//
// node council.mjs new "<question>" --seats product,architect,backend[,…] [--tier quick|standard|critical]
//                      [--criteria "Correctness:3,Risk:3,Value:2,Simplicity:2,Reversibility:2,Evidence:2"]   → prints id
// node council.mjs save <id> <round r1|r2|r3|da|chair> <seat> <file>     store a seat's returned text (validates it)
// node council.mjs validate <id> <round> <seat>                           schema check (exit 1 + reasons)
// node council.mjs packet <id> r2|r3 <seat>                               writes and prints the packet path for that seat
// node council.mjs overlap <id>                                           R1 reasoning overlap (theatrical consensus check)
// node council.mjs tally <id>                                             weighted scores, mean rank, spread, leader, gap
// node council.mjs record <id>                                            DECISION.md skeleton for the chair (+ chair text if saved)
// node council.mjs status <id> · list
// State lives in .planning/council/<id>/ under the project root (cwd or COUNCIL_ROOT).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const DEFAULT_CRITERIA = { Correctness: 3, Risk: 3, Value: 2, Simplicity: 2, Reversibility: 2, Evidence: 2 };
const TIERS = { quick: 3, standard: 5, critical: 7 };
const root = () => resolve(process.env.COUNCIL_ROOT || process.cwd());
const base = (r) => join(r, '.planning', 'council');
const dir = (r, id) => join(base(r), id);
const read = (p) => readFileSync(p, 'utf8');
const loadState = (r, id) => { const p = join(dir(r, id), 'state.json'); if (!existsSync(p)) throw Object.assign(new Error(`no council ${id}`), { code: 2 }); return JSON.parse(read(p)); };
const saveState = (r, s) => writeFileSync(join(dir(r, s.id), 'state.json'), JSON.stringify(s, null, 2) + '\n');
const slug = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'decision';

// Deterministic shuffle (seeded) so packets are reproducible but labels carry no order bias.
export function shuffle(arr, seed) {
  const a = [...arr]; let h = createHash('sha256').update(seed).digest();
  for (let i = a.length - 1; i > 0; i--) { if (i % 30 === 0) h = createHash('sha256').update(h).digest(); const j = h[i % 32] % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function parseCriteria(s) {
  if (!s) return { ...DEFAULT_CRITERIA };
  const out = {};
  for (const part of s.split(',')) { const [k, w] = part.split(':').map((x) => x.trim()); if (k) out[k] = Number(w) || 1; }
  return out;
}

export function create(r, question, { seats, tier = 'standard', criteria } = {}) {
  if (!question) throw Object.assign(new Error('question required'), { code: 2 });
  if (!seats?.length) throw Object.assign(new Error('--seats required (e.g. product,architect,backend)'), { code: 2 });
  if (!TIERS[tier]) throw Object.assign(new Error(`tier must be quick|standard|critical`), { code: 2 });
  if (new Set(seats).size !== seats.length) throw Object.assign(new Error('duplicate seat'), { code: 2 });
  mkdirSync(base(r), { recursive: true });
  const n = readdirSync(base(r)).filter((d) => /^\d{3}-/.test(d)).length + 1;
  const id = `${String(n).padStart(3, '0')}-${slug(question)}`;
  mkdirSync(dir(r, id), { recursive: true });
  const s = { id, question, tier, seats, criteria: parseCriteria(criteria), created_at: new Date().toISOString(), rounds: {} };
  saveState(r, s);
  writeFileSync(join(dir(r, id), 'brief.md'), `# Council ${id}\n\n## Question\n${question}\n\n## Constraints and context\n<facts, files, links — neutral, no recommendation>\n\n## Success criteria (rubric, weight)\n${Object.entries(s.criteria).map(([k, w]) => `- ${k} ×${w}`).join('\n')}\n\n## Options known so far (random order, no favourite)\n<none — seats may propose their own>\n\n## Budget\nTier ${tier}: ${seats.length} seats · rounds ${tier === 'quick' ? 'R1 + chair' : tier === 'standard' ? 'R1-R5' : 'R1-R5 + one extra R2-R3 cycle if the leader changed'}\n`);
  writeFileSync(join(dir(r, id), 'seats.md'), `# Seats\n${seats.map((x) => `- ${x} — <why this seat>`).join('\n')}\n`);
  return s;
}

// ---------- schema checks ----------
const R1_SECTIONS = ['Position', 'Reasons', 'Assumptions', 'Top risk', 'Wrong if', 'Cost', 'Confidence', 'What others will miss'];
export function validate(round, text, ctx = {}) {
  const errs = [];
  const has = (h) => new RegExp(`^#{1,3}\\s*${h}`, 'im').test(text);
  if (round === 'r1') {
    for (const h of R1_SECTIONS) if (!has(h)) errs.push(`missing section "## ${h}"`);
    if (!/Confidence[^\n]*[1-5]\s*\/\s*5/i.test(text)) errs.push('confidence must be written as N/5');
    if (!/(evidence|source)\s*:/i.test(text) && !/https?:\/\/|\w+\.\w+:\d+/.test(text)) errs.push('reasons carry no evidence (file:line, URL or command)');
  }
  if (round === 'r2') {
    const labels = ctx.labels || [...new Set([...text.matchAll(/^###\s*(P-[A-Z])/gm)].map((m) => m[1]))];
    for (const L of labels) {
      const block = (text.split(new RegExp(`^###\\s*${L}\\b`, 'm'))[1] || '').split(/^###\s*P-[A-Z]|^FINAL RANKING/m)[0];
      if (!block) { errs.push(`no section for ${L}`); continue; }
      if (!/^\s*Flaws\s*:/im.test(block)) errs.push(`${L}: missing "Flaws:"`);
      const credit = block.match(/^\s*Credit\s*:\s*(.+)$/im);
      if (!credit) errs.push(`${L}: missing "Credit:" (a transferable element, or "nothing transferable because …")`);
      else if (/^(good|great|nice|solid|interesting|well[- ]?(thought|written|done)|strong)( (idea|proposal|work|point))?[.!]?$/i.test(credit[1].trim())) errs.push(`${L}: generic credit — name the element to steal and why`);
      if (!/^\s*Scores\s*:/im.test(block)) errs.push(`${L}: missing "Scores:"`);
      for (const k of Object.keys(ctx.criteria || {})) if (!new RegExp(`${k}\\s*=\\s*[1-5]`, 'i').test(block)) errs.push(`${L}: score for ${k} missing (1-5)`);
      if (/^\s*-\s*\[F\d+\]/m.test(block) === false && !/nothing (wrong|to fault)/i.test(block)) errs.push(`${L}: flaws must be listed as "- [F1] (BLOCK|MAJOR|MINOR) …" or state "nothing to fault because …"`);
    }
    if (!/^FINAL RANKING\s*:\s*P-[A-Z](\s*>\s*P-[A-Z])*/m.test(text)) errs.push('missing "FINAL RANKING: P-X > P-Y > …" footer');
  }
  if (round === 'r3') {
    if (!/^#{1,3}\s*Responses/im.test(text)) errs.push('missing "## Responses" (one line per critique ID: concede | rebut | absorb)');
    if (!/^#{1,3}\s*Revised position/im.test(text)) errs.push('missing "## Revised position" (or "unchanged")');
    if (/majority|everyone (agrees|else)|most seats/i.test(text) && !/\b[A-Z]\.[A-Z]\.F\d+|\bF\d+\b/.test(text)) errs.push('position change cites the majority instead of critique IDs');
  }
  return errs;
}

// ---------- packets ----------
export function anonMap(s) {
  if (s.anon) return s.anon;
  const labels = shuffle(s.seats, `${s.id}:anon`);
  s.anon = Object.fromEntries(labels.map((seat, i) => [seat, `P-${String.fromCharCode(65 + i)}`]));
  return s.anon;
}
const stripPersona = (text, seats) => seats.reduce((t, seat) => t.replace(new RegExp(`\\b(as (the )?)?${seat.replace(/^absolute-/, '')}( seat)?\\b`, 'gi'), '[seat]'), text);

export function packetR2(r, s, reader) {
  const anon = anonMap(s);
  const others = shuffle(s.seats.filter((x) => x !== reader), `${s.id}:${reader}`);
  const parts = others.map((seat) => {
    const p = join(dir(r, s.id), 'r1', `${seat}.md`);
    if (!existsSync(p)) throw Object.assign(new Error(`R1 proposal of ${seat} not saved yet`), { code: 2 });
    return `### ${anon[seat]}\n${stripPersona(read(p), s.seats)}`;
  });
  const crit = Object.entries(s.criteria).map(([k, w]) => `${k} (×${w})`).join(', ');
  const text = `# COUNCIL ${s.id} — ROUND 2 (cross-critique) for your seat\n\nQuestion: ${s.question}\nRubric (score 1-5 each): ${crit}\n\nProposals are anonymised and shuffled; yours is not here. For EACH proposal write:\n### P-X\nFlaws:\n- [F1] (BLOCK|MAJOR|MINOR) <requirement broken> — <concrete scenario> — <evidence: file:line, URL, command or test>\nCredit: <the transferable element worth stealing> — <why it is strong> (or "nothing transferable because …")\nScores: ${Object.keys(s.criteria).map((k) => `${k}=N`).join(' ')}\n\nEnd with: FINAL RANKING: P-? > P-? > …\nBe brutal and exact; never invent a flaw your lens cannot support — fake disagreement is as worthless as fake praise.\n\n${parts.join('\n\n')}\n`;
  const out = join(dir(r, s.id), `packet-r2-${reader}.md`);
  writeFileSync(out, text); saveState(r, s);
  return out;
}

// Extract one proposal's block from a critique file.
const blockFor = (text, label) => ((text.split(new RegExp(`^###\\s*${label}\\b`, 'm'))[1] || '').split(/^###\s*P-[A-Z]|^FINAL RANKING/m)[0] || '').trim();

export function packetR3(r, s, seat) {
  const anon = anonMap(s);
  const mine = anon[seat];
  const critics = shuffle(s.seats.filter((x) => x !== seat), `${s.id}:r3:${seat}`);
  const parts = [];
  critics.forEach((c, i) => {
    const p = join(dir(r, s.id), 'r2', `${c}.md`);
    if (!existsSync(p)) return;
    const b = blockFor(read(p), mine);
    if (b) parts.push(`### Critic ${String.fromCharCode(65 + i)} (IDs ${String.fromCharCode(65 + i)}.F1, ${String.fromCharCode(65 + i)}.F2, …)\n${b}`);
  });
  const t = tally(r, s, { silent: true });
  const text = `# COUNCIL ${s.id} — ROUND 3 (revise or hold) for your seat\n\nYour proposal is ${mine}. Below: only the critiques of your proposal (critics anonymised) and the aggregate scores.\nFor every critique ID answer exactly one: concede (name the change) · rebut (with NEW evidence or a test) · absorb (name the credited element and its label).\nA change of position that cites no critique ID, or rests on "the majority", is invalid.\n\n## Aggregate scores\n${t.table}\n\n${parts.join('\n\n')}\n\nReply with:\n## Responses\n- A.F1: concede | rebut | absorb — …\n## Revised position\n<new position or "unchanged">\n## Confidence: N/5\n`;
  const out = join(dir(r, s.id), `packet-r3-${seat}.md`);
  writeFileSync(out, text);
  return out;
}

// ---------- scores ----------
export function tally(r, s, { silent = false } = {}) {
  const anon = anonMap(s);
  const label2seat = Object.fromEntries(Object.entries(anon).map(([k, v]) => [v, k]));
  const W = s.criteria; const wsum = Object.values(W).reduce((a, b) => a + b, 0);
  const per = {}; const ranks = {}; const raw = {};
  for (const critic of s.seats) {
    const p = join(dir(r, s.id), 'r2', `${critic}.md`);
    if (!existsSync(p)) continue;
    const text = read(p);
    for (const label of Object.values(anon)) {
      if (label2seat[label] === critic) continue; // never count self-scores
      const b = blockFor(text, label); const line = (b.match(/^\s*Scores\s*:(.*)$/im) || [])[1];
      if (!line) continue;
      let total = 0;
      for (const [k, w] of Object.entries(W)) {
        const m = line.match(new RegExp(`${k}\\s*=\\s*([1-5])`, 'i'));
        const v = m ? Number(m[1]) : null;
        (raw[label] ??= {})[k] ??= []; if (v != null) raw[label][k].push(v);
        total += (v ?? 0) * w;
      }
      (per[label] ??= []).push(total / wsum);
    }
    const rk = text.match(/^FINAL RANKING\s*:\s*(.+)$/m);
    if (rk) rk[1].split('>').map((x) => x.trim()).filter((x) => /^P-[A-Z]$/.test(x) && label2seat[x] !== critic).forEach((x, i) => (ranks[x] ??= []).push(i + 1));
  }
  const mean = (a) => (a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const rows = Object.values(anon).map((label) => {
    const spread = Object.fromEntries(Object.entries(raw[label] || {}).map(([k, v]) => [k, v.length ? Math.max(...v) - Math.min(...v) : 0]));
    return { label, seat: label2seat[label], score: mean(per[label]), rank: mean(ranks[label]), n: (per[label] || []).length, spread };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || (a.rank ?? 99) - (b.rank ?? 99));
  const leader = rows[0]; const gap = rows[1] && leader.score != null && rows[1].score != null ? leader.score - rows[1].score : null;
  const highW = Math.max(...Object.values(W));
  const contested = rows.flatMap((x) => Object.entries(x.spread).filter(([k, v]) => W[k] === highW && v >= 2).map(([k]) => `${x.label}:${k}`));
  const table = ['| Proposal | Weighted score (1-5) | Mean rank | Critiques |', '|---|---:|---:|---:|', ...rows.map((x) => `| ${x.label} | ${x.score == null ? '—' : x.score.toFixed(2)} | ${x.rank == null ? '—' : x.rank.toFixed(2)} | ${x.n} |`)].join('\n');
  const result = { rows, leader: leader?.label, gap, close: gap != null && gap < 0.3, contested, table };
  if (!silent) { s.rounds.tally = { at: new Date().toISOString(), leader: result.leader, gap }; saveState(r, s); writeFileSync(join(dir(r, s.id), 'scores.json'), JSON.stringify(result, null, 2) + '\n'); }
  return result;
}

// Jaccard overlap of R1 "Reasons" vocabularies; > 0.6 average → theatrical consensus warning.
export function overlap(r, s) {
  const words = (t) => new Set((t.match(/\p{L}{4,}/gu) || []).map((w) => w.toLowerCase()));
  const sets = s.seats.map((seat) => { const p = join(dir(r, s.id), 'r1', `${seat}.md`); return existsSync(p) ? words(read(p)) : null; }).filter(Boolean);
  const pairs = [];
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) { const inter = [...sets[i]].filter((w) => sets[j].has(w)).length; pairs.push(inter / (sets[i].size + sets[j].size - inter || 1)); }
  const avg = pairs.length ? pairs.reduce((a, b) => a + b, 0) / pairs.length : 0;
  return { average: +avg.toFixed(2), theatrical: avg > 0.6 };
}

export function record(r, s) {
  const anon = anonMap(s); const t = tally(r, s, { silent: true });
  const credits = [];
  for (const critic of s.seats) {
    const p = join(dir(r, s.id), 'r2', `${critic}.md`); if (!existsSync(p)) continue;
    for (const [seat, label] of Object.entries(anon)) { const m = blockFor(read(p), label).match(/^\s*Credit\s*:\s*(.+)$/im); if (m && !/^nothing transferable/i.test(m[1].trim())) credits.push(`- ${label} (${seat}) ← credited by ${critic}: ${m[1].trim()}`); }
  }
  const chair = join(dir(r, s.id), 'chair', 'absolute-chair.md');
  const verdict = existsSync(chair) ? (read(chair).match(/Verdict:\s*(CONVERGED|ANOTHER ROUND|ESCALATE)/i) || [])[1]?.toUpperCase() : null;
  const status = verdict === 'CONVERGED' ? 'DECIDED' : verdict === 'ESCALATE' ? 'DECISION NEEDED' : 'OPEN';
  const text = `# DEC-${s.id}: ${s.question}\nStatus: ${status}\nDate: ${new Date().toISOString().slice(0, 10)} · Tier: ${s.tier} · Seats: ${s.seats.join(', ')}\n\n## Question and criteria\n${s.question}\n${Object.entries(s.criteria).map(([k, w]) => `- ${k} ×${w}`).join('\n')}\n\n## Options\n${Object.entries(anon).map(([seat, label]) => `- ${label} — ${seat} (r1/${seat}.md)`).join('\n')}\n\n## Scores (no self-scores)\n${t.table}\n${t.close ? '\nTop two within 0.3 — if the dispute is about values, this is DECISION NEEDED for the user.\n' : ''}${t.contested.length ? `\nContested high-weight criteria (spread ≥ 2): ${t.contested.join(', ')}\n` : ''}\n## Credit ledger\n${credits.join('\n') || '- none recorded'}\n\n## Chair\n${existsSync(chair) ? read(chair).trim() : '<absolute-chair output goes here: Verdict, Decision, Built from, Rejected, Dissent, Reopen if, Actions>'}\n`;
  writeFileSync(join(dir(r, s.id), 'DECISION.md'), text);
  return join(dir(r, s.id), 'DECISION.md');
}

function main() {
  const r = root();
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const [cmd, id, a2, a3, a4] = argv;
  const fail = (m, code = 2) => { console.error(`council: ${m}`); process.exit(code); };
  try {
    if (cmd === 'new') {
      const s = create(r, id, { seats: (opt('seats') || '').split(',').map((x) => x.trim()).filter(Boolean), tier: opt('tier') || 'standard', criteria: opt('criteria') });
      console.log(s.id); return;
    }
    if (cmd === 'list') { if (existsSync(base(r))) for (const d of readdirSync(base(r))) console.log(d); return; }
    const s = loadState(r, id);
    if (cmd === 'save') {
      const [round, seat, file] = [a2, a3, a4];
      if (!['r1', 'r2', 'r3', 'da', 'chair'].includes(round) || !seat || !file) fail('usage: save <id> <r1|r2|r3|da|chair> <seat> <file>');
      const text = read(file);
      const anon = anonMap(s);
      const errs = validate(round, text, { criteria: s.criteria, labels: round === 'r2' ? Object.entries(anon).filter(([k]) => k !== seat).map(([, v]) => v) : undefined });
      mkdirSync(join(dir(r, id), round), { recursive: true });
      writeFileSync(join(dir(r, id), round, `${seat}.md`), text);
      (s.rounds[round] ??= {})[seat] = { at: new Date().toISOString(), valid: !errs.length };
      saveState(r, s);
      if (errs.length) { console.log(`saved with ${errs.length} schema problem(s) — re-dispatch ${seat} once with these:\n${errs.map((e) => `- ${e}`).join('\n')}`); process.exit(1); }
      console.log(`saved ${round}/${seat}`); return;
    }
    if (cmd === 'validate') { const errs = validate(a2, read(join(dir(r, id), a2, `${a3}.md`)), { criteria: s.criteria }); console.log(errs.length ? errs.join('\n') : 'valid'); process.exit(errs.length ? 1 : 0); }
    if (cmd === 'packet') { if (!['r2', 'r3'].includes(a2) || !s.seats.includes(a3)) fail('usage: packet <id> r2|r3 <seat>'); console.log(a2 === 'r2' ? packetR2(r, s, a3) : packetR3(r, s, a3)); return; }
    if (cmd === 'overlap') { console.log(JSON.stringify(overlap(r, s))); return; }
    if (cmd === 'tally') { const t = tally(r, s); console.log(t.table); console.log(`leader ${t.leader} · gap ${t.gap == null ? '—' : t.gap.toFixed(2)}${t.close ? ' (close: within 0.3)' : ''}${t.contested.length ? ` · contested: ${t.contested.join(', ')}` : ''}`); return; }
    if (cmd === 'record') { console.log(record(r, s)); return; }
    if (cmd === 'status') { console.log(JSON.stringify({ id: s.id, tier: s.tier, seats: s.seats, anon: s.anon, rounds: s.rounds }, null, 2)); return; }
    fail('usage: new | save | validate | packet | overlap | tally | record | status | list');
  } catch (e) { fail(e.message, e.code || 2); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
