#!/usr/bin/env bash
# Sync FIDV launcher icon into Standard-Financial-Charting.app.
# Source of truth remains Ind-Chain/assets/fidv-launcher.icns.
# Preferred path after changing the master icon: run build-standard-financial-charting-app.sh (copies and signs).
# This script is the quick path: if the icon actually changed it re-signs (ad hoc) and verifies, because editing
# a signed .app breaks its seal. SFC_APP may point at another copy (used for testing).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
ICNS="$ROOT/assets/fidv-launcher.icns"
APP="${SFC_APP:-$REPO/Standard-Financial-Charting.app}"
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
CHANGED=1
if [[ -f "$DEST" ]] && cmp -s "$ICNS" "$DEST"; then CHANGED=0; fi
if [[ $CHANGED -eq 1 ]]; then
  cp "$ICNS" "$DEST"
  codesign --force --deep --sign - "$APP" >/dev/null
  codesign --verify --deep --strict "$APP"
fi

/usr/bin/touch "$APP"
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP" >/dev/null 2>&1 || true

echo "[Ind-Chain] icon synced → $(basename "$APP") (changed=$CHANGED$([[ $CHANGED -eq 1 ]] && echo ", re-signed and verified"))"
