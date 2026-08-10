/**
 * R256 · 私有化综合术数 · 舌面诊标准化标签池
 *
 * 文档来源：docx V1.1 §2.3「全局统一标签池」
 * 强制约束：禁止自定义新增标签，全平台唯一；如需扩展须更新本文件 + 走 KANBAN 评审
 *
 * 字段结构：
 *   tongue.shape       形态
 *   tongue.color       色泽
 *   tongue.coating     舌苔
 *   tongue.moisture    湿度
 *   face.complexion    气色
 *   face.local         局部
 *
 * 所有标签已对齐 docx V1.1 §2.3 · 不可增减字段，可调整具体值。
 */

(function(){
  var TONGUE_FACE_TAG_POOL = {
    version: 'docx-v1.1-2026-07-31',
    doc_ref: 'docx §2.3 全局统一标签池',
    tongue: {
      shape: {
        label: '形态',
        tags: [
          {id: 'tongue.shape.normal',   label: '正常',   desc: '舌体大小适中'},
          {id: 'tongue.shape.swollen',  label: '胖大',   desc: '舌体胖大、饱满'},
          {id: 'tongue.shape.thin',     label: '瘦薄',   desc: '舌体瘦薄'},
          {id: 'tongue.shape.teeth',    label: '齿痕',   desc: '舌边有齿痕'},
          {id: 'tongue.shape.crack',    label: '裂纹',   desc: '舌面有裂纹'},
          {id: 'tongue.shape.deviated', label: '歪斜',   desc: '舌体歪斜'}
        ]
      },
      color: {
        label: '色泽',
        tags: [
          {id: 'tongue.color.pale',       label: '淡白', desc: '舌色淡白'},
          {id: 'tongue.color.pink',       label: '淡红', desc: '舌色淡红（正常偏淡）'},
          {id: 'tongue.color.red',        label: '红',   desc: '舌色红'},
          {id: 'tongue.color.crimson',    label: '绛红', desc: '舌色绛红'},
          {id: 'tongue.color.purple',     label: '青紫', desc: '舌色青紫'},
          {id: 'tongue.color.local_pete', label: '局部瘀斑', desc: '局部有瘀斑'},
          {id: 'tongue.color.pete',       label: '瘀点', desc: '舌面有瘀点'}
        ]
      },
      coating: {
        label: '舌苔',
        tags: [
          {id: 'tongue.coating.none',       label: '无苔',     desc: '舌面无苔'},
          {id: 'tongue.coating.thin_white', label: '薄白苔',   desc: '薄白苔'},
          {id: 'tongue.coating.thick_white',label: '厚白苔',   desc: '厚白苔'},
          {id: 'tongue.coating.greasy_white',label: '白腻苔',   desc: '白腻苔'},
          {id: 'tongue.coating.thin_yellow',label: '薄黄苔',   desc: '薄黄苔'},
          {id: 'tongue.coating.thick_yellow',label: '黄厚苔',  desc: '黄厚苔'},
          {id: 'tongue.coating.greasy_yellow',label: '黄腻苔', desc: '黄腻苔'},
          {id: 'tongue.coating.gray_black', label: '灰黑苔',   desc: '灰黑苔'}
        ]
      },
      moisture: {
        label: '湿度',
        tags: [
          {id: 'tongue.moisture.wet',       label: '水润', desc: '舌面湿润'},
          {id: 'tongue.moisture.slippery',  label: '水滑', desc: '舌面水滑'},
          {id: 'tongue.moisture.normal',    label: '正常', desc: '湿度正常'},
          {id: 'tongue.moisture.dry',       label: '偏干', desc: '舌面偏干'},
          {id: 'tongue.moisture.dry_thorn', label: '干燥', desc: '舌面干燥'},
          {id: 'tongue.moisture.thorn',     label: '起刺', desc: '舌面起刺'}
        ]
      }
    },
    face: {
      complexion: {
        label: '气色',
        tags: [
          {id: 'face.complexion.rosy',   label: '面色红润', desc: '面色红润有光泽'},
          {id: 'face.complexion.pale',   label: '淡白',     desc: '面色淡白'},
          {id: 'face.complexion.sallow', label: '萎黄',     desc: '面色萎黄'},
          {id: 'face.complexion.flush',  label: '潮红',     desc: '面色潮红'},
          {id: 'face.complexion.dull',   label: '暗沉',     desc: '面色暗沉'},
          {id: 'face.complexion.gray',   label: '青灰',     desc: '面色青灰'}
        ]
      },
      local: {
        label: '局部',
        tags: [
          {id: 'face.local.eye_bag',       label: '眼袋明显',   desc: '眼袋明显'},
          {id: 'face.local.eye_dark',      label: '眼周暗沉',   desc: '眼周暗沉'},
          {id: 'face.local.flush_face',    label: '面色泛红',   desc: '面色泛红'},
          {id: 'face.local.cheek_pale',    label: '两颊苍白',   desc: '两颊苍白'},
          {id: 'face.local.lip_pale',      label: '唇色淡',     desc: '唇色淡'},
          {id: 'face.local.lip_purple',    label: '唇色红紫',   desc: '唇色红紫'},
          {id: 'face.local.face_spot',     label: '面部色斑',   desc: '面部色斑'},
          {id: 'face.local.face_vein',     label: '面部青筋',   desc: '面部青筋'}
        ]
      }
    }
  };

  // 内部工具
  var _allTagIds = {};
  function _buildIndex(pool, prefix){
    Object.keys(pool).forEach(function(cat){
      var def = pool[cat];
      if(def && Array.isArray(def.tags)){
        def.tags.forEach(function(t){ _allTagIds[t.id] = {label: t.label, desc: t.desc, category: prefix + '.' + cat}; });
      }
    });
  }
  _buildIndex(TONGUE_FACE_TAG_POOL.tongue, 'tongue');
  _buildIndex(TONGUE_FACE_TAG_POOL.face,   'face');

  function getAllTagIds(){ return Object.keys(_allTagIds).slice(); }
  function isValidTag(tagId){ return Object.prototype.hasOwnProperty.call(_allTagIds, tagId); }
  function tagMeta(tagId){ return _allTagIds[tagId] || null; }
  function getPool(){ return TONGUE_FACE_TAG_POOL; }

  // 导出（CommonJS + browser）
  if(typeof module !== 'undefined' && module.exports){
    module.exports = { getPool: getPool, getAllTagIds: getAllTagIds, isValidTag: isValidTag, tagMeta: tagMeta };
  }
  if(typeof window !== 'undefined'){
    window.TongueFaceTagPool = { getPool: getPool, getAllTagIds: getAllTagIds, isValidTag: isValidTag, tagMeta: tagMeta };
  }
})();