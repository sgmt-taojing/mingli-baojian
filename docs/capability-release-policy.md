# 能力发版纪律（G21 任务③ · 2026-10-09 裁决生效）

命理宝鉴是命理能力的**唯一源头与定版方**。本文件固化「能力变更即打包」触发纪律，脚本为 `scripts/release-capability.js`。

## 触发规则

| 变更类型 | 通道 | 时限 |
|---|---|---|
| 排盘引擎 / 排盘规则 / 历法换算规则 / 命理批注 prompt 变更（CHANGELOG 出现命理能力条目） | **出能力包**：`node scripts/release-capability.js paipan <x.y.z> "<差集说明>"` | 同版本出包 |
| 知识条目增量（命理知识库蒸馏入库） | 原 mingli-full.json 镜像通道 | 走既有节奏，**不出能力包** |
| 红线类（涉及家庭成员安全提示的命理话术） | 出能力包 | **2h 内** |
| 常规优化 | 出能力包 | 周窗打包 |

## 包契约（与 family `capabilities/paipan` 完全一致）

- `manifest.json`：id / version / type / provider / source_commit / consumers / changelog / contract / selftest / rollback_ref / fingerprint
- `code/`：引擎快照（源头 `server/` 直取；`paipan.py` 按契约改名 `paipan-bazi.py`）
- `selftest.js`：6 用例（5 引擎 + ziwei 契约字段 + kbref 无库降级）
- `paipan_bridge.py`：消费方统一桥，接口变更时才更新
- 落点：`_shared/sync-bus/outbox/capability-packs/<id>/<version>/`
- 登记：`_shared/capability-registry.json` → `releases[]`（`packs[].deployed_version` 由消费方部署后自更新，源头不代写）

## 版本纪律

- 版本号 x.y.z 单调递增，已存在目录拒发；`rollback_ref` 自动指向上版
- `fingerprint`（code/ 全文件 sha256 链哈希）为 G22 漂移巡检对照基准
- 发版后 CHANGELOG 记 G21 条目：版本号 + 差集清单 + 自检结果

## 已发版本

| 版本 | 日期 | 要点 |
|---|---|---|
| 1.1.0 | 2026-08-28 | 历史基线回补（八字 Python 入包） |
| 1.2.0 | 2026-09-05 | R778 年份全区间 + shengxiao 字段 + wrapper 契约回灌 |
| 1.3.0 | 2026-10-09 | 六爻入参校验；奇门格局烟波钓叟歌校正；紫微细则引证层（ziweiDeepRead）入包 |
