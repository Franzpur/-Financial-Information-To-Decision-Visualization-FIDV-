#!/usr/bin/env bash
# Launch GOOGL bond liability cash-flow expansion chart.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT=8791
URL="http://127.0.0.1:${PORT}/"

cd "$ROOT"

if lsof -ti ":$PORT" >/dev/null 2>&1; then
  echo "[bond-cf] port $PORT busy — stopping previous listener"
  lsof -ti ":$PORT" | xargs kill 2>/dev/null || true
  sleep 0.4
fi

echo "[bond-cf] rebuilding cash-flow series…"
python3 "$ROOT/scripts/build_cashflows.py"

echo "[bond-cf] starting server…"
python3 "$ROOT/server/app.py" &
PID=$!
sleep 0.6

if ! kill -0 "$PID" 2>/dev/null; then
  echo "[bond-cf] server failed to start" >&2
  exit 1
fi

open "$URL" 2>/dev/null || true
echo "[bond-cf] running at $URL  (pid $PID)"
echo "[bond-cf] press Ctrl+C in this Terminal to stop, or: kill $PID"
wait "$PID"
