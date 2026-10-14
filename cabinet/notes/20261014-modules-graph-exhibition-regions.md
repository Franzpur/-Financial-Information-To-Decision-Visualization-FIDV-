# 内阁旁注 · 模块关系图展示级分区整改

**日期** 2026-10-14  
**业主令** 电内阁：关系图改展示级；nav→list 淡绿框底；cube boot→aesthetic 淡蓝框底；FE-API 两框外；整后端淡黄框底  
**不发问** · 未令总参 · 未改 ind-chain

## 落盘

| 项 | 路径 |
|----|------|
| 真源 | `modules/graph.json`（可选 `region`；bake 有 fallback） |
| 烘焙器 | `modules/bake_static.py` |
| 静态投影 | `modules/index.html` |
| 重烘焙 | `python3 modules/bake_static.py` |
| 截图 | `cabinet/modules-graph-20261014-exhibition.png` |

## 架构一句

前端两大模块（淡绿决策路径 · 淡蓝立方体面）＋ 后端一大模块（淡黄）；FE-API 独立于两 FE 框外，作前后端契约枢纽。

## 分区写死

| 区 | region | 含 |
|----|--------|-----|
| 决策路径 | `fe-decision` | FE-NAV、FE-GATE、FE-LIST、FE-LISTING-UI |
| 立方体面 | `fe-cube` | FE-CUBE-BOOT、FE-STATE、FE-COORD、FE-SCENE、FE-CHROME、FE-FOCUS-STAGE、FE-AESTHETIC |
| API 枢纽 | `fe-api` | FE-API（框外小牌） |
| 后端 | `be` | 全部 BE-*、MODULES-TRACK |

## 版式

左后端 · 右前端（竖向为主、控宽）；纸面 token 对齐 cabinet reports；边色翠绿／天青／亮红；几何硬校验 problems=0。
