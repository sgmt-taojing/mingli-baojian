# -*- coding: utf-8 -*-
"""
E2E 视觉诊断 + KB 联动测试（修真后验证 · R652）
测试链路：base64 图 → ONNX 推理 → 输出文本 → KB 匹配 → 蒸馏模块命中
"""
import sys, base64, json
sys.path.insert(0, '/Users/tom/kimi/projects/mingli-baojian/server')

# 真实舌象测试图（红舌/淡红舌图片，用更大分辨率的纯色 PNG）
import zlib, struct
def make_color_png(r, g, b, w=32, h=32):
    """生成指定颜色的 PNG"""
    def png_chunk(typ, data):
        return struct.pack('>I', len(data)) + typ + data + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    raw = b''
    for _ in range(h):
        raw += b'\x00' + bytes([r, g, b]) * w
    idat = zlib.compress(raw)
    return sig + png_chunk(b'IHDR', ihdr) + png_chunk(b'IDAT', idat) + png_chunk(b'IEND', b'')

# 红色测试图（模拟红舌）
red_b64 = base64.b64encode(make_color_png(220, 50, 50)).decode()
# 黄色测试图（模拟眼白发黄）
yellow_b64 = base64.b64encode(make_color_png(240, 220, 100)).decode()

from vision_onnx_integration import classify_vision
from kb_matcher import match_kb

print('=' * 70)
print('E2E 视觉诊断 + KB 联动全链路测试（R652 修真后）')
print('=' * 70)

test_cases = [
    ('tongue', red_b64, 'ALG-070 舌诊（红舌）'),
    ('face',   red_b64, 'ALG-071 面诊（红面色）'),
    ('eye',    yellow_b64, 'ALG-072 眼诊（黄眼白）'),
    ('hand',   red_b64, 'ALG-080 手诊（红掌色）'),
]

for mode, b64, label in test_cases:
    print(f'\n--- {label} ---')
    r = classify_vision(mode, b64)
    print(f'  engine={r.get("engine")} results={r.get("results") is not None}')
    top1 = r.get('top1')
    if top1:
        print(f'  TOP-1: {top1["label"]} (conf={top1["confidence"]:.3f})')
        # 把 top1 label 作为 KB 搜索文本
        kb_hits = match_kb(top1['label'], mode, limit=5)
        print(f'  KB 命中: {len(kb_hits)} 条')
        for h in kb_hits:
            print(f'    [{h["score"]}] {h["title"][:40]} ({h["module"]})')
        engine_count = sum(1 for h in kb_hits if '-engine' in h['module'])
        print(f'  → 蒸馏模块命中: {engine_count} 条')
    else:
        print(f'  ⚠️  ONNX 无 top1 结果')

# 离线测试：模拟 ONNX 输出 → KB 命中
print('\n' + '=' * 70)
print('离线模拟：ONNX top-1 label → KB 匹配（修真后蒸馏模块是否触发）')
print('=' * 70)
mocks = [
    ('tongue', '红舌', 0.85),
    ('face', '面色红', 0.92),
    ('eye', '眼白发黄', 0.78),
    ('hand', '掌色红', 0.81),
]
for mode, label, conf in mocks:
    print(f'\n  [{mode}] 模拟识别: {label}')
    kb_hits = match_kb(label, mode, limit=4)
    for h in kb_hits:
        marker = '🔥' if '-engine' in h['module'] else '  '
        print(f'    {marker} [{h["score"]}] {h["title"][:40]} ({h["module"]})')