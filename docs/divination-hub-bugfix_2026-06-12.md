# divination-hub.html Bug修复记录

**时间**: 2026-06-12 16:25-16:35

## 修复的问题

### 1. 电子罗盘文字不显示（关键bug）
- **原因**: Canvas `drawTextOnCircle` 和另一处 `fillStyle` 使用了 CSS变量 `var(--paper)` 作为默认颜色，Canvas API 不支持 CSS 变量
- **修复**: 改为实际颜色值 `#f0e8d8`（对应 --paper 的浅色文字）
- **影响**: 所有6个电子罗盘（奇门/六壬/玄空/八宅/河图洛书/爻卦）文字均不可见

### 2. 导出按钮无效
- **原因**: `exportBaziReport()` 和 `exportHuajieReport()` 函数在HTML中被onclick引用但从未定义
- **修复**: 添加完整函数实现，生成独立HTML文件下载
- **影响**: 八字报告导出和化解方案导出按钮点击无反应

### 3. 重复HTML ID
- **原因**: 信众中心和八字模块都使用了 `baziName` 和 `baziHour` 作为ID
- **修复**: 信众中心改为 `userBaziName`/`userBaziHour`，`bindBazi()` 函数引用同步更新
- **影响**: 可能导致信众中心绑八字功能取值错误

### 4. HTTP服务路径错误
- **原因**: 端口8899的HTTP服务运行在 `~/.qclaw/workspace/skills/epb-assistant/scripts/`，非workspace根目录
- **修复**: 终止旧进程，在workspace根目录重启 `python3 -m http.server 8899`
- **影响**: 通过localhost:8899无法访问divination系列文件

## 当前文件状态
- `divination-hub.html`: 5972行，327KB
- HTTP服务: localhost:8899（workspace根目录）
