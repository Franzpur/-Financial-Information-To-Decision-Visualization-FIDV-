#!/bin/bash
# App lifecycle regression (R1-R4, R11): cold start via `open`, API golden compare, single instance, four exits
# (quit event, window close via --selftest-close, SIGTERM, SIGKILL). The red close button itself is not UI-tested.
# Usage: [APP=/path/Standard-Financial-Charting.app] [SFC_GOLDEN=${TMPDIR:-/tmp}/sfc-golden] bash Ind-Chain/scripts/regress_app_lifecycle.sh
# See also regress_all.sh (runs this for you). Only ever signals the shell it launched; never kills by port. Needs no other instance running.
cd "$(dirname "$0")/../.."
export PYTHONDONTWRITEBYTECODE=1
APP=${APP:-$PWD/Standard-Financial-Charting.app}
EXE="$APP/Contents/MacOS/Standard-Financial-Charting"
G=${SFC_GOLDEN:-${TMPDIR:-/tmp}/sfc-golden}
LOG=$HOME/Library/Logs/Standard-Financial-Charting/backend.log
shell_pid() { pgrep -f "$EXE" | head -1; }
backend_pids() { pgrep -f 'Ind-Chain/server/app.py'; }
launch() { open "$APP"; for i in $(seq 1 100); do [ -n "$(shell_pid)" ] && break; sleep 0.1; done; }
wait_port() { for i in $(seq 1 300); do BP=$(backend_pids | head -1); P=""; [ -n "$BP" ] && P=$(lsof -nP -a -p "$BP" -iTCP -sTCP:LISTEN -Fn 2>/dev/null | sed -n 's/^n.*://p' | head -1); [ -n "$P" ] && { echo "$P"; return; }; sleep 0.1; done; }
gone() { for i in $(seq 1 40); do [ -z "$(backend_pids)" ] && [ -z "$(shell_pid)" ] && { echo "all gone after ~$(python3 -c "print($i*0.1)")s"; return 0; }; sleep 0.1; done; echo "STILL RUNNING: shell=$(shell_pid) backend=$(backend_pids)"; return 1; }
if [ -n "$(shell_pid)" ] || [ -n "$(backend_pids)" ]; then echo "refusing to run: an instance or back end is already running"; exit 2; fi

echo "== R3/R1/R2/R11 (cold start of $APP)"
T0=$(python3 -c 'import time;print(time.time())')
launch
echo "shell process up after $(python3 -c "import time;print(round(time.time()-$T0,2))")s"
PORT=$(wait_port)
for i in $(seq 1 300); do curl -s "http://127.0.0.1:$PORT/api/health" | rg -q '"ok":true' && break; sleep 0.1; done
echo "health ok after $(python3 -c "import time;print(round(time.time()-$T0,2))")s on port $PORT"
python3 Ind-Chain/scripts/regress_api_golden.py compare --base http://127.0.0.1:$PORT --golden $G \
  --allow-changed /modules/graph.json --allow-changed /modules/ \
  --allow-changed /cube --allow-changed /cube/ --allow-changed /cube.html | rg -v '^OK'
echo "-- sockets of shell + backend:"
lsof -nP -a -p "$(shell_pid),$(backend_pids | head -1)" -i 2>/dev/null | awk 'NR==1||/TCP|UDP/'
echo "-- backend log head:"; head -4 "$LOG"
echo "== N1 single instance: second open + direct exec"
open "$APP"; sleep 1.5
echo "shell processes: $(pgrep -f "$EXE" | wc -l | tr -d ' ')  backends: $(backend_pids | wc -l | tr -d ' ')"
"$EXE"; echo "direct exec second shell exit=$? (0 = silent refusal)"
sleep 0.5; echo "shell processes: $(pgrep -f "$EXE" | wc -l | tr -d ' ')  backends: $(backend_pids | wc -l | tr -d ' ')"
echo "== R4a quit (Cmd-Q equivalent: application quit event)"
osascript -e 'tell application "Standard-Financial-Charting" to quit' ; gone
echo "== R4b window close path (--selftest-close)"
"$EXE" --selftest --selftest-close | python3 -c 'import json,sys; d=json.load(sys.stdin); print({k:d.get(k) for k in ("ok","closeExit")})'; gone
echo "== R4c SIGTERM shell"
launch; wait_port >/dev/null; sleep 1; kill -TERM "$(shell_pid)"; gone
echo "== R4d SIGKILL shell"
launch; wait_port >/dev/null; sleep 1; SP=$(shell_pid); kill -KILL "$SP"; gone
echo "== done"
