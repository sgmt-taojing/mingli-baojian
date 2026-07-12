// app.js — 命理宝鉴小程序
App({
  globalData: {
    apiBase: 'http://127.0.0.1:8920',
    userInfo: null,
    token: null,
    isLogin: false
  },

  onLaunch() {
    // 检查本地存储的 token
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.globalData.isLogin = true;
    }

    // 检查更新
    const updateManager = wx.getUpdateManager();
    if (updateManager) {
      updateManager.onCheckForUpdate(() => {});
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已就绪，是否重启应用？',
          success(res) {
            if (res.confirm) updateManager.applyUpdate();
          }
        });
      });
    }
  },

  // 检查登录状态
  checkLogin() {
    if (!this.globalData.token) {
      wx.navigateTo({ url: '/pages/mine/mine' });
      return false;
    }
    return true;
  },

  // 获取 token
  getToken() {
    return this.globalData.token || wx.getStorageSync('token');
  }
});
