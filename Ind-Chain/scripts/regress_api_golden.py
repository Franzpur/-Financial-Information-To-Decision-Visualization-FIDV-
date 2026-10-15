#!/usr/bin/env python3
"""API golden regression: capture HTTP responses once, compare later (stdlib only).

  python3 regress_api_golden.py capture --base http://127.0.0.1:8787 --out DIR [--only PATH ...]
  python3 regress_api_golden.py compare --base http://127.0.0.1:PORT --golden DIR \
      [--allow-changed /modules/ ...]

Paths are sent verbatim (no normalisation) so W1 probes like /../ stay raw.
Excluded fields: none (all responses are deterministic for a fixed repo state).
"""
from __future__ import annotations

import argparse
import hashlib
import http.client
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

# (method, path-with-query)
REQUESTS: list[tuple[str, str]] = [
    ("GET", "/api/health"),
    ("GET", "/api/meta"),
    ("GET", "/api/layers"),
    ("GET", "/api/companies"),
    ("GET", "/api/companies?layer=1"),
    ("GET", "/api/companies?country=US"),
    ("GET", "/api/companies?q=nvidia"),
    ("GET", "/api/companies?supply=1"),
    ("GET", "/api/companies/1"),
    ("GET", "/api/companies/99999"),
    ("GET", "/api/companies/abc"),
    ("GET", "/api/bics/l1"),
    ("GET", "/api/bics/children"),
    ("GET", "/api/bics/children?parent=10"),
    ("GET", "/api/bics/children?parent=12"),
    ("GET", "/api/bics/children?parent=101010"),
    ("GET", "/api/bics/children?parent=121010&listingCountry=US"),
    ("GET", "/api/bics/children?parent=999999"),
    ("GET", "/api/bics/node?code=10101010"),
    ("GET", "/api/bics/node?code=19101010"),
    ("GET", "/api/bics/node?code=00000000"),
    ("GET", "/api/bics/locate?q=Apple"),
    ("GET", "/api/bics/locate?q=NVDA"),
    ("GET", "/api/bics/entities?bics=10101010"),
    ("GET", "/api/bics/entities?bics=10101010&listingCountry=US"),
    ("GET", "/api/bics/entities?bics=19101010"),
    ("GET", "/api/bics/entities?bics=10"),
    ("GET", "/api/bics/entities"),
    ("GET", "/api/bundle?ticker=NVDA"),
    ("GET", "/api/bundle?ticker=KO"),
    ("GET", "/api/bundle?ticker=AAPL"),
    ("GET", "/api/bundle?ticker=DEMO"),
    ("GET", "/api/bundle"),
    ("GET", "/api/nope"),
    ("GET", "/"),
    ("GET", "/index.html"),
    ("GET", "/cube"),
    ("GET", "/cube/"),
    ("GET", "/cube.html"),
    ("GET", "/list"),
    ("GET", "/list/"),
    ("GET", "/list.html"),
    ("GET", "/css/app.css"),
    ("GET", "/js/api.js"),
    ("GET", "/js/main.js"),
    ("GET", "/modules/graph.json"),
    ("GET", "/modules/"),
    # W1 probes
    ("GET", "/../"),
    ("GET", "/%2e%2e/"),
    ("GET", "/data/ind_chain.db"),
    ("GET", "/server/app.py"),
    ("GET", "/BE-DATA/"),
    ("GET", "/BE-CLASS/"),
    ("GET", "/Ind-Chain/data/shell-last.log"),
    # vendored three.js (P2): served from web/vendor, still no way out of web/
    ("GET", "/vendor/three/build/three.module.js"),
    ("GET", "/vendor/three/examples/jsm/controls/OrbitControls.js"),
    ("GET", "/vendor/three/build/three.cjs"),
    ("GET", "/vendor/../server/app.py"),
    ("GET", "/vendor/%2e%2e/server/app.py"),
    ("OPTIONS", "/api/health"),
]


def _key(method: str, path: str) -> str:
    return hashlib.sha1(f"{method} {path}".encode(), usedforsecurity=False).hexdigest()[:16]


def fetch(base: str, method: str, path: str) -> dict:
    u = urlparse(base)
    conn = http.client.HTTPConnection(u.hostname, u.port, timeout=30)
    try:
        conn.putrequest(method, path, skip_host=False, skip_accept_encoding=True)
        conn.endheaders()
        r = conn.getresponse()
        body = r.read()
        return {"status": r.status, "ctype": r.getheader("Content-Type") or "", "body": body}
    finally:
        conn.close()


def cmd_capture(base: str, out: Path, only: set[str]) -> int:
    """Capture all requests, or only the listed paths (merging into an existing golden dir)."""
    out.mkdir(parents=True, exist_ok=True)
    manifest = []
    for method, path in REQUESTS:
        k = _key(method, path)
        if only and path not in only:
            if not (out / f"{k}.json").exists():
                continue
            meta = json.loads((out / f"{k}.json").read_text())
            manifest.append(f'{meta["sha256"]}  {k} {method} {path} {meta["status"]}')
            continue
        res = fetch(base, method, path)
        (out / f"{k}.body").write_bytes(res["body"])
        meta = {"method": method, "path": path, "status": res["status"], "ctype": res["ctype"],
                "sha256": hashlib.sha256(res["body"]).hexdigest(), "len": len(res["body"])}
        (out / f"{k}.json").write_text(json.dumps(meta, ensure_ascii=False))
        manifest.append(f'{meta["sha256"]}  {k} {method} {path} {res["status"]}')
    (out / "MANIFEST.sha256").write_text("\n".join(manifest) + "\n")
    print(f"captured {len(only) if only else len(REQUESTS)} responses -> {out}")
    print("MANIFEST sha256:", hashlib.sha256(("\n".join(manifest) + "\n").encode()).hexdigest())
    return 0


def cmd_compare(base: str, golden: Path, allow: set[str]) -> int:
    bad = 0
    for method, path in REQUESTS:
        k = _key(method, path)
        if not (golden / f"{k}.json").exists():
            print(f"NEW      {method} {path} (not in this golden set; skipped)")
            continue
        meta = json.loads((golden / f"{k}.json").read_text())
        want = (golden / f"{k}.body").read_bytes()
        got = fetch(base, method, path)
        same = got["status"] == meta["status"] and got["ctype"] == meta["ctype"] and got["body"] == want
        if same:
            print(f"OK       {method} {path} {got['status']}")
        elif path in allow:
            print(f"CHANGED-EXPECTED {method} {path} {got['status']} sha={hashlib.sha256(got['body']).hexdigest()[:12]}")
        else:
            bad += 1
            print(f"DIFF     {method} {path}: status {meta['status']}->{got['status']} "
                  f"ctype {meta['ctype']!r}->{got['ctype']!r} len {len(want)}->{len(got['body'])}")
    print(f"compared {len(REQUESTS)}; unexpected diffs: {bad}")
    return 1 if bad else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("capture")
    c.add_argument("--base", required=True)
    c.add_argument("--out", required=True)
    c.add_argument("--only", action="append", default=[])
    p = sub.add_parser("compare")
    p.add_argument("--base", required=True)
    p.add_argument("--golden", required=True)
    p.add_argument("--allow-changed", action="append", default=[])
    a = ap.parse_args()
    if a.cmd == "capture":
        return cmd_capture(a.base, Path(a.out), set(a.only))
    return cmd_compare(a.base, Path(a.golden), set(a.allow_changed))


if __name__ == "__main__":
    sys.exit(main())
