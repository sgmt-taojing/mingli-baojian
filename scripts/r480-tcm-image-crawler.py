#!/usr/bin/env python3
"""
R480 · TCM 诊断图片爬虫 — 🚫 已隔离（项目归属：ai-vision-toolkit）
原职责：采集舌象/面诊/手诊公开图片数据集（GitHub/Kaggle/Wiki Commons）
原位置：scripts/r480-tcm-image-crawler.py
备份位置：scripts/r480-tcm-image-crawler.py.isolated

归属判定（2026-08-07）：
- 视觉数据集采集 → 属 ai-vision-toolkit
- mingli-baojian 仅布控训练好的 ONNX 算法，不采集数据
"""
import sys

def main():
    print("⚠️  r480-tcm-image-crawler.py 已隔离")
    print("📦  原脚本: scripts/r480-tcm-image-crawler.py.isolated")
    print("")
    print("🚫 本项目不做 TCM 视觉数据采集")
    print("📡 本项目消费方：face-ocr-server.py:8913")
    sys.exit(0)

if __name__ == '__main__':
    main()
