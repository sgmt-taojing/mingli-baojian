// pages/index/index.js — 命理宝鉴·功能大厅
const api = require('../../utils/api.js');

// tabBar 页面（switchTab 可跳转）
const TAB_BAR_PAGES = [
  '/pages/index/index',
  '/pages/paipan/paipan',
  '/pages/almanac/almanac',
  '/pages/knowledge/knowledge',
  '/pages/mine/mine'
];

// 已实现的页面（可直接跳转）
const EXISTING_PAGES = [
  '/pages/index/index',
  '/pages/paipan/paipan',
  '/pages/almanac/almanac',
  '/pages/knowledge/knowledge',
  '/pages/mine/mine',
  '/pages/shop/shop'
];

Page({
  data: {
    today: '',
    dailyWisdom: '',
    isBeta: true, // 测试期全功能免费
    isLogin: false,
    sections: [
      {
        id: 'bazi',
        title: '八字命理',
        icon: '🌟',
        items: [
          { id: 'paipan', icon: '🔮', name: '八字排盘', desc: '四柱推命·知命改运', path: '/pages/paipan/paipan', vip: false },
          { id: 'naming', icon: '✏️', name: '起名改名', desc: '五行补益·良名伴生', path: '/pages/naming/naming', vip: false },
          { id: 'hehun', icon: '❤️', name: '合婚匹配', desc: '八字合婚·姻缘分析', path: '/pages/hehun/hehun', vip: false },
          { id: 'tizhi', icon: '🏥', name: '体质辨识', desc: '五运六气·体质养生', path: '/pages/tizhi/tizhi', vip: false }
        ]
      },
      {
        id: 'divination',
        title: '占卜术数',
        icon: '🔮',
        items: [
          { id: 'zhanbu', icon: '📖', name: '周易占卜', desc: '文王卦·断事吉凶', path: '/pages/zhanbu/zhanbu', vip: false },
          { id: 'qimen', icon: '🧭', name: '奇门遁甲', desc: '天地人神·择时方位', path: '/pages/paipan/paipan?type=qimen', vip: false },
          { id: 'ziwei', icon: '⭐', name: '紫微斗数', desc: '星曜格局·命运解析', path: '/pages/paipan/paipan?type=ziwei', vip: false },
          { id: 'meihua', icon: '🌸', name: '梅花易数', desc: '万物取象·随时起卦', path: '/pages/paipan/paipan?type=meihua', vip: false },
          { id: 'liuren', icon: '🎭', name: '大六壬', desc: '三传四课·推演人事', path: '/pages/paipan/paipan?type=liuren', vip: false },
          { id: 'liuyao', icon: '🪙', name: '六爻占卜', desc: '铜钱起卦·六爻断事', path: '/pages/paipan/paipan?type=liuyao', vip: false }
        ]
      },
      {
        id: 'fengshui',
        title: '风水生活',
        icon: '🏠',
        items: [
          { id: 'fengshui', icon: '🏯', name: '阳宅风水', desc: '方位布局·聚气纳财', path: '/pages/fengshui/fengshui', vip: false },
          { id: 'louceng', icon: '🏢', name: '楼层推荐', desc: '生肖五行·楼层吉凶', path: '/pages/louceng/louceng', vip: false },
          { id: 'almanac', icon: '📅', name: '每日黄历', desc: '宜忌方位·趋吉避凶', path: '/pages/almanac/almanac', vip: false },
          { id: 'zeri', icon: '🗓️', name: '择日服务', desc: '婚嫁搬家·择吉日', path: '/pages/zeri/zeri', vip: false },
          { id: 'phone', icon: '📱', name: '手机号测评', desc: '数字能量·吉凶分析', path: '/pages/phone/phone', vip: false },
          { id: 'yunshi', icon: '🍀', name: '每日运势', desc: '十二生肖·今日运程', path: '/pages/yunshi/yunshi', vip: false }
        ]
      },
      {
        id: 'study',
        title: '学习修养',
        icon: '📚',
        items: [
          { id: 'knowledge', icon: '📖', name: '命理知识', desc: '古今典籍·智慧传承', path: '/pages/knowledge/knowledge', vip: false },
          { id: 'master', icon: '🎓', name: '大师课堂', desc: '名家视频·系统学习', path: '/pages/master/master', vip: true },
          { id: 'merit', icon: '🙏', name: '功德系统', desc: '日行一善·积德改运', path: '/pages/merit/merit', vip: false },
          { id: 'wiki', icon: '🗂️', name: '命理百科', desc: '术语查询·入门百科', path: '/pages/knowledge/knowledge?type=wiki', vip: false }
        ]
      },
      {
        id: 'service',
        title: '服务商城',
        icon: '🛒',
        items: [
          { id: 'shop', icon: '🛍️', name: '开运商城', desc: '佩饰法器·助运催旺', path: '/pages/shop/shop', vip: false },
          { id: 'vip', icon: '👑', name: '会员中心', desc: '尊享特权·专属服务', path: '/pages/mine/mine?type=vip', vip: true },
          { id: 'history', icon: '📋', name: '我的排盘', desc: '历史记录·一键查看', path: '/pages/paipan/paipan?type=history', vip: false }
        ]
      }
    ]
  },

  onLoad() {
    this.updateDate();
    this.loadDailyWisdom();
  },

  onShow() {
    const app = getApp();
    if (app.globalData) {
      this.setData({ isLogin: !!app.globalData.isLogin });
    }
  },

  updateDate() {
    const now = new Date();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const today = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;
    this.setData({ today });
  },

  loadDailyWisdom() {
    const wisdoms = [
      '知命者不怨天，知己者不怨人。',
      '积善之家，必有余庆；积不善之家，必有余殃。',
      '天行健，君子以自强不息；地势坤，君子以厚德载物。',
      '祸兮福之所倚，福兮祸之所伏。',
      '顺天者存，逆天者亡。知命者改运，不知命者随流。',
      '一命二运三风水，四积阴德五读书。',
      '吉人自有天相，善心自有福报。',
      '穷则变，变则通，通则久。',
      '善不积不足以成名，恶不积不足以灭身。',
      '居善地，心善渊，与善仁，言善信。'
    ];
    const idx = new Date().getDate() % wisdoms.length;
    this.setData({ dailyWisdom: wisdoms[idx] });
  },

  onItemTap(e) {
    const { path, name } = e.currentTarget.dataset;
    const basePath = path.split('?')[0];
    const hasParams = path.includes('?');

    // VIP 功能检查登录态
    const item = e.currentTarget.dataset;
    if (item.vip) {
      const token = wx.getStorageSync('token');
      const app = getApp();
      if (!token && !app.globalData?.isLogin) {
        wx.showModal({
          title: '需要登录',
          content: '该功能需要登录后使用，是否前往登录？',
          confirmText: '去登录',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/mine/mine' });
            }
          }
        });
        return;
      }
    }

    // 未实现的页面 → 跳转到"功能开发中"提示页
    if (!EXISTING_PAGES.includes(basePath)) {
      wx.navigateTo({
        url: `/pages/coming/coming?name=${encodeURIComponent(name)}`,
        fail: () => {
          wx.showToast({ title: '功能开发中', icon: 'none' });
        }
      });
      return;
    }

    // tabBar 页面处理
    if (TAB_BAR_PAGES.includes(basePath)) {
      if (hasParams) {
        // switchTab 不支持 query 参数，通过 globalData 传递
        const app = getApp();
        app.globalData = app.globalData || {};
        const queryStr = path.split('?')[1];
        const params = {};
        queryStr.split('&').forEach(pair => {
          const [key, val] = pair.split('=');
          if (key) params[key] = val;
        });
        app.globalData.tabNavigateParams = params;
        wx.switchTab({ url: basePath });
      } else {
        wx.switchTab({ url: basePath });
      }
    } else {
      // 非 tabBar 页面
      wx.navigateTo({ url: path });
    }
  },

  onShareAppMessage() {
    return {
      title: '命理宝鉴 — 知命改运，趋吉避凶',
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: '命理宝鉴 — 知命改运，趋吉避凶'
    };
  }
});
