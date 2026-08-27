// ═══ TCM-Agent i18n 多语言框架 v1.0 ═══
window.TCM_I18N = {
  _lang: (localStorage.getItem('tcm_lang') || navigator.language || 'zh-CN').startsWith('zh') ? 'zh' : 'en',
  _dict: {
    zh: {
      'app.name':'中医智能体','clinic':'问诊台','home':'居家健康','diagnosis':'辨证论治',
      'patient':'患者','symptoms':'症状','formula':'方剂','herbs':'药材','report':'诊断报告',
      'ai_analyzing':'AI分析中...','confirm':'确认','cancel':'取消','save':'保存','print':'打印',
      'risk_low':'低风险','risk_medium':'中风险','risk_high':'高风险',
      'disclaimer':'本系统由AI辅助，仅供执业医师参考，不构成诊断或处方建议。'
    },
    en: {
      'app.name':'TCM-Agent','clinic':'Clinic Desk','home':'Home Health','diagnosis':'Diagnosis',
      'patient':'Patient','symptoms':'Symptoms','formula':'Formula','herbs':'Herbs','report':'Report',
      'ai_analyzing':'AI analyzing...','confirm':'Confirm','cancel':'Cancel','save':'Save','print':'Print',
      'risk_low':'Low Risk','risk_medium':'Medium Risk','risk_high':'High Risk',
      'disclaimer':'AI-assisted reference only. Not a medical diagnosis or prescription.'
    }
  },
  t: function(key) { return (this._dict[this._lang] && this._dict[this._lang][key]) || key; },
  setLang: function(l) { this._lang = l; localStorage.setItem('tcm_lang', l); location.reload(); }
};
