const api = require('../../utils/api.js')

Page({
  data: {
    cartList: [],
    totalAmount: 0,
    totalCount: 0,
    selectAll: false,
    isEmpty: false
  },

  onShow() {
    this.loadCart()
  },

  loadCart() {
    // 优先从 API 获取，失败时 fallback 到 localStorage
    api.getCart && api.getCart().then(res => {
      this.setData({ cartList: res.data || [] }, this.calcTotal)
    }).catch(() => {
      this.loadFromStorage()
    }) || this.loadFromStorage()
  },

  loadFromStorage() {
    let cart = wx.getStorageSync('cart') || []
    // 内置示例数据
    if (cart.length === 0) {
      cart = [
        { id: 1, title: '八字精批详批报告', price: 199, num: 1, selected: false, cover: '/images/placeholder.png' },
        { id: 2, title: '紫微斗数全盘解析', price: 299, num: 1, selected: false, cover: '/images/placeholder.png' },
        { id: 3, title: '流年运势详批（2026）', price: 159, num: 2, selected: false, cover: '/images/placeholder.png' }
      ]
      wx.setStorageSync('cart', cart)
    }
    this.setData({ cartList: cart, isEmpty: cart.length === 0 }, this.calcTotal)
  },

  // 增加数量
  increase(e) {
    const index = e.currentTarget.dataset.index
    const cartList = this.data.cartList
    cartList[index].num++
    this.setData({ cartList }, this.calcTotal)
    wx.setStorageSync('cart', cartList)
  },

  // 减少数量
  decrease(e) {
    const index = e.currentTarget.dataset.index
    const cartList = this.data.cartList
    if (cartList[index].num <= 1) return
    cartList[index].num--
    this.setData({ cartList }, this.calcTotal)
    wx.setStorageSync('cart', cartList)
  },

  // 删除商品
  deleteItem(e) {
    const index = e.currentTarget.dataset.index
    const cartList = this.data.cartList
    wx.showModal({
      title: '确认删除',
      content: '确定要从购物车中移除该商品吗？',
      confirmColor: '#e6c86e',
      success: (res) => {
        if (res.confirm) {
          cartList.splice(index, 1)
          this.setData({ cartList, isEmpty: cartList.length === 0 }, this.calcTotal)
          wx.setStorageSync('cart', cartList)
          wx.showToast({ title: '已移除', icon: 'success' })
        }
      }
    })
  },

  // 切换单个选中
  toggleSelect(e) {
    const index = e.currentTarget.dataset.index
    const cartList = this.data.cartList
    cartList[index].selected = !cartList[index].selected
    const selectAll = cartList.length > 0 && cartList.every(item => item.selected)
    this.setData({ cartList, selectAll }, this.calcTotal)
    wx.setStorageSync('cart', cartList)
  },

  // 全选/取消全选
  toggleSelectAll() {
    const selectAll = !this.data.selectAll
    const cartList = this.data.cartList.map(item => {
      item.selected = selectAll
      return item
    })
    this.setData({ cartList, selectAll }, this.calcTotal)
    wx.setStorageSync('cart', cartList)
  },

  // 计算合计
  calcTotal() {
    const cartList = this.data.cartList
    let totalAmount = 0
    let totalCount = 0
    cartList.forEach(item => {
      if (item.selected) {
        totalAmount += item.price * item.num
        totalCount += item.num
      }
    })
    this.setData({ totalAmount, totalCount })
  },

  // 去结算
  goCheckout() {
    const selectedItems = this.data.cartList.filter(item => item.selected)
    if (selectedItems.length === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    // 将选中商品存入结算临时存储
    wx.setStorageSync('checkout_items', selectedItems)
    wx.navigateTo({
      url: '/pages/shop/checkout/checkout'
    })
  },

  // 继续购物
  goShopping() {
    wx.switchTab({
      url: '/pages/shop/index/index'
    })
  },

  onShareAppMessage() {
    return {
      title: '命理宝鉴 - 购物车',
      path: '/pages/shop/cart/cart'
    }
  }
})
