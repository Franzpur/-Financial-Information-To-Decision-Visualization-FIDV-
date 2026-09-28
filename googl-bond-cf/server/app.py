#!/usr/bin/env python3
"""Static + JSON server for GOOGL bond cash-flow viz on :8791."""
from __future__ import annotations

import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
DATA = ROOT / "data"
HOST, PORT = "127.0.0.1", 8791


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[bond-cf] {self.address_string()} {fmt % args}")

    def _send(self, code: int, body: bytes, ctype: str):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return self._send(200, b'{"ok":true}', "application/json")
        if path == "/api/bundle":
            bonds = json.loads((DATA / "bonds.json").read_text(encoding="utf-8"))
            series = json.loads((DATA / "cashflow_series.json").read_text(encoding="utf-8"))
            payload = {"meta": series.get("meta") or bonds.get("meta"), "bonds": bonds["bonds"], "series": series["series"]}
            return self._send(200, json.dumps(payload).encode("utf-8"), "application/json")
        if path == "/api/bonds":
            return self._send(200, (DATA / "bonds.json").read_bytes(), "application/json")
        if path == "/api/series":
            return self._send(200, (DATA / "cashflow_series.json").read_bytes(), "application/json")

        rel = "index.html" if path in ("", "/") else path.lstrip("/")
        file = (WEB / rel).resolve()
        if not str(file).startswith(str(WEB.resolve())) or not file.is_file():
            return self._send(404, b"not found", "text/plain")
        ctype = mimetypes.guess_type(str(file))[0] or "application/octet-stream"
        return self._send(200, file.read_bytes(), ctype)


def main():
    if not (DATA / "cashflow_series.json").exists():
        raise SystemExit("Missing data — run: python3 scripts/build_cashflows.py")
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"GOOGL bond CF → http://{HOST}:{PORT}/")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
