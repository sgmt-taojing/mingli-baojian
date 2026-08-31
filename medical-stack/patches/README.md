# medical-stack/patches/ · 补丁目录规范（G18 · ADR-017）

## 定位

medical-stack 的 tcm 源页面**只允许一种产生方式**：
`tcm-agent/app/<page>.html（唯一源头基线） + patches/ 补丁重放 = medical-stack/app/<page>.html`

禁止整页重打包（已废止）、禁止直接编辑 tcm 源页面的本侧副本（会被重放覆盖）。

## 补丁三要素（每个补丁 JSON 必备）

| 要素 | 字段 | 说明 |
|---|---|---|
| 锚点选择器 | `ops[].anchor` / `ops[].from` | 注入点或替换目标，失配即 WARN 转人工，**禁止静默跳过** |
| 注入模板 | `ops[].template` / `ops[].to` | 实际写入内容 |
| tcm 基线版本 | `baseline_head` | 编写补丁时的 tcm HEAD 短 sha，溯源可考 |

## 三类补丁（分离存放、独立重放、按序执行）

| 类 | 目录 | 职责 | 例 |
|---|---|---|---|
| brand | `patches/brand/` | canonical 改写、品牌词替换、平台脚本（seed-loader）注入 | brand-canonical / brand-name / seed-loader |
| disclaimer | `patches/disclaimer/` | ADR-009 机构版话术类修订 | （现无在管项，新增话术补丁入此） |
| mingli-view | `patches/mingli-view/` | 命理能力挂接医学页（视图开关、批注面板等） | treatment-center |

执行顺序固定：brand → disclaimer → mingli-view（命理增强永远最后挂，不掺进品牌层）。

## ops 操作类型

- `replace`：`{type, from, to, optional?}`——from 全局替换为 to；from 在页面出现 0 次且非 optional → WARN
- `inject`：`{type, anchors[], template}`——按 anchors 顺序找第一个命中锚点，在其后注入模板；全失配 → WARN；模板已存在 → 幂等跳过

## 重放纪律

1. 重放器 `scripts/reapply-patches.py` 由看守链 15min 轮询驱动，内容幂等（结果不变不写盘）。
2. 锚点失配/替换零命中 → WARN 落台账 `DELIVERY/patch-replay-<date>.json`，该页不写入，转人工。
3. 修改 tcm 源页面副本的唯一途径：改补丁或推 tcm 上游，不许手改 medical-stack/app 下 tcm 源页。
4. mingli 自有页面（tcm 没有的，如 review-studio）不受本目录管理，直接维护。
