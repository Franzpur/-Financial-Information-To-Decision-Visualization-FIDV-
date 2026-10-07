#!/usr/bin/env bash
# Rebuild Standard-Cube.app native stub (Launch Services requires Mach-O, not a shell script).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
SRC="$ROOT/scripts/standard-cube-stub.c"
APP="$REPO/Standard-Cube.app"
OUT="$APP/Contents/MacOS/Standard-Cube"
ICNS_SRC="$ROOT/assets/fidv-launcher.icns"
ICNS_DST="$APP/Contents/Resources/AppIcon.icns"

if [[ ! -f "$SRC" ]]; then
  echo "missing $SRC" >&2
  exit 1
fi

mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

if [[ ! -f "$APP/Contents/Info.plist" ]]; then
  cat >"$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>Standard-Cube</string>
	<key>CFBundleExecutable</key>
	<string>Standard-Cube</string>
	<key>CFBundleIconFile</key>
	<string>AppIcon</string>
	<key>CFBundleIdentifier</key>
	<string>local.fidv.Standard-Cube</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>Standard-Cube</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>LSMinimumSystemVersion</key>
	<string>11.0</string>
	<key>NSHighResolutionCapable</key>
	<true/>
</dict>
</plist>
PLIST
fi

printf 'APPL????' >"$APP/Contents/PkgInfo"

if [[ -f "$ICNS_SRC" ]]; then
  cp "$ICNS_SRC" "$ICNS_DST"
fi

SDK=""
for cand in \
  /Library/Developer/CommandLineTools/SDKs/MacOSX15.sdk \
  /Library/Developer/CommandLineTools/SDKs/MacOSX14.sdk \
  /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk; do
  if [[ -d "$cand" ]]; then
    SDK="$cand"
    break
  fi
done

CFLAGS=(-O2 -mmacosx-version-min=11.0)
if [[ -n "$SDK" ]]; then
  CFLAGS+=(-isysroot "$SDK")
fi

clang "${CFLAGS[@]}" -o "$OUT" "$SRC"
chmod +x "$OUT"
codesign --force --deep -s - "$APP" >/dev/null 2>&1 || true
/usr/bin/touch "$APP"

echo "[ind-chain] built $OUT ($(file -b "$OUT"))"
