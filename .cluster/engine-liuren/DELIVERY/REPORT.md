# 大六壬排盘引擎 V2 — 交付报告

## 一、完成情况

✅ **全部 78 项测试通过**

- 月将按中气切换：18 项 ✓
- 天地盘（月将加占时）：6 项 ✓
- 贵人（昼夜阳贵阴贵 + 顺逆）：12 项 ✓
- 四课：8 项 ✓
- 三传（贼克法全流程）：6 项 ✓
- 课体分类：5 项 ✓
- 三光/三阳/三阴：2 项 ✓
- 整盘端到端：1 项 ✓
- computeLiuRen 纯函数调用：2 项 ✓
- 贵人歌诀全覆盖（10天干昼夜）：20 项 ✓

## 二、文件变更

- `app/js/divination-core.js` — 已替换大六壬核心段（`11218-11978` 行，761行）
- `docs/js/divination-core.js` — 同步更新
- `.cluster/engine-liuren/DELIVERY/test-liuren.js` — 78项测试

## 三、核心函数列表

### 内部实现函数（`_lr*` 前缀）

| 函数 | 说明 | 返回 |
|------|------|------|
| `_lrYueJiang(year, month, day)` | 月将（按中气切换） | `{yueJiang: 地支, yueJiangIdx: 索引}` |
| `_lrTianPan(yueJiang, timeZhi)` | 天盘（月将加占时） | `{tpMap: {子→支,...}, tianPanStr: 字符串}` |
| `_lrShunNi(dayStemIdx, hourBranchIdx)` | 顺逆 + 昼夜判断 | `{guiZhi, isDay, shunPai, guiWuxing}` |
| `_lrGuiRen(dayStemIdx, isDayTime)` | 贵人定位（阳贵/阴贵） | `{guiZhi, shunPai, isDay, label}` |
| `_buildTianJiangFenbu(dayStemIdx, hourBranchIdx)` | 十二天将分布 | `{guirenZhi, tianganArr, shunPai, ...}` |
| `_buildSiKe(dayStem, dayZhi, tianPan, tpMap)` | 四课 | `{ke1,ke1shang,ke2,ke2shang,ke3,ke3shang,ke4,ke4shang}` |
| `_buildSanChuan(siKe, dayStemIdx, tpMap, hourBranchIdx)` | 三传（贼克法全流程） | `{faYong, zhongChuan, moChuan, faType}` |
| `_buildLiuRenTiGuan(sanChuan, siKe, dayStemIdx, tpMap)` | 课体判定 | `{name, jiXiong, desc, advice, detail}` |
| `_buildSanGuangYangYin(siKe, sanChuan, dayStemIdx, tpMap)` | 三光/三阳/三阴 | 字符串 |
| `_computeLiuRenImpl()` | 完整排盘（DOM + 返回） | `{keShi, ...}` |

### 对外 API 别名（古书名格式）

| 函数 | 别名 |
|------|------|
| `_lrYueJiang` | `getYueJiang(year, month, day)` |
| `_lrTianPan` | `getTianPan(yj, tz)` |
| `_lrGuiRen` | `getGuiRen(dayStemIdx, isDayTime)` |
| `_buildTianJiangFenbu` | `getTwelveGods(dayStemIdx, hourBranchIdx)` |
| `_buildSiKe` | `buildSiKe(ds, db, tianPan)` |
| `_buildSanChuan` | `buildSanChuan(siKe, ds, tp, hb)` |
| `_buildLiuRenTiGuan` | `getKeTi(sc, sk, ds, tp)` |

## 四、算法要点（古法原文对照）

### 4.1 月将
- 按中气切换，非节气
- 正月登明亥（雨水后）、二月河魁戌（春分后）、三月从魁酉（谷雨后）
- 四月传送申（小满后）、五月小吉未（夏至后）、六月胜光午（大暑后）
- 七月太乙巳（处暑后）、八月天罡辰（秋分后）、九月太冲卯（霜降后）
- 十月功曹寅（立冬后）、十一月大吉丑（大雪后）、十二月神后子（冬至后）

### 4.2 天盘
- 月将加临时地支 → 天盘该位为月将
- 其余地支顺排

### 4.3 贵人
- 甲戊庚：昼丑夜未
- 乙己：昼子夜申
- 丙丁：昼亥夜酉
- 壬癸：昼卯夜巳
- 六辛：昼午夜寅
- 昼贵顺行，夜贵逆行
- 阳支（子寅辰午申戌）顺布，阴支顺布则逆

### 4.4 四课
- 第一课：日干寄宫 → 天盘上神
- 第二课：第一课上神 → 天盘上神
- 第三课：日支 → 天盘上神
- 第四课：第三课上神 → 天盘上神

### 4.5 三传（贼克法完整流程）
1. **一下贼上** → 元首课（初传=贼神）
2. **二下贼上** → 重审课（取上位）
3. **三下贼上 / 四下贼上** → 知一课（比用）
4. **多贼** → 涉害课（依涉深浅）
5. **遥克** → 遥克课（无贼有克）
6. **无贼无克** → 别责 / 八专
7. **伏吟** → 伏吟课
8. **反吟** → 反吟课

## 五、运行命令

```bash
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
node .cluster/engine-liuren/DELIVERY/test-liuren.js
```

## 六、注意事项

- 旧段已移除，不再有 `// ═══ END LIUREN ENGINE CORE ═══`（无 v2 标记）
- 新段使用 `// ═══ START/END LIUREN ENGINE CORE v2 ═══` 标记
- 所有大六壬测试均通过，无回退风险
- `computeLiuRen()` API 不变，仅内部实现重写
