# 跨入口与多轮问测安全设计

日期：2026-10-27

## 缺口

前置策略目前只覆盖 `/api/ai/orchestrate`。`public-chat`、`/api/ai/chat` 和 `stream-chat` 仍可直接进入模型或 KB；`guide` 会先收集字段，最终又直接调用 planner，可能绕开安全策略。

## 方案

继续复用 `response-policy`，不新建第二套话术。各入口在缓存、KB、模型和字段收集之前，仅对当前用户最新输入匹配策略：公开/认证聊天返回兼容 OpenAI `choices` 的安全结果；流式端点返回同一组 SSE delta/done 事件；多轮 guide 保留当前会话历史后立即输出安全应答，不再追问生辰或症状。guide 最终执行统一 `orchestrate`，避免重复规划逻辑。

历史 assistant/user 内容不用于正则触发，避免把“刚才只是举例”误判为当前危机。未命中策略的请求保持原模型、KB 与排盘路径，API 外壳和前端契约不变。

## 验证

新增英文/繁体/插空格/越狱包装等改写样例；覆盖危机、胸痛、失眠、孕期、死期、发财承诺和内部规则。真实服务逐入口验证 orchestrate、guide、stream-chat、public-chat、chat 及 public-chat SSE，多轮会话验证“先普通咨询、后突发危机”立即转介。保留响应原文和检查结果，测试后清理临时副本 8920，不触碰既有 8911 进程。
