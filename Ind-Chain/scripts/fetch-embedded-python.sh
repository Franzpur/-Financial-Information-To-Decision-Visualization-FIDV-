#!/usr/bin/env bash
# Fetch, verify, trim and relocate the embedded Python runtime (python.org universal2 installer).
#   bash Ind-Chain/scripts/fetch-embedded-python.sh      -> build/python-runtime/Python.framework  (+ RUNTIME-MANIFEST.txt)
# Used by package-standard-financial-charting.sh. Downloads only from python.org, never installs anything into the system
# (pkgutil --expand-full into build/, no sudo), never uses pip/Homebrew. The cache and the output live in build/ (git-ignored).
# Pinned release (update the three PY_* lines together, then re-run; a wrong SHA-256 aborts and the file is not used):
set -euo pipefail
PY_VER="3.14.8"
PY_URL="https://www.python.org/ftp/python/${PY_VER}/python-${PY_VER}-macos11.pkg"
PY_SHA256="507fc086c5c006ff875d344a75b4e67b8fb3c401f1bc4908c6250adb673d4907"   # measured; python.org publishes only MD5 for the pkg
PY_MD5="25beb679036d0024db0a921ee5cad619"                                       # cross-check against the release page
PSF_TEAM="BMM5U3QVKW"                                                           # Developer ID Installer: Python Software Foundation
PY_MM="${PY_VER%.*}"                                                            # 3.14
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$ROOT/build/python-runtime"
PKG="$WORK/python-${PY_VER}-macos11.pkg"
OUT="$WORK/Python.framework"
mkdir -p "$WORK"

if [[ ! -f "$PKG" ]]; then
  echo "[python] downloading $PY_URL"
  curl -sSfL --max-time 900 -o "$PKG.part" "$PY_URL" && mv "$PKG.part" "$PKG"
fi
GOT="$(shasum -a 256 "$PKG" | cut -d' ' -f1)"
if [[ "$GOT" != "$PY_SHA256" ]]; then
  echo "[python] SHA-256 mismatch for $PKG (got $GOT, want $PY_SHA256); refusing to use it." >&2
  rm -f "$PKG"; exit 1
fi
[[ "$(md5 -q "$PKG")" == "$PY_MD5" ]] || { echo "[python] MD5 cross-check failed; refusing to use $PKG" >&2; rm -f "$PKG"; exit 1; }
SIG="$(pkgutil --check-signature "$PKG" 2>&1)"
echo "$SIG" | rg -q "Python Software Foundation \($PSF_TEAM\)" || { echo "[python] package is not signed by the PSF ($PSF_TEAM):" >&2; echo "$SIG" >&2; exit 1; }
echo "[python] $PY_VER sha256=$GOT; signature: PSF ($PSF_TEAM)"

rm -rf "$WORK/expand" "$OUT"
pkgutil --expand-full "$PKG" "$WORK/expand"
PAYLOAD="$WORK/expand/Python_Framework.pkg/Payload"
[[ -d "$PAYLOAD/Versions/$PY_MM" ]] || { echo "[python] unexpected installer layout" >&2; exit 1; }
ditto "$PAYLOAD" "$OUT"
rm -rf "$WORK/expand"
V="$OUT/Versions/$PY_MM"

# ---- trim (the rest of the standard library stays intact) ----
# bin/python3.14 is only a stub that re-executes Resources/Python.app/.../Python (GUI bundle). Use the real launcher directly.
cp "$V/Resources/Python.app/Contents/MacOS/Python" "$V/bin/python${PY_MM}.real" && mv -f "$V/bin/python${PY_MM}.real" "$V/bin/python${PY_MM}"
ln -sf "python${PY_MM}" "$V/bin/python3"
rm -rf "$V/Resources/Python.app" "$V/include" "$V/Headers" "$OUT/Headers" "$V/share" "$V/etc/openssl/misc" \
       "$V/Frameworks" "$V/lib/pkgconfig" "$V/lib/libpython${PY_MM}.dylib" "$V/_CodeSignature"
find "$V/bin" -mindepth 1 ! -name "python3" ! -name "python${PY_MM}" -delete          # pydoc/idle/*-config/*-intel64
L="$V/lib/python${PY_MM}"
rm -rf "$L/test" "$L/idlelib" "$L/tkinter" "$L/turtledemo" "$L/ensurepip" "$L"/config-* "$L/site-packages" "$L"/__pycache__
rm -f  "$L/turtle.py"
rm -f  "$L"/lib-dynload/{_tkinter,_test,_ctypes_test,_xxtestfuzz,_remote_debugging,xxlimited,xxsubtype}*   # tk, test and debugger-attach modules
find "$L" -type d \( -name test -o -name tests \) -prune -exec rm -rf {} +
mkdir -p "$L/site-packages"
find "$OUT" -name ".DS_Store" -delete
# dangling links would stop codesign from sealing the framework
find "$OUT" -type l | while read -r l; do
  [[ -e "$l" ]] || { echo "[python] removed dangling symlink ${l#"$OUT"/}"; rm -f "$l"; }
done

# ---- relocate: no absolute /Library/Frameworks references may remain (a Mac with a system Python must not be used) ----
python3 - "$OUT" "$PY_MM" <<'PY'
import os, subprocess, sys
out, mm = sys.argv[1:3]
root = os.path.join(out, "Versions", mm)
old = f"/Library/Frameworks/Python.framework/Versions/{mm}/"
n = 0
for d, _, fs in os.walk(out):
    for f in fs:
        p = os.path.join(d, f)
        if os.path.islink(p) or "Mach-O" not in subprocess.run(["file", "-b", p], capture_output=True, text=True).stdout:
            continue
        rel = os.path.relpath(root, os.path.dirname(os.path.realpath(p)))
        deps = subprocess.run(["otool", "-L", p], capture_output=True, text=True).stdout.splitlines()[1:]
        cmds = []
        for line in deps:
            ref = line.strip().split(" (")[0]
            if ref.startswith(old):
                cmds += ["-change", ref, "@loader_path/" + os.path.join(rel, ref[len(old):])]
        ident = subprocess.run(["otool", "-D", p], capture_output=True, text=True).stdout.splitlines()
        if len(ident) > 1 and ident[-1].startswith(old):
            cmds += ["-id", "@loader_path/" + os.path.join(rel, ident[-1][len(old):])]
        if cmds:
            subprocess.run(["install_name_tool", *cmds, p], check=True, capture_output=True)
            n += 1
        # ad-hoc re-sign: install_name_tool invalidates the signature and arm64 refuses to run unsigned code
        subprocess.run(["codesign", "--force", "--sign", "-", p], check=True, capture_output=True)
print(f"[python] relocated {n} Mach-O files")
PY
LEFT="$(find "$OUT" -type f -exec sh -c 'file -b "$1" | grep -q Mach-O && otool -L "$1" | grep -qE "^[[:space:]]+/Library/Frameworks" && echo "$1"' _ {} \;)"
if [[ -n "$LEFT" ]]; then
  echo "[python] absolute /Library/Frameworks reference left after relocation in:" >&2; echo "$LEFT" >&2; exit 1
fi

# ---- run from its new place, then precompile (the sealed .app is read-only at run time) ----
PYBIN="$V/bin/python${PY_MM}"
"$PYBIN" -I -c "import sys, sqlite3, ssl, json, http.server; print('[python] ok', sys.version.split()[0], sys.prefix.split('/build/')[-1], 'sqlite', sqlite3.sqlite_version, ssl.OPENSSL_VERSION)"
"$PYBIN" -I -m compileall -q -f -j0 --invalidation-mode checked-hash \
  -s "$V" -p "/Python.framework/Versions/$PY_MM" "$L" >/dev/null
# the copy we ship must not carry the build host's path in anything but zero-length strings
rc=0; rg -l --binary --no-ignore --hidden -F "$ROOT" "$OUT" >"$WORK/.leak-check" || rc=$?
if [[ $rc -gt 1 ]]; then echo "[python] leak check failed to run (rg exit $rc)" >&2; exit 1; fi
if [[ -s "$WORK/.leak-check" ]]; then echo "[python] build path embedded in:" >&2; cat "$WORK/.leak-check" >&2; exit 1; fi
rm -f "$WORK/.leak-check"

# ---- runtime manifest ----
{
  echo "Python $PY_VER (python.org universal2, $PY_URL)"
  echo "sha256 $PY_SHA256   signer: Python Software Foundation ($PSF_TEAM)"
  echo "files: $(find "$OUT" -type f | wc -l | tr -d ' ')   size: $(du -sh "$OUT" | cut -f1)"
  echo "-- Mach-O files (archs, minos)"
  find "$OUT" -type f | sort | while read -r f; do
    if file -b "$f" | grep -q Mach-O; then
      echo "$(lipo -archs "$f" 2>/dev/null | tr ' ' ',')  $(vtool -arch arm64 -show-build "$f" 2>/dev/null | awk '/minos/{print $2; exit}')  ${f#"$OUT"/}"
    fi
  done
} > "$WORK/RUNTIME-MANIFEST.txt"
sed -n '1,4p' "$WORK/RUNTIME-MANIFEST.txt"
echo "[python] runtime ready: $OUT"
