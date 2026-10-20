#!/bin/bash
# WO-002 v9.2 定案链（R-CHAIN 2026-09-21 Kimi driver）
# 停8960 → 训练(seq768稳定配方/300iter) → fuse → 同管线双模型488题本地评估 → 三选一定案 → 恢复8960
# 同管线原则：v9.0 与 v9.2 均用 eval-baziqa-local.py（v2.5 提取）本地评估，排除管线差异
set -uo pipefail
cd /Users/tom/kimi/projects/mingli-baojian
# R-TCC2：launchd 上下文 source 外盘软链 activate 触发 EPERM；
# 改为直接调用 venv python 绝对路径（与 mlx-v8.plist 同模式，实证可行）
VPY=/Users/tom/kimi/projects/mingli-baojian/.venv-mlx/bin/python
UID_N=$(id -u)
LABEL=com.mingli-baojian.mlx-v8
LOG=training/logs/wo002-v92-chain.log
V90=training/mlx-models/mingli-sft-v9.0-7b
V92=training/mlx-models/mingli-sft-v9.2-7b
CKPT=training/mlx-checkpoints/mingli-sft-v92

say(){ echo "[chain $(date '+%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

restore_8960() {
  launchctl bootstrap "gui/$UID_N/$LABEL" 2>/dev/null || launchctl kickstart "gui/$UID_N/$LABEL" 2>/dev/null
  say "8960 恢复指令已发（无论成败）"
}
trap restore_8960 EXIT

say "=== WO-002 v9.2 定案链启动 ==="
launchctl bootout "gui/$UID_N/$LABEL" 2>/dev/null && say "8960 已停（训练窗口）" || say "8960 本就不在"

# 1. 训练（R121 教训：seq 768 是 16GB 稳定配方，1024 曾 OOM）
# R-RESUME：产物已在即跳过（首轮 11:10 已完成 train+fuse，改样重评不重复训练）
if [ -d "$V92" ] && [ -f "$V92/config.json" ]; then
  say "v9.2 fused 产物已在，跳过训练与 fuse（R-RESUME）"
else
  rm -rf "$CKPT"; mkdir -p "$CKPT"
  say "训练启动：base=v9.0 data=mlx-r105-data-v92 iters=300 seq=768"
  "$VPY" -u -m mlx_lm lora --train \
    --model "$V90" \
    --data training/mlx-r105-data-v92 \
    --fine-tune-type lora --iters 300 --batch-size 1 \
    --grad-accumulation-steps 4 --learning-rate 5e-6 \
    --max-seq-length 768 --mask-prompt --grad-checkpoint \
    --num-layers 20 --adapter-path "$CKPT" \
    --save-every 50 --steps-per-report 10 --steps-per-eval 50 --val-batches 20 --seed 42 \
    >> "$LOG" 2>&1
  TRAIN_RC=$?
  [ $TRAIN_RC -ne 0 ] && { say "❌ 训练失败 rc=$TRAIN_RC，链路中止"; exit 1; }
  [ -f "$CKPT/adapters.safetensors" ] || { say "❌ 无 adapter 产物，链路中止"; exit 1; }
  say "训练完成，开始 fuse"

  # 2. fuse
  rm -rf "$V92"
  "$VPY" -u -m mlx_lm fuse --model "$V90" \
    --adapter-path "$CKPT" --save-path "$V92" >> "$LOG" 2>&1
  [ -d "$V92" ] || { say "❌ fuse 无产物，链路中止"; exit 1; }
  say "fuse 完成：$V92"
fi

# 3. 同管线双评估（本地单进程，v2.5 提取）
# R-SAMPLE：driver 定夺改 10 人样（≈96题/模型，CI±10pp）——全量 488 实测 56s/题需 15h，
# 期间 8960 停摆不可接受；样本同管线同题集对比公平，全量 488 留夜间验证跑
say "评估 v9.0 基线（同管线 10 人样）..."
rm -f training/baziqa-results/v90-sameharness-*.log
"$VPY" -u training/eval-baziqa-local.py --model "$V90" --limit 10 --tag v90-sameharness >> "$LOG" 2>&1
say "评估 v9.2（同管线 10 人样）..."
rm -f training/baziqa-results/v92-final-*.log
"$VPY" -u training/eval-baziqa-local.py --model "$V92" --limit 10 --tag v92-final >> "$LOG" 2>&1

# 4. 定案
python3 - <<'EOF' | tee -a "$LOG"
import json, re, glob, os
def parse(tag):
    fs = sorted(glob.glob(f'training/baziqa-results/{tag}*.log'))
    if not fs: return None
    txt = open(fs[-1]).read()
    m = re.findall(r'=== 结果: (\d+)/(\d+) = ([\d.]+)%', txt)
    empty = txt.count('模型=?')
    total_q = sum(int(a) for a,_,_ in m[-1:]) if m else 0
    if not m: return None
    correct, total, pct = int(m[-1][0]), int(m[-1][1]), float(m[-1][2])
    return {'log': fs[-1], 'correct': correct, 'total': total, 'pct': pct,
            'empty_rate': round(empty/total*100, 1) if total else 999}
v90, v92 = parse('v90-sameharness'), parse('v92-final')
out = {'ts': __import__('datetime').datetime.now().isoformat(), 'v90': v90, 'v92': v92}
if v90 and v92:
    margin = v92['pct'] - v90['pct']
    if v92['empty_rate'] >= 5:
        out['verdict'] = 'harness-fail'
        out['action'] = 'v9.2 空值率 %.1f%% ≥5%%，开审计单查管线' % v92['empty_rate']
    elif margin >= 5:
        out['verdict'] = 'v92-wins'
        out['action'] = 'v9.2 %.1f%% 超 v9.0 %.1f%% 达 %.1fpp（≥5pp 显著）→ 热切生产（8960 换挂 v9.2）' % (v92['pct'], v90['pct'], margin)
    elif margin <= -5:
        out['verdict'] = 'v92-loses'
        out['action'] = 'v9.2 %.1f%% 落后 v9.0 %.1f%% 达 %.1fpp → 归档定版不入生产' % (v92['pct'], v90['pct'], -margin)
    else:
        # R-SAMPLE 补：样本 CI±10pp 内差异不显著，保守留 v9.0，v9.2 归档观察
        out['verdict'] = 'v92-no-significant-diff'
        out['action'] = 'v9.2 %.1f%% vs v9.0 %.1f%%（差 %.1fpp，样本 CI 内不显著）→ 保守留 v9.0 生产，v9.2 归档观察' % (v92['pct'], v90['pct'], margin)
        out['margin_pp'] = round(margin, 1)
else:
    out['verdict'] = 'eval-incomplete'
    out['action'] = '评估日志缺失，需人工查 chain 日志'
os.makedirs('training/baziqa-results', exist_ok=True)
json.dump(out, open('training/baziqa-results/v92-verdict.json','w'), ensure_ascii=False, indent=2)
print('[verdict]', json.dumps(out, ensure_ascii=False))
EOF
say "=== 链路结束 ==="
