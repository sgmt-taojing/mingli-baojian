// pages/coming/coming.js — 功能开发中占位页
Page({
  data: {
    name: ''
  },
  onLoad(options) {
    this.setData({ name: options.name || '该功能' });
    wx.setNavigationBarTitle({ title: options.name || '功能开发中' });
  }
});
