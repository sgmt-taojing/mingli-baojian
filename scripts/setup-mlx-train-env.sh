#!/bin/bash
# R458: MLX 训练环境搭建脚本（Mac M4 Apple Silicon）
# 基于 MLX-LM 框架，替代 LLaMA-Factory Docker 方案
# 使用 miniforge Python 3.13

set -e

PYTHON="/opt/homebrew/Caskroom/miniforge/base/bin/python3"
PIP="/opt/homebrew/Caskroom/miniforge/base/bin/pip"
ENV_NAME="mingli-train"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== R458: MLX 训练环境搭建 ==="
echo "时间: $(date)"
echo "Python: $($PYTHON --version)"
echo "项目目录: $PROJECT_DIR"
echo ""

# Step 1: 创建 conda 虚拟环境
echo "[1/5] 创建 conda 环境: $ENV_NAME"
CONDA="/opt/homebrew/Caskroom/miniforge/base/bin/conda"
$CONDA env list 2>/dev/null | grep -q "$ENV_NAME" && {
  echo "  → 环境 $ENV_NAME 已存在，跳过创建"
} || {
  $CONDA create -y -n "$ENV_NAME" python=3.11 2>&1 | tail -3
  echo "  → 环境 $ENV_NAME 创建完成"
}

# 激活环境的 Python 路径
ENV_PYTHON="/opt/homebrew/Caskroom/miniforge/base/envs/$ENV_NAME/bin/python3"
ENV_PIP="/opt/homebrew/Caskroom/miniforge/base/envs/$ENV_NAME/bin/pip"

# Step 2: 安装 MLX-LM 及依赖
echo ""
echo "[2/5] 安装 MLX-LM 及训练依赖..."
$ENV_PIP install --quiet mlx-lm 2>&1 | tail -3
$ENV_PIP install --quiet datasets transformers 2>&1 | tail -3
echo "  → MLX-LM 安装完成"

# Step 3: 验证安装
echo ""
echo "[3/5] 验证安装..."
$ENV_PYTHON -c "
import mlx.core as mx
import mlx_lm
import datasets
print(f'  mlx core: {mx.__version__ if hasattr(mx, \"__version__\") else \"ok\"}')
print(f'  mlx-lm: {mlx_lm.__version__}')
print(f'  datasets: {datasets.__version__}')
print('  ✅ 所有依赖验证通过')
"

# Step 4: 准备训练数据目录结构
echo ""
echo "[4/5] 准备训练目录结构..."
mkdir -p "$PROJECT_DIR/training/mlx-checkpoints"
mkdir -p "$PROJECT_DIR/training/eval-results"
mkdir -p "$PROJECT_DIR/training/logs"
echo "  → training/mlx-checkpoints/"
echo "  → training/eval-results/"
echo "  → training/logs/"

# Step 5: 数据格式检查
echo ""
echo "[5/5] 检查训练数据格式..."
$ENV_PYTHON -c "
import json, os
project = '$PROJECT_DIR'
for f in ['mingli_sft_train', 'mingli_sft_val', 'mingli_sft_test']:
    path = os.path.join(project, 'data', f + '.json')
    with open(path) as fh:
        data = json.load(fh)
    print(f'  {f}: {len(data)} 条')

for f in ['mingli_dpo_train', 'mingli_dpo_val']:
    path = os.path.join(project, 'data', f + '.json')
    with open(path) as fh:
        data = json.load(fh)
    print(f'  {f}: {len(data)} 条')
print('  ✅ 数据文件全部可读')
"

echo ""
echo "=== R458 环境搭建完成 ==="
echo "下一步: R459 SFT 训练执行"
echo "使用: conda activate $ENV_NAME && python scripts/mlx-sft-train.py"
