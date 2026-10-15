# 模块化与接口方案

2026-10-13。业主原话：「电内阁，好的我明白了，现在我有一个想法，我觉得这个项目最后必须做到模块化，不同功能通过特定接口连接，以达到风险隔离的目的，你给我提出一个模块化与接口方案。」

上一份整合建议在 `cabinet/ICBC-Elliot-integration-advice.md`。业主已明白那一份。本文件不重选边，不改那一份。

目的写死：**风险隔离**。不同功能通过特定接口连接。一块失败，别的模块只看见接口上约定的空、缺或旧值，各自继续。一块失败不得拖垮另一块。

方案接在现有工程上：`ind-chain/`（概念在 `ind-chain/CONCEPTS.md`，路由在 `ind-chain/README.md` 的 API 表），行业库在 `class-3-coords/BICS-Classification/`。仍是一个本机进程 `127.0.0.1:8787`，仍是 `/`、`/list`、`/cube` 这三处入口。不另起一套服务，不把 SFC 写成与现有页面无关的微服务说明书。

这是方案，不是实施。

---

## 不采用

1. 模块化是代码与数据的边界，不是把一个三维空间拆成多张互不相通的页面。`agent_tasklist/DESIGN.md` 要求一维、二维、三维在同一个三维空间，信息在这个空间里堆叠。首页、名单、立方体仍是同一产品的入口。人从名单点进 `/cube?ticker=`，进入的是同一套用户坐标 `(s, x, y)`。不采用按页面各做一个孤立应用。
2. 公司节点仍是正对相机的环（C-POINT）。营收环（C-RING）只表示环分数，环心与切片共面。债务若日后要画，是企业节点之间的命名连线。不把营收环涂成风险颜色。本方案给债务留接口名，债务图没有做好。
3. 美 / 非美色只表示上市地。立方体上只有 `COLORS.US`（`#3cf0ff`）与 `COLORS.INTL`（`#ffb020`），读的是公司的 `country`（`US` 或 `INTL`）。不采用用这套颜色同时表示风险。

---

## 接口在现有路径上

模块之间只走下面这些口。口上没有的字段，调用方当不存在。谁也不打开对方的内部文件，谁也不改对方的几何。

| 现有路径 | 归哪一块 | 接口名 |
|----------|----------|--------|
| `GET /api/bics/children`、`/api/bics/node`、`/api/bics/l1` | 行业层级 | 行业节点 |
| `GET /api/bics/locate`、`/api/bics/entities` | 成员库 | 主业成员 |
| 首页格子上的公司个数 | 成员库，由首页按 `bicsCode` 拼到节点上 | 主业计数 |
| `/` 上的定位与 L1–L3 板（`home.js`） | 首页定位 | 只调用上三口，再把人送到名单 |
| `/list?bics=`（`list.js`） | 名单 | 只调用主业成员；行点击送到壳层 |
| 不带 `ticker` 的 `GET /api/bundle`，以及 `/api/layers`、`/api/companies`、`/api/companies/:id` | 演示库 | 演示链 |
| `GET /api/bundle?ticker=` | 壳层 | 公司壳 |
| `ind-chain/data/nvda-revenue-links.json` 挂到壳层的 `revenueLinks` | 收入线 | 收入线 |
| `web/js/coords.js` | 坐标 | 位置 |
| `main.js` 写入 `state.js`，`scene.js` / `ui.js` 只读这些字段 | 立方体场景 | 场景交接 |
| 今天没有任何路由 | 债务 | 债务线（预留，未挂上） |

立方体页的 `api.js` 只按地址取 bundle：地址上有 `ticker` 就走公司壳，没有就走演示链。首页、名单不经过 `api.js`，也不取立方体几何。

摆放只经过坐标模块。场景调用 `applyCoord` / `applySliceCoord`。不在场景里写 Three.js 原始坐标。

---

## 行业层级

独占 `class-3-coords/BICS-Classification/bics-equity-hierarchy-2024.json` 里的节点。镜像 `bics_hierarchy.db` 若在，也只归这里；产品读节点以 JSON 为准。

交出的接口叫 **行业节点**。路径是 `GET /api/bics/children?parent=`（空 parent 为 L1）、`GET /api/bics/node?code=`、`GET /api/bics/l1`。

接口上只过：`bicsCode`、`name`、`nameZh`、`definition`、`legalEntityCoord`、`level`、`isLeaf`、`parentCode`，以及 children 包里的 `parent`、`ancestors`、`children`。公司个数不在这张字段表里。

失败时，调用方看见缺：parent 未知为 404 `unknown bics parent`；文件缺失则 children 为空。首页格子可以没有，名单与壳层不改去演示链找公司。

不得打开 `bics_entities_20261003.db`、`ind_chain.db`、收入线 JSON。不得改环、切线或相机。

今天 `bics_children` 的响应里还夹着公司数。方案把数字划给成员库的主业计数。计数失败时，节点仍可返回，个数为 0 或缺。

---

## 成员库

独占 `class-3-coords/BICS-Classification/bics_entities_20261003.db` 的表 `entity_memberships`。摄入可以读 DATA-SPACE 里的 xlsx，可以读行业节点的公开字段（`bicsCode`、`name`）做对照。摄入不改层级文件。

交出的读接口叫 **主业成员**。

- `GET /api/bics/locate?q=` 只过 `hits[].name`、`ticker`、`bicsCode`、`l4Name`、`legalEntityCoord`，以及 `exact`。
- `GET /api/bics/entities?bics=` 只过主业行：`name`、`ticker`、`l1_name`、`l4_name`、`bics_code_l4`、`legal_entity_coord`、`pct_tot_rev`、`ind_rev`、`pct_sum`、`segments`、`other_segments`，以及上市地 `listingCountry`（含名单已在用的未映射标记）。主业排序与现在相同：有数字的 `% Tot Rev` 优先，空占比仍可胜出，此时企业坐标前加 `-`。

交给首页拼板的叫 **主业计数**：`companyCount`、`totalCount`、`listingCountries`、`unmappedCount`、`listingCountry`。只按行业码前缀和上市地过滤后的个数，按 `bicsCode` 与节点对齐。

不交出：`source_file`、`mkt_cap`、xlsx 路径、行 id。

交出的写接口叫 **替换成员库**。新库写完整之后才替换活库。读侧保持只读打开（现有 `file:…?mode=ro`）。写入失败时，首页、名单、壳层看见的仍是替换前那一份旧库。

库文件不在时：locate 为 `{hits: [], exact: false}`；entities 为 `[]`；壳层 `companies` 为 `[]` 且 `tickerFound` 为 false。这三处都不得改读演示库。

不得打开 `ind_chain.db` 或收入线文件。不得改环、切线或相机。

现行 `class-3-coords/BICS-Classification/ingest_20261003_entities.py` 在写入前会删掉活库。替换成员库这条要求尚未落在该脚本上。未点名之前不改它。

---

## 首页定位

独占 `ind-chain/web/index.html`、`web/js/home.js`，以及上市地下拉（`nations.js`）。开屏只在这一页。

它调用行业节点、主业计数、主业成员的 locate。它不拥有三维场景。

它把人送去的地址：L4 格子到 `/list?bics=`；定位框写入 ticker 后再按 Enter，到 `/list?bics=<主业 L4>&q=<ticker>`。页眉没有立方体按钮。裸立方体只按地址进入。

失败时：locate 无命中，浮层是空的，板还在。行业节点缺失，这一屏没有格子，不打开裸 `/cube`。主业计数缺失，格子还在，数字为 0 或缺。

不得引入 `scene.js`。不得读成员库文件、演示库文件或收入线文件。不得把定位失败画成演示链。

---

## 名单

独占 `ind-chain/web/list.html`、`web/js/list.js`。

它只调用主业成员 `GET /api/bics/entities`。行业坐标在页面上只显示前 4 段，并保留前导 `-`（`displayIndustryCoord`）。可选 `?q=` 只预填本页的名称或 ticker 过滤。按下收入排序时，只按主业行 `ind_rev` 的美元原值降序，空值在后。

它把人送去的地址：一行点击到 `/cube?ticker=`。退格回到面包屑上一级板。

失败时：`entities` 为空就是空表。祖先面包屑在行业节点还在时仍显示。不把 `companies.json` 里的公司填进表。

不得请求不带 `ticker` 的 `/api/bundle`。不得读收入线文件。不得画环。

---

## 演示库

独占 `ind-chain/data/layers.json`、`ind-chain/data/companies.json`，以及由 seed 生成的 `ind-chain/data/ind_chain.db`。

交出的接口叫 **演示链**。路径是不带 `ticker` 的 `GET /api/bundle`，以及 `GET /api/layers`、`GET /api/companies`、`GET /api/companies/:id`。

接口上只过：`meta`（无 `shell`）、`layers`，以及公司的 `id`、`name`、`revBn`、`ticker`、`country`、`layer`、`note`、`valueM`、`source`、`sourceDetail`、`legalEntityCoord`、`revScore`、`ring`、`ringCos`、`ringSin`。环位置在服务端算好，浏览器不因过滤重算环。`country` 只供美 / 非美色，含义是上市地。

只从裸地址 `/cube` 进入。首页和名单不调用这口。

失败时：这份库打不开，裸立方体启动失败，画布按场景模块藏起。首页、名单、带 `ticker` 的公司壳不改走这份载荷，也不因它失败而关掉。

不得打开成员库或收入线文件来补公司。不得把 `country` 写成风险。

---

## 壳层

独占带 `ticker` 的 bundle 形状（现有 `bundle_shell_ticker`）。一家公司放在用户坐标 `(s, x, y) = (5, 5, 5)`。`layers` 恒为 `[]`，因此没有行业切片墙，也没有营收环导引。

交出的接口叫 **公司壳**。路径是 `GET /api/bundle?ticker=`。

接口上只过：

- `meta.shell` 为 true，`meta.shellAnchor` 为 `{s:5, x:5, y:5}`，以及 `meta.ticker`、`meta.tickerResolved`、`meta.tickerFound`、`meta.countries`、`meta.title`、`meta.version`
- `layers` 为 `[]`
- `companies` 为空，或一条：`id`、`name`、`ticker`、`revBn`（成员库 `ind_rev` 除以 1e9）、`country`（上市地收成 `US` 或 `INTL`）、`note`（L4 名）、`valueM` 为 null、`source` 为 `bics-entity`、`sourceDetail`（主业 L4 码）、`legalEntityCoord`、`s`、`x`、`y`（等于锚点）
- `revenueLinks` 由收入线填入，可以是 `[]`

这一条不依赖演示库能否打开。公司身份只来自成员库的主业行。

失败时：成员库没有这家，看见 `tickerFound` false、`companies` 为 `[]`、`layers` 仍为 `[]`、`shell` 仍为 true。收入线文件缺失，看见 `revenueLinks` 为 `[]`，已经解析到的那一家仍在。两种失败都不得退回整条演示链，不得改发不带 `ticker` 的 bundle。

不得读场景里的 mesh。不得把这家公司放进演示库的层号。

现行 `_api` 在分出 ticker 之前会先连接演示库。公司壳不依赖演示库，这条要求尚未落在该函数上。未点名之前不改它。

---

## 收入线

独占 `ind-chain/data/nvda-revenue-links.json` 里的 `links`。同文件的 `held` 留在文件内，不进入接口。

交出的接口叫 **收入线**。只挂在公司壳的 `revenueLinks` 上。解析到的 ticker 词首是 `NVDA`、文件能读、行合格，才有元素。其他壳层一律 `[]`。

接口上只过：`side`（`supplier` 或 `customer`）、`name`、`pct`、`country`（`US` 或 `INTL`）。`pct` 在供应商侧来自文件里的 `spendPct`，在客户侧来自 `revPct`。

场景只在 `shellCube` 且数组非空时画。对手方仍是正对相机的环，圆心在切线所对的扇区上，不是 `state.companies` 里的公司，不能点选。线用切片描边色 `COLORS.EDGE`。这套颜色不表示风险。`held` 里的名字不画。

失败时：文件不在、读失败、JSON 坏、或没有合格的 `links`，别人看见 `[]`。壳层仍是这一家公司（解析到了就是一个环）。不得退回整条演示链，不得改画裸立方体的十一层切片。

不得读成员库的内部列。不得改公司环的半径或颜色。不得把 `held` 画出来当成已经完成的全链。

---

## 坐标

独占 `ind-chain/web/js/coords.js` 的 `LAYOUT`、单位、`companyCoord`、`displayIndustryCoord`。场景里的摆放只调用这里的 `applyCoord` / `applySliceCoord`。

交出的接口叫 **位置**。字段只有 `{s, x, y}`。相对坐标 `ringCos`、`ringSin` 不叫 x、y，由 `companyCoord` 投影成位置。行业坐标只经 `displayIndustryCoord` 给首页和名单显示前 4 段并保留前导 `-`，不参与摆放。

失败时：某个对象没有位置，场景不摆它。不得用演示链的层号补上，不得改写 Three.js 原始坐标补上。

其他模块不得改 mesh 的世界坐标。不得把行业坐标或风险读成位置。

---

## 立方体场景

独占 `scene.js` 的几何、相机、点选，`ui.js` 的浮层，`main.js` 的启动。`state.js` 只做这一页的交接，不是给首页或名单改几何的后门。

它读入的就是 **场景交接**：`main.js` 从公司壳或演示链写入 `state` 的 `layers`、`companies`、`countries`、`shellCube`、`shellAnchor`、`revenueLinks`。壳层没有这家公司时还有 `openTickerMiss`。面包屑名称若需要，只读行业节点 `GET /api/bics/node` 的公开字段，不据此更换 `companies`。

公司节点只画成正对相机的环。环的半径来自营收尺度（演示链用 `revScore`；壳层点沿用现有壳层半径）。颜色只来自 `country` 的美 / 非美，含义是上市地。

失败时：`fetchBundle` 或 `createScene` 抛错，`#app` 保持隐藏，错误条留在页面上，点击不把这句错误清掉。不得把没建成的画布交给人。

收入线为 `[]` 且 `shell` 为真时，画面仍是壳层：没有切片墙；公司解析到了就是一个环，没有就是空锚点。不得在此时装上演示链的层。

不得打开 sqlite、数据 JSON 或 DATA-SPACE。不得改那些文件。不得按风险给环上色。

---

## 债务线（预留，未建成）

独占：无。现在没有路径，没有文件，没有几何。

接口名叫 **债务线**。今天不挂在 `GET /api/bundle` 上，`state` 里也没有这份字段。

以后若点名要画：只在企业节点之间加命名连线。节点仍是正对相机的环。科目与字段到那时再定。本方案不填一套债的数字，也不把折线写成已经可看。

现在其他模块看见的是缺。环、收入线、壳层、演示链保持原样。

不得把营收环涂成风险颜色。不得把收入线文件改读成债务。不得为债务另开一页。

---

## 三处失败各自停下

1. 收入线文件缺失时，公司壳仍是这一家公司，`revenueLinks` 为 `[]`。不得退回整条演示链。
2. 成员库写入失败时，旧库还在。locate、名单、壳层继续读替换前那一份。
3. 立方体场景没建成时，藏起 `#app`。人看见的是错误条，不是没建成的画布。

---

## 未点名之前

不改 `ind-chain`，不改产品代码，不改 `class-3-coords` 里的摄入脚本。内阁不否决，不代替实施。要落成代码，须业主另行点名。
