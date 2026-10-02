# 子代理

每个文件是一个角色。Cursor 从 `.cursor/agents/` 里的同名链接加载。

每个角色在 `agent_tasklist/` 里有一份对应任务。总监的任务是 `agent_tasklist/DESIGN.md`，总参谋部的任务是 `agent_tasklist/general-staff.md`，书记的任务是 `agent_tasklist/secretary.md`。总参谋部只在「报文」「报」「电」「M」「Message」或直接呼出时才规划，而且必须是第一个执行的代理；它不指导总监和书记。书记每次谈话最后出现，不参与决策。工作区在 `library/`。用法在 `agent_tasklist/RULE.md`。
