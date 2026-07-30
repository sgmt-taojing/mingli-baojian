/**
 * R256 · 舌面诊图像质量校验器
 *
 * 文档来源：docx V1.1 §2.1 采集标准 + §2.4 置信度阈值
 * 强制约束：
 *   - 不合格图片直接拒识，不输出任何识别结果
 *   - 置信度阈值 0.75（硬性），< 0.75 直接判定识别失败
 *   - 输出 5 字段固定 JSON：图像质量判定/舌诊客观特征/面诊客观特征/置信度/待知识库推理字段
 *
 * 判定原则：图像质量判定优先；置信度阈值兜底；二者任一不合格 → 拒识
 */

(function(){
  // 拒识码常量（供前端 + 测试断言使用）
  var REJECT_CODE = {
    QUALITY_FAIL:     'quality_fail',       // §2.1 采集标准不合格
    CONFIDENCE_LOW:   'confidence_low',     // §2.4 < 0.75 拒识
    EMPTY_RESULT:     'empty_result',       // 模型未输出
    SCHEMA_INVALID:   'schema_invalid'      // 输出不符合固定 schema
  };

  // 缺省输入：qualityChecks 是 OCRClient / face-ocr-server 上游返回的可选质量提示
  //            confidence    是模型返回的 0-1 数值
  //            rawTags       是模型识别出的原始标签数组 [tag_id, ...]
  //            rawFace       是面诊原始标签数组
  function validate(input){
    input = input || {};
    var qualityChecks = input.qualityChecks || input.quality || {};
    var confidence    = typeof input.confidence === 'number' ? input.confidence : null;
    var rawTongue     = Array.isArray(input.tongueTags) ? input.tongueTags : [];
    var rawFace       = Array.isArray(input.faceTags)   ? input.faceTags   : [];

    // 1) 图像质量判定（§2.1）
    // 上游可传 {lighting, hasMakeup, hasFilter, hasOcclusion, isScreenshot, isPainting} 五个布尔
    var qFail = [];
    if(qualityChecks.lighting      === 'backlit') qFail.push('逆光');
    if(qualityChecks.hasMakeup     === true)      qFail.push('有妆容');
    if(qualityChecks.hasFilter     === true)      qFail.push('有滤镜');
    if(qualityChecks.hasOcclusion  === true)      qFail.push('有遮挡');
    if(qualityChecks.isScreenshot  === true)      qFail.push('截图/网图');
    if(qualityChecks.isPainting    === true)      qFail.push('绘画样本');
    if(qualityChecks.tooBlurry     === true)      qFail.push('图像模糊');
    if(qualityChecks.faceIncomplete=== true)      qFail.push('面部不完整');

    var qualityPassed = qFail.length === 0;

    // 2) 置信度阈值（§2.4）
    var confPassed = confidence !== null && confidence >= 0.75;
    var confDisplay = (confidence !== null) ? confidence.toFixed(2) : '0.00';

    // 3) 输出标准化 JSON（5 字段固定结构，不可增减字段）
    if(!qualityPassed){
      return {
        图像质量判定: '不合格',
        舌诊客观特征: [],
        面诊客观特征: [],
        置信度: confDisplay,
        待知识库推理字段: '已拒识：图像质量不合格（' + qFail.join('/') + '），请按 docx §2.1 标准重新采集（自然光/无美颜/无滤镜/无逆光/无遮挡/无妆容）',
        reject_code: REJECT_CODE.QUALITY_FAIL,
        reject_reasons: qFail
      };
    }
    if(!confPassed){
      return {
        图像质量判定: '合格',
        舌诊客观特征: [],
        面诊客观特征: [],
        置信度: confDisplay,
        待知识库推理字段: '已拒识：置信度 ' + confDisplay + ' < 阈值 0.75（docx §2.4），请重新采集更清晰图像',
        reject_code: REJECT_CODE.CONFIDENCE_LOW
      };
    }
    if(rawTongue.length === 0 && rawFace.length === 0){
      return {
        图像质量判定: '合格',
        舌诊客观特征: [],
        面诊客观特征: [],
        置信度: confDisplay,
        待知识库推理字段: '已拒识：模型未提取到有效特征（docx §2.5 模糊样本归档），请人工复核',
        reject_code: REJECT_CODE.EMPTY_RESULT
      };
    }

    // 4) 通过 → 输出标准 JSON（特征交由知识库后续多流派辨证解析）
    return {
      图像质量判定: '合格',
      舌诊客观特征: rawTongue,
      面诊客观特征: rawFace,
      置信度: confDisplay,
      待知识库推理字段: '已提取客观特征，等待中医知识库多流派辨证解析（docx §2.4 输出格式要求）',
      reject_code: null
    };
  }

  // 暴露拒识码常量
  function rejectCodes(){ return REJECT_CODE; }

  // CommonJS + browser 双导出
  if(typeof module !== 'undefined' && module.exports){
    module.exports = { validate: validate, rejectCodes: rejectCodes };
  }
  if(typeof window !== 'undefined'){
    window.TongueFaceValidator = { validate: validate, rejectCodes: rejectCodes };
  }
})();