# Financial Information To Decision Visualization (FIDV)

To standardly visualize statistics to fit human perception, so managers can make decisions more easily.

上传范围见 [`PUBLIC-PRIVATE.md`](./PUBLIC-PRIVATE.md)（公私隔离协议）：工程进仓；agent 与调度任务留在各人本机。写码权见 [`POWER-KNOWLEDGE.md`](./POWER-KNOWLEDGE.md)（权知统一：专知内美工/信息可改码；交叉整合部仅在总参谋部调度且任务写明实现时合并产品代码；其余跨域仍父代理；终裁为监理部三监报告）。

## Modules

| Path | Description |
|------|-------------|
| [`agent_tasklist/DESIGN.md`](./agent_tasklist/DESIGN.md) | 第一版设计理念。设计前先读 |
| [`agent_tasklist/AESTHETIC.md`](./agent_tasklist/AESTHETIC.md) | 美学真源（色板、chrome、splash、图标） |
| [`agent_tasklist/INFORMATION.md`](./agent_tasklist/INFORMATION.md) | 数据真源（词条、乱缺、BQLX 公式） |
| [`POWER-KNOWLEDGE.md`](./POWER-KNOWLEDGE.md) | 权知统一：专知 ↔ 改码权 |
| `agents/` | 本机工作工具，不随仓。见 `PUBLIC-PRIVATE.md` |
| [`BE-CLASS/`](./BE-CLASS/) | 3类坐标 / 行业坐标（BICS Equity Hierarchy 2024） |
| [`Ind-Chain/`](./Ind-Chain/) | Decision view. Industry-chain cube (Standard-Financial-Charting). Firms are nodes on slices |
| [`library/`](./library/) | 工作日志、可打印读本与运维记录 |
| [`cabinet/`](./cabinet/) | 内阁整理数据、图件、新闻、分析报告；可打印报告在 `cabinet/reports/` |
| [`modules/`](./modules/) | 模块图真源（`graph.json`）与静态投影（`index.html`） |
| [`Ind-Chain/CONCEPTS.md`](./Ind-Chain/CONCEPTS.md) | Concept library (ZH/EN): one name for slice, axes, pull |

### Run Standard-Financial-Charting

Double-click `Standard-Financial-Charting.app` in Finder: a native window; the app starts its own embedded back end and quits it when the window closes. Only one instance runs at a time. Works offline (three.js is vendored under `Ind-Chain/web/vendor/three/`).

Prerequisites: macOS 11+. The distributed app carries its own Python (python.org 3.14, universal2), so no Python needs to be installed. Only if that embedded runtime fails does the shell fall back to a system Python 3.9+; with neither, the app shows an error panel instead of a window. The repo-root `.app` (a development build) has no embedded Python and uses the system one.

```bash
# development path (no app): http://127.0.0.1:8787/ , data in Ind-Chain/data/
python3 Ind-Chain/server/app.py
# optional headless seed first
cd Ind-Chain && python3 scripts/seed.py && python3 server/app.py

# rebuild the app (only after changing Ind-Chain/shell/ or the build script)
./Ind-Chain/scripts/build-standard-financial-charting-app.sh
# self-contained zip with embedded Python -> dist/internal/ (contains third-party data: internal use only)
bash Ind-Chain/scripts/package-standard-financial-charting.sh
# external variant without the entities data -> dist/noentities/ (zip name ends in -noentities)
bash Ind-Chain/scripts/package-standard-financial-charting.sh --no-entities
# regressions (details in Ind-Chain/README.md)
bash Ind-Chain/scripts/regress_all.sh quick
bash Ind-Chain/scripts/regress_all.sh full    # also tests the packages found in dist/
```

App data: `~/Library/Application Support/Standard-Financial-Charting/`; log: `~/Library/Logs/Standard-Financial-Charting/backend.log`. Homepage `/`, cube `/cube`. The `.app` is a universal binary (arm64 + x86_64) with the hardened runtime on.

### Signing and notarization

Status today: **this Mac has no Developer ID identity, so every app and zip is ad-hoc signed and NOT notarized** (Gatekeeper rejects it until the user runs `xattr -dr com.apple.quarantine <app>` or uses right-click, Open). The pipeline is in place and switches on by environment variables:

| Variable | Meaning |
|----------|---------|
| `SFC_SIGN_IDENTITY` | Keychain identity, e.g. `Developer ID Application: Name (TEAMID)`. Unset: ad hoc. Set but unknown: the script fails (no silent downgrade). |
| `SFC_NOTARY_PROFILE` | Profile created by `xcrun notarytool store-credentials`. Unset: no notarization. Needs a Developer ID identity; unknown profile or `Invalid` result: the script fails and produces no zip. |

One-time steps for the owner: (1) join the Apple Developer Program; (2) create a "Developer ID Application" certificate (Xcode, Settings, Accounts, Manage Certificates) and keep a `.p12` backup outside the repo; (3) check `security find-identity -v -p codesigning`; (4) `xcrun notarytool store-credentials "sfc-notary" --apple-id <id> --team-id <TEAMID> --password <app-specific password>`; (5) run `SFC_SIGN_IDENTITY="Developer ID Application: Name (TEAMID)" SFC_NOTARY_PROFILE=sfc-notary bash Ind-Chain/scripts/package-standard-financial-charting.sh [--no-entities]`; (6) verify `spctl -a -vv -t exec <app>` says `accepted` and `source=Notarized Developer ID`, `xcrun stapler validate <app>` passes, then download the zip through a browser and double-click it. Certificates and credentials never go into the repo (`.gitignore` blocks `*.p12`, `*.p8`, `*.cer` and similar). With a real identity, re-run the hardened-runtime checks: the ad-hoc build adds `disable-library-validation` to the Python interpreter only, because ad-hoc signatures have no Team ID; a real identity should not need it.

### Two packages

| Variant | Folder | Contents | Use |
|---------|--------|----------|-----|
| internal (内部包) | `dist/internal/` | includes `bics_entities_*.db` (Bloomberg-derived entities) | team only, never public |
| external (外发包 = 外发版) | `dist/noentities/` (`-noentities.zip`) | no entities db: lists come back empty and name search finds nothing; the rest works | may be shipped (owner-authorized); still holds the BICS hierarchy JSON and demo data, see `PUBLIC-PRIVATE.md` |
