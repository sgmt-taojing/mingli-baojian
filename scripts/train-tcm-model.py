#!/usr/bin/env python3
"""
train-tcm-model.py — 🚫 已隔离（项目归属：ai-vision-toolkit）

原位置：scripts/train-tcm-model.py（YOLOv8-cls 训练 + ONNX 导出）
原职责：舌/面/手 视觉模型训练 + 部署到 video-ai-surveillance + face-ocr-server

归属判定（2026-08-07）：
- YOLOv8 视觉模型训练 → 属 ai-vision-toolkit
- ONNX 模型导出 → 属 ai-vision-toolkit
- 部署到 video-ai-surveillance → 跨项目
- face-ocr-server 仅消费已训练好的 ONNX，不在本项目训练

迁移路径：
  1. 备份文件：.openclaw/tmp/isolated-scripts/train-tcm-model.py.bak
  2. 等价脚本应在 ai-vision-toolkit 仓库内维护
  3. mingli-baojian 通过 face-ocr-server (port 8913) 消费其 ONNX 产物

项目边界（永久生效）：
  - mingli-baojian: 布控 + 诊疗 + KB 辨证（不训练视觉模型）
  - ai-vision-toolkit: 训练流水线 + 数据集 + 模型仓库
"""
import sys

def main():
    print("⚠️  train-tcm-model.py 已隔离")
    print("📦  原脚本: scripts/train-tcm-model.py.isolated")
    print("🗄️  备份: .openclaw/tmp/isolated-scripts/train-tcm-model.py.bak")
    print("")
    print("🚫  本项目不做视觉模型训练（YOLOv8 / MobileNetV3 / 视觉分类/检测）")
    print("✅  本项目布控已训练好的 ONNX 算法（4 类诊疗视觉）")
    print("")
    print("📂  等价实现应在 ai-vision-toolkit 项目维护")
    print("📡  本项目消费方：face-ocr-server.py:8913 (ALG-070/071/072/080)")
    sys.exit(0)

if __name__ == '__main__':
    main()
