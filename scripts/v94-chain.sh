#!/bin/bash
# v9.4 全链路：等训练完 → fuse → 部署 8960 → 全量 488 复测（2026-09-25）
# 后台常驻，全程日志 training/mlx-checkpoints/v94-chain.log
R=/Users/tom/kimi/projects/mingli-baojian
LOG=$R/training/mlx-checkpoints/v94-chain.log
exec >>$LOG 2>&1
set -x

echo "=== $(date '+%F %T') chain 启动，等训练进程结束 ==="
while pgrep -f 'mlx_lm lora' >/dev/null; do sleep 60; done
echo "=== $(date '+%F %T') 训练结束，开始 fuse ==="
tail -3 $R/training/mlx-checkpoints/v94-train.log

cd $R
/Users/tom/kimi/projects/mingli-baojian/.venv-mlx/bin/python -u -m mlx_lm fuse \
  --model training/mlx-models/mingli-sft-v9.0-7b \
  --adapter-path training/mlx-checkpoints/mingli-sft-v94 \
  --save-path training/mlx-models/mingli-sft-v9.4-7b || exit 1
echo "=== $(date '+%F %T') fuse 完成 ==="

# 部署：plist 指向 v9.4 并重启 8960
python3 - <<'PY'
import plistlib, os
p=os.path.expanduser('~/Library/LaunchAgents/com.mingli-baojian.mlx-v8.plist')
d=plistlib.load(open(p,'rb'))
d['EnvironmentVariables']['MLX_MODEL']='/Users/tom/kimi/projects/mingli-baojian/training/mlx-models/mingli-sft-v9.4-7b'
plistlib.dump(d, open(p,'wb'))
print('plist MLX_MODEL → v9.4')
PY
uid=$(id -u)
launchctl bootout gui/$uid/com.mingli-baojian.mlx-v8 2>/dev/null
sleep 2
launchctl bootstrap gui/$uid ~/Library/LaunchAgents/com.mingli-baojian.mlx-v8.plist
sleep 20
curl -s -m 5 http://127.0.0.1:8960/health || curl -s -o /dev/null -w '8960 http:%{http_code}\n' -m 5 http://127.0.0.1:8960/
echo "=== $(date '+%F %T') 8960 已带 v9.4 重启 ==="

# 全量 488 复测（分段跑法同 v92-fixed）
bash scripts/run-baziqa-full-v94.sh
echo "=== $(date '+%F %T') 复测完成 ==="
