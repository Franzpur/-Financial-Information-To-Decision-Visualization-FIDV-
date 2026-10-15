#!/bin/bash
# One entry point for all local regressions. Usage: bash Ind-Chain/scripts/regress_all.sh {quick|full|capture} | --help
#   capture : start the dev back end on a free port and capture the API golden set to $SFC_GOLDEN
#   quick   : module-graph checks + static checks + API golden compare against a dev back end
#   full    : quick + repo .app selftest/lifecycle, then each dist/<variant> package present (internal, noentities):
#             selftest incl. /cube offline checks, embedded-Python check, and (internal) the app lifecycle
# Environment: SFC_GOLDEN (default ${TMPDIR:-/tmp}/sfc-golden; golden responses hold third-party data: never commit).
#              full tests the repo .app and, if present, dist/internal and dist/noentities by themselves.
# Rules: refuses to start when an app instance or an Ind-Chain back end is already running; never kills anything it
# did not start (only its own PIDs); every step prints one PASS/FAIL line; exit code mirrors the summary.
# See also: regress_api_golden.py, regress_app_lifecycle.sh, build-/package-standard-financial-charting.sh.
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
cd "$(dirname "$SELF")/../.." || exit 2
REPO=$PWD
command -v rg >/dev/null || { echo "ripgrep (rg) is required"; exit 2; }
T=${TMPDIR:-/tmp}; T=${T%/}
export PYTHONDONTWRITEBYTECODE=1
GOLDEN=${SFC_GOLDEN:-${TMPDIR:-/tmp}/sfc-golden}
MODE=${1:-}
FAILS=0
DEV_PID=""

usage() { sed -n '2,11p' "$SELF" | sed 's/^# \{0,1\}//'; }
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; FAILS=$((FAILS+1)); }
check() { if "$@" >$T/sfc-regress-step.$$ 2>&1; then pass "$STEP"; else fail "$STEP"; sed 's/^/        /' $T/sfc-regress-step.$$ | tail -40; fi; rm -f $T/sfc-regress-step.$$; }
cleanup() { [ -n "$DEV_PID" ] && kill -TERM "$DEV_PID" 2>/dev/null; rm -f "$T"/sfc-regress-*.$$; return 0; }
trap cleanup EXIT

case "$MODE" in quick|full|capture) ;; -h|--help|help|"") usage; exit 0 ;; *) usage; exit 2 ;; esac

if pgrep -f "Standard-Financial-Charting.app/Contents/MacOS" >/dev/null || pgrep -f "Ind-Chain/server/app.py" >/dev/null; then
  echo "refusing to run: an app instance or an Ind-Chain back end is already running (not touching it)"; exit 2
fi

free_port() { python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])'; }
start_dev() {
  PORT=$(free_port)
  SFC_PORT=$PORT python3 Ind-Chain/server/app.py >$T/sfc-regress-dev.$$ 2>&1 &
  DEV_PID=$!
  for _ in $(seq 1 100); do curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null && return 0; sleep 0.2; done
  echo "dev back end did not come up"; cat "$T/sfc-regress-dev.$$"; kill -TERM "$DEV_PID" 2>/dev/null; DEV_PID=""; return 1
}

# ---- module graph (F section) ----
module_checks() {
  python3 - <<'PY'
import json, subprocess, sys
g = json.load(open("modules/graph.json"))
mods, edges = g["modules"], g["edges"]
assert (len(mods), len(edges)) == (26, 35), f"expected 26/35, got {len(mods)}/{len(edges)}"
assert {e["type"] for e in edges} <= {"depends", "calls", "contract"}
old = json.loads(subprocess.check_output(["git", "show", "019af67:modules/graph.json"]))
om = {m["id"]: m for m in old["modules"]}
nm = {m["id"]: m for m in mods}
assert all(om[i] == nm[i] for i in om), "an original module changed"
key = lambda e: (e["from"], e["to"], e["type"])
ne = {key(e) for e in edges}
assert all(key(e) in ne for e in old["edges"]), "an original edge is missing"
assert set(nm) - set(om) == {"SHELL-WINDOW", "SHELL-PROC", "SHELL-PACK"}, set(nm) - set(om)
added = ne - {key(e) for e in old["edges"]}
want = {("SHELL-WINDOW", "SHELL-PROC", "depends"), ("SHELL-PROC", "BE-HTTP", "calls"), ("SHELL-WINDOW", "BE-HTTP", "contract"),
        ("SHELL-PACK", "SHELL-WINDOW", "depends"), ("SHELL-PACK", "BE-HTTP", "depends")}
assert added == want, added ^ want
print("26 modules / 35 edges; original 23/30 identical to 019af67; added = SHELL-* + 5 edges")
PY
  cp modules/index.html "$T/sfc-regress-index.$$"
  python3 modules/bake_static.py >/dev/null 2>&1 || { echo "bake_static.py failed (geometry check)"; cp "$T/sfc-regress-index.$$" modules/index.html; rm -f "$T/sfc-regress-index.$$"; return 1; }
  if ! cmp -s modules/index.html "$T/sfc-regress-index.$$"; then
    cp "$T/sfc-regress-index.$$" modules/index.html; rm -f "$T/sfc-regress-index.$$"   # leave the tree as found
    echo "bake is not idempotent: index.html would change (restored the original)"; return 1
  fi
  rm -f "$T/sfc-regress-index.$$"
  ! rg -n 'fetch\(|XMLHttpRequest' modules/index.html || return 1
  ! rg -n 'https?://' modules/index.html | rg -v 'www.w3.org/2000/svg' || return 1
  echo "bake idempotent; static page has no fetch/XHR/external URL"
}
static_checks() {
  ! rg -n 'https?://' Ind-Chain/web -g '!**/vendor/**' | rg -v 'www.w3.org' || { echo "external URL in web/"; return 1; }
  ! rg -n 'lsof|pkill|killall' Ind-Chain/shell || { echo "forbidden word in shell/"; return 1; }
  (cd Ind-Chain/web/vendor/three && awk '/^BEGIN SHA256$/{f=1;next}/^END SHA256$/{f=0}f' README.txt | shasum -a 256 -c - >/dev/null) || { echo "vendor/three checksum mismatch"; return 1; }
  CHG=$(git status --short -uall -- Ind-Chain/web | rg -v 'cube.html|web/vendor/three/' || true)
  [ -z "$CHG" ] || { echo "unexpected web/ change: $CHG"; return 1; }
  echo "web/: no external URL; vendor checksums ok; only cube.html + vendor/three differ"
}
golden_gate() {
  [ -d "$GOLDEN" ] && [ -f "$GOLDEN/MANIFEST.sha256" ] || { echo "no golden set at $GOLDEN: run 'bash $SELF capture' first (on a known-good baseline)"; return 1; }
  start_dev || return 1
  python3 Ind-Chain/scripts/regress_api_golden.py compare --base "http://127.0.0.1:$PORT" --golden "$GOLDEN" >$T/sfc-regress-cmp.$$ 2>&1
  RC=$?
  kill -TERM "$DEV_PID" 2>/dev/null; wait "$DEV_PID" 2>/dev/null; DEV_PID=""
  rg -v '^OK' $T/sfc-regress-cmp.$$; rm -f $T/sfc-regress-cmp.$$
  return $RC
}
selftest_cube() {
  J=$("$APP_EXE" --selftest --start-path "/cube?ticker=NVDA%20US%20Equity") || { echo "$J"; return 1; }
  echo "$J" | python3 -c 'import json,sys; d=json.load(sys.stdin); print({k:d.get(k) for k in ("ok","external","canvases","webglDrawn","nonBgRatio")}); sys.exit(0 if d["ok"] and d["external"]==0 and d["canvases"]>=1 and d.get("webglDrawn") is not False else 1)'
}
selftest_embedded() {  # minimal PATH, system candidates narrowed away: only the bundled interpreter can pass
  J=$(env -i HOME="$HOME" PATH=/usr/bin:/bin SFC_PYTHON_CANDIDATES=/nonexistent "$APP_EXE" --selftest) || { echo "$J"; return 1; }
  echo "$J" | python3 -c 'import json,sys; d=json.load(sys.stdin); print({k:d.get(k) for k in ("ok","health","pythonSource","pythonVersion")}); sys.exit(0 if d["ok"] and d.get("pythonSource")=="bundled" else 1)'
}
lifecycle() {  # verdict from the log; the log is printed on failure (check() shows its tail)
  L=$T/sfc-regress-life.$$
  APP="$1" SFC_GOLDEN="$GOLDEN" bash Ind-Chain/scripts/regress_app_lifecycle.sh >"$L" 2>&1
  if rg -q 'unexpected diffs: 0' "$L" && ! rg -q "STILL RUNNING|DIFF |refusing|shell processes: [2-9]|'ok': False|Traceback" "$L"; then rm -f "$L"; return 0; fi
  cat "$L"; rm -f "$L"; return 1
}

if [ "$MODE" = capture ]; then
  start_dev || exit 1
  python3 Ind-Chain/scripts/regress_api_golden.py capture --base "http://127.0.0.1:$PORT" --out "$GOLDEN"
  exit $?
fi

STEP="module graph (26/35, original 23/30 == 019af67, bake idempotent)"; check module_checks
STEP="static checks (no external URL, vendor sha, shell word gate, web/ scope)"; check static_checks
STEP="API golden compare (dev back end, $GOLDEN)"; check golden_gate

if [ "$MODE" = full ]; then
  APP_EXE="$REPO/Standard-Financial-Charting.app/Contents/MacOS/Standard-Financial-Charting"
  STEP="selftest + /cube offline check (repo .app)"; check selftest_cube
  STEP="lifecycle: repo .app (cold start, golden, single instance, four exits)"; check lifecycle "$REPO/Standard-Financial-Charting.app"
  for V in internal noentities; do
    D="$REPO/dist/$V/Standard-Financial-Charting.app"
    if [ -d "$D" ]; then
      APP_EXE="$D/Contents/MacOS/Standard-Financial-Charting"
      STEP="selftest + /cube offline check (dist/$V)"; check selftest_cube
      STEP="embedded Python is used with no system Python reachable (dist/$V)"; check selftest_embedded
      # the noentities variant lacks the entities data on purpose, so its API golden would differ; its lifecycle is the internal one
      if [ "$V" = internal ]; then STEP="lifecycle: dist/$V"; check lifecycle "$D"; fi
    else
      echo "SKIP  dist/$V (run package-standard-financial-charting.sh [--no-entities] first)"
    fi
  done
fi

if [ "$FAILS" -eq 0 ]; then echo "== $MODE: ALL PASS"; exit 0; fi
echo "== $MODE: $FAILS FAILED"; exit 1
