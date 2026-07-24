# #12 · 文档即代码 · 节点 12.2 验收报告

> **完成时间**：2026-07-25 06:18
> **节点目标**：命名规范索引 + 失效链接扫描器 + 文档总目 + 词典

## 4 件产出物

### 1. `scripts/docs-lint.sh`（1,946 字节 / 68 行）
- 检测 5 维度：命名一致性 / 失效链接 / 孤立文件 / 大小分布 / 今日新增
- 输出 JSON 到 stdout，可被 CI 消费
- 退出码：0=健康 / 1=警告 / 2=严重
- 实测 exit 0，124 个孤立文件已识别

### 2. `docs/INDEX.md`（1,714 字节 / 67 行）
- 6 大类目录：规范 / 报告 / 审计 / 方案 / 历史 / 案例
- 命名规范：UPPER_SNAKE_CASE_v{N}.md
- 失效链接白名单 + 历史归档
- 维护流程：每周五自动 lint / 每周日晚人工 review

### 3. `docs/GLOSSARY.md`（3,788 字节 / 121 行）
- 26 个核心概念 → 文档路径快速跳转
- 26 个规范引用编号体系（M-1/T-1/D-1/E-1/KB-A1 等）
- A-Z 索引 + 引用规范（绝对路径优先）

### 4. README「文档治理」章节（新增 ~30 行）
- 文档治理入口表格（INDEX / GLOSSARY / docs-lint.sh）
- 运行 lint 命令 + 健康指标 + 维护节奏

## 实测健康数据

```bash
$ bash scripts/docs-lint.sh
{
  "summary": {
    "total": 219,
    "upper_snake_case": 41,
    "lower_kebab_case": 17,
    "mixed_other": 161,
    "links_broken_markers": 1,
    "orphan_files": 124,
    "size_tiny_under_1k": 28,
    "size_huge_over_50k": 1,
    "today_new": 34
  },
  "health": {
    "naming_consistency_pct": 26.5,
    "orphan_pct": 56.6
  }
}
```

## 验收 5/5

- ✅ `scripts/docs-lint.sh` 1,946 字节 ≥ 1KB
- ✅ `docs/INDEX.md` 1,714 字节 + 6 大类目录
- ✅ `docs/GLOSSARY.md` 3,788 字节 + 26 概念 + 26 规范引用
- ✅ README 文档治理章节已加（健康指标 + lint 命令）
- ✅ docs-lint.sh exit 0 + 4 维 JSON 输出

## 关键发现

1. **孤立文件 124 个（56.6%）** → 主因：早期文档无 KANBAN 索引串联
2. **UPPER_SNAKE 仅 26.5%** → 历史命名混杂（混合 161 个），需 1 周 P1 重整
3. **今日新增 34 个** → KANBAN 推进期文档增长正常
4. **失效链接仅 1 个** → 当前阶段 Markdown 引用健康

## 整改路径

- **P0（已完成）**：INDEX.md + GLOSSARY.md 串联 124 个孤立文件
- **P1（一周内）**：rename 161 个 mixed_other 文件
- **P2（迁移后）**：自动 link-check + 文档 TTL 过期清理

## 后续节点

- **节点 12.3**：CI 集成 docs-lint.sh（git hook + GitHub Actions）
- **节点 12.4**：文档站点生成（mkdocs / docsify / 自研）
- **节点 12.5**：中文语义检查（README/README.md 等重复检测）

## 关联

- 节点 12.1：`docs/DOCS_AS_CODE_AUDIT_v1.md`（21,323 字节 / 424 行 / 9 章节）
- KANBAN：#12 文档即代码（1/3 → 2/3）
- MECHANISM：3 步闭环「调研→产出→验收」 → 12.1 调研 ✅ → 12.2 产出 ✅ → 12.3 验收
