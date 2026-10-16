#!/usr/bin/env python3
"""BE-HTTP — Loopback HTTP API, static web server, /modules/ narrow mouth, and process lifecycle."""
from __future__ import annotations

import json
import mimetypes
import os
import signal
import sys
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))

from bics_entity import (  # noqa: E402
    count_pack,
    entity_by_member_ticker,
    list_bics_entities,
    locate_bics,
    peer_l4_key,
    primary_entity_for_ticker,
    primary_listings_count,
    resolve_entity_ticker,
)
from bics_hier import bics_ancestors, bics_children, bics_node, list_bics_l1  # noqa: E402
from bundle_dispatch import build_bundle, register_chain, set_shell_builder  # noqa: E402
from debt_ladder import ladder_for  # noqa: E402
from db import connect, ensure_demo_db, get_company, list_companies, list_layers, meta  # noqa: E402
from db_shadow import bundle_shell_ticker, configure_shadow_lookup  # noqa: E402
from nvda_links import bundle_nvda_chain, configure_nvda_entity_lookup  # noqa: E402

WEB_ROOT = ROOT / "web"
# W1 narrow mouth: repo-root modules/ only (graph + paper HTML). Not a general static mount.
MODULES_ROOT = (ROOT.parent / "modules").resolve()
HOST = "127.0.0.1"
DEFAULT_PORT = 8787
# Shell embedding (SHELL-PROC): SFC_PORT picks the port, SFC_PARENT_PID ties our life to the shell.
SHELL_PORT_ENV = "SFC_PORT"
SHELL_PARENT_ENV = "SFC_PARENT_PID"
DATA_DIR_ENV = "SFC_DATA_DIR"
_MODULES_SUFFIXES = {".html", ".json", ".css", ".js"}


def ensure_db() -> None:
    ensure_demo_db()
    n_pri = primary_listings_count()
    print(f"[Ind-Chain] primary listings {n_pri} tickers", flush=True)


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
            self._send_json(404, {"error": "not found"})  # No filesystem path in JSON (W1 A2).
            return
        data = path.read_bytes()
        ctype, _ = mimetypes.guess_type(str(path))
        if path.suffix == ".js":
            ctype = "text/javascript; charset=utf-8"
        elif path.suffix == ".css":
            ctype = "text/css; charset=utf-8"
        elif path.suffix == ".html":
            ctype = "text/html; charset=utf-8"
        elif path.suffix == ".json":
            ctype = "application/json; charset=utf-8"
        elif path.suffix == ".woff2":
            ctype = "font/woff2"
        self.send_response(200)
        self.send_header("Content-Type", ctype or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def _send_modules(self, url_path: str) -> bool:
        """Serve only files under MODULES_ROOT. Returns True if handled."""
        if url_path not in ("/modules", "/modules/") and not url_path.startswith("/modules/"):
            return False
        rel = url_path[len("/modules") :].lstrip("/")
        if not rel or rel.endswith("/"):
            rel = (rel + "index.html") if rel else "index.html"
        candidate = (MODULES_ROOT / rel).resolve()
        root_s = str(MODULES_ROOT)
        if not str(candidate).startswith(root_s + "/") and str(candidate) != root_s:
            self._send_json(403, {"error": "forbidden"})
            return True
        if candidate.suffix.lower() not in _MODULES_SUFFIXES:
            self._send_json(403, {"error": "forbidden"})
            return True
        self._send_file(candidate)
        return True

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        try:
            self._route()
        except Exception:  # noqa: BLE001
            traceback.print_exc()
            self._send_json(500, {"error": "internal error"})  # W1 A2: never leak paths in JSON.

    def _route(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)
        if path in ("/", "/index.html"):
            self._send_file(WEB_ROOT / "index.html")
            return
        if path in ("/cube", "/cube/", "/cube.html"):
            self._send_file(WEB_ROOT / "cube.html")
            return
        if path in ("/list", "/list/", "/list.html"):
            self._send_file(WEB_ROOT / "list.html")
            return
        if self._send_modules(path):
            return
        if path.startswith("/api/"):
            self._api(path, qs)
            return
        rel = path.lstrip("/")
        web_root = WEB_ROOT.resolve()
        candidate = (WEB_ROOT / rel).resolve()
        if not str(candidate).startswith(str(web_root) + "/") and candidate != web_root:
            self._send_json(403, {"error": "forbidden"})
            return
        self._send_file(candidate)

    def _qs0(self, qs: dict, key: str, default: str = "") -> str:
        return (qs.get(key, [default])[0] or default).strip()

    def _bics_children_resp(self, qs: dict) -> None:
        parent = self._qs0(qs, "parent")
        loc = self._qs0(qs, "listingCountry") or None
        pack = bics_children(parent, loc, count_fn=count_pack)
        if pack is None:
            self._send_json(404, {"error": "unknown bics parent", "parent": parent})
            return
        self._send_json(200, pack)

    def _bics_node_resp(self, qs: dict) -> None:
        code = self._qs0(qs, "code")
        node = bics_node(code) if code else None
        if not node:
            self._send_json(404, {"error": "unknown bics code", "code": code})
            return
        self._send_json(200, {"node": node})

    def _bics_entities_resp(self, qs: dict) -> None:
        code = self._qs0(qs, "bics")
        loc = self._qs0(qs, "listingCountry") or None
        node = bics_node(code) if code else None
        ancestors = bics_ancestors(code) if node else []
        pack = list_bics_entities(code, loc, node=node, ancestors=ancestors) if code else None
        if pack is None:
            self._send_json(400, {"error": "bics must be a level-4 code", "bics": code})
            return
        self._send_json(200, pack)

    def _api_bics(self, path: str, qs: dict) -> bool:
        if path == "/api/bics/l1":
            self._send_json(200, {"sectors": list_bics_l1(count_fn=count_pack)})
            return True
        if path == "/api/bics/children":
            self._bics_children_resp(qs)
            return True
        if path == "/api/bics/node":
            self._bics_node_resp(qs)
            return True
        if path == "/api/bics/locate":
            self._send_json(200, locate_bics(self._qs0(qs, "q")))
            return True
        if path == "/api/bics/entities":
            self._bics_entities_resp(qs)
            return True
        return False

    def _api_companies(self, conn, path: str, qs: dict) -> None:
        if path == "/api/companies":
            layer = qs.get("layer", [None])[0]
            layer_i = int(layer) if layer not in (None, "") else None
            supply = qs.get("supply", ["0"])[0] in ("1", "true", "yes")
            companies = list_companies(
                conn,
                layer=layer_i,
                country=qs.get("country", [None])[0],
                supply_only=supply,
                q=qs.get("q", [None])[0],
            )
            self._send_json(200, {"companies": companies, "count": len(companies)})
            return
        cid = int(path.rsplit("/", 1)[-1])
        company = get_company(conn, cid)
        if not company:
            self._send_json(404, {"error": "company not found"})
            return
        self._send_json(200, {"company": company})

    def _api_bundle(self, qs: dict) -> None:
        ticker = self._qs0(qs, "ticker")
        self._send_json(200, build_bundle(ticker))

    def _api(self, path: str, qs: dict) -> None:
        if path.startswith("/api/bics/") and self._api_bics(path, qs):
            return
        if path == "/api/health":
            self._send_json(200, {"ok": True})
            return
        if path == "/api/bundle":
            self._api_bundle(qs)
            return
        if path == "/api/debt/ladder":
            doc = ladder_for(self._qs0(qs, "ticker"), self._qs0(qs, "name"))
            if doc is None:
                self._send_json(404, {"error": "no ladder"})  # No path, no hint of a file (W1 A2).
            else:
                self._send_json(200, doc)
            return
        conn = connect()
        try:
            if path == "/api/meta":
                self._send_json(200, meta())
                return
            if path == "/api/layers":
                self._send_json(200, {"layers": list_layers(conn)})
                return
            if path == "/api/companies" or path.startswith("/api/companies/"):
                self._api_companies(conn, path, qs)
                return
            self._send_json(404, {"error": "unknown api route", "path": path})
        finally:
            conn.close()


def _register_bundle_builders() -> None:
    """Wire BE-BUNDLE registry and entity lookup callbacks once modules are loaded."""
    configure_shadow_lookup(resolve_entity_ticker, primary_entity_for_ticker)
    configure_nvda_entity_lookup(entity_by_member_ticker, peer_l4_key)
    set_shell_builder(bundle_shell_ticker)
    register_chain("nvda", lambda key: key.split(" ", 1)[0] == "NVDA", bundle_nvda_chain)


_register_bundle_builders()


def _resolve_port() -> tuple[int, bool]:
    raw = os.environ.get(SHELL_PORT_ENV)
    if raw is None:
        return DEFAULT_PORT, False
    try:
        port = int(raw)
    except ValueError:
        port = -1
    if not 1024 <= port <= 65535:
        print(f"[Ind-Chain] invalid {SHELL_PORT_ENV}={raw!r} (need integer 1024-65535)", file=sys.stderr, flush=True)
        sys.exit(2)
    return port, True


def _check_data_dir() -> None:
    raw = os.environ.get(DATA_DIR_ENV)
    if raw is None:
        return
    d = Path(raw)
    problem = None
    if not d.is_absolute():
        problem = "not an absolute path"
    else:
        try:
            d.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            problem = f"cannot create ({exc.strerror})"
        else:
            if not os.access(d, os.W_OK):
                problem = "not writable"
    if problem:
        print(f"[Ind-Chain] invalid {DATA_DIR_ENV}={raw!r}: {problem}", file=sys.stderr, flush=True)
        sys.exit(2)


def _start_parent_watch() -> None:
    raw = os.environ.get(SHELL_PARENT_ENV)
    if raw is None:
        return
    try:
        parent = int(raw)
        if parent <= 1:
            raise ValueError
    except ValueError:
        print(f"[Ind-Chain] ignoring invalid {SHELL_PARENT_ENV}={raw!r}", file=sys.stderr, flush=True)
        return

    def watch() -> None:
        while True:
            time.sleep(1.0)
            try:
                os.kill(parent, 0)
            except ProcessLookupError:
                print("[Ind-Chain] parent gone, exiting", flush=True)
                os._exit(0)
            except PermissionError:
                continue

    threading.Thread(target=watch, daemon=True, name="parent-watch").start()


def _raise_interrupt(_signum, _frame) -> None:
    raise KeyboardInterrupt


def main() -> None:
    port, from_env = _resolve_port()
    _check_data_dir()
    _start_parent_watch()
    signal.signal(signal.SIGTERM, _raise_interrupt)
    ensure_db()
    httpd = ThreadingHTTPServer((HOST, port), Handler)
    if from_env:
        print(f"[Ind-Chain] port {port}", flush=True)
    print(f"[Ind-Chain] homepage http://{HOST}:{port}/ · list /list · cube /cube · modules /modules/", flush=True)
    print("[Ind-Chain] API: /api/bundle  /api/bics/children  /api/bics/entities  /api/bics/locate  /api/bics/node  /api/debt/ladder  /api/health", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Ind-Chain] stopped")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
