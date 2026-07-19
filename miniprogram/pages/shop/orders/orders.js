const api = require('../../utils/api.js')

Page({
  data: {
    tabs: [
      { name: '全部', type: 'all' },
      { name: '待付款', type: 'pending' },
      { name: '已付款', type: 'paid' },
      { name: '已发货', type: 'shipped' }
    ],
    currentTab: 'all',
    orderList: [],
    isEmpty: false
  },

  onLoad(options) {
    if (options.tab) {
      this.setData({ currentTab: options.tab })
    }
  },

  onShow() {
    this.loadOrders()
  },

  loadOrders() {
    api.getOrders && api.getOrders().then(res => {
      this.filterOrders(res.data || [])
    }).catch(() => {
      this.loadFromStorage()
    }) || this.loadFromStorage()
  },

  loadFromStorage() {
    let orders = wx.getStorageSync('orders') || []
    // 内置示例数据
    if (orders.length === 0) {
      orders = [
        {
          id: 'ML20260718001',
          title: '八字精批详批报告',
          price: 199,
          num: 1,
          status: 'pending',
          statusText: '待付款',
          createTime: '2026-07-18 14:30',
          cover: '/images/placeholder.png'
        },
        {
          id: 'ML20260717002',
          title: '紫微斗数全盘解析',
          price: 299,
          num: 1,
          status: 'paid',
          statusText: '已付款',
          createTime: '2026-07-17 10:15',
          cover: '/images/placeholder.png'
        },
        {
          id: 'ML20260716003',
          title: '流年运势详批（2026）',
          price: 159,
          num: 2,
          status: 'shipped',
          statusText: '已发货',
          createTime: '2026-07-16 09:00',
          cover: '/images/placeholder.png'
        },
        {
          id: 'ML20260715004',
          title: '姓名学分析报告',
          price: 99,
          num: 1,
          status: 'paid',
          statusText: '已付款',
          createTime: '2026-07-15 16:42',
          cover: '/images/placeholder.png'
        }
      ]
      wx.setStorageSync('orders', orders)
    }
    this.filterOrders(orders)
  },

  filterOrders(orders) {
    const currentTab = this.data.currentTab
    let filtered = orders
    if (currentTab !== 'all') {
      filtered = orders.filter(item => item.status === currentTab)
    }
    this.setData({
      orderList: filtered,
      isEmpty: filtered.length === 0
    })
  },

  switchTab(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ currentTab: type }, () => {
      this.loadOrders()
    })
  },

  // 去支付
  goPay(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认支付',
      content: '确定要支付该订单吗？',
      confirmColor: '#e6c86e',
      success: (res) => {
        if (res.confirm) {
          // 更新订单状态
          const orders = wx.getStorageSync('orders') || []
          const index = orders.findIndex(item => item.id === id)
          if (index > -1) {
            orders[index].status = 'paid'
            orders[index].statusText = '已付款'
            wx.setStorageSync('orders', orders)
            wx.showToast({ title: '支付成功', icon: 'success' })
            this.loadOrders()
          }
        }
      }
    })
  },

  // 取消订单
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      confirmColor: '#e6c86e',
      success: (res) => {
        if (res.confirm) {
          let orders = wx.getStorageSync('orders') || []
          orders = orders.filter(item => item.id !== id)
          wx.setStorageSync('orders', orders)
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadOrders()
        }
      }
    })
  },

  // 确认收货
  confirmReceive(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品/服务吗？',
      confirmColor: '#e6c86e',
      success: (res) => {
        if (res.confirm) {
          const orders = wx.getStorageSync('orders') || []
          const index = orders.findIndex(item => item.id === id)
          if (index > -1) {
            orders[index].status = 'completed'
            orders[index].statusText = '已完成'
            wx.setStorageSync('orders', orders)
            wx.showToast({ title: '已确认', icon: 'success' })
            this.loadOrders()
          }
        }
      }
    })
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/shop/detail/detail?id=' + id
    })
  },

  // 去购物
  goShopping() {
    wx.switchTab({
      url: '/pages/shop/index/index'
    })
  },

  onShareAppMessage() {
    return {
      title: '命理宝鉴 - 我的订单',
      path: '/pages/shop/orders/orders'
    }
  }
})
