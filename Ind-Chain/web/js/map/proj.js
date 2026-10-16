/**
 * FE-MAPPROJ — second-mapping projection ([C-MAP2], [C-PLOT]): element data -> PlotSpec.
 * Pure: no DOM, no fetch, no clock, no randomness; same input -> byte-identical spec.
 * Only mapping today: PM-LADDER-Q (quarterly debt service, stacked principal + coupon).
 * Must not import scene / ui / api / state.
 */

/** Descriptor (JSON round-trip safe). */
export const desc = {
  id: "PM-LADDER-Q",
  requires: ["debtLadder"],
  params: {
    peaks: { type: "int", min: 0, max: 12, default: 6 },
    cumTo: { type: "quarter", default: "2031Q4" },
  },
  disclosure: "aggregate",
  basis: "population",
  dataTier: "bundle+api",
};

const QRE = /^(\d{4})Q([1-4])$/;
const FOOT = "gross cash flow, before cash & refinancing";

const num = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const r3 = (x) => Number(x.toFixed(3)) + 0;
const f1 = (x) => x.toFixed(1);
const f2 = (x) => x.toFixed(2);

function fail(hint) {
  return { ok: false, reason: "requires debtLadder", hint };
}

function validate(input) {
  if (!input || typeof input !== "object" || input.v !== 1) return "need a v1 debt-ladder payload";
  const qs = input.quarters;
  if (!Array.isArray(qs) || qs.length < 2) return "need at least two quarters";
  const ok = qs.every((q) => q && QRE.test(q.q) && num(q.principalBn) && num(q.interestBn));
  if (!ok) return "quarters need q (YYYYQn), principalBn, interestBn";
  const b = input.basis;
  if (!b || !num(b.parBn) || b.parBn <= 0 || !Number.isInteger(b.n)) return "basis needs n and parBn";
  return "";
}

function tickStep(yMax) {
  return yMax <= 8 ? 1 : yMax <= 20 ? 2 : 5;
}

function yearGroups(qs) {
  const groups = [];
  qs.forEach((q, i) => {
    const y = q.q.slice(0, 4);
    const last = groups[groups.length - 1];
    if (last && last.label === y) last.to = i;
    else groups.push({ label: y, from: i, to: i });
  });
  return groups;
}

/** @returns {{ok:true, spec:object} | {ok:false, reason:string, hint:string}} */
export function project(input, params = {}) {
  const why = validate(input);
  if (why) return fail(why);
  const qs = input.quarters;
  const peaks = Number.isInteger(params.peaks) ? Math.max(0, Math.min(12, params.peaks)) : desc.params.peaks.default;
  const cumTo = QRE.test(params.cumTo) ? params.cumTo : desc.params.cumTo.default;

  const totals = qs.map((q) => q.principalBn + q.interestBn);
  const yMax = Math.max(1, Math.ceil(Math.max(...totals)));
  const step = tickStep(yMax);
  const ticks = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);

  const marks = ticks.map((v) => ({ type: "line", y: v, tone: v === 0 ? "axis" : "grid" }));
  qs.forEach((q, i) => {
    const p = r3(q.principalBn);
    const tip = `${q.q} · Principal ${f2(q.principalBn)} · Coupon ${f2(q.interestBn)} · USD bn-eq`;
    marks.push({ type: "rect", x: q.q, y0: 0, y: p, tone: "neutral", tip, nRef: q.n | 0 });
    marks.push({ type: "rect", x: q.q, y0: p, y: r3(totals[i]), tone: "muted", tip, nRef: q.n | 0 });
  });
  const top = totals
    .map((t, i) => i)
    .sort((a, b) => totals[b] - totals[a] || a - b)
    .slice(0, peaks)
    .sort((a, b) => a - b);
  top.forEach((i) => marks.push({ type: "text", x: qs[i].q, y: r3(totals[i]), text: f1(totals[i]), tone: "neutral", emph: true }));

  const cumIdx = qs.findIndex((q) => q.q === cumTo);
  const upto = cumIdx < 0 ? qs.length : cumIdx + 1;
  const cum = qs.slice(0, upto).reduce((s, q) => s + q.principalBn, 0);
  const peakVal = Math.max(...totals);
  const tied = qs.filter((q, i) => f1(totals[i]) === f1(peakVal)).map((q) => q.q);
  const peakUnit = tied.length > 1 ? `${tied[0]} (tie: ${tied.slice(1).join(", ")})` : tied[0];
  const int4 = qs.slice(0, 4).reduce((s, q) => s + q.interestBn, 0);
  const par = input.basis.parBn;
  const issuer = String(input.issuer || "");

  const kpis = [
    { id: "outstanding", value: r3(par), unit: `USD bn-eq · ${input.basis.n} notes outstanding`, text: "Total amount outstanding in scope" },
    { id: "cum-principal", value: r3(cum), unit: `USD bn-eq · ${Math.round((cum / par) * 100)}% of outstanding`, text: `Principal due ${qs[0].q}–${qs[upto - 1].q}` },
    { id: "peak", value: r3(peakVal), unit: `USD bn-eq · ${peakUnit}`, text: "Highest single-quarter total (principal + coupon)" },
    { id: "coupon-4q", value: r3(int4), unit: "USD bn-eq · next 4 quarters", text: "Coupon cash, next four quarters" },
  ];

  return {
    ok: true,
    spec: {
      v: 1,
      mappingId: desc.id,
      params: { peaks, cumTo },
      basis: { mode: "single-company", n: input.basis.n, excluded: (input.basis.excluded || []).map((e) => ({ reason: String(e.reason), count: e.count | 0 })) },
      title: `${issuer} · Quarterly debt service`,
      subtitle: "USD bn-eq / quarter",
      scales: [
        { id: "x", kind: "band", domain: qs.map((q) => q.q), tickLabels: qs.map((q) => `Q${q.q.slice(5)}`), groups: yearGroups(qs), label: "Calendar quarter", unit: "quarter" },
        { id: "y", kind: "linear", domain: [0, yMax], ticks, label: "USD bn-eq / quarter", unit: "USD bn-eq" },
      ],
      marks,
      legend: [{ tone: "neutral", text: "Principal due" }, { tone: "muted", text: "Coupon cash" }],
      kpis,
      notes: (input.notes || []).map(String),
      footnote: `${input.provenance && input.provenance.thirdParty ? "Bloomberg-derived · internal use · " : ""}${FOOT}`,
      provenance: { illustrative: Boolean(input.provenance && input.provenance.illustrative), thirdParty: Boolean(input.provenance && input.provenance.thirdParty) },
    },
  };
}

/** Temporary mapping: selected C-REV-LINK → pair relationship paper (GS-20261016-NVDA-SPHERE-LINK). */
export const revLinkDesc = {
  id: "PM-REV-LINK",
  requires: ["revLink"],
  params: {},
  disclosure: "aggregate",
  basis: "pair",
  dataTier: "bundle",
};

/** @returns {{ok:true, spec:object} | {ok:false, reason:string, hint:string}} */
export function projectRevLink(input) {
  if (!input || typeof input !== "object" || input.v !== 1) {
    return { ok: false, reason: "requires revLink", hint: "Select a supply-chain link" };
  }
  const side = input.side === "supplier" || input.side === "customer" ? input.side : "";
  if (!side) return { ok: false, reason: "requires revLink", hint: "link needs side" };
  const fromName = String(input.fromName || "").trim() || "—";
  const toName = String(input.toName || "").trim() || "—";
  const paths = Array.isArray(input.sourcePaths)
    ? input.sourcePaths.map(String).filter(Boolean)
    : input.sourcePath
      ? [String(input.sourcePath)]
      : [];
  const pct = typeof input.pct === "number" && Number.isFinite(input.pct) ? input.pct : null;
  const sideLabel = side === "supplier" ? "Supplier" : "Customer";
  const pctText = pct == null ? "—" : `${pct.toFixed(2)}%`;
  const pctUnit = side === "supplier" ? "of NVDA spend" : "of NVDA rev";
  return {
    ok: true,
    spec: {
      v: 1,
      mappingId: revLinkDesc.id,
      layout: "pair",
      params: {},
      basis: { mode: "pair", n: 1, excluded: [] },
      title: `${fromName} · ${toName}`,
      subtitle: `${sideLabel} link`,
      scales: [],
      marks: [
        { type: "pair-node", role: "from", text: fromName, tone: "neutral" },
        { type: "pair-edge", side, text: sideLabel, tone: side === "supplier" ? "muted" : "neutral" },
        { type: "pair-node", role: "to", text: toName, tone: "neutral" },
      ],
      legend: [
        { tone: "neutral", text: sideLabel },
        { tone: "muted", text: paths[0] ? paths[0].split("/").pop() : "source file" },
      ],
      kpis: [
        { id: "side", value: side === "supplier" ? 1 : 2, unit: sideLabel, text: "Relationship side" },
        { id: "pct", value: pct == null ? 0 : r3(pct), unit: pct == null ? "unknown" : pctUnit, text: pctText === "—" ? "Share unknown" : `Share ${pctText}` },
        { id: "from", value: 0, unit: fromName, text: "From (center)" },
        { id: "to", value: 0, unit: toName, text: "To (peer)" },
      ],
      notes: paths.length ? paths.map((p) => `Source: ${p}`) : ["Source path not recorded"],
      footnote: "Temporary relationship paper · not a standard figure",
      provenance: { illustrative: true, thirdParty: false },
      pair: { fromName, toName, side, pct, sourcePaths: paths },
    },
  };
}

/** Temporary: US HQ map + dual supplier/customer tables (GS-20261016-NVDA-SHAPE2-USMAP). */
export const usMapDesc = {
  id: "PM-US-MAP",
  requires: ["usMap"],
  params: {},
  disclosure: "aggregate",
  basis: "us-hq",
  dataTier: "bundle",
};

/** @returns {{ok:true, spec:object} | {ok:false, reason:string, hint:string}} */
export function projectUsMap(input) {
  if (!input || typeof input !== "object" || !input.center || !Array.isArray(input.points)) {
    return { ok: false, reason: "requires usMap", hint: "Open NVDA chain with US HQ bake" };
  }
  const bounds = input.bounds || { lonMin: -125, lonMax: -66, latMin: 24, latMax: 50 };
  const suppliers = input.points.filter((p) => p && p.side === "supplier");
  const customers = input.points.filter((p) => p && p.side === "customer");
  const row = (p) => ({
    name: String(p.name || p.ticker || ""),
    ticker: String(p.ticker || ""),
    city: String(p.city || ""),
    pct: typeof p.spendPct === "number" ? p.spendPct : typeof p.revPct === "number" ? p.revPct : null,
  });
  return {
    ok: true,
    spec: {
      v: 1,
      mappingId: usMapDesc.id,
      layout: "us-map",
      params: {},
      basis: { mode: "us-hq", n: 1 + input.points.length, excluded: [] },
      title: "NVIDIA · US headquarters map",
      subtitle: "Shape Two · CONUS",
      scales: [],
      marks: [],
      legend: [
        { tone: "neutral", text: "Customer link" },
        { tone: "muted", text: "Supplier link" },
      ],
      kpis: [
        { id: "us", value: input.points.length, unit: "US HQs", text: "Peers on map" },
        { id: "sup", value: suppliers.length, unit: "suppliers", text: "Left table" },
        { id: "cust", value: customers.length, unit: "customers", text: "Right table" },
        {
          id: "intl",
          value: Number.isFinite(input.intlOmitted) ? input.intlOmitted : 0,
          unit: "INTL omitted",
          text: "See footnote",
        },
      ],
      notes: [String(input.intlNote || "INTL peers not shown on US map")],
      footnote: "HQ cities approximate · listing country US only · temporary figure",
      provenance: { illustrative: true, thirdParty: false },
      usMap: {
        bounds,
        center: input.center,
        points: input.points,
        suppliers: suppliers.map(row),
        customers: customers.map(row),
      },
    },
  };
}
