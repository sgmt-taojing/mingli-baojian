// pages/shop/detail.js
const api = require('../../utils/api.js')

// 内置 fallback 商品数据（后端无 detail API 时使用）
const FALLBACK_PRODUCTS = {
  1: {
    id: 1,
    name: '黑曜石本命佛吊坠',
    price: 198,
    category: 'crystal',
    desc: '辟邪化煞，护身保平安',
    wuxing: '水',
    detail: '天然黑曜石雕琢本命佛，经寺院开光加持，辟邪化煞、护身保平安。佩戴可增强自身气场，驱散负面能量，适合本命年或犯太岁者佩戴。每尊吊坠均附赠开光证书与精美礼盒包装。',
    stock: 35,
    emoji: '📿'
  },
  2: {
    id: 2,
    name: '紫水晶招财手链',
    price: 268,
    category: 'crystal',
    desc: '招财聚气，提升贵人运',
    wuxing: '火',
    detail: '精选巴西天然紫水晶，色泽深邃通透。紫水晶在五行中属火，能激发智慧、聚财纳福、招引贵人。适合经商者、创业者佩戴，可放置于财位或随身携带。珠径 10mm，共 15 颗。',
    stock: 28,
    emoji: '🔮'
  },
  3: {
    id: 3,
    name: '和田玉平安扣',
    price: 388,
    category: 'jade',
    desc: '温润养人，平安吉祥',
    wuxing: '土',
    detail: '新疆和田玉籽料精雕平安扣，质地温润细腻，油润度极佳。玉在五行中属土，土能生金、养人安神。平安扣寓意出入平安、事事顺心。适合各年龄段佩戴，自用馈赠皆宜。附权威鉴定证书。',
    stock: 15,
    emoji: '⚪'
  },
  4: {
    id: 4,
    name: '桃木剑镇宅符',
    price: 128,
    category: 'talisman',
    desc: '镇宅辟邪，化解煞气',
    wuxing: '木',
    detail: '天然雷击桃木手工雕刻七星剑，配以朱砂绘制的镇宅符咒。桃木在五行中属木，木主仁、主生发，能驱邪扶正。悬挂于门后或玄关，可化解外煞、镇守家宅安宁。开光加持，附使用说明。',
    stock: 50,
    emoji: '🗡️'
  },
  5: {
    id: 5,
    name: '黄铜貔貅摆件',
    price: 458,
    category: 'ornament',
    desc: '只进不出，招财进宝',
    wuxing: '金',
    detail: '精炼黄铜铸造貔貅摆件，做工精细、威武生动。貔貅为龙生九子之一，以财为食、只进不出，是招财瑞兽之首。铜在五行中属金，金主财富。摆放于店内或家中财位，头朝门外或窗外，可招财纳宝。高约 8cm，附开光证书。',
    stock: 20,
    emoji: '🦁'
  },
  6: {
    id: 6,
    name: '艾草祈福香囊',
    price: 68,
    category: 'talisman',
    desc: '驱蚊辟邪，安神助眠',
    wuxing: '木',
    detail: '精选三年陈艾草搭配多味中药，手工缝制香囊。艾草纯阳之物，可辟邪驱秽、净化气场。悬挂于车内、床头或随身携带，能驱蚊安神、提神醒脑。香囊采用传统刺绣工艺，多种花色可选。',
    stock: 80,
    emoji: '🌿'
  }
}

// 五行属性颜色映射
const WUXING_COLORS = {
  '金': '#d4af37',
  '木': '#4caf50',
  '水': '#2196f3',
  '火': '#f44336',
  '土': '#8d6e63'
}

Page({
  data: {
    product: null,
    quantity: 1,
    wuxingColor: '',
    loading: true
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '商品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadProductDetail(id)
  },

  // 加载商品详情
  loadProductDetail(id) {
    this.setData({ loading: true })

    // 尝试调用后端 API，失败则使用 fallback 数据
    api.getProductDetail
      ? api.getProductDetail(id)
          .then(res => {
            const product = res.data || res
            this.setProductData(product)
          })
          .catch(err => {
            console.warn('API 获取商品详情失败，使用本地数据:', err)
            this.useFallbackData(id)
          })
      : this.useFallbackData(id)
  },

  // 使用内置 fallback 数据
  useFallbackData(id) {
    const product = FALLBACK_PRODUCTS[id]
    if (product) {
      this.setProductData(product)
    } else {
      this.setData({ loading: false })
      wx.showToast({ title: '商品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  // 设置商品数据到页面
  setProductData(product) {
    const wuxingColor = WUXING_COLORS[product.wuxing] || '#e6c86e'
    this.setData({
      product,
      wuxingColor,
      loading: false
    })
  },

  // 数量减少
  onQuantityMinus() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 })
    }
  },

  // 数量增加
  onQuantityPlus() {
    const max = this.data.product ? this.data.product.stock : 99
    if (this.data.quantity < max) {
      this.setData({ quantity: this.data.quantity + 1 })
    } else {
      wx.showToast({ title: '库存不足', icon: 'none' })
    }
  },

  // 直接输入数量
  onQuantityInput(e) {
    let val = parseInt(e.detail.value) || 1
    const max = this.data.product ? this.data.product.stock : 99
    if (val < 1) val = 1
    if (val > max) val = max
    this.setData({ quantity: val })
  },

  // 加入购物车
  onAddToCart() {
    const { product, quantity } = this.data
    if (!product) return

    // 从本地存储获取购物车
    const cart = wx.getStorageSync('cart') || []
    const existing = cart.find(item => item.id === product.id)

    if (existing) {
      existing.quantity += quantity
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        emoji: product.emoji,
        quantity
      })
    }

    wx.setStorageSync('cart', cart)
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },

  // 立即购买
  onBuyNow() {
    const { product, quantity } = this.data
    if (!product) return

    // 构建订单临时数据
    const orderItems = [{
      id: product.id,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      quantity
    }]

    wx.setStorageSync('pendingOrder', orderItems)
    wx.navigateTo({
      url: '/pages/shop/checkout?type=buyNow'
    })
  },

  // 跳转到购物车
  onGoToCart() {
    wx.switchTab({
      url: '/pages/shop/cart'
    })
  },

  // 分享
  onShareAppMessage() {
    const product = this.data.product
    return {
      title: product ? `${product.name} - 命理宝鉴` : '命理宝鉴商城',
      path: `/pages/shop/detail?id=${product ? product.id : ''}`
    }
  }
})
