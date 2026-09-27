# WORKLOG — GOOGL / AI Chain Cube / FIDV
更新：2026-09-27 · 账号 GitHub `Franzpur` · 本机路径见文末

格式：`U=`用户简令 · `A=`我方简应 · 够后续接续即可。

---
> **主仓已迁至 FIDV**（本文件随仓）。本机克隆：`/Volumes/DATA/ANA_RSLT/FIDV`（或工作区根）。原 `ANA_RSLT` 仅作数据邻接盘；开发以本仓为准。
>
> **概念靶向库**：[`ai-chain/CONCEPTS.md`](./ai-chain/CONCEPTS.md) — 切片/轴/抽出/标准视角等中英对照；续工必读。

---

## 1. 对话流水（压缩）

### 阶段 A — GOOGL 财务（2026-09-25）
| # | U | A |
|---|---|---|
|1| 读同级 `googl example`，讲财务整体、最大风险、如何诊断阻断、如何安全充裕融资 | 读表/PDF；概括盈利与现金流强、云与广告结构；风险：监管/广告周期/AI capex 与供应商集中；诊断指标与融资结构建议（债股、期限匹配等）。另有 canvas 类分析产物。 |

### 阶段 B — 3D 产业链立方体立项（09-26）
| # | U | A |
|---|---|---|
|2| 据 `GOOGL_SA`/`GOOGL_SUPPLY` 做**可互动三维**散点切片立方体：点=公司；多层=产业链环节；从**电力**到 **OpenAI/Anthropic**；偏美国，非美用别色 | 单文件 `ai-chain-cube.html`：Three.js + OrbitControls；11 层；青=US / 红=非美；金环=SUPPLY 量化供应商；启动用 `Open-AI-Cube.command` + 本地 http。 |
|3| 架构好但大量 `?????` 乱码/空内容 | 中文→英文 UI/文案，修编码。 |
|4| 改进拖拽导航；补公司名/数据源标签 | 加控制说明、搜索、详情面板、数据源字段。 |
|5| 无法正常显示 | 修 importmap / 字面 `\nimport` 等加载错误。 |
|6| 在这边打开给我看；本地服务器可能被关 | 起 ruby httpd（曾用 **8767**），浏览器打开。 |
|7| 左键红屏；左右键应切切片；点太大 | 点选用 pointerup 阈值阈值；`[`/`]` 切层；缩小球半径。 |
|8| 变成平铺平面，要有层次的立方体 | 切片改为 **YZ 墙沿 X 堆叠**；等轴测默认相机；框线辅助。 |

### 阶段 C — 视觉与环尺度迭代（每步先备份）
| # | U | A |
|---|---|---|
|9| 备份后：点球荧光蓝/红；切片深蓝 | 备份→`…backup-20260926.html`；材质 emissive 加强。 |
|10| 再存档；按企业体量（营收）在切片内画**同心圆**定位 | 备份 glow；层内 min-max→0–100→10 环；外环低分、内环高分。 |
|11| 副本3；环要更亮；领域名要显示，不要 1–11 | 备份 rings；环线提亮；域名 canvas 标签。 |
|12| 副本4；选中一切片时**他环变暗**；公司/领域名**贴切片平面**不跟视角转；**Q 左旋 / E 右旋** | 备份 labels→4；关 CSS2D billboard→`PlaneGeometry` 共面；离焦环 opacity↓；`root.rotation.y` +=Q / −=E。 |
|13| 体量=100 的公司不在圆心；切切片时**视角勿瞬移** | score100→`ring=10` 原点；去掉选层时的 `cameraToLayer`。 |
|14| 副本5；半小时：①改善 UX ②拆文件架构+后端库撑前端 | 备份5；建 `ai-chain/` 包（见下）。 |

### 阶段 D — 架构与运维
| # | U | A |
|---|---|---|
|15| （系统）8767/8787 任务中止通知 | 确认后按需重启；后用户要求停服。 |
|16| 先别跑，停终端；自己点 bundle/command 打开 | kill **8787/8767**；入口改 `ai-chain/Open-AI-Chain.command`（根 `Open-AI-Cube.command` 转发）。 |
|17| 移植到已绑定 GitHub；进 **FIDV** 主干 | 装 `gh`→device login；账号 **Franzpur**；仓 `Franzpur/-Financial-Information-To-Decision-Visualization-FIDV-`；`ai-chain/` 推 **main** `37d0cf1`。 |
|18| gh 授权码有没有给我 | 有：当时 `27CB-90E4` + device URL。 |
|19| diff-tab：建分支并提交、**勿推** | 本地仓 `/Volumes/DATA/ANA_RSLT`：分支 `cursor/ai-chain-modular-cube`，commit `1ff981d`（未推）；排除 `_fidv_push/`。 |
|20| 写工作日志（本文件） | 写 `WORKLOG.md`。 |


### 阶段 E — 坐标/视角/交互 UX（09-26→09-27）
| # | U | A |
|---|---|---|
|21| 轴命名、原点、抽出方向、角视图镜像、非美橙、遮挡/dim、轨道/滚轮 | 用户轴 s/x/y；抽出沿 +x [0,1]→[1,2]；`USER_X_SIGN=-1`；角视图镜像；橙非美；透明 dim；距离缩放 rotateSpeed；指数滚轮。 |
|22| 继续按理解优化 UX，给足权限与时间 | 平滑相机动画；Esc 分层清除（选中→焦点）；点击切片平面聚焦；抽出缓动；聚焦边框高亮；中键/Home/V 角视图；双击空白清除；状态栏提示 pulled x∈[1,2]。 |


### 阶段 F — 概念靶向库（09-27）
| # | U | A |
|---|---|---|
|23| 建中英对照概念库（切片/点球/轴/抽出/标准视角等），代码标注，保移植可续 | 写 `ai-chain/CONCEPTS.md`；`scene.js`/`state.js`/`ui.js` 加 `[C-*]`；README/WORKLOG 挂链；刷新冻结约定。 |

---

## 2. 当前真源结构（以这个为准）

```
/Volumes/DATA/ANA_RSLT/
  WORKLOG.md                 ← 本日志
  Open-AI-Cube.command       ← 转发到 ai-chain 启动器
  ai-chain/                  ← 【主工程】
    Open-AI-Chain.command    ← 双击即可：seed + server :8787
    data/{layers,companies}.json + ai_chain.db
    server/{app.py,db.py}    ← stdlib HTTP + SQLite
    web/{index.html,css/,js/}← api/state/scene/ui/main
    scripts/seed.py
  _fidv_push/                ← FIDV 远程克隆（勿当源；.gitignore 已排）
```

**GitHub FIDV**：  
https://github.com/Franzpur/-Financial-Information-To-Decision-Visualization-FIDV-  
路径：`ai-chain/` on `main`

**本地 git（ANA_RSLT）**：分支 `cursor/ai-chain-modular-cube` @ `1ff981d`（root commit，未推远程）

**旧单文件**：曾用 `ai-chain-cube.html` + `ai-chain-cube.backup-20260926{,-glow,-rings,-labels,-4,-5}.html`；工作区现可能已不在（以备份/历史为准）；逻辑已迁入 `ai-chain/`。

---

## 3. 产品约定（续做时勿回退）

| 项 | 约定 |
|----|------|
| 层序 | 0 Power → … → 10 Models（OpenAI/Anthropic 端）共 11 |
| 颜色 | US `#3cf0ff`；非美 `#ffb020`（荧光橙黄）；SUPPLY 金环 |
| 营收环 | 层内 min-max→0–100；0–9.9 最外；90–99.9 近心；**100=圆心** |
| 标签 | 贴 YZ 切片平面，不 billboard |
| 焦点 | 选切片：他环/他层变暗；**沿蓝/`x` 抽出**；切层/抽回**保持相机**；`Esc` 分层清除 |
| 坐标 | 用户轴 `(x,y,s)`：橙=`s`；绿=`y`；蓝=`x`。原点左下。抽出：x∈[0,1]→[1,2]。详见 CONCEPTS.md |
| 标准视角 | 抽出：`(1.5,0.5,s*+10)` 朝 −s；总览：`(2.1,2.1,24)` 朝原点；快捷键 **C** / 中键 |
| 键位 | Q/E 偏航；WASD 平移；R/F 推拉；**C** 标准视角；`[`/`]` 切层；`Esc`；`?` 帮助（角视图 V 已废） |
| 端口 | 新栈 **8787**；旧静态曾 **8767**（可弃） |
| 服务 | **默认不常驻**；用户自点 `.command` |

---

## 4. API 速查

- `GET /api/bundle` 启动包（layers+companies+meta）
- `GET /api/layers` · `/api/companies?layer=&country=us|intl&supply=1&q=` · `/api/companies/:id` · `/api/health`
- 环坐标在**服务端** `db.assign_rings` 算，过滤不改变相对位置

---

## 5. 数据注意

- `GOOGL_SUPPLY.xlsx` → `value_m` 与金环；其余 Public industry map
- `GOOGL_SA.pdf` = 2020 方法论文，**不是**公司名单
- 收入 `rev_bn` 为示意年化十亿美元，非审计数；切片内位置为示意+环尺度

---

## 6. 未决 / 可续

- [ ] FIDV README 与本地 `WORKLOG` 是否再同步推一版
- [ ] 旧 `ai-chain-cube*.html` 备份是否归档进仓或 DATA 盘
- [ ] UX 可再加：切片切换动画、导出、更多数据源接入
- [ ] Git 提交者身份目前是本机自动 `Hugo SUI <hgsui@…>`（未改 global config）
- [ ] 用户偏好：中文沟通；researcher；直接改代码迭代

---

## 7. 一键续工

```bash
cd /Volumes/DATA/ANA_RSLT/ai-chain && ./Open-AI-Chain.command
# 或
python3 scripts/seed.py && python3 server/app.py   # http://127.0.0.1:8787/
```

接话时先读本文件 + `ai-chain/CONCEPTS.md` + `ai-chain/README.md`，再动代码。
