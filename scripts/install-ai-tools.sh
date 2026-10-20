#!/bin/bash
# ═══════════════════════════════════════════════════════
# install-ai-tools.sh — 主流 AI 训练工具一键安装
# ═══════════════════════════════════════════════════════
set -euo pipefail
GREEN='\033[0;32m' YELLOW='\033[1;33m' NC='\033[0m'

echo "============================================"
echo "  主流 AI 识别算法训练工具安装"
echo "============================================"
echo ""

# ─── 1. 基础依赖 ───
echo -e "${YELLOW}[1/5]${NC} 基础科学计算..."
pip3 install numpy scipy scikit-learn matplotlib tqdm pillow -q
echo -e "${GREEN}✓${NC} numpy, scipy, sklearn, matplotlib, tqdm, pillow"

# ─── 2. OpenCV ───
echo -e "${YELLOW}[2/5]${NC} OpenCV 图像处理..."
pip3 install opencv-python-headless -q
python3 -c "import cv2; print('OpenCV', cv2.__version__)"
echo -e "${GREEN}✓${NC} OpenCV"

# ─── 3. ONNX 推理 ───
echo -e "${YELLOW}[3/5]${NC} ONNX 模型导出+推理..."
pip3 install onnx onnxruntime -q
python3 -c "import onnx, onnxruntime; print('ONNX', onnx.__version__, 'ORT', onnxruntime.__version__)"
echo -e "${GREEN}✓${NC} ONNX + ONNX Runtime"

# ─── 4. PyTorch (CPU版，训练够用) ───
echo -e "${YELLOW}[4/5]${NC} PyTorch 深度学习框架（CPU版，~180MB）..."
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q 2>&1 | tail -1
python3 -c "import torch; print('PyTorch', torch.__version__)"
echo -e "${GREEN}✓${NC} PyTorch + torchvision"

# ─── 5. Ultralytics YOLOv8 ───
echo -e "${YELLOW}[5/5]${NC} Ultralytics YOLOv8（检测/分类/分割）..."
pip3 install ultralytics -q 2>&1 | tail -1
python3 -c "from ultralytics import YOLO; print('Ultralytics YOLOv8 ready')"
echo -e "${GREEN}✓${NC} Ultralytics YOLOv8"

# ─── 可选：MediaPipe ───
echo ""
echo -e "${YELLOW}[可选]${NC} MediaPipe 人脸/手部关键点..."
pip3 install mediapipe -q 2>&1 | tail -1 && echo -e "${GREEN}✓${NC} MediaPipe" || echo -e "${YELLOW}⚠${NC} MediaPipe 跳过（可选）"

# ─── 验证 ───
echo ""
echo "============================================"
echo "  安装验证"
echo "============================================"
python3 << 'VERIFY'
import importlib
tools = {
    'numpy': '科学计算', 'cv2': 'OpenCV 图像处理',
    'torch': 'PyTorch 深度学习', 'torchvision': 'torchvision 视觉',
    'onnx': 'ONNX 导出', 'onnxruntime': 'ONNX 推理',
    'PIL': 'Pillow 图像', 'sklearn': 'scikit-learn',
    'ultralytics': 'YOLOv8 检测/分类',
}
for mod, desc in tools.items():
    try:
        m = importlib.import_module(mod)
        v = getattr(m, '__version__', '')
        print(f'  ✅ {mod:20s} {v:15s} {desc}')
    except:
        print(f'  ❌ {mod:20s} {"未安装":15s} {desc}')

# mediapipe
try:
    import mediapipe as mp
    print(f'  ✅ {"mediapipe":20s} {mp.__version__:15s} 人脸/手部关键点')
except:
    print(f'  ⚠️ {"mediapipe":20s} {"(可选)":15s} 人脸/手部关键点')

print('\n🎉 主流 AI 训练工具安装完成！')
VERIFY
