// pages/index/index.js — 命理宝鉴首页
const api = require('../../utils/api.js');

Page({
  data: {
    today: '',
    lunarDate: '',
    dailyWisdom: '',
    menuItems: [
      { id: 'paipan', icon: '🔮', title: '八字排盘', desc: '四柱推命，知命改运', path: '/pages/paipan/paipan' },
      { id: 'almanac', icon: '📅', title: '每日黄历', desc: '宜忌方位，趋吉避凶', path: '/pages/almanac/almanac' },
      { id: 'ziwei', icon: '⭐', title: '紫微斗数', desc: '星曜格局，命运解析', path: '/pages/paipan/paipan?type=ziwei' },
      { id: 'qimen', icon: '🧭', title: '奇门遁甲', desc: '天地人神，择时方位', path: '/pages/paipan/paipan?type=qimen' },
      { id: 'liuyao', icon: '🪙', title: '六爻占卜', desc: '铜钱起卦，断事吉凶', path: '/pages/paipan/paipan?type=liuyao' },
      { id: 'fengshui', icon: '🏠', title: '风水堪舆', desc: '方位布局，聚气纳财', path: '/pages/paipan/paipan?type=fengshui' },
      { id: 'knowledge', icon: '📚', title: '命理知识', desc: '古今典籍，智慧传承', path: '/pages/knowledge/knowledge' },
      { id: 'shop', icon: '🛒', title: '开运商城', desc: '佩饰法器，助运催旺', path: '/pages/shop/shop' }
    ],
    isLogin: false,
    userInfo: null
  },

  onLoad() {
    this.updateDate();
    this.loadDailyWisdom();
  },

  onShow() {
    const app = getApp();
    this.setData({ isLogin: app.globalData.isLogin });
    if (app.globalData.isLogin) {
      this.loadUserInfo();
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
      '穷则变，变则通，通则久。'
    ];
    const idx = new Date().getDate() % wisdoms.length;
    this.setData({ dailyWisdom: wisdoms[idx] });
  },

  async loadUserInfo() {
    try {
      const res = await api.getProfile();
      if (res.id) {
        this.setData({ userInfo: res });
        wx.setStorageSync('userInfo', res);
      }
    } catch (e) {
      // 静默处理
    }
  },

  onMenuTap(e) {
    const path = e.currentTarget.dataset.path;
    wx.navigateTo({ url: path, fail: () => wx.switchTab({ url: path }) });
  },

  onLoginTap() {
    wx.navigateTo({ url: '/pages/mine/mine' });
  },

  onShareAppMessage() {
    return {
      title: '命理宝鉴 — 知命改运，趋吉避凶',
      path: '/pages/index/index'
    };
  }
});
