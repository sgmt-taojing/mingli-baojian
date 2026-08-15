# -*- coding: utf-8 -*-
"""天纪分类版 184 视频字幕提取（6.4GB 主题切片）"""
import os, subprocess, json, time, sys, glob
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = "/Volumes/data2/倪师智慧结晶/7.天纪裁剪切割分类版（有广告，不建议看）"
OUT = "/Volumes/data2/nishi-materials/subs-tianji-classified"
BIN = "/tmp/video_subtitle_extract"
WORKERS = 4
INTERVAL = 3

os.makedirs(OUT, exist_ok=True)

def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(f"{OUT}/progress.log", "a") as f:
        f.write(line + "\n")

videos = []
for root, dirs, files in os.walk(ROOT):
    for f in sorted(files):
        if f.endswith('.mp4'):
            videos.append(os.path.join(root, f))

# 去重：同一文件名不同目录（(1) 副本）
seen = {}
for v in videos:
    base = os.path.basename(v).replace('(1)', '').replace('.mp4', '')
    if base not in seen:
        seen[base] = v
videos = list(seen.values())
log(f"去重后 {len(videos)} 个视频")

def extract(video):
    name = os.path.splitext(os.path.basename(video))[0].replace('(1)', '').replace('_new', '')[:60]
    out = os.path.join(OUT, name + ".txt")
    if os.path.exists(out) and os.path.getsize(out) > 800:
        return video, "skip", os.path.getsize(out)
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
        if done % 10 == 0:
            elapsed = (time.time() - t_start) / 60
            rate = done / elapsed if elapsed > 0 else 0
            remain = (len(videos) - done) / rate / 60 if rate > 0 else 0
            log(f"进度 {done}/{len(videos)} | ok={results['ok']} skip={results['skip']} err={results['err']} | ETA {remain:.0f}min")

elapsed = (time.time() - t_start) / 60
log(f"🎉 完成: {results} | {elapsed:.0f}min")
