"""直连 yidao.db 规范助手（R-WALF 预防层，2026-09-06）

背景：R772 末连接语义——某直连脚本写后作为「末连接」关闭，触发 SQLite
删除/重建 -wal/-shm，8920 主句柄持有的 wal fd 失链成孤儿（写入不落盘）。
本模块统一规范：写完主动 wal_checkpoint(TRUNCATE) 截断 wal 再关闭，
缩短 wal 生命周期、压缩裂脑窗口。

用法：
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
    from yidao_safe import safe_close
    ...
    safe_close(conn)   # 替代 conn.commit(); conn.close()

注意：checkpoint(TRUNCATE) 在有其他活跃连接时会退让（PASSIVE 兜底），
失败不抛异常——巡检侧 R-WALF 自动收敛是兜底，本层是预防。
"""

import sqlite3  # noqa: F401  （方便调用方一并引用）


def safe_close(conn):
    """commit → wal_checkpoint(TRUNCATE) → close，任一步失败降级不抛。"""
    try:
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute("PRAGMA busy_timeout=5000")
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    except Exception:
        try:
            conn.execute("PRAGMA wal_checkpoint(PASSIVE)")
        except Exception:
            pass
    try:
        conn.close()
    except Exception:
        pass
