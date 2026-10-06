# ops-log-001 — FIDV 运行问题
更新：2026-10-06 · 书记处运维 · 接 clone/ingest 空名单

格式：现象 · 原因 · 解法 · 路径。流水序号全库连续。

---

## 1. 问题流水

| # | 现象 | 原因 | 解法 | 路径 |
|---|---|---|---|---|
|1| GitHub 克隆后首页有分类格、家数 0、四级无公司 | 成员库 `bics_entities_20261003.db` gitignore，clone 不带；ingest 造库不是连库；`app.py` 按路径打开文件 | 终端进入仓库根目录：`pip3 install openpyxl` 后 `python3 class-3-coords/BICS-Classification/ingest_20261003_entities.py`；`quit` 再开 `./Open-AI-Cube.command` | `library/showable-report/FIDV-clone-handbook.html` |
