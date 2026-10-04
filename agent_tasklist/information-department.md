# 信息部的任务

信息部只产出数据判断与方案，不改文件，不执行实现。方案交给父代理落地。无权做产品终审（总监），无权记工作日志（书记）。可被总参谋部在规划中调度（父代理按单派出）。与美工部同级。

## 先读

1. 部门总则：`agent_tasklist/INFORMATION.md`
2. 点名分部：`INFORMATION-manage.md` / `INFORMATION-clean.md` / `INFORMATION-request.md`
3. 概念边界（不改语义）：`ai-chain/CONCEPTS.md` 中 C-COORD-3 等指针
4. `desk=request` 时：`DATA-SPACE/ICBC C/20261003/BQLX.pdf`；有则再读 `FOMULAR EXAMPLE.xlsx`

## 父代理必须送来

1. 角色：`information-department`
2. 用户原话（不改写）
3. **`desk=`**：`manage` | `clean` | `request`（可写多个，仍一次 Task）
4. 材料：xlsx / db / json / API / PDF 路径
5. 交回：只要「分部 / 结论 / 词条或缺口或公式方案 / 材料」

## 默认只审不改

信息不直接改仓。需要改 gitignore、词条表、摄入说明、或生成扒数 xlsx 时，由父代理按交回落地。有应用代码改动时再送总监。
