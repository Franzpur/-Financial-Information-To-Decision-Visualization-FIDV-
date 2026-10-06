# 子代理

每个文件是一个角色。Cursor 从 `.cursor/agents/` 里的同名链接加载。

每个角色在 `agent_tasklist/` 里有一份对应任务：

| 角色 | 任务真源 |
|------|----------|
| 总监 `chief-inspector` | `agent_tasklist/DESIGN.md` |
| 总参谋部 `general-staff` | `agent_tasklist/general-staff.md` |
| 书记处 `secretariat` | `agent_tasklist/secretariat.md` |
| 书记 `secretary` | `agent_tasklist/secretary.md` |
| 秘书 `clerk` | `agent_tasklist/clerk.md` |
| 运维 `operations` | `agent_tasklist/operations.md` |
| 美工部 `art-department` | `agent_tasklist/AESTHETIC.md`（派用步骤见 `art-department.md`） |
| 信息部 `information-department` | `agent_tasklist/INFORMATION.md`（三分部 + 派用 `information-department.md`） |

「电」加角色名可点名任意子代理（电总参谋部、电书记处、电总监…）。单独的「电」不派。总参谋部还可用「报文」「报」「M」「Message」或直接呼出；一旦派出必须第一个执行。它**不指导总监与书记处**；可调度美工部、信息部。书记处与总参谋部平级。美工部管网页与启动表层美学；信息部管数据词条。产品终审仍归总监。书记每次谈话最后记 worklog。用法在 `agent_tasklist/RULE.md`。
