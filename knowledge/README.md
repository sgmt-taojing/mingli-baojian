# knowledge/ 历史 KB 副本说明

> **DEPRECATED · 2026-08-14 R109 评估**

## 状态

本目录 `yidao.db`（2026-08-13 14,745 条）是 2026-08-13 的 KB 历史快照，
**不再同步**，**不再用于运行时查询**。

运行时权威 KB 在：`server/database/yidao.db`（2026-08-14 当前 47,502 条，含 32,757 条新增）。

## 行数对比

| 库 | 行数 | 角色 |
|---|---|---|
| `server/database/yidao.db` | 47,502 | 运行权威 |
| `knowledge/yidao.db`        | 14,745 | 2026-08-13 历史快照（DEPRECATED） |
| 差值 | +32,757 | server 库新增 |

## 修真决策（R109）

1. **保留 physical 文件不动**：归档决策权下放 mingli 负责人下一轮启动。
2. **README 标注**：本文件即 DEPRECATED 标记。
3. **副本同步脚本禁用**：`scripts/r432-kb-trust-upgrade.py` 已加 DEPRECATED 头注释。
4. **r4xx 一次性脚本保留**：r481/r432/r486 等历史归档脚本不修真（一次性）。

## 验证

- lsof 检查无任何进程打开本库 ✓
- 两库内容 hash 不同（已确认非镜像，是历史快照）✓

## 下一步动作建议

若确认归档，执行：
```bash
mv knowledge/yidao.db data/backups/legacy-kb-202608/
mv knowledge/yidao.db-shm data/backups/legacy-kb-202608/
mv knowledge/yidao.db-wal data/backups/legacy-kb-202608/ 2>/dev/null
```