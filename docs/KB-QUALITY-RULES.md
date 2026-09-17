# KB 质量红线与写入规范（R792/R793 · 2026-09-17 固化）

> 依据 2026-09-17 知识库深度校正实证（fts5 冗余 2 万行 / 同文重复 1065 / 乱码 286+ / 无出处 3195）。
> 适用：所有向 yidao.db kb_formal / kb_fts5 / kb_staging 写入的脚本、cron、Agent。

## 一、写入五红线（违反任何一条 = 禁止入库）

1. **禁止直插 fts5**：kb_fts5 只能由 `kb-sync-guard.py` 维护。任何脚本/cron/Agent 不得对 kb_fts5 执行 INSERT/UPDATE（历史教训：外部工具直插致 830 entry×25 次重复索引、2 万冗余行）。主表写完后由守卫同步。
2. **禁止 NULL/空壳键**：entry_id/tags/summary 写入时一律 COALESCE 规整（entry_id 必填非空；tags/summary 空值写 `''` 不写 NULL——IS NOT 比较陷阱实证）。
3. **禁止同文重复**：入库前 (module, content) 指纹查重，命中即跳过或更新，不新增。
4. **禁止无出处入库**：每条必须带 src_id（五类映射见下表）；确实无源的进 staging 而非 formal。
5. **长度门槛分域**（R796 校准）：通用域 ≥100 字；蒸馏规格 50-150 字的短知识域（yangsheng/huangli/mantra 等口诀养生类）≥60 字且主题锚点明确。
5. **禁止垃圾入库**：OCR 乱文本（拉丁高位字符密度>15%）、控制符残渣（\x00-\x08\x0e-\x1f 密度>3%）、测试占位（x/y/test/TODO）、单次差评蒸馏候选——一律拒收。

## 二、出处五类映射（src_id 规范）

| 内容类型 | src_id | 判定特征 |
|---|---|---|
| 方药条文（组成/功效/主治） | SRC-CLASSIC-FORMULARY | module ∈ tcm-formula/tcm-herb/tcm-acupuncture |
| 原典章节/OCR 书籍 | SRC-CLASSIC-ORIGINAL | title 含 OCR/书名/原典· |
| 公有领域原典（维基文库） | SRC-PUBLIC-DOMAIN | content 含「维基文库」或 title=原典· |
| 作者/整理者标注 | SRC-AUTHOR-ANNOTATED | content 前 100 字含「来源：/出处：」 |
| 自有编撰（养护/化解/口诀） | SRC-INTERNAL-AUTHORED | wuxing/huajie/mantra 类自撰 |

## 三、staging 晋升门槛
- entry_id 非空 + content ≥100 字 + 通过五红线检测 → 才可 pending
- 单次差评蒸馏候选：≥3 次独立差评才可生成候选（1 次即生成 = 样本不足驳回）
- 测试数据一律 rejected 并记 audit_notes

## 四、质量标记规范（打标不删除）
- `mojibake-unrecoverable`：不可逆乱码，trust=0.3
- `ocr-garbage-lowquality`：OCR 乱文本，trust=0.3
- `kb-sourced-<date>`：批量补源操作留痕
- 带上述标记的条目在检索排序中降权；每月复审一次可救则救

## 五、巡检接入（kb-quality-patrol.py）
每日 06:00 随健康巡检运行五红线检测，输出项：fts5/主表行数差、同文重复组、乱码残留、真无出处、staging 待审数。任何一项 >0 即告警。
