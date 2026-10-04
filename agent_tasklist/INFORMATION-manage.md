# 数据管理分部（desk=manage）

负责读取数据、管理数据、设定调用词条。对照 `INFORMATION.md` §3。

## 读

打开材料中的 xlsx / sqlite / json / API 说明，核对表头、主键候选（ticker / 名称）、BICS 名或码、行量级。不改文件。

## 管

- 真源：xlsx 在 `DATA-SPACE/`；结构化产物 JSON/SQLite 在 `class-3-coords/`。
- `bics_entities_20261003.db`、`ai_chain.db` 为生成库，gitignore，勿当唯一真源提交。
- 勿提交 `~$*.xlsx`。
- 摄入入口写进词条，不默默换路径。

## 调用词条

为口语、文件名笔误、API、码制各定**一个**指向。同义（data-spase / DATA-SPACE、Comsumer / Consumer、Fiancials / Financials）写入词条，不改业主文件名。

码制不得与 CONCEPTS 打架：权威 `bicsCode`；产品字段 `legalEntityCoord`（7×2）。

## 交回

更新或确认词条表（口语 → 路径/库/API）。新数据集先立词条再谈摄入。
