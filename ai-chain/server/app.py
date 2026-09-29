#!/usr/bin/env python3
"""AI Chain Cube — lightweight HTTP API + static web server (stdlib only)."""
from __future__ import annotations

import json
import mimetypes
import sys
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))

from db import (  # noqa: E402
    DB_PATH,
    connect,
    get_company,
    init_schema,
    list_companies,
    list_layers,
    meta,
    seed_from_json,
)

WEB_ROOT = ROOT / "web"
BOND_SERIES = ROOT.parent / "googl-bond-cf" / "data" / "cashflow_series.json"
HOST = "127.0.0.1"
PORT = 8787


def ensure_db() -> None:
    conn = connect()
    init_schema(conn)
    n = conn.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
    if n == 0:
        seed_from_json(conn)
        n = conn.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
        print(f"[ai-chain] seeded SQLite → {DB_PATH} ({n} companies)")
    else:
        print(f"[ai-chain] using SQLite → {DB_PATH} ({n} companies)")
    conn.close()


def json_bytes(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    server_version = "AIChainCube/1.0"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, code: int, obj) -> None:
        body = json_bytes(obj)
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path) -> None:
        if not path.is_file():
            self._send_json(404, {"error": "not found", "path": str(path.relative_to(WEB_ROOT))})
            return
        data = path.read_bytes()
        ctype, _ = mimetypes.guess_type(str(path))
        if path.suffix == ".js":
            ctype = "text/javascript; charset=utf-8"
        elif path.suffix == ".css":
            ctype = "text/css; charset=utf-8"
        elif path.suffix == ".html":
            ctype = "text/html; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", ctype or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        try:
            self._route()
        except Exception as exc:  # noqa: BLE001
            traceback.print_exc()
            self._send_json(500, {"error": str(exc)})

    def _route(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path in ("/", "/index.html"):
            self._send_file(WEB_ROOT / "index.html")
            return

        if path.startswith("/api/"):
            self._api(path, qs)
            return

        # Static assets under web/
        rel = path.lstrip("/")
        candidate = (WEB_ROOT / rel).resolve()
        if not str(candidate).startswith(str(WEB_ROOT.resolve())):
            self._send_json(403, {"error": "forbidden"})
            return
        self._send_file(candidate)

    def _api(self, path: str, qs: dict) -> None:
        conn = connect()
        try:
            if path == "/api/health":
                self._send_json(200, {"ok": True, "db": str(DB_PATH)})
                return
            if path == "/api/meta":
                self._send_json(200, meta())
                return
            if path == "/api/layers":
                self._send_json(200, {"layers": list_layers(conn)})
                return
            if path == "/api/companies":
                layer = qs.get("layer", [None])[0]
                country = qs.get("country", [None])[0]
                supply = qs.get("supply", ["0"])[0] in ("1", "true", "yes")
                q = qs.get("q", [None])[0]
                companies = list_companies(
                    conn,
                    layer=int(layer) if layer not in (None, "") else None,
                    country=country,
                    supply_only=supply,
                    q=q,
                )
                self._send_json(200, {"companies": companies, "count": len(companies)})
                return
            if path.startswith("/api/companies/"):
                cid = int(path.rsplit("/", 1)[-1])
                company = get_company(conn, cid)
                if not company:
                    self._send_json(404, {"error": "company not found"})
                    return
                self._send_json(200, {"company": company})
                return
            if path == "/api/googl-bond":
                self._send_json(200, googl_bond_payload())
                return
            if path == "/api/bundle":
                # One-shot bootstrap payload for the SPA
                self._send_json(
                    200,
                    {
                        "meta": meta(),
                        "layers": list_layers(conn),
                        "companies": list_companies(conn),
                    },
                )
                return
            self._send_json(404, {"error": "unknown api route", "path": path})
        finally:
            conn.close()


def _flow_row(row: dict, key: str) -> dict:
    return {
        key: row.get(key),
        "coupon": float(row.get("coupon") or 0),
        "principal": float(row.get("principal") or 0),
        "total": float(row.get("total") or 0),
    }


def googl_bond_payload() -> dict:
    """Yearly and quarterly liability rows for the in-cube financial slice."""
    if not BOND_SERIES.is_file():
        raise FileNotFoundError(f"missing bond series: {BOND_SERIES}")
    raw = json.loads(BOND_SERIES.read_text(encoding="utf-8"))
    series = raw.get("series") or {}
    return {
        "meta": dict(raw.get("meta") or {}),
        "byYear": [_flow_row(row, "year") for row in series.get("byYear") or []],
        "byQuarter": [_flow_row(row, "quarter") for row in series.get("byQuarter") or []],
    }


def main() -> None:
    ensure_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[ai-chain] http://{HOST}:{PORT}/", flush=True)
    print("[ai-chain] API: /api/bundle  /api/googl-bond  /api/layers  /api/companies  /api/health", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[ai-chain] stopped")


if __name__ == "__main__":
    main()
