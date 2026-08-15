# -*- coding: utf-8 -*-
"""倪师 106 视频字幕全量提取管线（4 并行）
- 输入: /Volumes/data2/倪师智慧结晶/*/**.mp4
- 输出: /Volumes/data2/nishi-materials/subs/*.txt
- 断点续跑
"""
import os, subprocess, json, time, sys, glob
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = "/Volumes/data2/倪师智慧结晶"
OUT = "/Volumes/data2/nishi-materials/subs"
BIN = "/tmp/video_subtitle_extract"
WORKERS = 4
INTERVAL = 3  # 秒

os.makedirs(OUT, exist_ok=True)

def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(f"{OUT}/progress.log", "a") as f:
        f.write(line + "\n")

# 收集所有视频
videos = []
for d in sorted(os.listdir(ROOT)):
    full = os.path.join(ROOT, d)
    if not os.path.isdir(full):
        continue
    for f in sorted(glob.glob(os.path.join(full, "*.mp4"))):
        # 跳过"有广告"目录
        if "广告" in d or "裁剪" in d:
            continue
        videos.append(f)

log(f"共 {len(videos)} 个视频")

def extract(video):
    name = os.path.splitext(os.path.basename(video))[0]
    out = os.path.join(OUT, name + ".txt")
    # 断点: 已存在且 >1KB 跳过
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        return video, "skip", os.path.getsize(out)
    t0 = time.time()
    try:
        r = subprocess.run([BIN, video, out, str(INTERVAL)], capture_output=True, text=True, timeout=3600)
        if r.returncode == 0 and os.path.exists(out):
            size = os.path.getsize(out)
            return video, "ok" if size > 500 else "empty", size
        return video, f"err:{r.returncode}", 0
    except Exception as e:
        return video, f"exc:{str(e)[:50]}", 0

t_start = time.time()
results = {"ok": 0, "skip": 0, "err": 0, "chars": 0}
with ThreadPoolExecutor(max_workers=WORKERS) as ex:
    futs = {ex.submit(extract, v): v for v in videos}
    done = 0
    for fut in as_completed(futs):
        video, status, size = fut.result()
        done += 1
        name = os.path.basename(video)[:30]
        if status == "ok":
            results["ok"] += 1
            results["chars"] += size
        elif status == "skip":
            results["skip"] += 1
        else:
            results["err"] += 1
            log(f"❌ {name}: {status}")
        if done % 5 == 0:
            elapsed = (time.time() - t_start) / 60
            rate = done / elapsed if elapsed > 0 else 0
            remain = (len(videos) - done) / rate / 60 if rate > 0 else 0
            log(f"进度 {done}/{len(videos)} | ok={results['ok']} skip={results['skip']} err={results['err']} | {rate:.1f}个/分 | ETA {remain:.0f}min")

elapsed = (time.time() - t_start) / 60
log(f"🎉 完成: {results} | {elapsed:.0f}min")
