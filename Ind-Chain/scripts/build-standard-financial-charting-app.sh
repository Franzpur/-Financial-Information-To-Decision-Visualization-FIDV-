#!/usr/bin/env bash
# Rebuild Standard-Financial-Charting.app: native Swift shell (Ind-Chain/shell/*.swift: NSWindow + WKWebView +
# embedded back end), universal binary arm64 + x86_64 (SFC_ARCHS=native builds the host architecture only).
# Takes no arguments. See also: package-standard-financial-charting.sh (self-contained dist/), regress_all.sh.
# Environment:
#   SFC_SDK_ROOT  directory holding MacOSX*.sdk (default: Command Line Tools SDKs). Each candidate gets a 120 s probe
#                 per architecture; the first SDK that builds every requested architecture is used.
#   SFC_ARCHS     "arm64,x86_64" (default) | "native" | comma list
#   SFC_APP_DIR   directory in which Standard-Financial-Charting.app is (re)built (default: repo root)
#   SFC_SIGN_IDENTITY  keychain identity name ("Developer ID Application: Name (TEAMID)"); unset => ad hoc signature.
#                 A set but unknown identity is an error (never a silent downgrade). Hardened runtime is always on.
# The whole app is assembled and signed in a staging copy; the live app is replaced only after codesign verifies.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
APP_DIR="${SFC_APP_DIR:-$REPO}"
APP="$APP_DIR/Standard-Financial-Charting.app"
ICNS_SRC="$ROOT/assets/fidv-launcher.icns"
if [[ $# -gt 0 ]]; then
  if [[ "$1" == "--legacy" ]]; then
    echo "--legacy was retired in P4; the last commit that still has the old launcher is 019af67" >&2
  else
    echo "unknown argument: $1 (this script takes none; configure with SFC_ARCHS / SFC_SDK_ROOT / SFC_APP_DIR)" >&2
  fi
  exit 2
fi

mkdir -p "$APP_DIR"
TMPD="$(mktemp -d)"
STAGE="$APP_DIR/.sfc-stage-$$.app"
trap 'rm -rf "$TMPD" "$STAGE"' EXIT

NEW="$TMPD/sfc-exe"
if [[ ! -f "$ROOT/shell/main.swift" ]]; then
  echo "missing $ROOT/shell/main.swift (top-level code must live in main.swift)" >&2
  exit 1
fi
ARCHS="${SFC_ARCHS:-arm64,x86_64}"
[[ "$ARCHS" == "native" ]] && ARCHS="$(uname -m)"
USED_SDK="$(python3 - "$ROOT/shell" "$TMPD" "$ARCHS" <<'PY'
import glob, os, re, signal, subprocess, sys

shell_dir, tmp, archs_arg = sys.argv[1], sys.argv[2], sys.argv[3]
sdk_root = os.environ.get("SFC_SDK_ROOT", "/Library/Developer/CommandLineTools/SDKs")
sources = sorted(glob.glob(os.path.join(shell_dir, "*.swift")))
archs = [a.strip() for a in archs_arg.split(",") if a.strip()]
if not archs or any(a not in ("arm64", "x86_64") for a in archs):
  sys.stderr.write(f"unsupported SFC_ARCHS={archs_arg!r} (use arm64, x86_64, native)\n")
  sys.exit(1)


def ver_key(path):
  m = re.search(r"MacOSX(\d+(?:\.\d+)?)\.sdk$", path)
  return (0, -float(m.group(1))) if m else (1, 0.0)  # versioned newest->oldest, MacOSX.sdk last


def run(cmd, timeout):
  p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                       start_new_session=True)
  try:
      o, _ = p.communicate(timeout=timeout)
      return p.returncode, o
  except subprocess.TimeoutExpired:
      os.killpg(p.pid, signal.SIGKILL)
      p.communicate()
      return -9, "timeout"


cands = sorted(glob.glob(os.path.join(sdk_root, "MacOSX*.sdk")), key=ver_key)
probe_src = os.path.join(tmp, "probe.swift")
with open(probe_src, "w") as f:
  f.write("import Cocoa\nimport WebKit\n_ = WKWebView(frame: .zero)\n")


def flags(sdk, arch):
  return ["-swift-version", "5", "-sdk", sdk, "-target", f"{arch}-apple-macos11.0",
          "-framework", "Cocoa", "-framework", "WebKit"]


fails = []
for sdk in cands:
  ok = True
  for arch in archs:  # every requested architecture must probe on the same SDK
      rc, log = run(["swiftc", *flags(sdk, arch), "-o", os.path.join(tmp, f"probe-{arch}"), probe_src], 120)
      if rc != 0:
          fails.append(f"{sdk} [{arch}]: probe failed ({'timeout' if rc == -9 else log.strip().splitlines()[-1:]})")
          ok = False
          break
  if not ok:
      continue
  for arch in archs:
      rc, log = run(["swiftc", "-O", *flags(sdk, arch), "-o", os.path.join(tmp, f"exe-{arch}"), *sources], 180)
      if rc != 0:
          fails.append(f"{sdk} [{arch}]: build failed\n{log}")
          ok = False
          break
  if ok:
      print(sdk)
      sys.exit(0)
sys.stderr.write("no usable SDK for swiftc:\n" + "\n".join(fails) + "\n")
sys.exit(1)
PY
)"
IFS=',' read -r -a ARCH_LIST <<<"$ARCHS"
if [[ ${#ARCH_LIST[@]} -gt 1 ]]; then
  lipo -create "${ARCH_LIST[@]/#/$TMPD/exe-}" -output "$NEW"
else
  cp "$TMPD/exe-${ARCH_LIST[0]}" "$NEW"
fi

# Assemble in a staging copy (keeps a package's Resources/sfc if the target app already has one).
if [[ -d "$APP" ]]; then ditto --norsrc --noextattr "$APP" "$STAGE"; fi
mkdir -p "$STAGE/Contents/MacOS" "$STAGE/Contents/Resources"
cp "$NEW" "$STAGE/Contents/MacOS/Standard-Financial-Charting"
chmod +x "$STAGE/Contents/MacOS/Standard-Financial-Charting"
cat >"$STAGE/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>Standard-Financial-Charting</string>
	<key>CFBundleExecutable</key>
	<string>Standard-Financial-Charting</string>
	<key>CFBundleIconFile</key>
	<string>AppIcon</string>
	<key>CFBundleIdentifier</key>
	<string>local.fidv.Standard-Financial-Charting</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>Standard-Financial-Charting</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>2.2</string>
	<key>CFBundleVersion</key>
	<string>4</string>
	<key>LSApplicationCategoryType</key>
	<string>public.app-category.finance</string>
	<key>LSMinimumSystemVersion</key>
	<string>11.0</string>
	<key>LSMultipleInstancesProhibited</key>
	<true/>
	<key>NSHighResolutionCapable</key>
	<true/>
	<key>NSHumanReadableCopyright</key>
	<string>Standard-Financial-Charting. Data and computation stay on this Mac.</string>
</dict>
</plist>
PLIST
printf 'APPL????' >"$STAGE/Contents/PkgInfo"
if [[ -f "$ICNS_SRC" ]]; then
  cp "$ICNS_SRC" "$STAGE/Contents/Resources/AppIcon.icns"
fi
plutil -lint "$STAGE/Contents/Info.plist" >/dev/null

# Sign last, verify, and only then swap the live app. Hardened runtime always; no --deep when signing (verify only).
SIGN_ID="${SFC_SIGN_IDENTITY:--}"
SIGN_ARGS=(--force --options runtime --entitlements "$ROOT/scripts/sfc.entitlements")
if [[ "$SIGN_ID" == "-" ]]; then
  SIGN_ARGS+=(--timestamp=none)
else
  if ! security find-identity -v -p codesigning 2>/dev/null | grep -qF "\"$SIGN_ID\""; then
    echo "[Ind-Chain] SFC_SIGN_IDENTITY is set but no such identity is in the keychain; refusing to fall back to ad hoc." >&2
    exit 1
  fi
  SIGN_ARGS+=(--timestamp)
fi
xattr -cr "$STAGE" 2>/dev/null || true
codesign "${SIGN_ARGS[@]}" -s "$SIGN_ID" "$STAGE" >/dev/null
codesign --verify --deep --strict "$STAGE"
if [[ -d "$APP" ]]; then
  OLD="$APP_DIR/.sfc-old-$$.app"
  mv "$APP" "$OLD"
  mv "$STAGE" "$APP"
  rm -rf "$OLD"
else
  mv "$STAGE" "$APP"
fi
/usr/bin/touch "$APP"

OUT="$APP/Contents/MacOS/Standard-Financial-Charting"
echo "[Ind-Chain] built $OUT (swift; sdk=$USED_SDK; $(file -b "$OUT"))"
SIGN_DESC="ad hoc signature, hardened runtime, not notarized: spctl rejection is expected"
[[ "$SIGN_ID" != "-" ]] && SIGN_DESC="signed with the configured identity, hardened runtime; notarization is done by the package script"
echo "[Ind-Chain] spctl: $(spctl -a -vv "$APP" 2>&1 | tr '\n' ' ' || true)($SIGN_DESC)"
