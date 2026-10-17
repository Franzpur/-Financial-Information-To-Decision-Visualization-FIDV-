/**
 * FE-MAPREG — mapping catalog ([C-MAP2]): list (available / unavailable + reason), get, run.
 * Pure: no DOM, no fetch. `run` validates params against the descriptor, projects, and never throws.
 * Must not import scene / ui / api / state.
 */
import {
  desc as ladderDesc,
  project as ladderProject,
  revLinkDesc,
  projectRevLink,
  usMapDesc,
  projectUsMap,
} from "./proj.js?v=5";

const HINT = "Select a node with debt data, e.g. GOOGL";
const HINT_LINK = "Select a supply-chain link on the cube";
const HINT_USMAP = "Open NVDA chain (Shape 2 · US map)";
// `expose` = params the dock shows as controls; keep defaults (no param row).
const MAPPINGS = [
  { id: ladderDesc.id, name: "Quarterly debt ladder", family: "Time", desc: ladderDesc, project: ladderProject, expose: [], noun: "notes", hint: HINT },
  { id: revLinkDesc.id, name: "Supply-chain link", family: "Network", desc: revLinkDesc, project: projectRevLink, expose: [], noun: "links", hint: HINT_LINK },
  { id: usMapDesc.id, name: "US headquarters map", family: "Network", desc: usMapDesc, project: projectUsMap, expose: [], noun: "sites", hint: HINT_USMAP },
];

export const get = (id) => MAPPINGS.find((m) => m.id === id) || null;

/** @param {{selected?: object|null, avail?: Record<string, boolean|null>}} ctx avail[requirement]: true | false | null (probing) */
export function list(ctx = {}) {
  return MAPPINGS.map((m) => {
    const state = ctx.selected ? (ctx.avail || {})[m.desc.requires[0]] : false;
    const available = state === true;
    return { id: m.id, name: m.name, family: m.family, desc: m.desc, expose: m.expose, noun: m.noun, available, reason: available ? "" : state === null ? "Checking…" : m.hint };
  });
}

/** Keep only declared params, coerced into their range; unknown or bad values fall back to the default. */
export function cleanParams(schema, values = {}) {
  const out = {};
  Object.keys(schema || {}).forEach((k) => {
    const s = schema[k];
    const v = values[k];
    if (s.type === "int" || s.type === "number") {
      const n = Number(v);
      const ok = Number.isFinite(n) && (s.type === "number" || Number.isInteger(n));
      out[k] = ok ? Math.max(s.min ?? -Infinity, Math.min(s.max ?? Infinity, n)) : s.default;
    } else if (s.type === "bool") out[k] = typeof v === "boolean" ? v : Boolean(s.default);
    else if (s.type === "enum") out[k] = (s.options || []).includes(v) ? v : s.default;
    else out[k] = typeof v === "string" ? v : s.default;
  });
  return out;
}

/** @returns {{ok:true, spec:object} | {ok:false, reason:string, hint:string}} */
export function run(id, input, params) {
  const m = get(id);
  if (!m) return { ok: false, reason: "unknown mapping", hint: String(id) };
  try {
    return m.project(input, cleanParams(m.desc.params, params));
  } catch {
    return { ok: false, reason: "projection failed", hint: m.hint };
  }
}
