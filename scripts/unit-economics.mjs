#!/usr/bin/env node
// unit-economics — per-order contribution margin, break-even CPA/ROAS, landed cost and batch cash flow
// for cash-on-delivery e-commerce (Nova Poshta model). Zero dependencies, Node >= 18.
//
// Usage:
//   node scripts/unit-economics.mjs <input.json>          markdown table (one column per scenario)
//   node scripts/unit-economics.mjs <input.json> --json   full JSON result
//   cat input.json | node scripts/unit-economics.mjs -    read JSON from stdin
// Input schema and field meanings: skills/selling-unit-economics/SKILL.md (section "Calculator").
// Every figure is normalised to ONE SHIPPED ORDER (an order that left the warehouse), the unit COD sellers
// actually pay for: refused parcels still cost packaging, shipping, ads and call-centre time.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DEFAULT_THRESHOLDS = { minContribution: 150, minMarkup: 2.3, maxRefusal: 0.22 };

const r2 = (n) => (Number.isFinite(n) ? Math.round((n + Math.sign(n) * 1e-9) * 100) / 100 : n);
const ceil = (n) => Math.ceil(n - 1e-9);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function deepMerge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) out[k] = isObj(v) && isObj(base[k]) ? deepMerge(base[k], v) : v;
  return out;
}

function num(v, name, { min = 0, max = Infinity, def, required = false } = {}) {
  if (v === undefined || v === null) {
    if (required) throw new Error(`${name} is required`);
    return def;
  }
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a number`);
  if (v < min || v > max) throw new Error(`${name} must be between ${min} and ${max}`);
  return v;
}
const rate = (v, name, def = 0) => num(v, name, { min: 0, max: 1, def });

// Landed cost per unit in the selling currency.
// customsValue = (unitPrice + freightPerUnit) * fx; duty on customsValue; import VAT on (customsValue + duty).
export function landedCost(l) {
  const unitPrice = num(l.unitPrice, 'landed.unitPrice', { required: true });
  const fx = num(l.fx, 'landed.fx', { def: 1, min: 0 });
  const freight = num(l.freightPerUnit, 'landed.freightPerUnit', { def: 0 })
    + num(l.freightPerKg, 'landed.freightPerKg', { def: 0 }) * num(l.weightKg, 'landed.weightKg', { def: 0 });
  const customsValue = (unitPrice + freight) * fx;
  const duty = customsValue * rate(l.dutyPct, 'landed.dutyPct');
  const importVat = (customsValue + duty) * rate(l.importVatPct, 'landed.importVatPct');
  const vatCost = l.importVatReclaimable ? 0 : importVat;
  const fees = num(l.brokerPerUnit, 'landed.brokerPerUnit', { def: 0 }) + num(l.domesticPerUnit, 'landed.domesticPerUnit', { def: 0 });
  return { customsValue: r2(customsValue), duty: r2(duty), importVat: r2(importVat), importVatInCost: r2(vatCost), fees: r2(fees), perUnit: r2(customsValue + duty + vatCost + fees) };
}

export function compute(input) {
  if (!isObj(input)) throw new Error('input must be a JSON object');
  const price = num(input.price, 'price', { required: true, min: 0.01 });
  const unitsPerOrder = num(input.unitsPerOrder, 'unitsPerOrder', { def: 1, min: 1 });
  let landed = null;
  let cogsPerUnit;
  if (isObj(input.landed)) { landed = landedCost(input.landed); cogsPerUnit = landed.perUnit; }
  else cogsPerUnit = num(input.cogsPerUnit, 'cogsPerUnit (or landed)', { required: true });

  const packaging = num(input.packaging, 'packaging', { def: 0 });
  const ship = input.shipping || {};
  const forward = num(ship.forward, 'shipping.forward', { def: 0 });
  const ret = num(ship.return, 'shipping.return', { def: forward });
  const payer = ship.payer ?? 'buyer';
  if (!['buyer', 'seller'].includes(payer)) throw new Error('shipping.payer must be "buyer" or "seller"');

  const rc = rate(input.refusalRate, 'refusalRate');
  const p = rate(input.prepaidShare, 'prepaidShare');
  const rp = rate(input.prepaidRefusalRate, 'prepaidRefusalRate');
  const loss = rate(input.refusedGoodsLossPct, 'refusedGoodsLossPct');
  const cod = input.codFee || {};
  const codPct = rate(cod.pct, 'codFee.pct');
  const codFixed = num(cod.fixed, 'codFee.fixed', { def: 0 });
  const pay = input.paymentFee || {};
  const payPct = rate(pay.pct, 'paymentFee.pct');
  const payFixed = num(pay.fixed, 'paymentFee.fixed', { def: 0 });
  const commissionPct = rate(input.marketplaceCommissionPct, 'marketplaceCommissionPct');
  const ads = input.ads || {};
  const cpa = num(ads.cpa, 'ads.cpa', { def: 0 });
  const basis = ads.basis ?? 'shipped';
  if (!['shipped', 'lead'].includes(basis)) throw new Error('ads.basis must be "shipped" or "lead"');
  const approve = num(ads.approveRate, 'ads.approveRate', { def: 1, min: 0.01, max: 1 });
  const adsVat = rate(ads.vatPct, 'ads.vatPct');
  const callCenter = num(input.callCenterPerOrder, 'callCenterPerOrder', { def: 0 });
  const other = num(input.otherPerOrder, 'otherPerOrder', { def: 0 });
  const tax = input.tax || { mode: 'none' };
  const taxMode = tax.mode ?? 'none';
  if (!['none', 'revenue', 'vat'].includes(taxMode)) throw new Error('tax.mode must be "none", "revenue" or "vat"');
  const taxRate = rate(tax.rate, 'tax.rate');
  const th = { ...DEFAULT_THRESHOLDS, ...(input.thresholds || {}) };

  // Delivery outcome per shipped order.
  const dCod = (1 - p) * (1 - rc);
  const dPre = p * (1 - rp);
  const d = dCod + dPre;
  if (d <= 0) throw new Error('nothing is ever delivered (refusal 100%) — check refusalRate/prepaidShare');
  const refused = 1 - d;

  const grossCollected = price * d;
  const taxAmount = taxMode === 'revenue' ? grossCollected * taxRate : taxMode === 'vat' ? grossCollected * taxRate / (1 + taxRate) : 0;
  const netRevenue = grossCollected - taxAmount;
  const goodsPerOrder = cogsPerUnit * unitsPerOrder;
  const goods = goodsPerOrder * (d + refused * loss);
  const shipping = (payer === 'seller' ? forward : forward * refused) + ret * refused;
  const codFees = price * dCod * codPct + dCod * codFixed;
  const payFees = price * dPre * payPct + dPre * payFixed;
  const commission = price * d * commissionPct;
  const cpaShippedNet = basis === 'lead' ? cpa / approve : cpa;
  const adCost = cpaShippedNet * (1 + adsVat);

  const contributionBeforeAds = netRevenue - goods - packaging - shipping - codFees - payFees - commission - callCenter - other;
  const contribution = contributionBeforeAds - adCost;
  // Break-even CPA in the units the ad platform reports (per lead or per shipped order), excluding ad VAT.
  const beShippedNet = contributionBeforeAds / (1 + adsVat);
  const beCpaPlatform = basis === 'lead' ? beShippedNet * approve : beShippedNet;
  const cpaPlatform = cpa;

  const result = {
    name: input.name ?? null,
    perShippedOrder: {
      deliveredShare: r2(d), refusedShare: r2(refused),
      grossCollected: r2(grossCollected), tax: r2(taxAmount), netRevenue: r2(netRevenue),
      goods: r2(goods), packaging: r2(packaging), shipping: r2(shipping), codFees: r2(codFees), paymentFees: r2(payFees),
      marketplaceCommission: r2(commission), callCenter: r2(callCenter), other: r2(other), ads: r2(adCost),
      contributionBeforeAds: r2(contributionBeforeAds), contribution: r2(contribution),
    },
    perDeliveredOrder: { contribution: r2(contribution / d) },
    marginPct: r2((contribution / grossCollected) * 100),
    markup: r2(price / goodsPerOrder),
    cogsPerUnit: r2(cogsPerUnit),
    landed,
    breakEven: {
      cpaPlatform: r2(beCpaPlatform), cpaBasis: basis,
      roasPlatform: beCpaPlatform > 0 ? r2(price / beCpaPlatform) : null,
      roasCollected: contributionBeforeAds > 0 ? r2(grossCollected / contributionBeforeAds) : null,
    },
    actual: {
      cpaPlatform: r2(cpaPlatform),
      roasPlatform: cpaPlatform > 0 ? r2(price / cpaPlatform) : null,
      roasCollected: adCost > 0 ? r2(grossCollected / adCost) : null,
      cpaHeadroomPct: beCpaPlatform > 0 && cpaPlatform > 0 ? r2(((beCpaPlatform - cpaPlatform) / beCpaPlatform) * 100) : null,
    },
    flags: [],
  };

  const fixedMonthly = num(input.fixedMonthly, 'fixedMonthly', { def: 0 });
  if (fixedMonthly > 0) result.monthly = { fixed: r2(fixedMonthly), breakEvenShippedOrders: contribution > 0 ? ceil(fixedMonthly / contribution) : null };

  if (isObj(input.batch)) {
    const units = num(input.batch.units, 'batch.units', { required: true, min: 1 });
    const perDay = num(input.batch.ordersPerDay, 'batch.ordersPerDay', { def: 0 });
    const lag = num(input.batch.cashLagDays, 'batch.cashLagDays', { def: 0 });
    const consumption = unitsPerOrder * (d + refused * loss); // units leaving stock for good, per shipped order
    const shippedOrders = units / consumption;
    const batchCost = units * cogsPerUnit;
    const cashPerOrderExGoods = contribution + goods; // goods were paid up front
    const cashOutBeforeCollection = adCost + packaging + callCenter + other + (payer === 'seller' ? forward : 0);
    result.batch = {
      units, cost: r2(batchCost), shippedOrders: r2(shippedOrders), deliveredOrders: r2(shippedOrders * d),
      contribution: r2(shippedOrders * contribution), roiPct: r2((shippedOrders * contribution / batchCost) * 100),
      ordersToRecoverCost: cashPerOrderExGoods > 0 ? ceil(batchCost / cashPerOrderExGoods) : null,
      daysToSellOut: perDay > 0 ? r2(shippedOrders / perDay) : null,
      peakCashNeed: r2(batchCost + perDay * lag * cashOutBeforeCollection),
    };
  }

  if (contribution < th.minContribution) result.flags.push(`contribution ${r2(contribution)} per shipped order is below ${th.minContribution}`);
  if (result.markup < th.minMarkup) result.flags.push(`markup ${result.markup}x is below ${th.minMarkup}x`);
  if (rc > th.maxRefusal) result.flags.push(`COD refusal ${r2(rc * 100)}% is above ${r2(th.maxRefusal * 100)}%`);
  if (contribution < 0) result.flags.push('every shipped order loses money');
  return result;
}

export function run(input) {
  const base = { ...input };
  delete base.scenarios;
  const list = Array.isArray(input.scenarios) && input.scenarios.length
    ? input.scenarios.map((s) => { const { name, ...over } = s; return { name: name || 'scenario', data: deepMerge(base, over) }; })
    : [{ name: input.name || 'base', data: base }];
  return list.map(({ name, data }) => ({ scenario: name, ...compute(data) }));
}

const ROWS = [
  ['Delivered share', (x) => `${r2(x.perShippedOrder.deliveredShare * 100)}%`],
  ['Collected revenue', (x) => x.perShippedOrder.grossCollected],
  ['Tax', (x) => x.perShippedOrder.tax],
  ['Goods (incl. lost returns)', (x) => x.perShippedOrder.goods],
  ['Packaging', (x) => x.perShippedOrder.packaging],
  ['Shipping paid by seller', (x) => x.perShippedOrder.shipping],
  ['COD fees', (x) => x.perShippedOrder.codFees],
  ['Payment fees', (x) => x.perShippedOrder.paymentFees],
  ['Marketplace commission', (x) => x.perShippedOrder.marketplaceCommission],
  ['Call centre', (x) => x.perShippedOrder.callCenter],
  ['Other', (x) => x.perShippedOrder.other],
  ['Contribution before ads', (x) => x.perShippedOrder.contributionBeforeAds],
  ['Ads (incl. ad VAT)', (x) => x.perShippedOrder.ads],
  ['**Contribution / shipped order**', (x) => `**${x.perShippedOrder.contribution}**`],
  ['Contribution / delivered order', (x) => x.perDeliveredOrder.contribution],
  ['Margin on collected revenue', (x) => `${x.marginPct}%`],
  ['Markup (price / goods)', (x) => `${x.markup}x`],
  ['Break-even CPA (platform, ex-VAT)', (x) => `${x.breakEven.cpaPlatform} per ${x.breakEven.cpaBasis === 'lead' ? 'lead' : 'order'}`],
  ['Break-even ROAS (platform)', (x) => x.breakEven.roasPlatform ?? 'n/a'],
  ['Break-even ROAS (collected cash)', (x) => x.breakEven.roasCollected ?? 'n/a'],
  ['CPA headroom', (x) => (x.actual.cpaHeadroomPct === null ? 'n/a' : `${x.actual.cpaHeadroomPct}%`)],
];

export function toMarkdown(results) {
  const head = `| Metric | ${results.map((r) => r.scenario).join(' | ')} |\n|---|${results.map(() => '---:').join('|')}|`;
  const rows = ROWS.map(([label, f]) => `| ${label} | ${results.map(f).join(' | ')} |`);
  const out = [head, ...rows];
  const monthly = results.filter((r) => r.monthly);
  if (monthly.length) out.push('', ...monthly.map((r) => `- ${r.scenario}: break-even ${r.monthly.breakEvenShippedOrders ?? 'never'} shipped orders/month to cover fixed ${r.monthly.fixed}`));
  const batches = results.filter((r) => r.batch);
  if (batches.length) {
    out.push('', '| Batch | ' + batches.map((r) => r.scenario).join(' | ') + ' |', '|---|' + batches.map(() => '---:').join('|') + '|');
    for (const [label, k] of [['Units', 'units'], ['Cost', 'cost'], ['Shipped orders to sell out', 'shippedOrders'], ['Contribution', 'contribution'], ['ROI on stock', 'roiPct'], ['Orders to recover stock cost', 'ordersToRecoverCost'], ['Days to sell out', 'daysToSellOut'], ['Peak cash need', 'peakCashNeed']]) {
      out.push(`| ${label} | ${batches.map((r) => r.batch[k] ?? 'n/a').join(' | ')} |`);
    }
  }
  const flagged = results.filter((r) => r.flags.length);
  if (flagged.length) out.push('', 'Flags:', ...flagged.flatMap((r) => r.flags.map((f) => `- ${r.scenario}: ${f}`)));
  return out.join('\n');
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('usage: node unit-economics.mjs <input.json | -> [--json]');
    process.exit(2);
  }
  try {
    const text = file === '-' ? readFileSync(0, 'utf8') : readFileSync(file, 'utf8');
    const results = run(JSON.parse(text));
    console.log(args.includes('--json') ? JSON.stringify(results, null, 2) : toMarkdown(results));
  } catch (e) {
    console.error(`unit-economics: ${e.message}`);
    process.exit(2);
  }
}
