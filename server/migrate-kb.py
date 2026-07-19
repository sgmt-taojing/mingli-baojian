# -*- coding: utf-8 -*-
"""
命理宝鉴 · 知识库迁移脚本
═══════════════════════════════════════════════════════════════
将 knowledge/ 目录下的60个JS文件按分级配置复制到
server/kb-store/{public,registered,member,premium,professional,admin}/

特性：
  - 读取 kb-config.js 中的分级映射
  - 不删除原文件（保持向后兼容）
  - 生成迁移清单 manifest.json
  - 支持增量迁移（跳过已存在且内容相同的文件）
  - 迁移后验证文件完整性

用法：
  python3 migrate-kb.py                    # 执行迁移
  python3 migrate-kb.py --verify           # 仅验证
  python3 migrate-kb.py --dry-run          # 预览不执行
  python3 migrate-kb.py --clean            # 清空目标目录后迁移
"""

import os
import sys
import json
import shutil
import hashlib
import argparse
from datetime import datetime
from pathlib import Path

# ═══════════════════════════════════════════════════════════════
# 路径配置
# ═══════════════════════════════════════════════════════════════
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent
KNOWLEDGE_DIR = PROJECT_ROOT / 'knowledge'
KB_STORE_DIR = SCRIPT_DIR / 'kb-store'
MANIFEST_PATH = KB_STORE_DIR / 'manifest.json'

# 级别 → 目标子目录
LEVEL_DIRS = {
    'public':       'public',
    'registered':   'registered',
    'member':       'member',
    'premium':      'premium',
    'professional': 'professional',
    'admin':        'admin',
}


def load_kb_config():
    """
    从 kb-config.js 中解析 KB_LEVELS 配置。
    使用 Node.js 执行并输出 JSON，确保解析准确。
    """
    config_path = SCRIPT_DIR / 'kb-config.js'
    if not config_path.exists():
        print(f'[ERROR] 配置文件不存在: {config_path}')
        sys.exit(1)

    # 使用 Node.js 导出 JSON（确保与 JS 模块语义一致）
    js_code = f"""
    const {{ KB_LEVELS }} = require('{config_path}');
    console.log(JSON.stringify(KB_LEVELS));
    """
    import subprocess
    try:
        result = subprocess.run(
            ['node', '-e', js_code],
            capture_output=True, text=True, timeout=10,
            cwd=str(SCRIPT_DIR)
        )
        if result.returncode != 0:
            print(f'[ERROR] Node.js 解析配置失败:\n{result.stderr}')
            sys.exit(1)
        return json.loads(result.stdout.strip())
    except FileNotFoundError:
        print('[ERROR] 未找到 node 可执行文件，请确保 Node.js 已安装')
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f'[ERROR] 解析 kb-config.js 输出为 JSON 失败: {e}')
        sys.exit(1)


def file_md5(filepath):
    """计算文件MD5"""
    hash_md5 = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def ensure_dirs(levels, clean=False):
    """创建目标目录结构"""
    KB_STORE_DIR.mkdir(parents=True, exist_ok=True)
    for level, subdir in LEVEL_DIRS.items():
        target_dir = KB_STORE_DIR / subdir
        if clean and target_dir.exists():
            shutil.rmtree(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)


def migrate_file(src_path, dst_path, filename, level, desc, dry_run=False):
    """迁移单个文件"""
    if not src_path.exists():
        return {'filename': filename, 'level': level, 'status': 'MISSING', 'desc': desc}

    src_md5 = file_md5(src_path)

    # 检查目标是否已存在且内容相同
    if dst_path.exists():
        dst_md5 = file_md5(dst_path)
        if src_md5 == dst_md5:
            return {
                'filename': filename, 'level': level, 'status': 'SKIP',
                'desc': desc, 'md5': src_md5, 'size': src_path.stat().st_size
            }

    if dry_run:
        return {
            'filename': filename, 'level': level, 'status': 'DRY_RUN',
            'desc': desc, 'md5': src_md5, 'size': src_path.stat().st_size
        }

    # 复制文件
    shutil.copy2(src_path, dst_path)

    # 验证
    dst_md5 = file_md5(dst_path)
    if dst_md5 != src_md5:
        return {'filename': filename, 'level': level, 'status': 'VERIFY_FAIL', 'desc': desc}

    return {
        'filename': filename, 'level': level, 'status': 'COPIED',
        'desc': desc, 'md5': src_md5,
        'size': src_path.stat().st_size,
        'src': str(src_path.relative_to(PROJECT_ROOT)),
        'dst': str(dst_path.relative_to(PROJECT_ROOT))
    }


def run_migration(dry_run=False, clean=False, verify_only=False):
    """执行迁移"""
    print('=' * 60)
    print('  命理宝鉴 · 知识库分级迁移')
    print(f'  时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'  模式: {"验证" if verify_only else "预览" if dry_run else "执行"}')
    print('=' * 60)

    # 加载配置
    kb_levels = load_kb_config()
    print(f'\n[INFO] 加载配置: {len(kb_levels)} 个KB文件')

    # 统计各级别数量
    level_counts = {}
    for fname, info in kb_levels.items():
        level = info['level']
        level_counts[level] = level_counts.get(level, 0) + 1
    print('[INFO] 分级统计:')
    for level in ['public', 'registered', 'member', 'premium', 'professional', 'admin']:
        print(f'  {level:15s}: {level_counts.get(level, 0):2d} 个')

    if verify_only:
        return verify_migration(kb_levels)

    # 准备目录
    ensure_dirs(LEVEL_DIRS, clean=clean)
    print(f'\n[INFO] 目标目录: {KB_STORE_DIR}')

    # 执行迁移
    results = []
    success_count = 0
    skip_count = 0
    fail_count = 0

    print('\n[INFO] 开始迁移...')
    for filename, info in sorted(kb_levels.items()):
        level = info['level']
        desc = info.get('desc', '')
        src_path = KNOWLEDGE_DIR / filename
        dst_dir = KB_STORE_DIR / LEVEL_DIRS[level]
        dst_path = dst_dir / filename

        result = migrate_file(src_path, dst_path, filename, level, desc, dry_run=dry_run)
        results.append(result)

        status = result['status']
        if status in ('COPIED', 'DRY_RUN'):
            success_count += 1
            symbol = '✓' if status == 'COPIED' else '○'
            print(f'  {symbol} [{level:13s}] {filename}')
        elif status == 'SKIP':
            skip_count += 1
            print(f'  - [{level:13s}] {filename} (已存在，跳过)')
        elif status == 'MISSING':
            fail_count += 1
            print(f'  ✗ [{level:13s}] {filename} (源文件不存在!)')
        elif status == 'VERIFY_FAIL':
            fail_count += 1
            print(f'  ✗ [{level:13s}] {filename} (验证失败!)')

    # 生成清单
    manifest = {
        'generated_at': datetime.now().isoformat(),
        'source_dir': str(KNOWLEDGE_DIR.relative_to(PROJECT_ROOT)),
        'target_dir': str(KB_STORE_DIR.relative_to(PROJECT_ROOT)),
        'total_files': len(results),
        'summary': {
            'copied': success_count,
            'skipped': skip_count,
            'failed': fail_count,
        },
        'level_counts': level_counts,
        'files': results,
    }

    if not dry_run:
        with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        print(f'\n[INFO] 迁移清单已保存: {MANIFEST_PATH}')

    # 汇总
    print('\n' + '=' * 60)
    print('  迁移完成汇总')
    print('=' * 60)
    print(f'  总计:   {len(results)} 个文件')
    print(f'  成功:   {success_count} 个')
    print(f'  跳过:   {skip_count} 个')
    print(f'  失败:   {fail_count} 个')

    if fail_count > 0:
        print('\n[WARN] 存在失败项，请检查上述标记 ✗ 的文件')
        return 1

    print('\n[OK] 迁移完成！原 knowledge/ 目录未修改，保持向后兼容。')
    return 0


def verify_migration(kb_levels):
    """验证已迁移文件的完整性"""
    print(f'\n[INFO] 验证模式：检查 {KB_STORE_DIR} 中的文件')

    total = 0
    verified = 0
    missing = 0
    mismatch = 0

    for filename, info in sorted(kb_levels.items()):
        level = info['level']
        src_path = KNOWLEDGE_DIR / filename
        dst_path = KB_STORE_DIR / LEVEL_DIRS[level] / filename
        total += 1

        if not dst_path.exists():
            print(f'  ✗ {filename} → 目标文件不存在')
            missing += 1
            continue

        if not src_path.exists():
            print(f'  ⚠ {filename} → 源文件不存在（可能已重命名）')
            continue

        src_md5 = file_md5(src_path)
        dst_md5 = file_md5(dst_path)

        if src_md5 == dst_md5:
            verified += 1
            print(f'  ✓ [{level:13s}] {filename}')
        else:
            mismatch += 1
            print(f'  ✗ {filename} → MD5不匹配 (src={src_md5[:8]} dst={dst_md5[:8]})')

    print(f'\n  总计: {total} | 验证通过: {verified} | 缺失: {missing} | 不匹配: {mismatch}')
    return 0 if (missing + mismatch) == 0 else 1


def main():
    parser = argparse.ArgumentParser(description='命理宝鉴知识库迁移工具')
    parser.add_argument('--dry-run', action='store_true', help='预览迁移，不实际复制')
    parser.add_argument('--verify', action='store_true', help='仅验证已迁移文件')
    parser.add_argument('--clean', action='store_true', help='清空目标目录后重新迁移')
    args = parser.parse_args()

    exit_code = run_migration(
        dry_run=args.dry_run,
        clean=args.clean,
        verify_only=args.verify
    )
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
