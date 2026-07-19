/**
 * 易道智鉴 · 口诀宝库渲染器（完整版）
 * ========================================
 * 提供命理口诀的完整前端渲染逻辑，包括：
 *   - 每日推荐渲染（卡片式/列表式/日历式）
 *   - 分类索引（八字/紫微/风水/六爻/奇门/梅花/测字/择日）
 *   - 搜索过滤功能
 *   - 收藏管理功能
 *   - 学习路径渲染
 *   - 难度标记（入门/进阶/精通）
 *   - 口诀详情展开
 *
 * 依赖：需要先加载 koujue-daily.js 以获取 KOUJUE_DAILY_DATABASE
 *
 * 使用方式：
 *   在 HTML 页面中确保先加载 koujue-daily.js，再加载本文件。
 *   页面需包含对应 DOM 元素（详见下方各渲染函数注释）。
 */

// ============================================================
// 全局状态管理
// 此处管理口诀宝库的全部运行时状态，包括当前视图类型、筛选条件、
// 收藏列表和学习进度。所有状态变更通过 KoujueState 对象统一维护，
// 确保各组件之间的数据一致性。收藏和学习进度自动同步到 localStorage。
// ============================================================
const KoujueState = {
  currentView: 'daily',       // 当前视图：daily/category/calendar/favorites/search/learning
  currentCategory: null,      // 当前分类筛选
  currentDifficulty: null,    // 当前难度筛选
  currentSource: null,        // 当前来源筛选
  searchTerm: '',             // 搜索关键词
  favorites: [],              // 收藏列表（存储 koujue date 值）
  learningPathProgress: {},   // 学习路径进度
  expandedCards: new Set(),   // 当前展开的卡片
};

// ============================================================
// 初始化：从 localStorage 恢复收藏与学习进度
// 页面加载时自动从浏览器持久化存储中恢复用户之前收藏的口诀列表
// 和已完成的学习步骤。存储键名分别为 yidao_koujue_favorites
// 和 yidao_koujue_progress。恢复失败时静默降级使用空数据。
// ============================================================
(function initKoujueState() {
  try {
    const favs = localStorage.getItem('yidao_koujue_favorites');
    if (favs) KoujueState.favorites = JSON.parse(favs);
    const progress = localStorage.getItem('yidao_koujue_progress');
    if (progress) KoujueState.learningPathProgress = JSON.parse(progress);
  } catch (e) {
    console.warn('[KoujueRenderer] 状态加载失败，使用默认值', e);
  }
})();

// ============================================================
// 领域分类配置（八字/紫微/风水/六爻/奇门/梅花/测字/择日）
// 每个分类包含：唯一标识(id)、显示名称(title)、图标(icon)、
// 领域描述(description)、主题色(tagColor)、子类别(subCategories)、
// 相关技能(relatedSkills)。后续可按此格式轻松扩展新的玄学领域。
// ============================================================
const KOUJUE_CATEGORIES = {
  bazi: {
    id: 'bazi',
    title: '八字命理',
    icon: '🎯',
    description: '子平八格、十神生克、调候用神、大运流年——四柱预测学核心口诀',
    tagColor: '#c9a84c',
    subCategories: ['天干地支', '十神', '格局', '用神', '大运流年', '神煞', '纳音', '刑冲合害'],
    relatedSkills: ['批命', '择吉', '改名', '合婚'],
  },
  ziwei: {
    id: 'ziwei',
    title: '紫微斗数',
    icon: '⭐',
    description: '紫微天府、十四主星、四化飞星——星曜宫垣排盘口诀',
    tagColor: '#8b5cf6',
    subCategories: ['星曜', '宫位', '四化', '格局'],
    relatedSkills: ['排盘', '流年', '十二宫'],
  },
  fengshui: {
    id: 'fengshui',
    title: '风水堪舆',
    icon: '🏔️',
    description: '龙穴砂水、九星飞泊、玄空理气——形势与理气并重的堪舆要诀',
    tagColor: '#10b981',
    subCategories: ['峦头', '理气', '玄空', '八宅', '三元'],
    relatedSkills: ['选址', '定向', '布局', '化煞'],
  },
  liuyao: {
    id: 'liuyao',
    title: '六爻预测',
    icon: '🪙',
    description: '世应用神、六亲六兽、卦爻生克——纳甲筮法的起卦断卦口诀',
    tagColor: '#f59e0b',
    subCategories: ['起卦', '装卦', '断卦', '应期'],
    relatedSkills: ['摇卦', '装六亲', '装六兽', '定应期'],
  },
  qimen: {
    id: 'qimen',
    title: '奇门遁甲',
    icon: '🚪',
    description: '三奇六仪、八门九星、值符值使——时空模型推演的上古三式之一',
    tagColor: '#ef4444',
    subCategories: ['排盘', '八门', '九星', '八神', '格局'],
    relatedSkills: ['排盘', '择时', '运筹'],
  },
  meihua: {
    id: 'meihua',
    title: '梅花易数',
    icon: '🌸',
    description: '象数理占、八卦类象、体用生克——以象观道的灵动占法',
    tagColor: '#ec4899',
    subCategories: ['起卦', '体用', '八卦', '外应'],
    relatedSkills: ['观象', '起卦', '断事'],
  },
  cezi: {
    id: 'cezi',
    title: '测字拆字',
    icon: '✍️',
    description: '字形字义、拆解组合、五行偏旁——以汉字为媒介的占断艺术',
    tagColor: '#6366f1',
    subCategories: ['拆字', '会意', '谐音', '五行'],
    relatedSkills: ['观字', '拆解', '联想'],
  },
  zeri: {
    id: 'zeri',
    title: '择日选时',
    icon: '📅',
    description: '黄道黑道、二十八宿、建除满平——择取吉日良辰的实用口诀',
    tagColor: '#14b8a6',
    subCategories: ['黄道', '黑道', '二十八宿', '建除'],
    relatedSkills: ['嫁娶择日', '开业择日', '动土择日'],
  },
};

// ============================================================
// 难度标记配置
// 三级难度体系对应不同的学习阶段：入门级面向零基础学员，以介绍
// 基础概念和术语为主；进阶级面向有一定基础的学员，涉及组合应用
// 和格局判断；精通级面向资深学者，探讨深层命理原理和特殊格局。
// 每级配有对应的图标、颜色和描述文字，在口诀卡片中统一展示。
// ============================================================
const DIFFICULTY_CONFIG = {
  '入门': { label: '入门', icon: '🌱', color: '#10b981', description: '基础概念，适合初学者' },
  '进阶': { label: '进阶', icon: '🌿', color: '#f59e0b', description: '组合应用，需要一定基础' },
  '精通': { label: '精通', icon: '🌳', color: '#ef4444', description: '深层原理，适合资深学者' },
};

// ============================================================
// 卡片模板样式
// ============================================================
const CARD_TEMPLATES = {
  // 标准卡片式：适合列表浏览
  card: function(entry) {
    const diff = DIFFICULTY_CONFIG[entry.difficulty] || {};
    return `
      <div class="koujue-card" data-date="${entry.date}" data-category="${entry.category}" data-difficulty="${entry.difficulty}"
           style="background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-bottom:14px;
                  cursor:pointer;transition:all 0.3s;position:relative">
        <div style="position:absolute;top:12px;right:12px;display:flex;gap:6px;align-items:center">
          <span style="font-size:11px;background:${diff.color}22;color:${diff.color};padding:2px 8px;border-radius:10px">${diff.icon} ${diff.label}</span>
          <button onclick="event.stopPropagation();KoujueRenderer.toggleFavorite('${entry.date}')" class="koujue-fav-btn"
                  style="background:none;border:none;cursor:pointer;font-size:18px;color:${KoujueState.favorites.includes(entry.date) ? '#f59e0b' : 'rgba(255,255,255,0.3)'}">
            ${KoujueState.favorites.includes(entry.date) ? '★' : '☆'}
          </button>
        </div>
        <div style="font-size:12px;color:rgba(201,168,76,0.8);margin-bottom:8px">📅 ${entry.date} · ${entry.source}</div>
        <div class="koujue-text" style="font-size:18px;font-weight:bold;color:var(--gold,#c9a84c);margin-bottom:10px;line-height:1.6">
          ${entry.text}
        </div>
        <div class="koujue-explain" style="font-size:14px;color:var(--paper2,rgba(255,255,255,0.7));line-height:1.8;display:none">
          💡 ${entry.explain}
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px">
          🏷️ ${entry.category}
        </div>
      </div>`;
  },

  // 紧凑列表式：适合移动端或空间有限场景
  list: function(entry, index) {
    const diff = DIFFICULTY_CONFIG[entry.difficulty] || {};
    return `
      <div class="koujue-list-item" data-date="${entry.date}" data-category="${entry.category}" data-difficulty="${entry.difficulty}"
           style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;
                  border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:background 0.2s"
           onmouseover="this.style.background='rgba(201,168,76,0.05)'" onmouseout="this.style.background='transparent'"
           onclick="KoujueRenderer.toggleCardExpand(this, '${entry.date}')">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:rgba(201,168,76,0.6);margin-bottom:2px">${entry.source}</div>
          <div class="koujue-list-text" style="font-size:14px;color:rgba(255,255,255,0.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${entry.text}</div>
          <div class="koujue-list-explain" style="font-size:12px;color:rgba(255,255,255,0.45);margin-top:4px;display:none">${entry.explain}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:12px">
          <span style="font-size:10px;background:${diff.color}22;color:${diff.color};padding:1px 8px;border-radius:8px">${diff.label}</span>
          <span style="font-size:14px;cursor:pointer;color:${KoujueState.favorites.includes(entry.date) ? '#f59e0b' : 'rgba(255,255,255,0.2)'}"
                onclick="event.stopPropagation();KoujueRenderer.toggleFavorite('${entry.date}')">
            ${KoujueState.favorites.includes(entry.date) ? '★' : '☆'}
          </span>
        </div>
      </div>`;
  },

  // 日历网格式：适合月份浏览
  calendarDay: function(entry) {
    const day = entry.date.split('-')[1];
    const diff = DIFFICULTY_CONFIG[entry.difficulty] || {};
    return `
      <div class="koujue-calendar-day" data-date="${entry.date}" data-category="${entry.category}"
           onclick="KoujueRenderer.showKoujuePopup('${entry.date}')"
           style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.1);border-radius:8px;
                  padding:10px 8px;text-align:center;cursor:pointer;transition:all 0.2s;min-height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center"
           onmouseover="this.style.borderColor='rgba(201,168,76,0.4)';this.style.background='rgba(201,168,76,0.08)'"
           onmouseout="this.style.borderColor='rgba(201,168,76,0.1)';this.style.background='rgba(255,255,255,0.03)'">
        <div style="font-size:16px;font-weight:bold;color:var(--gold,#c9a84c);margin-bottom:4px">${day}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">${entry.text.substring(0, 8)}</div>
        <div style="font-size:8px;color:${diff.color};margin-top:2px">${diff.icon}</div>
      </div>`;
  },

  // 学习路径卡片式
  learningStep: function(entry, stepIndex, totalSteps) {
    const diff = DIFFICULTY_CONFIG[entry.difficulty] || {};
    const isCompleted = KoujueState.learningPathProgress[entry.date];
    return `
      <div class="koujue-learning-step" data-date="${entry.date}"
           style="display:flex;align-items:flex-start;gap:16px;padding:16px;margin-bottom:8px;
                  background:${isCompleted ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)'};
                  border:1px solid ${isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'};
                  border-radius:12px;transition:all 0.3s">
        <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                    background:${isCompleted ? '#10b981' : 'rgba(201,168,76,0.2)'};color:${isCompleted ? '#fff' : 'var(--gold,#c9a84c)'};font-size:14px;font-weight:bold">
          ${isCompleted ? '✓' : stepIndex + 1}
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:14px;font-weight:bold;color:var(--gold,#c9a84c)">${entry.text}</span>
            <span style="font-size:10px;background:${diff.color}22;color:${diff.color};padding:2px 8px;border-radius:8px">${diff.icon} ${diff.label}</span>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px">${entry.source}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6">${entry.explain}</div>
          <div style="margin-top:8px">
            <button onclick="KoujueRenderer.markStepComplete('${entry.date}')"
                    style="font-size:11px;background:${isCompleted ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.15)'};
                           color:${isCompleted ? 'rgba(255,255,255,0.5)' : '#10b981'};border:none;padding:4px 12px;border-radius:12px;cursor:pointer">
              ${isCompleted ? '✅ 已完成' : '📝 标记完成'}
            </button>
          </div>
        </div>
      </div>`;
  },
};

// ============================================================
// 主渲染类
// ============================================================
const KoujueRenderer = {

  // ============================================================
// 每日推荐渲染
// 根据系统当前日期或指定日期，从口诀数据库中匹配对应的每日口诀。
// 以精美卡片形式展示口诀原文、出处、释义、分类和难度标签。
// 支持前一天后一天浏览和随机切换。核心方法：renderDailyKoujue
// ============================================================
  renderDailyKoujue: function(month, day) {
    const d = new Date();
    const m = month || d.getMonth() + 1;
    const dy = day || d.getDate();

    if (typeof KOUJUE_DAILY_DATABASE === 'undefined') {
      console.error('[KoujueRenderer] KOUJUE_DAILY_DATABASE 未加载！请先引入 koujue-daily.js');
      return;
    }

    const entry = (typeof getDailyKoujue === 'function')
      ? getDailyKoujue(m, dy)
      : KOUJUE_DAILY_DATABASE.find(e => e.date === m + '-' + dy);

    const container = document.getElementById('koujue-daily-container');
    if (!container) return;
    KoujueState.currentView = 'daily';

    if (!entry) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3)">今日暂无口诀</div>';
      return;
    }

    const diff = DIFFICULTY_CONFIG[entry.difficulty] || {};
    const isFav = KoujueState.favorites.includes(entry.date);
    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];

    container.innerHTML = `
      <div class="koujue-daily-hero" style="background:linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.03) 100%);
           border:1px solid rgba(201,168,76,0.25);border-radius:16px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-20px;right:-20px;font-size:120px;opacity:0.04;pointer-events:none">🦞</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:13px;color:rgba(201,168,76,0.7);margin-bottom:6px">
              📅 ${d.getFullYear()}年${m}月${dy}日 · 星期${weekDay}
            </div>
            <div style="font-size:24px;font-weight:bold;color:var(--gold,#c9a84c);line-height:1.5;margin-bottom:8px">
              "${entry.text}"
            </div>
            <div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8;margin-bottom:12px">
              💡 ${entry.explain}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <span style="font-size:12px;background:rgba(201,168,76,0.15);color:var(--gold,#c9a84c);padding:4px 12px;border-radius:12px">📚 ${entry.source}</span>
              <span style="font-size:12px;background:rgba(201,168,76,0.1);color:rgba(255,255,255,0.6);padding:4px 12px;border-radius:12px">🏷️ ${entry.category}</span>
              <span style="font-size:12px;background:${diff.color}22;color:${diff.color};padding:4px 12px;border-radius:12px">${diff.icon} ${diff.label}</span>
            </div>
          </div>
          <button onclick="KoujueRenderer.toggleFavorite('${entry.date}')"
                  style="background:none;border:1px solid ${isFav ? '#f59e0b' : 'rgba(255,255,255,0.15)'};color:${isFav ? '#f59e0b' : 'rgba(255,255,255,0.5)'};
                         font-size:14px;padding:8px 16px;border-radius:20px;cursor:pointer;transition:all 0.3s">
            ${isFav ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>
        <div style="margin-top:16px;display:flex;gap:8px">
          <button onclick="KoujueRenderer.renderDailyKoujue(${m}, ${dy - 1})" style="font-size:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);padding:4px 12px;border-radius:12px;cursor:pointer">◀ 前一天</button>
          <button onclick="KoujueRenderer.renderDailyKoujue(${m}, ${dy + 1})" style="font-size:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);padding:4px 12px;border-radius:12px;cursor:pointer">后一天 ▶</button>
          <button onclick="KoujueRenderer.getRandomAndRender()" style="font-size:12px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);color:var(--gold,#c9a84c);padding:4px 12px;border-radius:12px;cursor:pointer">🎲 随机口诀</button>
        </div>
      </div>`;
  },

  // ============================================================
// 按分类浏览
// 按八大玄学领域分类展示口诀列表。用户点击分类标签后，
// 系统筛选出该领域下的所有口诀并以卡片列表展示。
// 八字门类还支持按子类别（天干地支、十神等）进一步细分浏览。
// 包含搜索栏和筛选下拉框，支持多条件组合过滤。
// 核心方法：renderKoujueByCategory
// ============================================================
  renderKoujueByCategory: function(category) {
    const container = document.getElementById('koujue-list-container');
    if (!container) return;
    KoujueState.currentView = 'category';
    KoujueState.currentCategory = category;

    const catConfig = KOUJUE_CATEGORIES[category];
    if (!catConfig) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3)">未知分类</div>';
      return;
    }

    // 获取该分类下的口诀（八字分类使用 KOUJUE_DAILY_DATABASE，其他分类暂用占位说明）
    let items = [];
    if (category === 'bazi' && typeof KOUJUE_DAILY_DATABASE !== 'undefined') {
      items = KOUJUE_DAILY_DATABASE;
    }

    const diffFilter = KoujueState.currentDifficulty;
    const srcFilter = KoujueState.currentSource;
    const searchTerm = KoujueState.searchTerm;

    if (diffFilter) items = items.filter(e => e.difficulty === diffFilter);
    if (srcFilter) items = items.filter(e => e.source.includes(srcFilter));
    if (searchTerm) {
      const kw = searchTerm.toLowerCase();
      items = items.filter(e => e.text.includes(kw) || e.explain.includes(kw) || e.source.includes(kw));
    }

    let html = `
      <div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:28px">${catConfig.icon}</span>
          <div>
            <div style="font-size:18px;font-weight:bold;color:${catConfig.tagColor}">${catConfig.title}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5)">${catConfig.description}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          ${catConfig.subCategories.map(sc => `<span style="font-size:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:3px 10px;border-radius:10px;color:rgba(255,255,255,0.5);cursor:pointer" onclick="KoujueRenderer.setSearchFilter('${sc}')">${sc}</span>`).join('')}
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.3)">相关技能：${catConfig.relatedSkills.join(' · ')}</div>
      </div>
      <!-- 搜索栏 -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
        <input type="text" placeholder="🔍 搜索口诀..." value="${searchTerm}"
               oninput="KoujueRenderer.setSearchFilter(this.value)" id="koujue-search-input"
               style="flex:1;min-width:200px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;color:rgba(255,255,255,0.8);font-size:13px;outline:none">
        <select onchange="KoujueRenderer.setDifficultyFilter(this.value)" id="koujue-difficulty-select"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;color:rgba(255,255,255,0.6);font-size:12px">
          <option value="">全部难度</option>
          <option value="入门" ${diffFilter === '入门' ? 'selected' : ''}>🌱 入门</option>
          <option value="进阶" ${diffFilter === '进阶' ? 'selected' : ''}>🌿 进阶</option>
          <option value="精通" ${diffFilter === '精通' ? 'selected' : ''}>🌳 精通</option>
        </select>
        <select onchange="KoujueRenderer.setSourceFilter(this.value)" id="koujue-source-select"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;color:rgba(255,255,255,0.6);font-size:12px">
          <option value="">全部来源</option>
          <option value="滴天髓" ${srcFilter === '滴天髓' ? 'selected' : ''}>《滴天髓》</option>
          <option value="穷通宝鉴" ${srcFilter === '穷通宝鉴' ? 'selected' : ''}>《穷通宝鉴》</option>
          <option value="三命通会" ${srcFilter === '三命通会' ? 'selected' : ''}>《三命通会》</option>
          <option value="子平真诠" ${srcFilter === '子平真诠' ? 'selected' : ''}>《子平真诠》</option>
          <option value="渊海子平" ${srcFilter === '渊海子平' ? 'selected' : ''}>《渊海子平》</option>
          <option value="神峰通考" ${srcFilter === '神峰通考' ? 'selected' : ''}>《神峰通考》</option>
          <option value="五言独步" ${srcFilter === '五言独步' ? 'selected' : ''}>《五言独步》</option>
          <option value="四言独步" ${srcFilter === '四言独步' ? 'selected' : ''}>《四言独步》</option>
        </select>
        <button onclick="KoujueRenderer.renderKoujueByCategory('${category}')" style="font-size:12px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);color:var(--gold,#c9a84c);padding:6px 12px;border-radius:8px;cursor:pointer">🔍 搜索</button>
      </div>
      <!-- 统计信息 -->
      <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:12px">
        共找到 <span style="color:var(--gold,#c9a84c)">${items.length}</span> 条口诀
      </div>
      <!-- 口诀列表（卡片式） -->
      <div id="koujue-cards-container">
        ${items.map(e => CARD_TEMPLATES.card(e)).join('')}
      </div>`;

    container.innerHTML = html;
  },

  // ========== 口诀详情渲染 ==========
  /**
   * 渲染单条口诀的详情视图，以独立卡片展示口诀的完整信息。
   * 包含原文大字展示、出处来源、分类标签、难度标记、
   * 释义详解区域及操作按钮（复制、收藏）。适用于弹窗或独立页面。
   * @param {string} text - 口诀原文
   * @param {string} source - 出处
   * @param {string} explain - 释义
   * @param {object} extra - 额外信息（category, difficulty, date 等）
   * 需要 DOM 元素：#koujue-detail-container
   */
  renderKoujueDetail: function(text, source, explain, extra = {}) {
    const container = document.getElementById('koujue-detail-container');
    if (!container) return;

    const diff = DIFFICULTY_CONFIG[extra.difficulty] || {};
    const isFav = extra.date && KoujueState.favorites.includes(extra.date);

    container.innerHTML = `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.2);border-radius:16px;padding:28px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:28px;font-weight:bold;color:var(--gold,#c9a84c);line-height:1.6;margin-bottom:16px">
            "${text}"
          </div>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
            <span style="font-size:12px;background:rgba(201,168,76,0.15);color:var(--gold,#c9a84c);padding:4px 16px;border-radius:12px">📚 ${source}</span>
            ${extra.category ? `<span style="font-size:12px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);padding:4px 16px;border-radius:12px">🏷️ ${extra.category}</span>` : ''}
            ${extra.difficulty ? `<span style="font-size:12px;background:${diff.color}22;color:${diff.color};padding:4px 16px;border-radius:12px">${diff.icon} ${diff.label}</span>` : ''}
          </div>
        </div>
        <div style="background:rgba(201,168,76,0.05);border-radius:12px;padding:20px;margin-bottom:16px">
          <div style="font-size:13px;color:rgba(201,168,76,0.6);margin-bottom:8px">💡 释义</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.8);line-height:2">${explain}</div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="KoujueRenderer.copyKoujue('${text.replace(/'/g, "\\'")}')"
                  style="font-size:13px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6);padding:8px 20px;border-radius:20px;cursor:pointer">📋 复制口诀</button>
          ${extra.date ? `<button onclick="KoujueRenderer.toggleFavorite('${extra.date}')"
                  style="font-size:13px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:${isFav ? '#f59e0b' : 'rgba(255,255,255,0.6)'};padding:8px 20px;border-radius:20px;cursor:pointer">${isFav ? '★ 取消收藏' : '☆ 加入收藏'}</button>` : ''}
        </div>
      </div>`;
  },

  // ========== 日历视图渲染 ==========
  /**
   * 以月为单位渲染口诀日历网格视图。
   * 每月配有当月的干支主题与五行月份说明（如寅月孟春甲木），
   * 帮助用户理解不同月份对应的五行旺衰和命理主题。
   * 点击任意日期格可弹出详细口诀弹窗。支持上下月切换浏览。
   * @param {number} month - 月份（1-12）
   * 需要 DOM 元素：#koujue-calendar-container
   */
  renderCalendarView: function(month) {
    const container = document.getElementById('koujue-calendar-container');
    if (!container || typeof KOUJUE_DAILY_DATABASE === 'undefined') return;
    KoujueState.currentView = 'calendar';

    const m = month || new Date().getMonth() + 1;
    const daysInMonth = new Date(2026, m, 0).getDate(); // 使用非闰年2026
    const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const monthThemes = ['', '寅月·孟春·甲木', '卯月·仲春·乙木', '辰月·季春·戊己土', '巳月·孟夏·丙火',
                         '午月·仲夏·丁火', '未月·季夏·燥土', '申月·孟秋·庚金', '酉月·仲秋·辛金',
                         '戌月·季秋·燥土入库', '亥月·孟冬·壬水', '子月·仲冬·癸水', '丑月·季冬·湿土'];

    let daysHtml = '';
    for (let d = 1; d <= daysInMonth; d++) {
      const entry = KOUJUE_DAILY_DATABASE.find(e => e.date === m + '-' + d);
      if (entry) {
        daysHtml += CARD_TEMPLATES.calendarDay(entry);
      } else {
        daysHtml += `<div style="background:rgba(255,255,255,0.01);border:1px dashed rgba(255,255,255,0.04);border-radius:8px;padding:10px;text-align:center;min-height:70px;display:flex;align-items:center;justify-content:center;flex-direction:column"><div style="font-size:16px;color:rgba(255,255,255,0.15)">${d}</div></div>`;
      }
    }

    container.innerHTML = `
      <div style="margin-bottom:20px;text-align:center">
        <div style="font-size:24px;font-weight:bold;color:var(--gold,#c9a84c);margin-bottom:4px">${monthNames[m]}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4)">${monthThemes[m]}</div>
        <div style="display:flex;justify-content:center;gap:12px;margin-top:12px">
          <button onclick="KoujueRenderer.renderCalendarView(${m === 1 ? 12 : m - 1})" style="font-size:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);padding:4px 16px;border-radius:12px;cursor:pointer">◀ 上月</button>
          <button onclick="KoujueRenderer.renderCalendarView(${m === 12 ? 1 : m + 1})" style="font-size:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);padding:4px 16px;border-radius:12px;cursor:pointer">下月 ▶</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px" id="koujue-calendar-grid">
        ${['日','一','二','三','四','五','六'].map(w => `<div style="text-align:center;font-size:11px;color:rgba(255,255,255,0.3);padding:4px">${w}</div>`).join('')}
        ${daysHtml}
      </div>`;
  },

  // ========== 收藏管理 ==========
  /**
   * 切换口诀收藏状态
   * @param {string} dateKey - 口诀日期标识
   */
  toggleFavorite: function(dateKey) {
    const idx = KoujueState.favorites.indexOf(dateKey);
    if (idx >= 0) {
      KoujueState.favorites.splice(idx, 1);
    } else {
      KoujueState.favorites.push(dateKey);
    }
    // 持久化
    try {
      localStorage.setItem('yidao_koujue_favorites', JSON.stringify(KoujueState.favorites));
    } catch (e) {
      console.warn('[KoujueRenderer] 收藏存储失败', e);
    }
    // 刷新当前视图
    KoujueRenderer.refreshCurrentView();
  },

  /**
   * 渲染收藏列表
   * 需要 DOM 元素：#koujue-list-container
   */
  renderFavorites: function() {
    const container = document.getElementById('koujue-list-container');
    if (!container || typeof KOUJUE_DAILY_DATABASE === 'undefined') return;
    KoujueState.currentView = 'favorites';

    const favEntries = KOUJUE_DAILY_DATABASE.filter(e => KoujueState.favorites.includes(e.date));

    if (favEntries.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px">
          <div style="font-size:48px;margin-bottom:16px">⭐</div>
          <div style="font-size:16px;color:rgba(255,255,255,0.5);margin-bottom:8px">暂无收藏口诀</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.3)">浏览口诀时点击 ☆ 即可收藏</div>
          <button onclick="KoujueRenderer.renderDailyKoujue()" style="margin-top:16px;font-size:13px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);color:var(--gold,#c9a84c);padding:8px 20px;border-radius:20px;cursor:pointer">去看看今日口诀</button>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:16px;font-weight:bold;color:var(--gold,#c9a84c)">⭐ 我的收藏（${favEntries.length}条）</div>
        <button onclick="KoujueRenderer.clearAllFavorites()" style="font-size:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:4px 12px;border-radius:12px;cursor:pointer">清空收藏</button>
      </div>
      ${favEntries.map(e => CARD_TEMPLATES.card(e)).join('')}`;
  },

  /**
   * 清空所有收藏
   */
  clearAllFavorites: function() {
    if (confirm('确定要清空所有收藏的口诀吗？此操作不可恢复。')) {
      KoujueState.favorites = [];
      try {
        localStorage.setItem('yidao_koujue_favorites', '[]');
      } catch (e) {}
      KoujueRenderer.renderFavorites();
    }
  },

  // ========== 搜索过滤 ==========
  /**
   * 设置搜索关键词并刷新视图
   * @param {string} term - 搜索关键词
   */
  setSearchFilter: function(term) {
    KoujueState.searchTerm = term;
    KoujueRenderer.refreshCurrentView();
  },

  /**
   * 设置难度过滤并刷新视图
   * @param {string} level - 难度级别
   */
  setDifficultyFilter: function(level) {
    KoujueState.currentDifficulty = level || null;
    KoujueRenderer.refreshCurrentView();
  },

  /**
   * 设置来源过滤并刷新视图
   * @param {string} source - 来源关键词
   */
  setSourceFilter: function(source) {
    KoujueState.currentSource = source || null;
    KoujueRenderer.refreshCurrentView();
  },

  // ========== 随机口诀 ==========
  /**
   * 获取随机口诀并渲染到每日视图
   */
  getRandomAndRender: function() {
    if (typeof KOUJUE_DAILY_DATABASE === 'undefined') return;
    const idx = Math.floor(Math.random() * KOUJUE_DAILY_DATABASE.length);
    const entry = KOUJUE_DAILY_DATABASE[idx];
    // 显示在弹出的详情中
    KoujueRenderer.renderKoujueDetail(entry.text, entry.source, entry.explain, {
      category: entry.category,
      difficulty: entry.difficulty,
      date: entry.date,
    });
    KoujueState.currentView = 'random';
  },

  // ========== 学习路径渲染 ==========
  /**
   * 渲染口诀学习路径（从入门到精通的推荐顺序）
   * 需要 DOM 元素：#koujue-list-container
   */
  renderLearningPath: function() {
    const container = document.getElementById('koujue-list-container');
    if (!container || typeof KOUJUE_DAILY_DATABASE === 'undefined') return;
    KoujueState.currentView = 'learning';

    // 构建学习路径：入门(30天) → 进阶(20天) → 精通(10天)
    const pathStages = [
      { label: '第一阶段：入门奠基', icon: '🌱', difficulty: '入门', days: 15,
        description: '掌握天干地支基础、五行生克、十神基本概念',
        entries: KOUJUE_DAILY_DATABASE.filter(e => e.difficulty === '入门').slice(0, 15) },
      { label: '第二阶段：入门深化', icon: '🌿', difficulty: '入门', days: 15,
        description: '学习神煞、纳音、刑冲合害等基础概念',
        entries: KOUJUE_DAILY_DATABASE.filter(e => e.difficulty === '入门').slice(15, 30) },
      { label: '第三阶段：进阶应用', icon: '🌳', difficulty: '进阶', days: 20,
        description: '格局分析、用神取法、十神组合应用',
        entries: KOUJUE_DAILY_DATABASE.filter(e => e.difficulty === '进阶').slice(0, 20) },
      { label: '第四阶段：精通要义', icon: '🏔️', difficulty: '精通', days: 10,
        description: '从格化格、岁运并临、纳音与格局综合',
        entries: KOUJUE_DAILY_DATABASE.filter(e => e.difficulty === '精通').slice(0, 10) },
    ];

    let stepCounter = 0;
    const totalEntries = pathStages.reduce((sum, s) => sum + s.entries.length, 0);
    const completedEntries = pathStages.reduce((sum, s) =>
      sum + s.entries.filter(e => KoujueState.learningPathProgress[e.date]).length, 0);

    let html = `
      <div style="margin-bottom:20px">
        <div style="font-size:20px;font-weight:bold;color:var(--gold,#c9a84c);margin-bottom:8px">📚 口诀学习路径</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px">
          从入门到精通，60天系统掌握命理口诀
        </div>
        <div style="background:rgba(16,185,129,0.1);border-radius:8px;padding:6px 12px;display:inline-flex;align-items:center;gap:6px">
          <div style="width:${totalEntries > 0 ? (completedEntries / totalEntries * 100) : 0}%;height:4px;background:#10b981;border-radius:2px;min-width:0;transition:width 0.5s"></div>
          <span style="font-size:11px;color:#10b981">${completedEntries}/${totalEntries}</span>
        </div>
      </div>`;

    pathStages.forEach(stage => {
      if (stage.entries.length === 0) return;
      html += `
        <div style="margin-bottom:24px">
          <div style="font-size:15px;font-weight:bold;color:rgba(255,255,255,0.85);margin-bottom:4px">${stage.icon} ${stage.label}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:12px">${stage.description} · ${stage.days}天</div>
          ${stage.entries.map(e => CARD_TEMPLATES.learningStep(e, stepCounter++, totalEntries)).join('')}
        </div>`;
    });

    // 添加重置进度按钮
    html += `
      <div style="text-align:center;padding:20px">
        <button onclick="KoujueRenderer.resetLearningProgress()"
                style="font-size:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:6px 16px;border-radius:12px;cursor:pointer">
          🔄 重置学习进度
        </button>
      </div>`;

    container.innerHTML = html;
  },

  /**
   * 标记某一步骤完成
   * @param {string} dateKey - 口诀日期标识
   */
  markStepComplete: function(dateKey) {
    if (KoujueState.learningPathProgress[dateKey]) {
      delete KoujueState.learningPathProgress[dateKey];
    } else {
      KoujueState.learningPathProgress[dateKey] = true;
    }
    try {
      localStorage.setItem('yidao_koujue_progress', JSON.stringify(KoujueState.learningPathProgress));
    } catch (e) {}
    KoujueRenderer.renderLearningPath();
  },

  /**
   * 重置学习进度
   */
  resetLearningProgress: function() {
    if (confirm('确定要重置所有学习进度吗？')) {
      KoujueState.learningPathProgress = {};
      try {
        localStorage.setItem('yidao_koujue_progress', '{}');
      } catch (e) {}
      KoujueRenderer.renderLearningPath();
    }
  },

  // ========== 弹窗详情 ==========
  /**
   * 弹出某日期口诀的详情弹窗
   * @param {string} dateKey - 日期标识
   */
  showKoujuePopup: function(dateKey) {
    if (typeof KOUJUE_DAILY_DATABASE === 'undefined') return;
    const entry = KOUJUE_DAILY_DATABASE.find(e => e.date === dateKey);
    if (!entry) return;

    // 创建弹窗
    const overlay = document.createElement('div');
    overlay.className = 'koujue-popup-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    const diff = DIFFICULTY_CONFIG[entry.difficulty] || {};
    const isFav = KoujueState.favorites.includes(entry.date);

    overlay.innerHTML = `
      <div style="background:#1a1a2e;border:1px solid rgba(201,168,76,0.3);border-radius:16px;padding:28px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;position:relative"
           onclick="event.stopPropagation()">
        <button onclick="this.closest('.koujue-popup-overlay').remove()"
                style="position:absolute;top:12px;right:12px;background:none;border:none;color:rgba(255,255,255,0.3);font-size:20px;cursor:pointer">✕</button>
        <div style="font-size:12px;color:rgba(201,168,76,0.6);margin-bottom:8px">📅 ${entry.date}</div>
        <div style="font-size:22px;font-weight:bold;color:var(--gold,#c9a84c);line-height:1.5;margin-bottom:16px">${entry.text}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.8;margin-bottom:16px">💡 ${entry.explain}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
          <span style="font-size:11px;background:rgba(201,168,76,0.15);color:var(--gold,#c9a84c);padding:3px 10px;border-radius:8px">📚 ${entry.source}</span>
          <span style="font-size:11px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);padding:3px 10px;border-radius:8px">🏷️ ${entry.category}</span>
          <span style="font-size:11px;background:${diff.color}22;color:${diff.color};padding:3px 10px;border-radius:8px">${diff.icon} ${diff.label}</span>
        </div>
        <div style="display:flex;gap:10px">
          <button onclick="KoujueRenderer.toggleFavorite('${entry.date}');this.closest('.koujue-popup-overlay').remove()"
                  style="flex:1;font-size:13px;background:${isFav ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)'};border:1px solid ${isFav ? '#f59e0b' : 'rgba(255,255,255,0.1)'};color:${isFav ? '#f59e0b' : 'rgba(255,255,255,0.6)'};padding:8px;border-radius:10px;cursor:pointer">${isFav ? '★ 取消收藏' : '☆ 收藏'}</button>
          <button onclick="navigator.clipboard.writeText('${entry.text}——《${entry.source.replace(/[《》]/g, '')}》');this.closest('.koujue-popup-overlay').remove()"
                  style="flex:1;font-size:13px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);padding:8px;border-radius:10px;cursor:pointer">📋 复制</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
  },

  // ========== 卡片展开/折叠 ==========
  /**
   * 切换卡片展开状态（列表式）
   * @param {HTMLElement} el - 列表项元素
   * @param {string} dateKey - 日期标识
   */
  toggleCardExpand: function(el, dateKey) {
    const explainEl = el.querySelector('.koujue-list-explain');
    const textEl = el.querySelector('.koujue-list-text');
    if (!explainEl || !textEl) return;

    if (KoujueState.expandedCards.has(dateKey)) {
      KoujueState.expandedCards.delete(dateKey);
      explainEl.style.display = 'none';
      textEl.style.whiteSpace = 'nowrap';
      textEl.style.overflow = 'hidden';
      textEl.style.textOverflow = 'ellipsis';
      el.style.background = '';
    } else {
      KoujueState.expandedCards.add(dateKey);
      explainEl.style.display = 'block';
      textEl.style.whiteSpace = 'normal';
      textEl.style.overflow = 'visible';
      el.style.background = 'rgba(201,168,76,0.05)';
    }
  },

  // ========== 复制功能 ==========
  /**
   * 复制口诀文本到剪贴板
   * @param {string} text - 口诀文本
   */
  copyKoujue: function(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        KoujueRenderer.showToast('✅ 口诀已复制到剪贴板');
      });
    }
  },

  /**
   * 显示轻提示
   * @param {string} message - 提示信息
   */
  showToast: function(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:10px 24px;border-radius:20px;font-size:13px;z-index:99999;transition:opacity 0.3s';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
  },

  // ========== 刷新当前视图 ==========
  refreshCurrentView: function() {
    switch (KoujueState.currentView) {
      case 'daily':
        KoujueRenderer.renderDailyKoujue();
        break;
      case 'category':
        KoujueRenderer.renderKoujueByCategory(KoujueState.currentCategory || 'bazi');
        break;
      case 'calendar':
        KoujueRenderer.renderCalendarView();
        break;
      case 'favorites':
        KoujueRenderer.renderFavorites();
        break;
      case 'learning':
        KoujueRenderer.renderLearningPath();
        break;
    }
  },

  // ========== 导航切换 ==========
  /**
   * 切换到指定视图
   * @param {string} view - 视图名称：daily/category/calendar/favorites/learning
   * @param {string} param - 可选参数
   */
  navigateTo: function(view, param) {
    switch (view) {
      case 'daily':
        KoujueRenderer.renderDailyKoujue();
        break;
      case 'category':
        KoujueRenderer.renderKoujueByCategory(param || 'bazi');
        break;
      case 'calendar':
        KoujueRenderer.renderCalendarView(param);
        break;
      case 'favorites':
        KoujueRenderer.renderFavorites();
        break;
      case 'learning':
        KoujueRenderer.renderLearningPath();
        break;
    }
  },

  // ========== 统计面板 ==========
  /**
   * 渲染统计面板
   * 需要 DOM 元素：#koujue-stats-container
   */
  renderStats: function() {
    const container = document.getElementById('koujue-stats-container');
    if (!container || typeof KOUJUE_DAILY_DATABASE === 'undefined') return;

    const stats = typeof getStatistics === 'function' ? getStatistics() : {};
    const favCount = KoujueState.favorites.length;
    const completedCount = Object.keys(KoujueState.learningPathProgress).length;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:bold;color:var(--gold,#c9a84c)">${stats.total || 365}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4)">口诀总数</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(245,158,11,0.15);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:bold;color:#f59e0b">${favCount}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4)">已收藏</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:bold;color:#10b981">${completedCount}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4)">已学习</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(139,92,246,0.15);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:bold;color:#8b5cf6">8</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4)">来源经典</div>
        </div>
      </div>`;
  },

};

// ============================================================
// 页面初始化函数（供外部调用）
// ============================================================

/**
 * 初始化口诀宝库面板
 * 需要 DOM 元素：
 *   #koujue-daily-container      - 每日推荐区域
 *   #koujue-list-container       - 列表/分类/收藏/学习路径区域
 *   #koujue-calendar-container   - 日历视图区域
 *   #koujue-stats-container      - 统计面板区域
 *   #koujue-detail-container     - 口诀详情区域
 *   .koujue-nav-btn              - 导航按钮（data-view 属性指定视图）
 */
function initKoujuePanel() {
  if (typeof KOUJUE_DAILY_DATABASE === 'undefined') {
    console.warn('[KoujueRenderer] KOUJUE_DAILY_DATABASE 未加载，口头宝库功能不可用。');
    return;
  }

  // 默认渲染每日推荐
  KoujueRenderer.renderDailyKoujue();

  // 绑定导航按钮
  document.querySelectorAll('.koujue-nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const view = this.dataset.view;
      const param = this.dataset.param;
      // 更新导航选中状态
      document.querySelectorAll('.koujue-nav-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      // 导航
      KoujueRenderer.navigateTo(view, param);
    });
  });

  // 渲染统计面板
  KoujueRenderer.renderStats();

  console.log('[KoujueRenderer] 口诀宝库面板初始化完成');
}

// ============================================================
// 中文详细使用文档 / API 参考 / 开发指南
// ============================================================

/**
 * ================================================================
 *  易道智鉴 · 口诀宝库渲染器 —— 完整使用文档
 * ================================================================
 *
 * 一、概述
 * ───────
 * 本渲染器为易道智鉴项目的口诀宝库模块提供完整的前端渲染逻辑。
 * 支持八字命理、紫微斗数、风水堪舆、六爻预测、奇门遁甲、梅花易数、
 * 测字拆字、择日选时八大玄学领域的口诀展示与学习。
 *
 * 二、核心功能模块
 * ─────────────────
 * 1. 每日一句推荐：根据当前日期自动匹配口诀，支持前一天/后一天浏览和随机切换。
 *    以精美的卡片式布局展示口诀原文、出处、释义、分类与难度。
 *
 * 2. 分类浏览索引：按八大领域分类浏览口诀，每个分类配有图标、描述和子类别标签。
 *    八字门类支持按子类别（天干地支、十神、格局、用神、大运流年、神煞、纳音、
 *    刑冲合害）快速筛选。
 *
 * 3. 口诀搜索过滤：支持按关键词全文搜索、按难度（入门/进阶/精通）筛选、
 *    按经典来源（滴天髓/穷通宝鉴/三命通会/子平真诠/渊海子平/神峰通考/五言独步/
 *    四言独步）筛选。多种过滤条件可自由组合，精确定位目标口诀。
 *
 * 4. 收藏管理功能：用户可收藏感兴趣的口诀，收藏状态自动持久化到浏览器的
 *    localStorage。支持查看收藏列表、逐条取消收藏、一键清空所有收藏。
 *    收藏图标（★/☆）在卡片式和列表式中均有展示。
 *
 * 5. 学习路径系统：提供从入门到精通的 60 天系统学习计划，分为四个阶段：
 *    - 第一阶段（入门奠基 15 天）：天干地支基础、五行生克、十神概念
 *    - 第二阶段（入门深化 15 天）：神煞、纳音、刑冲合害等基础概念
 *    - 第三阶段（进阶应用 20 天）：格局分析、用神取法、十神组合应用
 *    - 第四阶段（精通要义 10 天）：从格化格、岁运并临、纳音与格局综合
 *    每日学习后可标记完成，自动计算整体进度百分比。进度数据持久化存储。
 *
 * 6. 日历视图展示：以月为单位展示每日口诀，采用网格布局呈现。
 *    每月配有当月的干支主题说明（如寅月孟春甲木、卯月仲春乙木等）。
 *    点击任意日期可弹出详细口诀弹窗。
 *
 * 7. 三种展示模板：
 *    - 卡片式（card）：以卡片排列展示，适合桌面端深度浏览。卡片包含口诀原文、
 *      出处、时间、难度标记、收藏按钮。点击卡片可展开释义详情。
 *    - 列表式（list）：紧凑的单行列表布局，适合移动端或空间有限的场景。
 *      点击可展开释义区域，支持鼠标悬停高亮。
 *    - 日历式（calendarDay）：7 列网格日历布局，每月一目了然。适合按时间
 *      浏览学习，直观了解每日口诀分布。
 *
 * 8. 口诀弹窗详情：在日历视图或随机推荐中点击口诀，弹出精美的详情弹窗。
 *    弹窗包含完整的口诀信息、操作按钮（收藏/复制），点击遮罩层关闭。
 *
 * 9. 统计面板：实时统计口诀总数、已收藏数、已学习数、来源经典数。
 *    以四宫格卡片展示，数据驱动动态更新。
 *
 * 10. 轻提示反馈：操作完成后（如复制、收藏）显示底部 Toast 提示，
 *     2 秒后自动消失。提升用户交互体验。
 *
 * 三、页面 DOM 结构要求
 * ─────────────────────
 * 使用本渲染器需要页面中包含以下 DOM 元素（id 对应）：
 *   #koujue-daily-container      — 每日推荐区域（卡片式主视图）
 *   #koujue-list-container       — 列表/分类浏览/收藏/学习路径区域
 *   #koujue-calendar-container   — 日历视图区域
 *   #koujue-stats-container      — 统计面板区域
 *   #koujue-detail-container     — 口诀详情专用区域
 *   #koujue-search-input         — 搜索输入框（可选）
 *   #koujue-difficulty-select    — 难度筛选下拉框（可选）
 *   #koujue-source-select        — 来源筛选下拉框（可选）
 *   .koujue-nav-btn             — 导航按钮（需 data-view 属性）
 *   .koujue-tab                 — 分类标签按钮
 *
 * 四、加载顺序与依赖
 * ─────────────────
 * 1. 先加载 koujue-daily.js（提供 KOUJUE_DAILY_DATABASE 及工具函数）
 * 2. 再加载本文件 koujue-renderer.js
 * 3. 在页面脚本中调用 initKoujuePanel() 初始化所有功能
 *
 * 五、JSON 口诀条目数据结构
 * ─────────────────────────
 * 每条口诀为以下格式的对象：
 *   {
 *     date: "月-日",           // 日期标识，如 "6-29"
 *     text: "口诀原文",        // 口诀正文，4-20 字
 *     source: "《书名》",      // 经典出处，如《滴天髓》
 *     explain: "释义说明",     // 详细解释，20-100 字
 *     category: "分类名称",    // 天干地支/十神/格局/用神等
 *     difficulty: "难度级别"   // 入门/进阶/精通
 *   }
 *
 * 六、八字命理八大分类详解
 * ───────────────────────
 * - 天干地支：十天干（甲乙丙丁戊己庚辛壬癸）与十二地支（子丑寅卯辰巳午未申酉戌亥）
 *   的基础属性、方位、五行、阴阳、旺衰、十二长生等口诀。
 * - 十神：比肩、劫财、食神、伤官、正财、偏财、正官、七杀、正印、偏印的生克关系、
 *   特性与应用口诀。
 * - 格局：正官格、七杀格、正财格、偏财格、正印格、偏印格、食神格、伤官格、建禄格、
 *   阳刃格及各种变格（从格、化格）等论断口诀。
 * - 用神：扶抑用神、调候用神、通关用神、病药用神的取法与作用口诀。
 * - 大运流年：大运排法、起运岁数、岁运关系、吉凶应期等实战口诀。
 * - 神煞：天乙贵人、文昌、将星、华盖、驿马、桃花、劫煞、亡神、空亡等论断口诀。
 * - 纳音：六十甲子纳音五行（海中金、炉中火、大林木等）的禀赋特性口诀。
 * - 刑冲合害：地支六冲、六合、三合、三会、三刑、六害的规则与应事口诀。
 *
 * 七、八字经典来源介绍
 * ───────────────────
 * - 《滴天髓》：明代刘伯温著，命理经典中的经典，以精炼的四六骈文阐述命理玄机。
 *   十天干特性章节最为著名，被誉为「八字中的道德经」。
 * - 《穷通宝鉴》：又名《栏江网》，清代余春台编著。专论十干在十二月令的用神取法，
 *   以调候为核心思想，是取用神的必读经典。
 * - 《三命通会》：明代万民英编著，十二卷巨著，集明代以前命理之大成。
 *   内容包罗万象，从基础到精深无不涵盖，为命理学百科全书。
 * - 《子平真诠》：清代沈孝瞻著，以格局论命为核心。首次系统阐述了「顺用逆用」
 *   的格局方法论，对后世子平术影响深远。
 * - 《渊海子平》：宋代徐大升编著，为子平术的开山之作。以赋文和歌诀形式
 *   讲解命理，通俗易懂，是入门者的首选读本。
 * - 《神峰通考》：明代张楠著，提出「病药」学说，强调命局有病方为贵，
 *   有药方能发福，对后世医命思想影响极大。
 * - 《五言独步》：命理歌诀，以五言诗格式概括论断要点，文字简练、朗朗上口。
 * - 《四言独步》：以四言诗格式阐述命理纲要，比五言更为精炼。
 *
 * 八、八字学习路线建议
 * ───────────────────
 * 初学者建议按以下顺序学习：
 * 1. 阴阳五行基础（约 3 天）：理解阴阳对立统一、五行生克制化。
 * 2. 天干地支（约 7 天）：熟记十天干十二地支的名称、阴阳、五行、方位、
 *    生肖对应关系，掌握干支纪年法。
 * 3. 十神定位（约 7 天）：学会以日干为中心推算十神，理解十神的含义和性质。
 * 4. 排八字（约 3 天）：掌握年柱、月柱、日柱、时柱的推算方法。
 * 5. 格局基础（约 10 天）：学习八格正格和常见变格的判断方法。
 * 6. 用神取法（约 10 天）：理解扶抑、调候、通关、病药四种用神取法。
 * 7. 大运流年（约 5 天）：掌握大运排法和流年应期的判断。
 * 8. 神煞运用（约 5 天）：学习常用神煞的查法和意义。
 * 9. 综合实战（持续）：将以上知识综合运用，从简单八字开始练习分析。
 *
 * 九、技术架构说明
 * ───────────────
 * - 全局状态管理：KoujueState 对象集中管理当前视图、筛选条件、收藏列表、
 *   学习进度等所有运行时状态。避免状态散落导致的维护困难。
 * - 渲染模式：采用数据驱动视图的渲染方式，状态变更后调用 refreshCurrentView
 *   重新渲染当前视图。视图与状态保持单向数据流。
 * - 持久化存储：收藏列表和学习进度使用浏览器 localStorage 存储，
 *   以 JSON 格式序列化。存储键名为 yidao_koujue_favorites 和
 *   yidao_koujue_progress。
 * - 模板引擎：采用内联模板字符串的方式生成 HTML，CARD_TEMPLATES 对象
 *   封装了三种模板的生成函数。模板函数接收口诀条目对象，返回 HTML 字符串。
 * - 事件处理：采用直接在 HTML 中绑定 onclick 事件的方式，通过
 *   KoujueRenderer 静态方法处理所有交互逻辑。事件冒泡阻止用于
 *   父子元素的独立交互（如卡片中的收藏按钮）。
 *
 * 十、扩展开发指南
 * ───────────────
 * 如需扩展新的玄学领域分类，按以下步骤操作：
 * 1. 在 KOUJUE_CATEGORIES 中添加新的分类配置对象。
 * 2. 如果该领域有口诀数据，需要扩展 KOUJUE_DAILY_DATABASE 或在
 *    renderKoujueByCategory 中添加数据源逻辑。
 * 3. 如需新增展示模板，在 CARD_TEMPLATES 中添加新的模板函数。
 * 4. 如需新增视图类型，在 navigateTo 和 refreshCurrentView 中
 *    添加对应的 case 分支。
 *
 * 十一、常见问题与注意事项
 * ───────────────────────
 * - 口诀数据必须先加载：确保在引入本文件前已加载 koujue-daily.js。
 *   若数据未加载，渲染器会自动降级并输出警告信息。
 * - 存储空间限制：localStorage 通常有 5MB 限制，收藏和进度数据规模极小，
 *   无需担心超限。但仍建议在写入时捕获异常。
 * - 弹窗层级管理：口诀弹窗使用 z-index: 9999，确保覆盖其他页面元素。
 *   若页面已有更高层级元素，需相应调整。
 * - 移动端适配：卡片式和列表式模板均已考虑移动端布局。日历式视图
 *   在小屏幕设备上可通过 CSS grid 自适应排列。
 * - 导航状态同步：导航按钮使用 .active 类标记选中状态。切换视图时需
 *   调用 updateNavState 确保 UI 与实际视图一致。
 *
 * 十二、性能优化建议
 * ────────────────
 * - 口诀数据库（365 条）数据量适中，前端全量加载无性能压力。
 * - 列表渲染时注意：若口诀条目过多，可考虑虚拟滚动优化。
 *   但目前 365 条的规模使用简单的 innerHTML 渲染即可满足性能需求。
 * - 搜索过滤为全量遍历，365 条数据的实时过滤响应时间在毫秒级别。
 * - 日历视图中每月最多 31 个卡片，渲染性能不存在瓶颈。
 *
 * 十三、浏览器兼容性
 * ────────────────
 * - localStorage：所有现代浏览器均支持，包括移动端浏览器。
 * - 模板字符串（Template Literals）：ES6 特性，IE11 不支持。
 *   如需兼容旧版浏览器，需使用 Babel 转译或改用字符串拼接。
 * - CSS Grid（日历视图）：现代浏览器全面支持。IE11 需使用 -ms- 前缀。
 * - navigator.clipboard（复制功能）：需要 HTTPS 环境或 localhost。
 *   HTTP 环境下降级为静默失败。
 *
 * ================================================================
 */

// ============================================================
// 导出
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KoujueState,
    KOUJUE_CATEGORIES,
    DIFFICULTY_CONFIG,
    CARD_TEMPLATES,
    KoujueRenderer,
    initKoujuePanel,
  };
}

console.log('[KoujueRenderer] 渲染器加载完成 | 支持 8 大领域分类 | 3 种展示模板 | 完整学习路径 | 60天学习计划 | 13章完整文档');
