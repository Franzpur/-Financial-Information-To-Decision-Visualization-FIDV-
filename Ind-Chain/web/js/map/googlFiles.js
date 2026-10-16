/**
 * GOOGL file ring — allow-list of paths whose filenames contain `googl`
 * (case-insensitive). Hard-coded for B2; no path traversal.
 * Public packages may omit the gitignored debt-ladder JSON.
 */
export const GOOGL_FILE_PATHS = [
  "BE-DATA/ICBC C/928/googl_bond_full.xlsx",
  "BE-DATA/ICBC C/928/googl_fa_bs.xlsx",
  "BE-DATA/ICBC C/928/googl_top20 comsumer.xlsx",
  "BE-DATA/ICBC C/928/googl_top20 supplier.xlsx",
  "Ind-Chain/data/debt-ladder-googl.json",
];

export function isGooglTicker(ticker) {
  // Demo uses "GOOGL"; shell bundle uses "GOOGL US Equity".
  const t = String(ticker || "").trim().toUpperCase();
  if (!t) return false;
  const head = t.split(/\s+/)[0];
  return head === "GOOGL";
}

/** @returns {{ path: string, name: string }[]} */
export function googlFileEntries() {
  return GOOGL_FILE_PATHS.filter((p) => /googl/i.test(p.split("/").pop() || "")).map((path) => ({
    path,
    name: path.split("/").pop() || path,
  }));
}
