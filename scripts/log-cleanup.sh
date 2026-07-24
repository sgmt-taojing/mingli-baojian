#!/bin/bash
# 日志清理：7天前 gzip，30天前删除
LOGS_DIR="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/logs"
find "$LOGS_DIR" -name "*.log" -mtime +7 -exec gzip {} \; 2>/dev/null
find "$LOGS_DIR" -name "*.gz" -mtime +30 -delete 2>/dev/null
