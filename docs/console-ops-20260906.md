# 控制台操作指引 · 2026-09-06（AutoClaw cron 两项）

> jobs.json 由 AutoClaw 运行时持有，需你本人在控制台操作。两项合计约 2 分钟。

## ① 停用「r470-staging-auto-promote」（已迁移 launchd，必做）

- 原因：该任务是纯脚本（node scripts/staging-auto-promote.js），走 agentTurn 每次白烧模型额度且 20 分钟超时窗必超时（已连败 4 次）。已迁移为 launchd 纯脚本任务 `com.mingli-baojian.staging-auto-promote`（每日 03:00，与原排程一致），今日实跑验证 promoted 829/829、0 错误。
- 操作：控制台 → cron 任务列表 → 找到「r470-staging-auto-promote」→ **停用（disable）**。不要删，留档备查。

## ② 精简「名人八字采集 · 每日增尸」payload（超时根修）

- 原因：20 分钟时限内做不完「2-3 位新名人 + 全维度事件年表 + 排盘 + 反向校验」，连败 3 次全部为超时（lastDurationMs=1200339 顶满）。
- 操作：控制台 → 该任务 → 编辑，把 message 整段替换为：

```
执行名人八字校正库每日采集（精简版）：

库：/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/training/celebrity-corpus/（先读库内 README.md）
纪律不变：只收公开信息、来源必溯、不编造、不确定标 approximate。

今日只做 1 位新名人：
1. 网络搜索采集生辰（时辰记载明确者优先）+ 关键事件年表（改名/换城市/婚姻/事业节点优先，标年份）
2. 按库内 JSON 结构写入 staging-batch-当日.json（事件存 facts 字段）
3. 生辰齐全用本地引擎排盘：curl -s -X POST http://127.0.0.1:8911/paipan ...（结果存 paipan 字段）
4. 反向校验 1 个已知事件（命中/不命中）
5. 一行纯中文汇报：新增名单+来源+校验结果

做不完就压缩事件数量，保生辰与来源准确。1200 秒内完成。
```

## 无需操作

- 「临床经验蒸馏（周一06:00）」：payload 已是单步版，脚本侧今日复跑验证通过（导出 44 条），周一 06:00 复跑成功后陈旧连败自动清零。
