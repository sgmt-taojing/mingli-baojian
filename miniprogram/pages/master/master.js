// pages/master/master.js — 大师课堂
const COURSES = [
  {
    id: 1,
    title: '命理入门：五行阴阳基础',
    teacher: '李道明',
    duration: '45分钟',
    lessons: 8,
    cover: '📐',
    category: '入门',
    free: true,
    desc: '从零开始了解阴阳五行、天干地支的基础概念，适合初学者。',
  },
  {
    id: 2,
    title: '八字基础：四柱排盘详解',
    teacher: '张玄机',
    duration: '60分钟',
    lessons: 12,
    cover: '📊',
    category: '八字',
    free: true,
    desc: '系统学习四柱八字排盘方法，掌握年柱、月柱、日柱、时柱的推算。',
  },
  {
    id: 3,
    title: '风水常识：阳宅布局要诀',
    teacher: '王青山',
    duration: '50分钟',
    lessons: 10,
    cover: '🏠',
    category: '风水',
    free: true,
    desc: '阳宅风水入门，了解门窗朝向、家具摆放的讲究。',
  },
  {
    id: 4,
    title: '进阶八字：十神与格局',
    teacher: '张玄机',
    duration: '90分钟',
    lessons: 15,
    cover: '🔮',
    category: '八字',
    free: false,
    price: 99,
    desc: '深入解析十神关系与八字格局判定，提升命理分析能力。',
  },
  {
    id: 5,
    title: '六爻占卜实战精讲',
    teacher: '陈卜易',
    duration: '75分钟',
    lessons: 14,
    cover: '🪙',
    category: '占卜',
    free: false,
    price: 129,
    desc: '六爻起卦、断卦实战技巧，从入门到精通。',
  },
  {
    id: 6,
    title: '风水进阶：玄空飞星',
    teacher: '王青山',
    duration: '80分钟',
    lessons: 16,
    cover: '🧭',
    category: '风水',
    free: false,
    price: 159,
    desc: '玄空飞星风水体系，九运飞星盘推演与断事。',
  },
  {
    id: 7,
    title: '姓名学：五格数理与用字',
    teacher: '李道明',
    duration: '55分钟',
    lessons: 11,
    cover: '✏️',
    category: '姓名',
    free: false,
    price: 89,
    desc: '五格剖象法详解，名字中的五行数理奥秘。',
  },
  {
    id: 8,
    title: '紫微斗数入门',
    teacher: '陈卜易',
    duration: '70分钟',
    lessons: 13,
    cover: '⭐',
    category: '紫微',
    free: false,
    price: 149,
    desc: '紫微斗数排盘基础，十四主星含义解析。',
  },
]

Page({
  data: {
    courses: [],
    activeCategory: '全部',
    categories: ['全部', '入门', '八字', '风水', '占卜', '姓名', '紫微'],
    vipActive: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '大师课堂' })
    this.loadCourses()
  },

  loadCourses() {
    const list = this.data.activeCategory === '全部'
      ? COURSES
      : COURSES.filter(c => c.category === this.data.activeCategory)
    this.setData({ courses: list })
  },

  onCategoryTap(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.cat })
    this.loadCourses()
  },

  onCourseTap(e) {
    const course = e.currentTarget.dataset.course
    if (course.free) {
      wx.showToast({ title: '开始学习：' + course.title.slice(0, 10), icon: 'none' })
    } else if (this.data.vipActive) {
      wx.showToast({ title: 'VIP可学习此课程', icon: 'success' })
    } else {
      wx.showModal({
        title: '升级VIP',
        content: '此课程为付费内容\n价格：¥' + (course.price || 0) + '\n是否升级VIP解锁全部课程？',
        confirmText: '去开通',
        success(res) {
          if (res.confirm) {
            wx.showToast({ title: '请前往商城开通VIP', icon: 'none' })
          }
        }
      })
    }
  },

  onShareAppMessage() {
    return { title: '命理宝鉴 · 大师课堂', path: '/pages/master/master' }
  },
})
