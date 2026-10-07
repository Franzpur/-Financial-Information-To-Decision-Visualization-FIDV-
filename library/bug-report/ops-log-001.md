# ops-log-001 — FIDV 运行问题与解法摘要
更新：2026-10-07 · 书记处运维 · 接 clone/ingest 空名单；补 Standard-Cube.app 启动与移植

格式：现象 · 原因 · 解法 · 路径。流水序号全库连续。

打印读本：[`FIDV 问题手册 · GitHub 克隆后分类空.pdf`](./FIDV%20问题手册%20·%20GitHub%20克隆后分类空.pdf)（与 `library/showable-report/FIDV-clone-handbook.html` 同题；业主 10-07 放入本夹，内容对接流水 #1）。

---

## 1. 问题流水

| # | 现象 | 原因 | 解法 | 路径 |
|---|---|---|---|---|
|1| GitHub 克隆后首页有分类格、家数 0、四级无公司 | 成员库 `bics_entities_* .db` gitignore，clone 不带；ingest 造库不是连库；服务按路径打开文件 | 终端进仓根：`pip3 install openpyxl` 后 `python3 class-3-coords/BICS-Classification/ingest_20261003_entities.py`；再开 `Standard-Cube.app`（Restart 或重新双击） | `library/showable-report/FIDV-clone-handbook.html`；本夹 PDF 同题 |
|2| 双击启动入口无反应 / 监测不到 app 活动 | 旧入口曾用 `.command`（必弹终端）或 `.app` 内 **bash 脚本**作可执行文件；macOS Launch Services 报 `kLSNoExecutableErr`（-10827），进程未真正起来 | 根目录用 **`Standard-Cube.app`**，可执行文件须为 **Mach-O**（`Contents/MacOS/Standard-Cube`），再 `exec` `ind-chain/scripts/launcher_gui.py`。改桩后跑 `./ind-chain/scripts/build-standard-cube-app.sh`。排障看 `ind-chain/data/launcher-last.log` | `Standard-Cube.app`；`ind-chain/scripts/standard-cube-stub.c` |
|3| 换到 **Intel Mac** 双击 `.app` 打不开 | 仓内预编译桩多为 **arm64** 单架构，Intel 不能直接跑 | 在该机重跑 `./ind-chain/scripts/build-standard-cube-app.sh`（需 clang + 可用 SDK）；或暂用 `python3 ind-chain/scripts/launcher_gui.py` | `ind-chain/scripts/build-standard-cube-app.sh` |
|4| **Windows** 无法双击 `Standard-Cube.app` | `.app` / Mach-O / Launch Services 为 macOS 专用；集成壳未做 Windows 版 | 用 `python ind-chain/scripts/launcher_gui.py`（需带 tkinter 的 Python），或 headless：`cd ind-chain && python scripts/seed.py && python server/app.py`，浏览器开 `http://127.0.0.1:8787/`。产品核心（HTTP+网页）可移植；**不要指望拷 `.app` 同晕** | `ind-chain/README.md`；根 `README.md` |
|5| 其他 **Apple Silicon Mac** 克隆后启动窗起不来 | 少见为桩本身；常见：`.app` 未与 `ind-chain/` 同仓根、缺带 **tkinter** 的 Python 3、Gatekeeper/隔离属性挡启动 | 保持整仓布局；确认 `python3 -c "import tkinter"`；必要时「仍要打开」；缺窗先看 `launcher-last.log`。名单空仍走 #1 ingest，与启动桩无关 | `ind-chain/data/launcher-last.log` |

---

## 2. 移植结论（启动壳）

**不会再以「bash 当 .app 可执行 → -10827」同一形式复发**（桩已是 Mach-O）。换机仍可能有入口/环境差异，不能保证零问题：

- Silicon → Silicon：拷仓 + Tk 齐，启动桩同类 bug 概率低。
- Intel：须本机重编桩。
- Windows：换入口，另做或走 Python/CLI。
