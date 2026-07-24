# R39-D H5 KB 接入扫描报告（2026-07-22）

## 扫描范围
- 53 个 H5 页面（`projects/mingli-baojian/app/*.html`）

## 扫描维度
- **KB 命中**：是否引用 `r39-dual-core-kb.js` 或 `kb` 关键词
- **API 调用**：是否有 `fetch()` 或 `/api/` 调用
- **双核覆盖**：是否包含 health/career/dual 等双核关键词

## 结果统计
| 类别 | 数量 | 占比 |
|------|------|------|
| 已双核 | 16/53 | **30%** |
| 缺双核 | 37/53 | 70% |
| KB 命中 | 33/53 | 62% |
| API 调用 | 16/53 | 30% |

## 缺双核页面 Top 10（按文件大小排序）
| 页面 | 大小 | 建议 |
|------|------|------|
| more-functions.html | 251KB | 加双核入口卡片 |
| admin.html | 96KB | 加双核后台统计 |
| divination-almanac.html | 88KB | 加双核日历 |
| yijing-qimen.html | 72KB | 加双核决策 |
| yijing-oracle.html | 65KB | 加双核卦象 |
| divination-membership.html | 60KB | 加双核会员 |
| nihaisha-learning.html | 58KB | 加双核学习 |
| master-class.html | 46KB | 加双核大师课 |
| master-disease.html | 42KB | **加双核+事业（化解板块）** |
| wechat-h5.html | 32KB | 加双核微信入口 |

## 已双核页面（16）
1. ✅ divination-hub.html（1.4MB·R36 主战场）
2. ✅ fengshui.html（411KB·化解 15 模块）
3. ✅ divination-knowledge.html（340KB·知识库）
4. ✅ ai-assistant.html（184KB·R39-C KB 接入）
5. ✅ tcm-clinic.html（147KB·R37-A 偏科解决）
6. ✅ divination-integrated.html（140KB·综合）
7. ✅ wechat-hub.html（118KB·微信中心）
8. ✅ divination-shop.html（93KB·商城）
9. ✅ master-zidise-illness.html（78KB·R38-C 紫微）
10. ✅ monitor-dashboard.html（63KB·监控）
11. ✅ lifeplan-detail.html（43KB·R38-A 双核）
12. ✅ doctor-elder.html（34KB·R37-B 长者）
13. ✅ master-elder.html（27KB·R38-D 双核）
14. ✅ tcm-symptom.html（24KB·症状）
15. ✅ health-career-dashboard.html（16KB·R39-A 独立双核）
16. ✅ glass-console.html（15KB·眼镜）

## R39-D 扫描完成
- 总页面：53
- 双核已覆盖：30%
- 后续 R40-R45 可继续补强 37 个页面