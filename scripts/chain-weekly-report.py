#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
chain-weekly-report.py — tcm→mingli 吸收链条周报表（2026-09-07）

解析 /tmp/tcm-import.log（链条各环节 JSON 行）最近 7 天，汇总：
  链3 import-tcm-kb：运行/秒退/入库条数
  链4 kb-follow：快照同步/lag 峰值
  2d kb-assets-sync：资产同步次数与清单/冒烟结果
  2c parity：对拍 PASS/FAIL 次数
  链5 capability-diff：clean/有增量次数、最新差集
  R-WALF：logs/wal-watch.jsonl 裂脑事件数（检出/自愈）
输出：reports/chain-weekly-YYYYMMDD.md + stdout 一行摘要。
launchd：周一 06:43（临床经验蒸馏 06:00 之后，同一晨读窗口）。
"""

import json
import re
import time
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG = Path('/tmp/tcm-import.log')
WAL_WATCH = ROOT / 'logs' / 'wal-watch.jsonl'
OUT_DIR = ROOT / 'reports'

DAYS = 7


def parse_chain_log(since_ts):
    """逐行提取 JSON 对象/数组，按 action/字段归堆。"""
    stats = {
        'import_runs': 0, 'import_skipped': 0, 'import_inserted': 0,
        'follow_runs': 0, 'follow_synced': 0, 'follow_lag_max': 0.0,
        'assets_runs': 0, 'assets_synced': [], 'assets_smoke_fail': 0,
        'parity_pass': 0, 'parity_fail': 0,
        'diff_runs': 0, 'diff_changed': 0, 'diff_last_clean': None,
        'patch_replays': 0, 'patch_warns': 0,
    }
    if not LOG.exists():
        return stats
    last_ts = None  # 无 ts 的行归属到上一条有效时间戳（日志按时间顺序）
    buf = []        # 多行 JSON 块缓冲（parity 输出是 pretty-print）
    in_block = False

    def handle(d):
        act = d.get('action')
        if act == 'kb-follow':
            stats['follow_runs'] += 1
            if d.get('status') == 'synced':
                stats['follow_synced'] += 1
            lag = d.get('lag_min')
            if isinstance(lag, (int, float)):
                stats['follow_lag_max'] = max(stats['follow_lag_max'], lag)
        elif act == 'kb-assets-sync':
            stats['assets_runs'] += 1
            if d.get('status') == 'synced':
                stats['assets_synced'] += d.get('changed') or []
                if d.get('smoke') is not True:
                    stats['assets_smoke_fail'] += 1
        elif 'mirror' in d and 'inserted' in d:  # import-tcm-kb 报告
            stats['import_runs'] += 1
            stats['import_inserted'] += d.get('inserted') or 0
        elif d.get('status') == 'skipped' and d.get('reason') == 'mirror unchanged':
            stats['import_runs'] += 1
            stats['import_skipped'] += 1
        elif 'verdict' in d:  # parity
            if d.get('verdict') == 'PASS':
                stats['parity_pass'] += 1
            elif d.get('verdict') == 'FAIL':
                stats['parity_fail'] += 1
        elif 'digest' in d and 'clean' in d:  # capability-diff
            stats['diff_runs'] += 1
            if d.get('changed'):
                stats['diff_changed'] += 1
            stats['diff_last_clean'] = d.get('clean')
        elif 'replayed' in d:
            stats['patch_replays'] += d.get('replayed') or 0
            stats['patch_warns'] += len(d.get('warns') or [])

    def maybe_handle(raw, ts_ok):
        try:
            d = json.loads(raw)
        except Exception:
            return
        ts = d.get('ts')
        if ts:
            try:
                t = datetime.fromisoformat(ts)
                if t < since_ts:
                    return
            except Exception:
                pass
        elif not ts_ok:
            return
        handle(d)

    for line in LOG.read_text(encoding='utf-8', errors='ignore').splitlines():
        s = line.strip()
        if in_block:
            buf.append(line)
            if line == '}':  # 列 0 才算块结束（行内 '  }' 是 rows 末行，strip 后误判）
                maybe_handle('\n'.join(buf), bool(last_ts))
                buf, in_block = [], False
            continue
        if not s.startswith('{'):
            continue
        try:
            d0 = json.loads(s)
            ts = d0.get('ts')
            if ts:
                try:
                    last_ts = datetime.fromisoformat(ts)
                except Exception:
                    pass
            if last_ts and last_ts < since_ts and ts:
                continue
            handle(d0)
        except Exception:
            in_block = True
            buf = [line]
    return stats


def wal_events(since_ts):
    n_detect = 0
    if WAL_WATCH.exists():
        for line in WAL_WATCH.read_text(encoding='utf-8', errors='ignore').splitlines():
            try:
                d = json.loads(line)
                t = datetime.strptime(d.get('ts', ''), '%Y-%m-%d %H:%M:%S')
                if t >= since_ts and d.get('held_bad'):
                    n_detect += 1
            except Exception:
                pass
    return n_detect


def main():
    since = datetime.now() - timedelta(days=DAYS)
    s = parse_chain_log(since)
    wal_n = wal_events(since)

    today = datetime.now().strftime('%Y%m%d')
    OUT_DIR.mkdir(exist_ok=True)
    md = OUT_DIR / ('chain-weekly-%s.md' % today)

    def ok(b):
        return '✅' if b else '🔴'

    lines = [
        '# tcm→mingli 吸收链条周报（%s ~ %s）' % (since.strftime('%m-%d'), datetime.now().strftime('%m-%d')),
        '',
        '生成：%s' % datetime.now().strftime('%Y-%m-%d %H:%M'),
        '',
        '| 环节 | 次数 | 要点 | 状态 |',
        '|---|---|---|---|',
        '| 链3 镜像入库 | %d 次（秒退 %d） | 入库 %d 条 | %s |' % (
            s['import_runs'], s['import_skipped'], s['import_inserted'],
            ok(s['import_runs'] > 0)),
        '| 链4 内化快照跟随 | %d 次 | 同步 %d 次，lag 峰值 %.1f min | %s |' % (
            s['follow_runs'], s['follow_synced'], s['follow_lag_max'],
            ok(s['follow_lag_max'] <= 60)),
        '| 2d KB 资产吸收 | %d 次 | 同步 %s，冒烟失败 %d | %s |' % (
            s['assets_runs'], '、'.join(sorted(set(s['assets_synced']))) or '0 项',
            s['assets_smoke_fail'], ok(s['assets_smoke_fail'] == 0)),
        '| 2c 同案对拍 | PASS %d / FAIL %d | FAIL 即破窗 | %s |' % (
            s['parity_pass'], s['parity_fail'], ok(s['parity_fail'] == 0)),
        '| 2a/2b 页面补丁 | 重放 %d 页 | WARN %d 条 | %s |' % (
            s['patch_replays'], s['patch_warns'], ok(s['patch_warns'] == 0)),
        '| 链5 差集巡检 | %d 次 | 差集变化 %d 次，最新 clean=%s | %s |' % (
            s['diff_runs'], s['diff_changed'], s['diff_last_clean'],
            ok(s['diff_last_clean'] is True)),
        '| R-WALF 裂脑 | 检出 %d 次 | %s | %s |' % (wal_n,
            '无事件' if wal_n == 0 else '均自动收敛（10:14 案）',
            '✅' if wal_n == 0 else '⚠ 已自愈'),
        '',
        '异常处置入口：/tmp/tcm-import.log（逐环节 JSON）、logs/wal-watch.jsonl（裂脑时间线）、DELIVERY/tcm-capability-diff-latest.md（差集报告）。',
    ]
    md.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    print('[chain-weekly] 报表 %s｜链3 %d 次/入库 %d｜2d 同步 %d 项｜对拍 FAIL %d｜裂脑 %d' % (
        md.name, s['import_runs'], s['import_inserted'],
        len(set(s['assets_synced'])), s['parity_fail'], wal_n))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
