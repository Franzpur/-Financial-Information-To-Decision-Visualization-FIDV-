# 信息部的任务

信息部对照 `INFORMATION.md` 产出数据判断与方案；在专知路径内、desk 任务明确实现时可直接改仓（`POWER-KNOWLEDGE.md`）。无权做产品终裁（监理部），无权记工作日志（书记）。可被总参谋部在规划中调度（父代理按单派出）。与美工部同级。

## 先读

1. 部门总则：`agent_tasklist/INFORMATION.md`
2. 权知边界：仓根 `POWER-KNOWLEDGE.md`
3. 点名分部：`INFORMATION-manage.md` / `INFORMATION-clean.md` / `INFORMATION-request.md`
4. 概念边界（不改语义）：`ind-chain/CONCEPTS.md` 中 C-COORD-3 等指针
5. `desk=request` 时：`DATA-SPACE/ICBC C/20261003/BQLX.pdf`；有则再读 `FOMULAR EXAMPLE.xlsx`

## 父代理必须送来

1. 角色：`information-department`
2. 用户原话（不改写）
3. **`desk=`**：`manage` | `clean` | `request`（可写多个，仍一次 Task）
4. 材料：xlsx / db / json / API / PDF 路径
5. 是否实现：写明「只出方案」或「专知内实现」
6. 交回：见角色文件（含 `已改路径`）

## 专知内可改

任务写明实现时，信息部可改 `INFORMATION.md` §1 表内数据路径（含公式表、ingest、词条）。不可改 `ind-chain/server/*`、C-* 语义、美学文件。有产品代码改动时，由**父代理**送监理部。
