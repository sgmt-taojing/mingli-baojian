# 控制台操作指引 · 2026-09-06（AutoClaw cron 两项）

> jobs.json 由 AutoClaw 运行时持有，需你本人在控制台操作。两项合计约 2 分钟。

## ① 停用「r470-staging-auto-promote」（已迁移 launchd，必做）

- 原因：该任务是纯脚本（node scripts/staging-auto-promote.js），走 agentTurn 每次白烧模型额度且 20 分钟超时窗必超时（已连败 4 次）。已迁移为 launchd 纯脚本任务 `com.mingli-baojian.staging-auto-promote`（每日 03:00，与原排程一致），今日实跑验证 promoted 829/829、0 错误。
- 操作：控制台 → cron 任务列表 → 找到「r470-staging-auto-promote」→ **停用（disable）**。不要删，留档备查。

## ② 替换「名人八字采集 · 每日增尸」payload（超时根修 · 半脚本化版）

- 原因：20 分钟时限做不完「2-3 人 + 全事件年表 + 排盘 + 反向校验」，连败 4 次全部超时（顶满 1200s）。已把确定性环节脚本化（`scripts/celebrity-ingest.py`：校验/查重/8911 排盘/事件反校上下文/合并入库），agent 只剩搜索筛选——实测 DRY-RUN 全通过。
- 操作：控制台 → 该任务 → 编辑，把 message 整段替换为：

```
执行名人八字校正库每日采集（半脚本化版）：

第一步（搜索筛选，唯一需要判断的环节）：按库内 README.md 规范（只收公开信息、来源必溯、不编造、不确定标 approximate），搜索筛选 2-3 位新名人（历史人物/时辰记载明确者优先），整理成 candidates JSON 写到 /tmp/celebrity-candidates.json，每人含：person_id、slug（拼音）、name、source、source_url、gender、birth{year,month,day,hour,place,approximate}、facts（改名/迁居/婚姻/子女/事业/健康/财富/官非事件年表，事件带 year）。

第二步（确定性环节全部交给脚本，禁止手工排盘）：
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian && python3 scripts/celebrity-ingest.py /tmp/celebrity-candidates.json

第三步：读脚本输出的 reverse_checks（每事件已预排流年干支十神+所在大运），对每人的 1 个关键事件给一句命中判定（命中/不命中+一句话理由），连同脚本首行摘要作为最终回复（纯中文）。

纪律：排盘/入库/反校上下文一律由脚本完成，不要在对话里手工算；查不到时辰的 birth.hour 留 null。
```

## 无需操作

- 「临床经验蒸馏（周一06:00）」：payload 已是单步版，脚本侧今日复跑验证通过（导出 44 条），周一 06:00 复跑成功后陈旧连败自动清零。
