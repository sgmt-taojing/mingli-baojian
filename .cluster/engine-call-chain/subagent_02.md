# 排盘功能调用链路深度排查报告

**排查时间**: 2026-07-13 08:00 GMT+8  
**排查范围**: H5移动端所有排盘推算分析功能  
**项目路径**: `/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/`

---

## 🔴 根因：const 重复声明导致脚本块整体失败

### 核心问题

`divination-core.js`（外部JS文件）在全局作用域声明了大量 `const` 变量（如 `STEMS`, `BRANCHES`, `ELE`, `ZHI_ELE`, `NAYIN_COLOR`, `HEXAGRAMS`, `STARS_MAP` 等）。

随后 `divination-hub.html` 的内联 `<script>` 块中**再次声明了同名的 `const` 变量**。在浏览器中，不同 `<script>` 标签共享同一个全局词法环境，**重复声明 `const` 会导致 `SyntaxError: Identifier 'XXX' has already been declared`**，并且**整个 `<script>` 块不会执行**。

### 受影响的脚本块

| 脚本块 | 行号范围 | 大小 | 重复声明数 | 状态 | 首个冲突 |
|--------|----------|------|-----------|------|---------|
| #2 | 12787-12920 | 6.1KB | 4 | ❌ 失败 | `const STEMS` (line 12802) |
| #4 | 13109-26725 | 658KB | 61 | ❌ 失败 | `const NAYIN_COLOR` (line 13184) |

### 脚本块 #4 中被影响的函数（未定义）

脚本块 #4（13109-26725行）包含约 658KB 代码，定义了以下关键函数（均因脚本块失败而**未被定义**）：

- `computeBazi()` (hub版本, line 16347)
- `computeQimen()` (hub版本, line 19641)
- `computeZiWei()` (hub版本, line 20005)
- `computeMeiHua()` (hub版本, line 20194)
- `computeLiuRen()` (hub版本, line 20470)
- `yjCast()` (hub版本, line 19170)
- `yjStart()` (hub版本, line 19124)
- `showYjResult()` (hub版本)
- `getNayin()`, `getGeju()`, `getShensha()`, `getHeChong()` 等
- `computeDayun()`, `getMingType()`, `getLifeSummary()`, `getTimingAdvice()` 等
- `HEXAGRAMS`, `STARS_MAP`, `DOORS_MAP`, `GODS_MAP`, `PALACE_INFO` 等常量

### 实际运行时行为

由于 `core.js` 先于 hub.html 内联脚本加载，且 `core.js` 中也定义了这些函数，**实际执行的是 core.js 版本**。hub.html 版本的覆盖失败，但不影响 core.js 版本的可用性。

**core.js 版本的函数均可正常工作**（经测试验证）：
- ✅ `computeBazi()` — 完成
- ✅ `computeQimen()` — 完成
- ✅ `computeZiWei()` — 完成（有非致命警告）
- ✅ `computeMeiHua()` — 完成
- ✅ `computeLiuRen()` — 完成
- ✅ `computeFengshui()` — 完成

---

## 🟡 次要问题：未定义函数

### 1. 仅存在于失败脚本块中的函数（8个）

以下函数**只在脚本块 #4 中定义**，运行时不可用：

| 函数名 | 调用位置 | 影响 |
|--------|---------|------|
| `getLiuRenTiGuan()` | hub.html computeLiuRen (失败) | 不影响 core.js 版本 |
| `getLiuRenShenPan()` | hub.html computeLiuRen (失败) | 不影响 core.js 版本 |
| `getDayStemAdvice()` | hub.html computeLiuRen (失败) | 不影响 core.js 版本 |
| `getGuaLeiXiang()` | hub.html computeMeiHua (失败) | 不影响 core.js 版本 |
| `renderMobileResult()` | 无调用 | 无影响 |
| `onLiCalModeChange()` | HTML onchange (line 12682) | ⚠️ 用户点击农历/公历切换时报错 |
| `onLpCalModeChange()` | HTML onchange (line 12334) | ⚠️ 用户点击农历/公历切换时报错 |
| `onYouthCalModeChange()` | HTML onchange (line 12444) | ⚠️ 用户点击农历/公历切换时报错 |

### 2. 完全未定义的函数（3个）

| 函数名 | 调用位置 | 影响 |
|--------|---------|------|
| `getShiChen()` | hub.html (line 19340, 19780, 20357) | 仅 yjMode==='matter' 时触发 |
| `getShiChenAnalysis()` | hub.html (line 19340, 19780, 20357) | 仅 yjMode==='matter' 时触发 |
| `getLunarDateStr()` | hub.html (line 19335, 19775, 20352) | 仅 yjMode==='matter' 时触发 |

### 3. 脚本块 #2 失败导致的未定义函数

| 函数名 | 行号 | 影响 |
|--------|------|------|
| `exportHTML()` | 12822 | ⚠️ 用户点击"导出HTML"按钮时报错 |
| `exportPDF()` | 12893 | ⚠️ 用户点击"导出PDF"按钮时报错 |

### 4. 完全不存在的口诀函数

| 函数名 | 调用位置 |
|--------|---------|
| `koujueShowFavorites()` | onclick |
| `koujueToggleDetail()` | onclick |
| `koujueToggleFav()` | onclick |

---

## 🟢 各排盘功能状态详情

### 1. 八字排盘 computeBazi()

| 项目 | 详情 |
|------|------|
| **函数来源** | core.js line 4398 (有效) |
| **hub.html版本** | line 16347 (失败，未定义) |
| **依赖函数** | getYearStemBranchExact ✅, getDayStemIndex ✅, getMonthBranchBySolar ✅, trueSolarTimeCorrection ✅ (均来自 core.js) |
| **结果渲染** | `baziResult` (line 7995) ✅ |
| **loadingOverlay** | 正确隐藏 (line 4841, 4988) ✅ |
| **错误处理** | try-catch 完整 ✅ |
| **状态** | ✅ **可用** |

### 2. 紫微斗数 runZiwei() / computeZiWei()

| 项目 | 详情 |
|------|------|
| **函数来源** | core.js line 9581 (有效) |
| **hub.html版本** | line 20005 (失败，未定义) |
| **ziweiPaiPan()** | core.js line 34811 ✅ |
| **ziweiAnalysis()** | core.js line 35009 ✅ |
| **结果渲染** | `zwResult` (line 8514) ✅ |
| **引擎结果** | `zwEngineResult` (line 8539) ✅ |
| **状态** | ✅ **可用** |

### 3. 奇门遁甲 runQimen() / computeQimen()

| 项目 | 详情 |
|------|------|
| **函数来源** | core.js line 8359 (有效) |
| **hub.html版本** | line 19641 (失败，未定义) |
| **qimenPaiPan()** | core.js line 35249 ✅ |
| **qimenAnalyze()** | core.js line 35529 ✅ |
| **结果渲染** | `qmResult` (line 8428) ✅ |
| **引擎结果** | `qmEngineResult` (line 8437) ✅ |
| **状态** | ✅ **可用** |

### 4. 大六壬 runLiuren() / computeLiuRen()

| 项目 | 详情 |
|------|------|
| **函数来源** | core.js line 11398 (有效) |
| **hub.html版本** | line 20470 (失败，未定义) |
| **liurenPaiPan()** | core.js line 35872 ✅ |
| **liurenAnalyze()** | core.js line 36176 ✅ |
| **结果渲染** | `lrResult` (line 8471) ✅ |
| **引擎结果** | `lrEngineResult` (line 8479) ✅ |
| **状态** | ✅ **可用** |

### 5. 六爻占卜 yjCast() / yjStart()

| 项目 | 详情 |
|------|------|
| **函数来源** | core.js line 7841/7800 (有效) |
| **hub.html版本** | line 19170/19124 (失败，未定义) |
| **liuyaoQiGua()** | calc-engine-lib.js line 67 ✅ |
| **结果渲染** | `yjResult` (line 8318) ✅ |
| **引擎结果** | `yjEngineResult` (line 8350) ✅ |
| **状态** | ✅ **可用**（但事盘模式的起心动念分析会报错） |

### 6. 梅花易数 runMeihua() / computeMeiHua()

| 项目 | 详情 |
|------|------|
| **函数来源** | core.js line 10365 (有效) |
| **hub.html版本** | line 20194 (失败，未定义) |
| **meihuaQiGua()** | core.js line 35722 ✅ |
| **meihuaAnalyze()** | core.js line 35771 ✅ |
| **结果渲染** | `mhResult` (line 8368) ✅ |
| **引擎结果** | `mhEngineResult` (line 8380) ✅ |
| **状态** | ✅ **可用** |

### 7. 风水分析 computeFengshui()

| 项目 | 详情 |
|------|------|
| **函数来源** | core.js line 16645 (有效) |
| **hub.html版本** | line 23837 (失败，未定义) |
| **fengshuiAnalyze()** | core.js line 36280 ✅ |
| **结果渲染** | `fsEngineResult` (line 9415) ✅ |
| **状态** | ✅ **可用** |

### 8. 其他功能

| 功能 | 函数 | 来源 | 状态 | 问题 |
|------|------|------|------|------|
| 起名改名 | runXingmingEngine() | core.js line 21 + hub.html block #11 | ⚠️ 部分可用 | core.js版本调用 `analyzeName()`，该函数在 hub.html block #6 (line 29742) 中定义 ✅ |
| 择日 | runZeriEngine() | core.js line 25 + hub.html block #11 | ✅ 可用 | `runPrecisionZeRi()` 在 core.js line 23930 |
| 手机号测评 | analyzeMobile() | hub.html block #6 | ✅ 可用 | |
| 楼层推荐 | _getFloorWuxing() | hub.html block #6 + core.js | ✅ 可用 | |
| 体质辨识 | tizhi-module.js | 外部JS | ✅ 可用 | |
| 每日运势 | getDailyKnowledge() | hub.html block #4 (失败) + core.js | ⚠️ 见下文 | |
| 搜索知识库 | initKbSearch() | hub.html block #11 (line 37493) | ✅ 可用 | |
| 导出HTML | exportHTML() | hub.html block #2 (失败) | ❌ 不可用 | |
| 导出PDF | exportPDF() | hub.html block #2 (失败) | ❌ 不可用 | |
| 导出Word | exportWord() | core.js line 27 | ✅ 可用 | |

---

## 🔍 加载链路验证

### 文件加载顺序
1. `knowledge/*.js` (39个文件, ~14MB) — 行 3402-34170
2. `voice-reader.js` — 行 3406
3. `js/calc-engine-lib.js` — 行 34150
4. `js/divination-core.js` — 行 34151 (2.2MB)
5. 其他JS文件 — 行 34152-34163
6. 内联脚本块 #1-#11 — 行 3293-37509

### GitHub Pages 部署验证
- ✅ `js/divination-core.js` 存在于 gh-pages 分支
- ✅ `knowledge/` 目录下 79 个 JS 文件全部存在
- ✅ `.nojekyll` 文件存在
- ✅ main 与 gh-pages 分支文件内容一致
- ✅ 所有外部 JS 文件语法检查通过
- ✅ 所有内联脚本块语法检查通过

### 资源大小
- `divination-hub.html`: 2.3MB
- `divination-core.js`: 2.2MB
- `knowledge/*.js`: ~14MB
- 其他JS文件: ~2MB
- **总加载量**: ~20MB（移动端可能较慢）

---

## 🛠️ 修复方案

### 方案 A：移除 hub.html 中的 const 重复声明（推荐，最小改动）

将 hub.html 中所有 `const XXX` 改为 `if (typeof XXX === 'undefined') const XXX = ...` 或直接删除重复声明（因为 core.js 已经定义了这些常量）。

**具体操作**：
1. 脚本块 #2 (line 12802-12805): 删除 `const STEMS`, `const BRANCHES`, `const ELE`, `const ZHI_ELE`（已在 core.js 中定义）
2. 脚本块 #4 (line 13109-26725): 删除所有 61 个重复的 `const` 声明，或改为条件赋值
3. 脚本块 #2 中的 `NAYIN_TABLE`, `LUNAR_MONTH_DAYS`, `LUNAR_LEAP_MONTHS`, `LUNAR_NEW_YEAR` 也需检查

### 方案 B：合并文件，消除重复（长期方案）

将 hub.html 的内联脚本完全合并到 divination-core.js 中，消除所有重复定义。这是最彻底的解决方案，但改动量大。

### 方案 C：将 const 改为 var（快速修复）

将 hub.html 中的 `const XXX` 改为 `var XXX`。`var` 允许重复声明，不会报错。但这降低了代码质量。

### 额外修复

1. **添加缺失函数**：
   - `getShiChen()` — 返回时辰名称
   - `getShiChenAnalysis()` — 返回时辰分析
   - `getLunarDateStr()` — 返回农历日期字符串
   - `onLiCalModeChange()`, `onLpCalModeChange()`, `onYouthCalModeChange()` — 日历模式切换
   - `exportHTML()`, `exportPDF()` — 导出功能
   - `koujueShowFavorites()`, `koujueToggleDetail()`, `koujueToggleFav()` — 口诀功能

2. **性能优化**：
   - 20MB 的 JS 加载量在移动端很慢，考虑按需加载
   - 知识库文件可以懒加载

---

## 📊 总结

| 严重度 | 问题 | 影响 |
|--------|------|------|
| 🔴 严重 | 脚本块 #4 const 重复声明 (61个) | hub.html 约 658KB 内联脚本完全不执行 |
| 🔴 严重 | 脚本块 #2 const 重复声明 (4个) | hub.html 约 6KB 内联脚本完全不执行 |
| 🟡 中等 | 8个函数仅存在于失败脚本块中 | 部分UI功能不可用 |
| 🟡 中等 | 3个函数完全未定义 | 六爻事盘模式报错 |
| 🟡 中等 | 3个口诀函数未定义 | 口诀功能不可用 |
| 🟢 低 | 20MB JS 加载量 | 移动端加载缓慢 |

**核心结论**：虽然 `core.js` 的排盘函数本身可用，但 hub.html 中大量的重复 `const` 声明导致两个脚本块（共 664KB）完全失败，影响了导出功能、日历切换、口诀收藏等多个用户体验环节。建议优先修复 const 重复声明问题。
