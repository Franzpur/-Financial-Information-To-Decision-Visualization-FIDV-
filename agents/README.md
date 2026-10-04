# 子代理

每个文件是一个角色。Cursor 从 `.cursor/agents/` 里的同名链接加载。

每个角色在 `agent_tasklist/` 里有一份对应任务：

| 角色 | 任务真源 |
|------|----------|
| 总监 `chief-inspector` | `agent_tasklist/DESIGN.md` |
| 总参谋部 `general-staff` | `agent_tasklist/general-staff.md` |
| 书记 `secretary` | `agent_tasklist/secretary.md` |
| 美工部 `art-department` | `agent_tasklist/AESTHETIC.md`（派用步骤见 `art-department.md`） |
| 信息部 `information-department` | `agent_tasklist/INFORMATION.md`（三分部 + 派用 `information-department.md`） |

总参谋部只在「报文」「报」「电」「M」「Message」或直接呼出时才规划，而且必须是第一个执行的代理。它**不指导总监与书记**；可在规划中**调度**其余子代理，并在业主安排下规划**管理/编辑**其余子代理（父代理落盘）。美工部管网页与启动表层美学；信息部管数据词条、乱缺建议与彭博公式方案；二者只审/出方案不改仓。产品终审仍归总监。书记每次谈话最后出现，不参与决策。工作区在 `library/`。用法在 `agent_tasklist/RULE.md`。
