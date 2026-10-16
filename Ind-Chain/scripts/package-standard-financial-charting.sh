#!/usr/bin/env bash
# Build the self-contained, distributable Standard-Financial-Charting.app (+ zip, SHA256SUMS, README-先读我.txt).
#   bash Ind-Chain/scripts/package-standard-financial-charting.sh [--no-entities]
# Two variants live side by side (a run builds one of them and only clears its own directory):
#   dist/internal/     contains the bics_entities_*.db third-party data derivative  -> INTERNAL distribution only
#   dist/noentities/   built with --no-entities, zip name ends in -noentities       -> may be shipped (owner-authorized)
# The package embeds a trimmed python.org universal2 Python (Contents/Frameworks/Python.framework): no system Python needed.
# Layout of the app resources mirrors the repo under Contents/Resources/sfc/, so no back-end path constant changes.
# Everything under Resources/sfc is copied from an explicit allow-list (never "copy the repo, then delete").
# Output goes to dist/ and build/ (both git-ignored).
#
# Signing / notarization (environment; secrets are never printed, never stored by this script):
#   SFC_SIGN_IDENTITY   keychain identity ("Developer ID Application: Name (TEAMID)"). Unset => ad hoc, NOT notarized.
#   SFC_NOTARY_PROFILE  profile created with `xcrun notarytool store-credentials`. Unset => no notarization.
# Failures are loud: unknown identity, profile without a Developer ID identity, unknown profile, notarization "Invalid".
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
cd "$REPO"
NO_ENTITIES=0
case "${1:-}" in
  "") ;;
  --no-entities) NO_ENTITIES=1 ;;
  *) echo "usage: $0 [--no-entities]" >&2; exit 2 ;;
esac
[[ $# -le 1 ]] || { echo "usage: $0 [--no-entities]" >&2; exit 2; }

VARIANT="internal"; [[ $NO_ENTITIES -eq 1 ]] && VARIANT="noentities"
BUILD="$REPO/build/pkg-$VARIANT"
DIST="$REPO/dist/$VARIANT"
ENT_REL="${SFC_ENTITIES_REL:-BE-CLASS/BICS-Classification/bics_entities_20261003.db}"  # override only to test the missing-data path
APP_NAME="Standard-Financial-Charting.app"
ENTITLEMENTS="$ROOT/scripts/sfc.entitlements"

for line in "/dist/" "/build/"; do
  grep -qxF "$line" .gitignore 2>/dev/null || printf '%s\n' "$line" >>.gitignore
done

# 0. signing configuration (validated before anything is built)
SIGN_ID="${SFC_SIGN_IDENTITY:--}"
NOTARY="${SFC_NOTARY_PROFILE:-}"
if [[ "$SIGN_ID" != "-" ]] && ! security find-identity -v -p codesigning 2>/dev/null | grep -qF "\"$SIGN_ID\""; then
  echo "[package] SFC_SIGN_IDENTITY is set but that identity is not in the keychain (see: security find-identity -v -p codesigning)." >&2
  echo "[package] refusing to fall back to an ad hoc signature." >&2
  exit 1
fi
if [[ -n "$NOTARY" ]]; then
  if [[ "$SIGN_ID" != Developer\ ID\ Application:* ]]; then
    echo "[package] SFC_NOTARY_PROFILE is set, but notarization needs SFC_SIGN_IDENTITY=\"Developer ID Application: ...\" (got: ${SIGN_ID/#-/ad hoc})." >&2
    exit 1
  fi
  if ! xcrun notarytool history --keychain-profile "$NOTARY" >/dev/null 2>&1; then
    echo "[package] notarytool profile \"$NOTARY\" does not exist or is not usable. Create it once with:" >&2
    echo "[package]   xcrun notarytool store-credentials \"$NOTARY\" --apple-id <id> --team-id <TEAMID> --password <app-specific password>" >&2
    exit 1
  fi
fi
if [[ "$SIGN_ID" == "-" ]]; then
  SIGN_MODE="ad hoc (not signed with a Developer ID; not notarized)"
  CS_COMMON=(--force --options runtime --timestamp=none)
else
  SIGN_MODE="Developer ID: $SIGN_ID"
  CS_COMMON=(--force --options runtime --timestamp)
fi
echo "[package] variant=$VARIANT signing=$SIGN_MODE notarize=$([[ -n "$NOTARY" ]] && echo "yes ($NOTARY)" || echo no)"

if [[ $NO_ENTITIES -eq 0 && ! -f "$REPO/$ENT_REL" ]]; then
  echo "[package] missing $ENT_REL (not tracked by git; produced by ingest_20261003_entities.py)." >&2
  echo "[package] refusing to build a package that silently lacks data. Use --no-entities to build without it." >&2
  exit 1
fi

# 1. embedded Python runtime (cached download, verified, trimmed, relocated, precompiled)
bash "$ROOT/scripts/fetch-embedded-python.sh"
PYFW_SRC="$REPO/build/python-runtime/Python.framework"
PY_FULL="$("$PYFW_SRC/Versions/Current/bin/python3" -I -c 'import sys; print("%d.%d.%d" % sys.version_info[:3])')"

rm -rf "$BUILD" "$DIST"
mkdir -p "$BUILD" "$DIST"

# 2. universal executable + signed shell app (reuses the build script; resources are added below)
BUILD_LOG="$BUILD/build.log"
SFC_APP_DIR="$BUILD" bash "$ROOT/scripts/build-standard-financial-charting-app.sh" | tee "$BUILD_LOG"
APP="$BUILD/$APP_NAME"
RES="$APP/Contents/Resources/sfc"
SDK_USED="$(sed -n 's/.*sdk=\([^;]*\);.*/\1/p' "$BUILD_LOG" | head -1)"
VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP/Contents/Info.plist")"
ARCHS="$(lipo -archs "$APP/Contents/MacOS/Standard-Financial-Charting")"

# 3. allow-list for Resources/sfc
EXPECTED="$BUILD/expected.txt"
{
  for f in app db db_shadow bundle_dispatch chain_layout nvda_links debt_ladder bics_hier bics_entity listing; do echo "Ind-Chain/server/$f.py"; done
  (cd "$ROOT/web" && find . -type f ! -name .DS_Store ! -name selfcheck-map.html | sed 's#^\./#Ind-Chain/web/#')
  for f in companies layers nvda-revenue-links; do echo "Ind-Chain/data/$f.json"; done
  [[ -f "$ROOT/data/links/nvda-revenue-links.xlsx" ]] && echo "Ind-Chain/data/links/nvda-revenue-links.xlsx"
  [[ -f "$ROOT/data/links/nvda-us-hq.json" ]] && echo "Ind-Chain/data/links/nvda-us-hq.json"
  # Bloomberg-derived debt ladder aggregate: internal variant only, and only when it has been baked locally.
  [[ $NO_ENTITIES -eq 0 && -f "$ROOT/data/debt-ladder-googl.json" ]] && echo "Ind-Chain/data/debt-ladder-googl.json"
  echo "BE-CLASS/BICS-Classification/bics-equity-hierarchy-2024.json"
  [[ $NO_ENTITIES -eq 0 ]] && echo "$ENT_REL"
  echo "modules/graph.json"
  echo "modules/index.html"
} | LC_ALL=C sort >"$EXPECTED"

mkdir -p "$RES"
while IFS= read -r rel; do
  [[ -f "$REPO/$rel" ]] || { echo "[package] allow-listed file missing: $rel" >&2; exit 1; }
  mkdir -p "$RES/$(dirname "$rel")"
  ditto --norsrc --noextattr "$REPO/$rel" "$RES/$rel"
done <"$EXPECTED"

# 4. embedded runtime + third-party notices (outside Resources/sfc: that area stays the exact allow-list)
mkdir -p "$APP/Contents/Frameworks"
ditto --norsrc --noextattr "$PYFW_SRC" "$APP/Contents/Frameworks/Python.framework"
PY_MM="${PY_FULL%.*}"
{
  echo "THIRD-PARTY NOTICES — Standard-Financial-Charting"
  echo
  echo "Python $PY_FULL (python.org universal2 build, signed by the Python Software Foundation)"
  echo "  License: PSF License Agreement (full text below). Source and binaries: https://www.python.org/"
  echo "OpenSSL 3 (libssl / libcrypto inside the Python framework): Apache License 2.0, https://www.openssl.org/source/license.html"
  echo "zstd (libzstd inside the Python framework): BSD-3-Clause, https://github.com/facebook/zstd"
  echo "ncurses (libncurses, libform, libmenu, libpanel inside the Python framework): X11/MIT-style, https://invisible-island.net/ncurses/"
  echo "SQLite: NOT bundled; Python uses the macOS system library (public domain)."
  echo "three.js 0.170.0 (Resources/sfc/Ind-Chain/web/vendor/three): MIT, full text in vendor/three/LICENSE."
  echo "Jost Light 300, caps subset (Resources/sfc/Ind-Chain/web/vendor/fonts/jost): SIL Open Font License 1.1, full text in vendor/fonts/jost/OFL.txt. Source: https://github.com/indestructible-type/Jost"
  echo "Bloomberg-derived debt-ladder aggregate (Resources/sfc/Ind-Chain/data/debt-ladder-*.json, internal variant only, when present): third-party data derivative, internal use only; do not publish."
  echo
  echo "----- Python license (Python/LICENSE.txt, verbatim) -----"
  cat "$APP/Contents/Frameworks/Python.framework/Versions/Current/lib/python${PY_MM}/LICENSE.txt"
} >"$APP/Contents/Resources/THIRD-PARTY-NOTICES.txt"

# 5. VERSION.txt (written before signing; does not list itself)
GIT_SHORT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
[[ -n "$(git status --porcelain -- Ind-Chain modules BE-CLASS 2>/dev/null)" ]] && GIT_SHORT="$GIT_SHORT+uncommitted"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
FILES_DIGEST="$(cd "$RES" && find . -type f ! -name VERSION.txt | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256 | cut -d' ' -f1)"
{
  echo "Standard-Financial-Charting $VERSION"
  echo "built:      $STAMP"
  echo "git:        $GIT_SHORT"
  echo "sdk:        $SDK_USED"
  echo "archs:      $ARCHS"
  echo "python:     $PY_FULL (embedded, Contents/Frameworks/Python.framework)"
  echo "signing:    $SIGN_MODE"
  echo "files:      $(cd "$RES" && find . -type f ! -name VERSION.txt | wc -l | tr -d ' ')"
  echo "files-sha256 (digest of sorted per-file sha256 lines): $FILES_DIGEST"
  if [[ $NO_ENTITIES -eq 0 ]]; then
    echo "entities-db: included. Contains a third-party data derivative: internal distribution only; do not publish."
  else
    echo "entities-db: NOT included (built with --no-entities)."
  fi
} >"$RES/VERSION.txt"

# 6. exact allow-list check: nothing else may be inside Resources/sfc
ACTUAL="$BUILD/actual.txt"
(cd "$RES" && find . -type f | sed 's#^\./##' | LC_ALL=C sort) >"$ACTUAL"
{ cat "$EXPECTED"; echo "VERSION.txt"; } | LC_ALL=C sort >"$BUILD/expected-with-version.txt"
if ! diff -u "$BUILD/expected-with-version.txt" "$ACTUAL" >"$BUILD/allowlist.diff"; then
  echo "[package] Resources/sfc differs from the allow-list:" >&2
  cat "$BUILD/allowlist.diff" >&2
  exit 1
fi

# 7. every embedded Mach-O must carry both architectures (a single-architecture file would break one class of Mac)
FW="$APP/Contents/Frameworks/Python.framework"
MACHO_LIST="$BUILD/macho.txt"
: >"$MACHO_LIST"
while IFS= read -r f; do
  file -b "$f" | grep -q "Mach-O" || continue
  a="$(lipo -archs "$f" | tr ' ' '\n' | LC_ALL=C sort | tr '\n' ' ')"
  [[ "$a" == "arm64 x86_64 " ]] || { echo "[package] not universal ($a): ${f#"$APP"/}" >&2; exit 1; }
  echo "$f" >>"$MACHO_LIST"
done < <(find "$FW" -type f | LC_ALL=C sort)
MACHO_N="$(wc -l <"$MACHO_LIST" | tr -d ' ')"
echo "[package] embedded Mach-O files: $MACHO_N (all arm64 + x86_64)"

# 8. sign inside-out (never --deep when signing): nested code, then the framework, then the app
cs() { codesign "${CS_COMMON[@]}" "$@" 2>"$BUILD/codesign.err" >/dev/null || { cat "$BUILD/codesign.err" >&2; return 1; }; }
xattr -cr "$APP" 2>/dev/null || true
# Ad hoc signatures carry no Team ID, so hardened-runtime library validation refuses the interpreter's own libraries
# ("different Team IDs", measured). Only for ad hoc builds, and only on the interpreter executable, library validation is
# switched off. With a real identity everything shares one Team ID and no entitlement is added (re-verify with one).
PY_ENT="$BUILD/adhoc-python.entitlements"
cat >"$PY_ENT" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>com.apple.security.cs.disable-library-validation</key><true/></dict></plist>
PLIST
while IFS= read -r f; do
  if [[ "$SIGN_ID" == "-" && "$f" == */Versions/*/bin/python3.* ]]; then
    cs --entitlements "$PY_ENT" -s "$SIGN_ID" "$f"
  else
    cs -s "$SIGN_ID" "$f"
  fi
done <"$MACHO_LIST"
cs -s "$SIGN_ID" "$FW"
cs --entitlements "$ENTITLEMENTS" -s "$SIGN_ID" "$APP"
while IFS= read -r f; do codesign --verify --strict "$f"; done <"$MACHO_LIST"
# with a real identity a library-validation refusal would still pass notarization; run the signed interpreter once now
"$FW/Versions/Current/bin/python3" -I -c 'import sqlite3, ssl, json, http.server' || { echo "[package] the signed embedded Python cannot start or import its libraries" >&2; exit 1; }
codesign --verify --deep --strict --verbose=2 "$APP" 2>"$BUILD/verify.txt" || { cat "$BUILD/verify.txt" >&2; exit 1; }
echo "[package] codesign verify (--deep --strict): ok"

# 9. notarize (only with a Developer ID identity and a stored profile), staple BEFORE zipping
SIGN_STATE="adhoc"
SPCTL_NOTE=""
if [[ -n "$NOTARY" ]]; then
  NZIP="$BUILD/notarize-upload.zip"
  ditto -c -k --keepParent "$APP" "$NZIP"
  SUBMIT_OUT="$BUILD/notarytool-submit.json"
  if ! xcrun notarytool submit "$NZIP" --keychain-profile "$NOTARY" --wait --output-format json >"$SUBMIT_OUT" 2>"$BUILD/notarytool.err"; then
    echo "[package] notarytool submit failed:" >&2; tail -5 "$BUILD/notarytool.err" >&2; exit 1
  fi
  NSTATUS="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("status",""))' "$SUBMIT_OUT")"
  NID="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("id",""))' "$SUBMIT_OUT")"
  if [[ "$NSTATUS" != "Accepted" ]]; then
    echo "[package] notarization status: $NSTATUS (submission $NID). Issues:" >&2
    xcrun notarytool log "$NID" --keychain-profile "$NOTARY" 2>&1 | python3 -c '
import json, sys
t = sys.stdin.read()
try:
    for i in json.loads(t).get("issues", []) or []:
        print("  -", i.get("severity"), i.get("path"), "::", i.get("message"))
except Exception:
    print(t[-1500:])
' >&2
    echo "[package] no zip produced." >&2
    exit 1
  fi
  xcrun stapler staple "$APP" >/dev/null
  xcrun stapler validate "$APP" >/dev/null
  SP="$(spctl -a -vv -t exec "$APP" 2>&1 || true)"
  if ! grep -q "accepted" <<<"$SP" || ! grep -q "Notarized Developer ID" <<<"$SP"; then
    echo "[package] Gatekeeper check after stapling did not report a notarized Developer ID app:" >&2; echo "$SP" >&2; exit 1
  fi
  SIGN_STATE="notarized"
  SPCTL_NOTE="$(tr '\n' ' ' <<<"$SP")"
elif [[ "$SIGN_ID" != "-" ]]; then
  SIGN_STATE="signed"
fi
[[ -n "$SPCTL_NOTE" ]] || SPCTL_NOTE="$(spctl -a -vv -t exec "$APP" 2>&1 | tr '\n' ' ' || true)"
echo "[package] signing state: $SIGN_STATE; spctl: $SPCTL_NOTE"

# 10. dist (the zip is made from the stapled app)
ditto --norsrc --noextattr "$APP" "$DIST/$APP_NAME"
ZIP="Standard-Financial-Charting-$VERSION-$(date +%Y%m%d)"
[[ $NO_ENTITIES -eq 1 ]] && ZIP="$ZIP-noentities"
ZIP="$ZIP.zip"
(cd "$DIST" && ditto -c -k --keepParent "$APP_NAME" "$ZIP")
ZIP_SHA="$(shasum -a 256 "$DIST/$ZIP" | cut -d' ' -f1)"

case "$SIGN_STATE" in
  notarized)
    SIGN_LINE="已用 Developer ID 签名并经 Apple 公证（已附票据）。可直接双击打开，无需任何额外步骤。"
    OPEN_HOW="   已公证：把 Standard-Financial-Charting.app 拖到「应用程序」文件夹后直接双击即可。" ;;
  signed)
    SIGN_LINE="已用 Developer ID 签名，但未公证。"
    OPEN_HOW="   先把 Standard-Financial-Charting.app 拖到「应用程序」文件夹，再在终端逐字运行：
       xattr -dr com.apple.quarantine /Applications/Standard-Financial-Charting.app
   然后双击打开。" ;;
  *)
    SIGN_LINE="ad-hoc 临时签名，未公证（本机没有 Developer ID 身份）。"
    OPEN_HOW="   先把 Standard-Financial-Charting.app 拖到「应用程序」文件夹，再在终端逐字运行：
       xattr -dr com.apple.quarantine /Applications/Standard-Financial-Charting.app
   然后双击打开。
   备选：macOS 14 及更早可「右键 → 打开」；macOS 15 及以上请先双击一次，再到「系统设置 → 隐私与安全性」点「仍要打开」。" ;;
esac

read -r CO_N CO_V LAYER_N < <(python3 - "$ROOT/data" <<'PY'
import json, sys
d = sys.argv[1]
c = json.load(open(d + "/companies.json"))
print(len(c), sum(1 for r in c if r.get("value_m") is not None), len(json.load(open(d + "/layers.json"))))
PY
)
if [[ $NO_ENTITIES -eq 0 ]]; then
  SEC8="8. 内部分发提示
   本包含彭博加工的实体库（第三方数据加工物），仅限团队内部分发，不得公开发布 / 上传公共网站。"
else
  SEC8="8. 外发版（不含实体库）
   本包以 --no-entities 构建，不含实体库（bics_entities_*.db）。
   不含的后果：按 BICS 行业取公司名单的接口返回空名单（entities 为 0、count 为 0，不报错）；按公司名 / 代码搜索（locate）无命中；
   行业层级、制图台（含 NVDA 链）等其余功能不受影响。
   本包仍含（外发前请自行确认各自许可）：
     - 彭博 BICS 行业层级 JSON（bics-equity-hierarchy-2024.json，行业名称 / 代码树）；
     - companies.json（${CO_N} 家公司；其中 ${CO_V} 家带 value_m 数值，代码把它们标注为彭博 Alphabet 供应商关系 GOOGL_SUPPLY.xlsx，其余为公开行业图谱）；
     - nvda-revenue-links.json（文件自注来源：Bloomberg Supply Chain Summary 2026-10-05 截图整理 + 旧 json，即含彭博供应链数据）；
     - layers.json（${LAYER_N} 个层名称与简介，自拟，无外部来源标注）；
     - three.js 0.170.0（MIT）；Jost Light 字体子集（OFL）；内置 Python ${PY_FULL}（PSF）、OpenSSL（Apache-2.0）等，声明见 Contents/Resources/THIRD-PARTY-NOTICES.txt。
   外发由业主授权；转发前请自行确认上述内容的许可，本说明不构成法律意见。"
fi

cat >"$DIST/README-先读我.txt" <<EOF
Standard-Financial-Charting ${VERSION}  先读我
=====================================================

1. 系统要求
   macOS 11 或更高；Apple 芯片或 Intel 均可（通用二进制：${ARCHS}）。
   制图台使用 import map，需 Safari/WebKit 16.4+；macOS 11/12 请先更新 Safari，建议 macOS 13 及以上。

2. 前置条件
   无需本机安装 Python：应用内置 Python ${PY_FULL}。仅当内置运行时异常时，才回落到本机 Python 3.9+，
   两者都没有时应用会在窗口内给出「需要 Python 3.9+」面板，不会崩溃。

3. 首次打开（签名状态：${SIGN_LINE}）
${OPEN_HOW}

4. 数据与日志（全部在你的用户目录，不写进应用包）
   数据：~/Library/Application Support/Standard-Financial-Charting/
   日志：~/Library/Logs/Standard-Financial-Charting/backend.log（上一次为 backend.prev.log；开头几行内可见 python=… source=bundled）
   菜单「帮助」里有「显示日志」「显示数据文件夹」。
   清除：退出应用后删除上述两个目录即可；卸载：再把应用拖进废纸篓。

5. 单实例
   同一时间只能运行一个。仓内开发版与本分发版使用同一个应用标识，二者互斥（预期行为）。

6. 离线可用
   全部页面与 three.js 都在包内，运行期不联网。

7. 版本与校验
   版本 ${VERSION}；构建 ${STAMP}；git ${GIT_SHORT}；内置 Python ${PY_FULL}。
   zip 的 SHA-256：${ZIP_SHA}
   同目录 SHA256SUMS.txt 可用  shasum -a 256 -c SHA256SUMS.txt  校验。

${SEC8}

9. 隐私
   不收集任何数据，不联网，无遥测、无自动更新。应用只在 127.0.0.1 上与自己的内置后端通信。
EOF

(cd "$DIST" && shasum -a 256 "$ZIP" "README-先读我.txt" >SHA256SUMS.txt)
(cd "$DIST" && shasum -a 256 -c SHA256SUMS.txt)

echo "[package] dist/$VARIANT ready: $DIST"
ls -la "$DIST"
if [[ $NO_ENTITIES -eq 0 ]]; then
  echo "[package] INTERNAL distribution only (third-party data derivative). dist/ and build/ are git-ignored; never commit them."
else
  echo "[package] -noentities variant: may be shipped (owner-authorized); it still contains the BICS hierarchy JSON and demo data. Never commit dist/ or build/."
fi
echo "[package] signing state: $SIGN_STATE"
