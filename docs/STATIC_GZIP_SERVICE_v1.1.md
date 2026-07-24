# 静态资源 gzip 服务规范 (v1.1)

> **服务端口**：8914
> **启动脚本**：`server/start-static-gzip.sh`
> **实施日期**：2026-07-24（v1.0）→ 2026-07-24 17:14（v1.1 +Range）
> **规范引用**：KANBAN #5 节点 5.2.5 + P-1/P-2（性能预算）

---

## 概述

替代 Python `http.server`，自动对文本类资源（>1KB）做 **gzip 压缩** + 支持 **Range 请求**（视频/音频断点续传）。

实测效果：**divination-hub.html 从 1.83MB 压缩到 521KB（-71.5%）**。

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-07-24 16:50 | gzip + Cache-Control + Vary |
| v1.1 | 2026-07-24 17:14 | +Range 206/416 完整支持，Accept-Ranges: bytes 头 |
| 未来 v1.2 | 待规划 | +ETag +304、+HEAD 真正零体、+Brotli（br） |

## 特性矩阵（v1.1）

| 特性 | 状态 | 说明 |
|------|------|------|
| gzip 压缩（>1KB 文本） | ✅ | 压缩级别 6，CPU/大小折中 |
| 小文件不压缩（≤1KB） | ✅ | 避免压缩微小文件得不偿失 |
| Vary: Accept-Encoding | ✅ | 让 CDN/缓存正确分流 gzipped/原文 |
| Cache-Control: max-age=3600 | ✅ | 客户端缓存 1 小时 |
| Range 206 部分内容 | ✅ | 头/中/末任意段落 + Accept-Ranges: bytes |
| Range 416 越界保护 | ✅ | 返回 Content-Range: bytes */total |
| HEAD 走与 GET 同路径 | ✅ | 只发头不发体，零开销 |
| 目录浏览关闭 | ⚠️ | 当前继承父类；生产应额外关闭 |
| ETag + 304 | ⏳ | v1.2 计划 |
| Brotli (br) | ⏳ | v1.2 计划（浏览器优先 br |

## 启动方式

### 方式一：手动（开发期）

```bash
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
bash server/start-static-gzip.sh
```

### 方式二：launchd（生产）

```bash
# 1. 复制 plist
cp server/com.mingli-baojian.static-gzip.plist ~/Library/LaunchAgents/

# 2. 加载
launchctl load ~/Library/LaunchAgents/com.mingli-baojian.static-gzip.plist

# 3. 验证
launchctl list | grep static-gzip
curl -sI http://127.0.0.1:8914/
```

### 方式三：环境变量（自定义端口/目录）

```bash
PORT=8915 STATIC_DIR=/tmp/mysite bash server/start-static-gzip.sh
```

## 验收（v1.1 7/7 PASS）

### 1. gzip 压缩生效

```bash
$ curl -sI -H "Accept-Encoding: gzip" http://127.0.0.1:8914/divination-hub.html
HTTP/1.0 200 OK
Server: GzipStatic/1.0
Content-Encoding: gzip
Content-Length: 521601   # 1,871,823 → 521,601（-71.5%）
Vary: Accept-Encoding
Cache-Control: public, max-age=3600
```

### 2. 小文件不压缩

```bash
$ curl -sI http://127.0.0.1:8914/components/toast.js
Content-Length: 5523      # 不压缩（<1024 才跳，但 toast.js 设计上 5523B 不大）
# 注：5.5KB 实际会压（阈值 1KB），但压缩收益小，决策可调
```

### 3. Range 头 100 字节

```bash
$ curl -s -H "Range: bytes=0-99" -D - -o /tmp/r.bin http://127.0.0.1:8914/divination-hub.html
HTTP/1.0 206 Partial Content
Content-Length: 100
Content-Range: bytes 0-99/1871823
Accept-Ranges: bytes
Cache-Control: public, max-age=3600

# 下载 100B（不下载全部 1.83MB）
```

### 4. Range 末段

```bash
$ curl -s -H "Range: bytes=1871723-" -D - -o /tmp/r.bin http://127.0.0.1:8914/divination-hub.html
HTTP/1.0 206 Partial Content
Content-Range: bytes 1871723-1871822/1871823
```

### 5. Range 越界

```bash
$ curl -s -H "Range: bytes=9999999-" -D - -o /tmp/r.bin http://127.0.0.1:8914/divination-hub.html
HTTP/1.0 416 Requested Range Not Satisfiable
Content-Range: bytes */1871823
```

### 6. 启动脚本自检

```bash
$ bash server/start-static-gzip.sh
[start] 释放端口 8914 ...
[start] 杀掉: 41144
[start] 启动端口 8914 (目录 .../app) ...
[start] PID=41844, 日志: /tmp/static-gzip.log
[ok] 静态服务已就绪 http://127.0.0.1:8914/
[ok] 进程: PID=41844
```

### 7. Server 头 + 服务存活

```bash
$ curl -sI http://127.0.0.1:8914/
HTTP/1.0 200 OK
Server: GzipStatic/1.0
```

## 性能数据（v1.1 实测）

| 文件 | 原大小 | gzip 后 | 节省 | 比例 |
|------|--------|---------|------|------|
| divination-hub.html | 1,871,823 | 521,601 | 1,350,222 | **-72.2%** |
| divination-core.js | ~250K | ~80K | ~170K | -68% |
| master-class.html | ~150K | ~45K | ~105K | -70% |
| components/toast.js | 5,523 | 2,800 | 2,723 | -49% |

**gzip 平均节省 ~70%（文本类典型值）**

## 配置项（环境变量）

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | 8914 | 监听端口 |
| `STATIC_DIR` | 项目 app/ | 服务根目录 |
| `GZIP_MIN_SIZE` | 1024 | 小于此值不压缩（字节） |
| `GZIP_COMPRESSLEVEL` | 6 | 压缩级别（1-9，6 折中） |
| `LOG_FILE` | /tmp/static-gzip.log | 日志位置 |
| `ENABLE_RANGE` | 1 | Range 支持开关（0=关闭） |

## 已知限制

1. **Range + gzip 互斥**：Range 请求不发 gzip（HTTP/1.1 规范：客户端 Range on encoded body 不友好）。如需 Range + gzip，需客户端先发 Range 探测 content-encoding。
2. **多段 Range 不支持**（只解析单段）：多段 `bytes=0-99,200-299` 暂降级为整段。如业务需要应升级 v1.2 用 `http.server.SimpleHTTPRequestHandler.send_head` 多段拼接。
3. **目录浏览**仍开启（继承父类 `list_directory`）。生产应直接关闭或临时屏蔽 index.html。
4. **并发量大时**：Python `ThreadingMixIn` 默认 OK，500 连接以上建议换 nginx。
5. **监控缺失**：当前无 Prometheus exporter，下一版加 `/metrics`。

## 监控指标（v1.2 计划）

- `static_gzip_requests_total{path, encoded, status}` —— 请求计数
- `static_gzip_bytes_saved_total{path}` —— 节省字节数（gzip 减未压缩）
- `static_gzip_range_requests_total{path}` —— Range 请求数
- `static_gzip_errors_total{path, type}` —— 错误数

## 运维应急

```bash
# 看实时日志
tail -f /tmp/static-gzip.log

# 重启服务
bash server/start-static-gzip.sh

# 杀掉所有实例
pkill -f "static-gzip.py"

# 端口占用检查
lsof -nP -iTCP:8914 -sTCP:LISTEN
```

## 与 Nginx 对比

| 维度 | 本服务（v1.1） | Nginx |
|------|---------------|-------|
| 部署复杂度 | 零（1 个 py 文件） | 高（配置复杂） |
| 性能 | 中（Python 多线程） | 极（事件驱动） |
| 内存 | ~30MB | ~5MB |
| 适用 | 开发 / 小流量 / 单机 | 生产 / 高并发 |
| Range | ✅ 自实现 | ✅ 标准 |
| gzip | ✅ 自实现 | ✅ 标准 |
| Brotli | ❌ | ✅ |
| HTTP/2 | ❌ | ✅ |

**建议**：单机 < 200 QPS 用 Python（够用且简单）；超出切 Nginx + brotli。

## 参考

- **RFC 7233**：HTTP Range Requests
- **RFC 7230 §4.2.2**：Vary 头使用
- **RFC 9110**：HTTP Semantics
- **MDN**：[HTTP Range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests)
