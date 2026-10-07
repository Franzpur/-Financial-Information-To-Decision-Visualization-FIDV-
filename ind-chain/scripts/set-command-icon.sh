#!/usr/bin/env bash
# Sync FIDV launcher icon into Standard-Cube.app (Finder / Dock).
# Source of truth remains ind-chain/assets/fidv-launcher.icns.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
ICNS="$ROOT/assets/fidv-launcher.icns"
APP="$REPO/Standard-Cube.app"
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

# Refresh Finder/Dock icon cache for this bundle.
/usr/bin/touch "$APP"
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP" >/dev/null 2>&1 || true

echo "[ind-chain] icon synced → Standard-Cube.app/Contents/Resources/AppIcon.icns"
