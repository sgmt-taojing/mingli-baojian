#!/usr/bin/env python3
"""专利代码提取 V2 — 前后端各1750行，多文件组合（去空行注释，保留方法说明注释）"""
import os

BASE = os.path.join(os.path.dirname(__file__), '..')
TARGET = 1750

# 后端文件 + 配额（过滤后行数预算，不足时从后续文件补）
BACKEND_PLAN = [
    ('server/api-server-v2.js', 700, 'API 网关：路由、鉴权、业务聚合'),
    ('server/kb-syndrome-infer.js', 200, '知识库证候推断引擎'),
    ('server/multi-modal-fusion.js', 400, '多模态融合评估引擎'),
    ('server/tcm-standard-agent.js', 260, '中医标准智能体'),
    ('server/unified-report-engine.js', 400, '统一报告生成引擎'),
    ('server/distillation-engine.js', 100, '知识蒸馏引擎'),
]

FRONTEND_PLAN = [
    ('app/js/ai-assistant-inline.js', 800, 'AI 智能助手交互'),
    ('app/js/ai-diagnosis-engine.js', 300, 'AI 诊断引擎'),
    ('app/js/camera-capture-inline.js', 350, '摄像头采集分析'),
    ('app/js/tcm-symptom-inline.js', 150, '舌面手采集'),
    ('app/js/bazi-core.js', 300, '八字排盘核心'),
]

def is_comment_line(s):
    if not s: return True
    if s.startswith('//'): return True
    if s.startswith('/*') and not s.startswith('/**'): return True
    if s.startswith('*/'): return True
    return False

def extract(plan):
    result = []       # [(file, lineno, code)]
    stats = []
    used = set()
    for f, quota, _desc in plan:
        if len(result) >= TARGET: break
        full = os.path.join(BASE, f)
        if not os.path.exists(full):
            print(f'  ⚠️ 缺失: {f}')
            continue
        with open(full, encoding='utf-8', errors='replace') as fh:
            lines = fh.readlines()
        picked = 0
        in_jsdoc = False
        for i, raw in enumerate(lines, 1):
            if len(result) >= TARGET or picked >= quota: break
            code = raw.rstrip('\n').rstrip('\r')
            s = code.strip()
            if in_jsdoc:
                result.append((f, i, code)); picked += 1
                if s.endswith('*/'): in_jsdoc = False
                continue
            if s.startswith('/**'):
                in_jsdoc = True
                result.append((f, i, code)); picked += 1
                if s.endswith('*/'): in_jsdoc = False
                continue
            if is_comment_line(s): continue
            result.append((f, i, code)); picked += 1
        stats.append((f, picked))
        used.add(f)
    return result[:TARGET], stats

def main():
    print('=== 后端代码提取 ===')
    back, bs = extract(BACKEND_PLAN)
    print(f'  后端实得: {len(back)} 行')
    for f, n in bs: print(f'    {f}: {n} 行')

    print('=== 前端代码提取 ===')
    front, fs_ = extract(FRONTEND_PLAN)
    print(f'  前端实得: {len(front)} 行')
    for f, n in fs_: print(f'    {f}: {n} 行')

    outdir = os.path.join(BASE, '.openclaw', 'tmp')
    os.makedirs(outdir, exist_ok=True)

    def dump(lines, path):
        with open(path, 'w', encoding='utf-8') as fh:
            for (f, lineno, code) in lines:
                fh.write(f'{code}\n')

    dump(back, os.path.join(outdir, 'patent-backend.txt'))
    dump(front, os.path.join(outdir, 'patent-frontend.txt'))
    # 元数据
    meta = {
        'backend_total': len(back),
        'frontend_total': len(front),
        'backend_sources': bs,
        'frontend_sources': fs_,
    }
    import json
    with open(os.path.join(outdir, 'patent-meta.json'), 'w', encoding='utf-8') as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)
    print(f'\n已输出: patent-backend.txt / patent-frontend.txt / patent-meta.json')

if __name__ == '__main__':
    main()
