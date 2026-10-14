#!/usr/bin/env bash
# Sync FIDV launcher icon into Standard-Financial-Charting.app.
# Source of truth remains Ind-Chain/assets/fidv-launcher.icns.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
ICNS="$ROOT/assets/fidv-launcher.icns"
APP="$REPO/Standard-Financial-Charting.app"
DEST="$APP/Contents/Resources/AppIcon.icns"

if [[ ! -f "$ICNS" ]]; then
  echo "missing $ICNS" >&2
  exit 1
fi

if [[ ! -d "$APP/Contents" ]]; then
  echo "missing $APP" >&2
  exit 1
fi

mkdir -p "$APP/Contents/Resources"
cp "$ICNS" "$DEST"

/usr/bin/touch "$APP"
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP" >/dev/null 2>&1 || true

echo "[Ind-Chain] icon synced → Standard-Financial-Charting.app"
