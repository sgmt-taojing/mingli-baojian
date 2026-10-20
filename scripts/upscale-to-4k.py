#!/usr/bin/env python3
"""upscale-to-4k.py — 节气图片 4K 超分工具
用法: python3 upscale-to-4k.py <src_url> <save_path>
"""
import urllib.request
import sys
import os
from PIL import Image, ImageEnhance, ImageFilter

def main():
    if len(sys.argv) < 3:
        print("USAGE: python3 upscale-to-4k.py <src_url> <save_path>")
        sys.exit(1)

    src_url = sys.argv[1]
    save_path = sys.argv[2]

    # 下载
    try:
        req = urllib.request.Request(src_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open("/tmp/_src.jpg", "wb") as f:
                f.write(resp.read())
    except Exception as e:
        print(f"DOWNLOAD_FAIL: {str(e)[:200]}")
        sys.exit(2)

    # 超分
    try:
        im = Image.open("/tmp/_src.jpg").convert("RGB")
        w, h = im.size
        # 保持宽高比，长边缩放到3840
        if w > h:
            new_w, new_h = 3840, int(3840 * h / w)
        else:
            new_w, new_h = int(3840 * w / h), 3840
        im2 = im.resize((new_w, new_h), Image.LANCZOS)
        im2 = im2.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=2))
        im2 = ImageEnhance.Sharpness(im2).enhance(1.15)
        im2.save(save_path, "JPEG", quality=92, optimize=True)
        print(f"4K_OK {new_w}x{new_h}")
    except Exception as e:
        print(f"RESIZE_FAIL: {str(e)[:200]}")
        sys.exit(3)

if __name__ == "__main__":
    main()
