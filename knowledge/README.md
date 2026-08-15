# knowledge/ 目录说明（R109k + R110 归档后）

## 状态：已清空归档（2026-08-15 12:57）

本目录下的 `yidao.db` 已于 2026-08-15 物理归档，**不再是可用数据源**。

## 归档位置

| 文件 | 去向 |
|---|---|
| `yidao.db`（2026-08-13 历史快照，233MB） | `data/backups/legacy-kb-202608/yidao-snapshot-20260813.db` |
| `yidao.db.bak-r109i` | `data/backups/legacy-kb-202608/` |
| `yidao.db.bak-r109k` | `data/backups/legacy-kb-202608/` |

## 运行权威库（唯一）

`server/database/yidao.db`（47,502 条，launchd api-server 持有）

## 禁止事项

1. 禁止向本目录写任何 SQLite 库（新库一律进 `server/database/`）
2. 禁止脚本/服务/cron 引用 `knowledge/yidao.db` 路径
3. `r432-kb-trust-verify.sh` 的副本同步断言已改为「DEPRECATED 库无进程持有」守卫

## 剩余文件

- `nihaisha.db`：0 字节空文件，保留占位（无引用）
