# HEARTBEAT.md

## 穿戴 SDK 监控
- 穿戴 SDK 8+1 文件本地 8914 + GitHub Pages 全 200 ✅（2026-07-25 验证）
- 文件路径：`js/wearable/`（device-provider + rokid-bridge/camera/audio/voice/motion/storage/glass + index）
- H5 集成：`app/glass-console.html` 已引入 8 个 script + wearable-status + 镜腿联动 + 唤醒词

## 定期检查项
- [ ] 8914 静态服务存活（lsof -i :8914）
- [ ] SDK 9 文件 curl 200（`for f in js/wearable/*.js; do curl -so /dev/null -w "%{http_code} $f\n" http://127.0.0.1:8914/$f; done`）
- [ ] GitHub Pages 可达（`curl -sI https://tom2025.github.io/mingli-baojian/js/wearable/rokid-bridge.js | head -1`）
