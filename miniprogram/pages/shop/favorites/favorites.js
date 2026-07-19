const api = require('../../utils/api.js')

Page({
  data: {
    favorites: [],
    isEmpty: false
  },

  onShow() {
    this.loadFavorites()
  },

  loadFavorites() {
    api.getFavorites && api.getFavorites().then(res => {
      const list = res.data || []
      this.setData({ favorites: list, isEmpty: list.length === 0 })
    }).catch(() => {
      this.loadFromStorage()
    }) || this.loadFromStorage()
  },

  loadFromStorage() {
    let favorites = wx.getStorageSync('favorites') || []
    // 内置示例数据
    if (favorites.length === 0) {
      favorites = [
        { id: 1, title: '八字精批详批报告', price: 199, cover: '/images/placeholder.png', desc: '深度解析八字命理，洞察人生轨迹' },
        { id: 2, title: '紫微斗数全盘解析', price: 299, cover: '/images/placeholder.png', desc: '紫微十四主星全面分析' },
        { id: 3, title: '流年运势详批（2026）', price: 159, cover: '/images/placeholder.png', desc: '2026年逐月运势详解' },
        { id: 4, title: '姓名学分析报告', price: 99, cover: '/images/placeholder.png', desc: '姓名五行与命运关联分析' }
      ]
      wx.setStorageSync('favorites', favorites)
    }
    this.setData({ favorites: favorites, isEmpty: favorites.length === 0 })
  },

  // 取消收藏
  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该商品吗？',
      confirmColor: '#e6c86e',
      success: (res) => {
        if (res.confirm) {
          let favorites = this.data.favorites.filter(item => item.id !== id)
          this.setData({ favorites, isEmpty: favorites.length === 0 })
          wx.setStorageSync('favorites', favorites)
          wx.showToast({ title: '已取消收藏', icon: 'success' })
        }
      }
    })
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/shop/detail/detail?id=' + id
    })
  },

  // 去逛逛
  goShopping() {
    wx.switchTab({
      url: '/pages/shop/index/index'
    })
  },

  // 加入购物车
  addToCart(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.favorites.find(f => f.id === id)
    if (!item) return

    const cart = wx.getStorageSync('cart') || []
    const existing = cart.find(c => c.id === id)
    if (existing) {
      existing.num++
    } else {
      cart.push({
        id: item.id,
        title: item.title,
        price: item.price,
        num: 1,
        selected: false,
        cover: item.cover || '/images/placeholder.png'
      })
    }
    wx.setStorageSync('cart', cart)
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },

  onShareAppMessage() {
    return {
      title: '命理宝鉴 - 我的收藏',
      path: '/pages/shop/favorites/favorites'
    }
  }
})
