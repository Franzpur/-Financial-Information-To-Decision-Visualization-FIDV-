#!/usr/bin/env bash
# Launch the AI Industry Chain Cube (SQLite API + modular web UI).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT=8787
URL="http://127.0.0.1:${PORT}/"

cd "$ROOT"

# Free stale listener on our port (our previous server only).
if lsof -ti ":$PORT" >/dev/null 2>&1; then
  echo "[ai-chain] port $PORT busy — stopping previous listener"
  lsof -ti ":$PORT" | xargs kill 2>/dev/null || true
  sleep 0.4
fi

python3 "$ROOT/scripts/seed.py"
echo "[ai-chain] starting server…"
python3 "$ROOT/server/app.py" &
PID=$!
sleep 0.6

if ! kill -0 "$PID" 2>/dev/null; then
  echo "[ai-chain] server failed to start" >&2
  exit 1
fi

open "$URL" 2>/dev/null || true
echo "[ai-chain] running at $URL  (pid $PID)"
echo "[ai-chain] press Ctrl+C in this terminal to stop, or: kill $PID"
wait "$PID"
