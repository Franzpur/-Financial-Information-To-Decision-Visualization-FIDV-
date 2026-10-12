# 子代理

每个文件是一个角色。Cursor 从 `.cursor/agents/` 里的同名链接加载。

四席平级，互不隶属、互不调度：**总参谋部**、**监理部**、**档案部**、**内阁**。美工部、信息部只受总参谋部调度，不是另一个平级部。

| 角色 | 任务真源 |
|------|----------|
| 总参谋部 `general-staff` | `agent_tasklist/general-staff.md` |
| 监理部 `supervision-department` | `agent_tasklist/supervision.md` |
| 工程测试属 `engineering-test` | `agent_tasklist/engineering-test.md` |
| 代码质量属 `code-quality` | `agent_tasklist/code-quality.md` |
| 理念贯彻属 `principle-compliance` | `agent_tasklist/DESIGN.md` |
| 档案部 `archive-department` | `agent_tasklist/archive-department.md` |
| 书记 `secretary` | `agent_tasklist/secretary.md` |
| 秘书 `clerk` | `agent_tasklist/clerk.md` |
| 运维 `operations` | `agent_tasklist/operations.md` |
| 美工部 `art-department` | `agent_tasklist/AESTHETIC.md`（派用步骤见 `art-department.md`） |
| 信息部 `information-department` | `agent_tasklist/INFORMATION.md`（三分部 + 派用 `information-department.md`） |
| 参谋纪要官 `staff-memo` | `agent_tasklist/staff-memo.md` |
| 内阁 `cabinet` | `agent_tasklist/cabinet.md` |

「电」加角色名可点名任意子代理（电总参谋部、电监理部、电档案部、电内阁…）。旧词改派：电总监 → 监理部；电书记处 → 档案部。单独的「电」不派。总参谋部还可用「报文」「报」「M」「Message」或直接呼出。对话刚开始若有内阁谏言，谏言在规划之前；其后总参谋部仍是第一个做规划的代理。它**不指导监理部、档案部与内阁**；可调度美工部、信息部、参谋纪要官。参谋纪要官**仅**经总参谋部任务单调度。监理部委派三属并列取证，再出三监报告；送审口仍是父代理。档案部委派书记、秘书、运维；谈话末项书记仍由父代理派。内阁整理落入 `cabinet/`；业主向内阁要可打印报告时写入 `cabinet/reports/`；读 PDF 可自行截图，不必请示。谏言只在对话刚开始，或三监报告交回并写完对话栏那一句之后、派书记之前。美工部 / 信息部在公开 `POWER-KNOWLEDGE.md` 与各自真源路径内有产品改码权；父代理串流程与跨域写码；纪要官只读。内阁不改产品代码。书记每次谈话最后记 worklog。用法在 `agent_tasklist/RULE.md`。
