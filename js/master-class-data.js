// ═══ 名师课堂课程数据 ═══
// 格式：addLesson(老师, {title, type, url, duration, category, summary, keyPoints})
// type: video/audio/text
// 资料填充后在此文件添加课程

window.MASTER_LESSONS_DATA = {
  shuhan: [
    // 舒晗老师课程（待填充）
    // 示例：
    // {title:'八字排盘实战入门', type:'video', url:'/videos/shuhan/bazi-basic.mp4', duration:'45分钟', category:'八字实战', summary:'从零开始学习八字排盘，掌握四柱推演核心方法', keyPoints:['天干地支基础','四柱排法','十神判定','用神选取']}
  ],
  nihaisha: [
    // 倪海厦老师课程（待填充）
    // 示例：
    // {title:'桂枝汤临床应用', type:'video', url:'/videos/ni/guizhi-tang.mp4', duration:'30分钟', category:'中医经方', summary:'桂枝汤的组成、主治、加减法及命理对应', keyPoints:['桂枝汤组成','主治症候','加减法','命理对应']}
  ]
};

// 初始化加载课程数据
function initMasterClassData() {
  if (typeof MASTER_LESSONS_DATA === 'undefined') return;
  ['shuhan','nihaisha'].forEach(function(master) {
    var lessons = MASTER_LESSONS_DATA[master] || [];
    lessons.forEach(function(l) {
      if (typeof addLesson === 'function') {
        addLesson(master, l);
      }
    });
  });
}

// 文档加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMasterClassData);
} else {
  initMasterClassData();
}
