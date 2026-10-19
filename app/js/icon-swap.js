/* R749: icon-swap —— 全站 emoji 标识 → 统一线性 SVG 图标
 *
 * 背景：全站 174 页存在大量 emoji 用作功能标识，风格不统一且依赖系统字体。
 * 本模块提供中心化 SVG 图标注册表 + 保守的运行时替换器。
 *
 * 安全边界（不得扩大）：
 *   - 只替换「注册表内的物体/符号类 emoji」（🔮📅📊🔍 等）
 *   - 人脸表情😖、旗帜🇨🇳、食物🍵、卦符☰ 等内容符号一律不动
 *   - 只替换「整元素纯 emoji」的节点（元素全部文本 = 1~4 个注册表 emoji）
 *   - 跳过 OPTION/SCRIPT/STYLE/TEXTAREA/INPUT 与 [data-emoji-keep] 子树
 *   - 混合文本（emoji+文字）不替换，避免破坏文案排版
 *
 * 用法：mobile-nav.js 已全站注入本脚本；也可手动 <script src="js/icon-swap.js?v=20261020a">
 * 关闭：页面定义 window.ML_ICON_SWAP=false 后本脚本不执行
 */
(function () {
  'use strict';
  if (typeof window !== 'undefined' && window.ML_ICON_SWAP === false) return;

  var W = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  function svg(inner) { return '<svg viewBox="0 0 24 24" ' + W + '>' + inner + '</svg>'; }

  // ---- SVG 图标注册表（与 mobile-nav.js 同一视觉口径）----
  var ICONS = {
    '🔮': svg('<circle cx="12" cy="10" r="6.5"/><path d="M8 20h8M10 16.5h4l1 3.5h-6z"/><path d="M9.5 8.5a3 3 0 0 1 2-1.6"/>'),
    '📅': svg('<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 14h3M8 17h6"/>'),
    '📆': svg('<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="1.4"/>'),
    '📊': svg('<path d="M4 4v16h16"/><path d="M8.5 16v-5M13 16V8M17.5 16v-8"/>'),
    '📈': svg('<path d="M4 4v16h16"/><path d="M7 15l4-4 3 3 5-6"/><path d="M19 8h-3M19 8v3"/>'),
    '📉': svg('<path d="M4 4v16h16"/><path d="M7 9l4 4 3-3 5 6"/><path d="M19 16h-3M19 16v-3"/>'),
    '📚': svg('<path d="M5 4h4v16H5zM11 4h4v16h-4z"/><path d="M16.5 5.5l3.5 14.5-3.8 1L12.7 6.5z" transform="rotate(6 17 13)"/>'),
    '📖': svg('<path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2z"/><path d="M12 6v14"/>'),
    '📜': svg('<path d="M7 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7"/><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2 2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M11 9h5M11 13h5"/>'),
    '🔍': svg('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>'),
    '🏠': svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
    '🏥': svg('<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M9 21v-5h6v5"/><path d="M12 9v5M9.5 11.5h5"/><path d="M9 6V3.5h6V6"/>'),
    '🏛': svg('<path d="M3 9l9-5.5L21 9"/><path d="M4 9.5h16"/><path d="M6 9.5V18M10 9.5V18M14 9.5V18M18 9.5V18"/><path d="M3.5 21h17M5 18h14"/>'),
    '👤': svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/>'),
    '👥': svg('<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c1.2-3.4 3.7-5.2 6.5-5.2s5.3 1.8 6.5 5.2"/><path d="M16 5.4a3.5 3.5 0 0 1 0 6.2M18.5 15.2c1.6.8 2.6 2.4 3 4.8"/>'),
    '⚙': svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8l1.2 2.6a7 7 0 0 1 2.4 1l2.7-.8 1.7 3-2.1 1.7a7 7 0 0 1 0 2.8l2.1 1.7-1.7 3-2.7-.8a7 7 0 0 1-2.4 1L12 21.2l-1.2-2.6a7 7 0 0 1-2.4-1l-2.7.8-1.7-3 2.1-1.7a7 7 0 0 1 0-2.8L4 9.2l1.7-3 2.7.8a7 7 0 0 1 2.4-1z" transform="scale(.92) translate(1 1)"/>'),
    '💊': svg('<rect x="3.5" y="9" width="17" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>'),
    '🩺': svg('<path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M4 3h4M12 3h4"/><path d="M10 12v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>'),
    '📷': svg('<rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="17.8" cy="10" r=".6" fill="currentColor" stroke="none"/>'),
    '📸': svg('<rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/><path d="M12 3.5V2M9 3l-.8-1.2M15 3l.8-1.2"/>'),
    '📹': svg('<rect x="2.5" y="6.5" width="13" height="11" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/>'),
    '🎥': svg('<rect x="2.5" y="6.5" width="13" height="11" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/>'),
    '🎤': svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>'),
    '🎙': svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>'),
    '💡': svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 1 3.5 10.9c-.8.6-1.5 1.5-1.5 2.6v.5h-4v-.5c0-1.1-.7-2-1.5-2.6A6 6 0 0 1 12 3z"/>'),
    '📋': svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a3 3 0 0 1 6 0"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>'),
    '📄': svg('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 15.5h6"/>'),
    '📝': svg('<path d="M5 19.5l1-3.5L16.5 5.5a2.1 2.1 0 0 1 3 3L9 19l-3.5 1z" transform="translate(-1 0)"/><path d="M14.5 7.5l3 3"/><path d="M4 21h16"/>'),
    '💬': svg('<path d="M4 5.5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
    '🌿': svg('<path d="M5 19C5 9 11 4 20 4c0 9-5 15-13 15"/><path d="M5 19c3-5 7-8.5 12-11"/>'),
    '⭐': svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
    '✅': svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>'),
    '❌': svg('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
    '⚠': svg('<path d="M12 3.5L22 20H2z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"/>'),
    '📱': svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 5h3"/><circle cx="12" cy="18.5" r=".9" fill="currentColor" stroke="none"/>'),
    '🔥': svg('<path d="M12 3c1 3-1.5 4.5-2.5 6.5C8.3 11.8 8 13 8 14.5A4.5 4.5 0 0 0 12.5 19c2.8 0 5-2 5-4.8 0-2.7-1.6-4.2-2.7-5.7-.4 1-1 1.7-1.8 2 .3-2.5-.2-5.5-1-7.5z"/><path d="M12 21a7 7 0 0 1-7-7c0-1.5.4-2.7 1-4"/>'),
    '🗑': svg('<path d="M4 6.5h16M9 6.5V4h6v2.5"/><path d="M6.5 6.5l1 14.5h9l1-14.5"/><path d="M10 10.5v6M14 10.5v6"/>'),
    '🔄': svg('<path d="M20 8a8 8 0 0 0-14.5-2M4 16a8 8 0 0 0 14.5 2"/><path d="M4 2.5V7h4.5M20 21.5V17h-4.5"/>'),
    '📤': svg('<path d="M12 15V4M8 7.5L12 3.5l4 4"/><path d="M4.5 14v5.5h15V14"/>'),
    '📥': svg('<path d="M12 4v11M8 11.5l4 4 4-4"/><path d="M4.5 14v5.5h15V14"/>'),
    '💾': svg('<path d="M4 4h13l3 3v13H4z"/><path d="M8 4v5h7V4"/><rect x="8" y="13" width="8" height="7"/>'),
    '🧭': svg('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none"/>'),
    '🪷': svg('<path d="M12 5c1.8 2.2 2.5 4.5 2 7-1.6-.4-2.7-1.4-3.5-3"/><path d="M12 5c-1.8 2.2-2.5 4.5-2 7 1.6-.4 2.7-1.4 3.5-3"/><path d="M6.5 9c2.8.4 4.6 1.8 5.5 4-2.4.8-4.4.3-6-1.3"/><path d="M17.5 9c-2.8.4-4.6 1.8-5.5 4 2.4.8 4.4.3 6-1.3"/><path d="M4 15c2 3.5 5 5 8 5s6-1.5 8-5c-2.5 1-5.2 1.4-8 1.4S6.5 16 4 15z"/>'),
    '🙏': svg('<path d="M11 4l-3.5 7.5c-.5 1-.3 2.2.5 3l2 2M13 4l3.5 7.5c.5 1 .3 2.2-.5 3l-2 2"/><path d="M11 4h2v9h-2z"/><path d="M10 20.5c.8.5 3.2.5 4 0"/>'),
    '📿': svg('<circle cx="12" cy="6" r="1.6"/><circle cx="7" cy="8" r="1.6"/><circle cx="17" cy="8" r="1.6"/><circle cx="5.5" cy="13" r="1.6"/><circle cx="18.5" cy="13" r="1.6"/><circle cx="8" cy="17.5" r="1.6"/><circle cx="16" cy="17.5" r="1.6"/><path d="M12 15.5v3M10.8 21h2.4"/>'),
    '☯': svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>'),
    '🎯': svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>'),
    '🔔': svg('<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2.5h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>'),
    '🔒': svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>'),
    '📌': svg('<path d="M9 4h6l-.8 6 2.8 2.5v1.5H7v-1.5L9.8 10z"/><path d="M12 14v7"/>'),
    '📍': svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="9.8" r="2.3"/>'),
    '✍': svg('<path d="M4 20l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M13.5 7.5l3 3"/>'),
    '✏': svg('<path d="M4 20l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M13.5 7.5l3 3"/>'),
    '🖨': svg('<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8.5" rx="2"/><path d="M7 14h10v7H7z"/><circle cx="17.5" cy="11" r=".7" fill="currentColor" stroke="none"/>'),
    '📁': svg('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2.5h8A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>'),
    '📂': svg('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2.5h8A1.5 1.5 0 0 1 21 9v1H6.5L3.8 18.5 3 18z"/><path d="M3.8 18.5L6.5 10H22l-2.7 8.5a1.5 1.5 0 0 1-1.4 1H4.5z"/>'),
    '📦': svg('<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/><path d="M7.5 5.5l8.5 4.5"/>'),
    '🛡': svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
    '🤖': svg('<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 7V3.5"/><circle cx="9" cy="12.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="12.5" r="1.1" fill="currentColor" stroke="none"/><path d="M9.5 16h5"/>'),
    '🧠': svg('<path d="M9.5 4A2.8 2.8 0 0 0 6.8 7 3.2 3.2 0 0 0 4 10.2c0 .9.3 1.7.9 2.3A3.4 3.4 0 0 0 6.5 18 2.9 2.9 0 0 0 12 19.5V7a3 3 0 0 0-2.5-3z"/><path d="M14.5 4A2.8 2.8 0 0 1 17.2 7a3.2 3.2 0 0 1 2.8 3.2c0 .9-.3 1.7-.9 2.3a3.4 3.4 0 0 1-1.6 5.5A2.9 2.9 0 0 1 12 19.5"/>'),
    '⚖': svg('<path d="M12 4v16M8 20h8"/><path d="M12 5.5L5 7.5M12 5.5l7 2"/><path d="M5 7.5L2.5 13a2.8 2.8 0 0 0 5 0zM19 7.5L16.5 13a2.8 2.8 0 0 0 5 0z"/>'),
    '⚕': svg('<path d="M12 3v18"/><path d="M7 6.5h10c1.8 0 3 1.2 3 2.8S18.5 12 17 12h-2.5c-1.6 0-2.5.9-2.5 2.2"/><path d="M9 21c-1.6 0-2.8-1-2.8-2.5S7.5 16 9.2 16H11"/>'),
    '🌙': svg('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>'),
    '🔗': svg('<path d="M9.5 14.5l5-5"/><path d="M11 6.5l1.8-1.8a3.5 3.5 0 0 1 5 5L16 11.5"/><path d="M13 17.5l-1.8 1.8a3.5 3.5 0 0 1-5-5L8 12.5"/>'),
    '🔊': svg('<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'),
    '🖼': svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4.5 3 3L15 12l5.5 5.5"/>'),
    '⛰': svg('<path d="M3 19L9.5 7l3.5 6 2.5-3.5L21 19z"/><path d="M9.5 7l1.8 3"/>'),
    '🌊': svg('<path d="M3 9c2 0 2.5 1.5 4.5 1.5S10 9 12 9s2.5 1.5 4.5 1.5S19 9 21 9"/><path d="M3 14.5c2 0 2.5 1.5 4.5 1.5s2.5-1.5 4.5-1.5 2.5 1.5 4.5 1.5 2.5-1.5 4.5-1.5"/>'),
    '🧪': svg('<path d="M10 3h4M11 3v5.5L5.5 18a2.2 2.2 0 0 0 2 3.2h9a2.2 2.2 0 0 0 2-3.2L13 8.5V3"/><path d="M7.5 14h9"/>'),
    '🔬': svg('<path d="M9 3h6M10.5 3v4L6 15.5A3.2 3.2 0 0 0 9 20.5h6a3.2 3.2 0 0 0 3-5L13.5 7V3"/><path d="M7.5 13h9"/>'),
    '🩻': svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 6v12M9 8.5h6M9 12h6M9.5 15.5h5"/>'),
    '💰': svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5L12 12l3.5-3.5M12 12v6M9 14.5h6M9 17h6"/>'),
    '🎓': svg('<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5"/><path d="M21.5 9.5V15"/>'),
    '🏮': svg('<ellipse cx="12" cy="12" rx="7" ry="8"/><path d="M9 4.5h6M9 19.5h6M12 4.5v-1M12 19.5v1.5"/><path d="M12 21v1.5M8.5 5.5c-1 2-1.5 4-1.5 6.5s.5 4.5 1.5 6.5M15.5 5.5c1 2 1.5 4 1.5 6.5s-.5 4.5-1.5 6.5"/>'),
    '🚪': svg('<rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="15.5" cy="12" r="1" fill="currentColor" stroke="none"/>'),
    '🛍': svg('<path d="M5 8h14l-1 13H6z"/><path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10"/>'),
    '🧧': svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 7c3 2 11 2 14 0"/><circle cx="12" cy="12.5" r="2.5"/>'),
    '🧬': svg('<path d="M7 3c0 5 10 6 10 10.5S7 17 7 21M17 3c0 5-10 6-10 10.5S17 17 17 21"/><path d="M8.5 6.5h7M8.5 17.5h7M9.5 10h5M9.5 14h5"/>'),
    '🪙': svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 9.5v5M10.5 10.8h3"/>'),
    '🧮': svg('<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 8.5h16"/><path d="M9 8.5V20.5M15 8.5V20.5"/><circle cx="6.8" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="15.5" r=".9" fill="currentColor" stroke="none"/><circle cx="17.2" cy="12" r=".9" fill="currentColor" stroke="none"/>'),
    '🗺': svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    '🚨': svg('<path d="M6 13a6 6 0 0 1 12 0v5H6z"/><path d="M4 20.5h16"/><path d="M12 4V2M5.5 6.5L4 5M18.5 6.5L20 5"/>'),
    '🧘': svg('<circle cx="12" cy="5.5" r="2"/><path d="M12 8.5v4"/><path d="M8 12.5c1.5 1 2.5 1.5 4 1.5s2.5-.5 4-1.5"/><path d="M4 18c2-2 4.5-3 8-3s6 1 8 3-3 3-8 3-8-1-8-3z"/>'),
    '🕯': svg('<path d="M12 6.5c1.2-1.5 1.2-3 0-4.5-1.2 1.5-1.2 3 0 4.5z"/><path d="M9.5 8.5h5V21h-5z"/><path d="M6.5 21h11"/>'),
    '🎵': svg('<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>'),
    '🔢': svg('<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 8.5l1.2-1 1.2 1M9.6 7.5V13"/><path d="M13.5 9.5h3.5l-3.5 4h3.5"/>'),
    '⏰': svg('<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l3 2"/><path d="M5 3.5L3 6M19 3.5L21 6"/>'),
    '🕐': svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    '👁': svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    '👅': svg('<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M12 10v6M4 4h16"/>'),
    '✋': svg('<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M17 12l2-2a1.5 1.5 0 0 1 2 2l-3.5 5A6 6 0 0 1 12 20.5h-.5A5.5 5.5 0 0 1 6 15v-4a1.5 1.5 0 0 1 3 0"/>'),
    '🤝': svg('<path d="M3 7l5-2 4 2 4-2 5 2v8l-5 3-4-2-4 2-5-3z"/><path d="M12 7v6"/>'),
    '📡': svg('<circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none"/><path d="M7 14a7 7 0 0 1 10 0M4 10.5a11.5 11.5 0 0 1 16 0M12 18v3.5"/><path d="M2 7a16 16 0 0 1 20 0"/>'),
    '🌡': svg('<path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none"/><path d="M12 15.5V8"/>'),
    '❤': svg('<path d="M12 20s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 6.4 5.2 5.2 0 0 1 21.3 11c-1.8 4.3-9.3 9-9.3 9z"/>'),
    '💓': svg('<path d="M12 20s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 6.4 5.2 5.2 0 0 1 21.3 11c-1.8 4.3-9.3 9-9.3 9z"/><path d="M5.5 12h3l1.5-2.5 2 5 1.5-2.5h3"/>'),
    '🩸': svg('<path d="M12 3s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11z"/>'),
    '💧': svg('<path d="M12 3s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11z"/>'),
    '🫁': svg('<path d="M12 3v5"/><path d="M12 8c-1-1.5-3-2-4.5-1C5.5 8 4.5 11 4.5 14.5c0 3 1 5.5 2.5 5.5s2.5-2 2.5-4V9.5"/><path d="M12 8c1-1.5 3-2 4.5-1 2 1 3 4 3 7.5 0 3-1 5.5-2.5 5.5s-2.5-2-2.5-4V9.5"/>'),
    '🦋': svg('<path d="M12 8v10"/><path d="M12 9C10 5.5 5.5 3.5 4 6c-1.2 2 .8 4.5 3 5-2 .5-3.8 2.5-2.5 4.5C6 18 10.5 15 12 12"/><path d="M12 9c2-3.5 6.5-5.5 8-3 1.2 2-.8 4.5-3 5 2 .5 3.8 2.5 2.5 4.5C18 18 13.5 15 12 12"/>'),
    '🐉': svg('<path d="M4 15c2-1 3-3.5 3-6 0-2 1-4 3-4s3 1.5 3 3.5c0 1.5-1 2.5-2.5 2.5"/><path d="M13 11c3 0 5 2 5 4.5S15.5 20 12.5 20H7"/><path d="M7 20l-2 1.5M16.5 19.5L18 21"/><circle cx="9.5" cy="8" r=".7" fill="currentColor" stroke="none"/>'),
    '🦞': svg('<path d="M12 6c-2 0-3.5 2-3.5 5s1.5 6 3.5 8c2-2 3.5-5 3.5-8S14 6 12 6z"/><path d="M12 6V3M9.5 8L6 5.5M14.5 8L18 5.5M9.5 12H5M14.5 12H19"/><path d="M10 19l-1.5 2.5M14 19l1.5 2.5"/>'),
    '🀄': svg('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M9 8.5h6M9 12h6M10 15.5h4M12 8.5v7"/>'),
    '🧿': svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>'),
    '🧾': svg('<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 11.5h6M9 15h4"/>'),
    '🪪': svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M6 16c.7-1.6 1.6-2.3 2.5-2.3s1.8.7 2.5 2.3"/><path d="M14 9h4M14 12.5h4M14 16h2.5"/>'),
    '🧑': svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/>'),
    '👨': svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/><path d="M8.5 6.5a4 4 0 0 1 7 0"/>'),
    '👩': svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/><path d="M8 11a4.5 4.5 0 0 1 0-6.5M16 11a4.5 4.5 0 0 0 0-6.5"/>'),
    '👧': svg('<circle cx="12" cy="8" r="3.6"/><path d="M5.5 21c1.3-3.6 3.8-5.4 6.5-5.4s5.2 1.8 6.5 5.4"/><path d="M7.5 6L6 3.5M16.5 6L18 3.5"/>'),
    '👶': svg('<circle cx="12" cy="10" r="6"/><path d="M12 4c.5 1.5 2 2 3 1.5"/><path d="M7 21c1.5-2 3-3 5-3s3.5 1 5 3"/><circle cx="10" cy="10" r=".7" fill="currentColor" stroke="none"/><circle cx="14" cy="10" r=".7" fill="currentColor" stroke="none"/>'),
    '👴': svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/><path d="M9 10.5c1 .8 2 .8 3 0M12 10.5c1 .8 2 .8 3 0"/>'),
    '💑': svg('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20c1-3 3-4.5 5.5-4.5 1.5 0 2.8.5 4 1.5 1.2-1 2.5-1.5 4-1.5 2.5 0 4.5 1.5 5.5 4.5"/>'),
    '💪': svg('<path d="M4 12c0-1.5 1-2.5 2.5-2.5H9c1 0 2 .5 2.5 1.5L13 8a2.5 2.5 0 0 1 4 2l-1.5 5A6 6 0 0 1 10 19.5H7a3 3 0 0 1-3-3z"/><path d="M13 8c.5-1.5 2-2.5 3.5-2"/>'),
    '🦵': svg('<path d="M8 3h5l-1 8 3 4-2 6H9l2-6-3-4z"/>'),
    '🍵': svg('<path d="M5 10h12v5a5 5 0 0 1-10 0z"/><path d="M17 11h2a2.5 2.5 0 0 1 0 5h-2.5"/><path d="M8 7c0-1.2 1-1.3 1-2.5M11.5 7c0-1.2 1-1.3 1-2.5"/>'),
    '🍚': svg('<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M7 11c0-3 2.5-5 5-5s5 2 5 5"/>'),
    '🎂': svg('<path d="M5 12h14v8H5z"/><path d="M5 15c1.5 1.2 3 1.2 4.5 0s3 1.2 4.5 0 3 1.2 4.5 0"/><path d="M12 12V8.5"/><path d="M12 8.5c1-1 1-2.3 0-3.5-1 1.2-1 2.5 0 3.5z"/>'),
    '🎲': svg('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none"/>'),
    '🎏': svg('<path d="M4 12c3-4 7-6 11-6l5 2-2 4 2 4-5 2c-4 0-8-2-11-6z"/><circle cx="15.5" cy="11" r=".9" fill="currentColor" stroke="none"/><path d="M9 8.5c1 2 1 5 0 7"/>'),
    '🏷': svg('<path d="M3.5 3.5H11L20.5 13a1.8 1.8 0 0 1 0 2.5l-5 5a1.8 1.8 0 0 1-2.5 0L3.5 11z"/><circle cx="8" cy="8" r="1.4"/>'),
    '🛒': svg('<path d="M3 4.5h2.5l2 11h11l2-7.5H7"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>'),
    '💳': svg('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 9.5h18"/><path d="M6 14.5h4"/>'),
    '💎': svg('<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M7 4l5 5 5-5M12 9v11"/>'),
    '🔑': svg('<circle cx="8" cy="8" r="4.5"/><path d="M11.5 11.5L20 20M17 17l2.5-2.5M19.5 19.5L22 17"/>'),
    '🗝': svg('<circle cx="8" cy="8" r="4.5"/><path d="M11.5 11.5L20 20M16 16l2.5-2.5M18.5 18.5L21 16"/>'),
    '📞': svg('<path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    '✉': svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>'),
    '📮': svg('<path d="M7 3h10v18H7z"/><path d="M7 7h10M10 7v3h4V7"/><path d="M10 21v-4h4v4"/>'),
    '🌐': svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18"/>'),
    '🚀': svg('<path d="M12 3c3 2 5 5.5 5 10l-2.5 3h-5L7 13c0-4.5 2-8 5-10z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M7 13l-3 4 4-1M17 13l3 4-4-1M10.5 18l1.5 3.5L13.5 18"/>'),
    '🛰': svg('<rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9.5 12H4M14.5 12H20M4 12l-1.5-3M4 12l-1.5 3M20 12l1.5-3M20 12l1.5 3"/><path d="M12 9.5V5M12 5l-2-1.5M12 5l2-1.5"/>'),
    '🎛': svg('<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8.5 8v8M12 8v8M15.5 8v8"/><circle cx="8.5" cy="11" r="1.3"/><circle cx="12" cy="14" r="1.3"/><circle cx="15.5" cy="10" r="1.3"/>'),
    '🎚': svg('<path d="M4 8.5h16M4 15.5h16"/><circle cx="9" cy="8.5" r="1.8"/><circle cx="15" cy="15.5" r="1.8"/>'),
    '🏆': svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5.5H4a3 3 0 0 0 3.5 3.5M17 5.5h3a3 3 0 0 1-3.5 3.5"/><path d="M12 14v3M8.5 20.5h7M10 17h4l.8 3.5H9.2z"/>'),
    '🏅': svg('<circle cx="12" cy="14" r="6"/><path d="M8.5 9L6 3h4l2 3.5L14 3h4l-2.5 6"/><path d="M12 11.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>'),
    '🥇': svg('<circle cx="12" cy="14" r="6"/><path d="M8.5 9L6 3h4l2 3.5L14 3h4l-2.5 6"/><path d="M12 11.5v5M10.8 12.8L12 11.5"/>'),
    '🥽': svg('<path d="M3 10c0-2 1.5-3 3.5-3h11c2 0 3.5 1 3.5 3v2c0 2-1.5 3-3.5 3H15l-3-2-3 2H6.5C4.5 15 3 14 3 12z"/><path d="M3 10.5h18"/>'),
    '🕶': svg('<path d="M3 9h18"/><path d="M5 9l1 4.5A2.5 2.5 0 0 0 11 13l.5-2h1l.5 2a2.5 2.5 0 0 0 5 .5L19 9"/>'),
    '🔭': svg('<path d="M4 16L14 6l4 4L8 20z"/><path d="M14 6l2.5-1L18 9.5 16 10.5"/><path d="M8 20l-2 1.5M11 17l2 3"/>'),
    '🔮‍': svg('<circle cx="12" cy="10" r="6.5"/><path d="M8 20h8"/>'),
    '📇': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 8.5h16M4 13h16"/><path d="M9 4v16"/>'),
    '🗂': svg('<path d="M3 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2H19A1.5 1.5 0 0 1 20.5 9v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z"/><path d="M7 3.5h4l2 2h4"/>'),
    '🗃': svg('<rect x="3.5" y="7" width="17" height="13" rx="1.5"/><path d="M3.5 11h17"/><path d="M10 14.5h4"/>'),
    '📑': svg('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M4 6v15h11"/>'),
    '📰': svg('<rect x="3" y="5" width="15" height="14" rx="1.5"/><path d="M18 9h2.5a1 1 0 0 1 1 1v8a1.5 1.5 0 0 1-3 0"/><path d="M6 8.5h9M6 12h9M6 15.5h5"/>'),
    '📻': svg('<rect x="3.5" y="9" width="17" height="10" rx="2"/><circle cx="8.5" cy="14" r="2.5"/><path d="M13.5 12.5h4M13.5 15.5h4"/><path d="M5.5 9L17 3.5"/>'),
    '📺': svg('<rect x="3" y="5.5" width="18" height="12" rx="2"/><path d="M9 21h6M12 17.5V21"/><path d="M8.5 2.5L12 5.5 15.5 2.5"/>'),
    '🖥': svg('<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M9 21h6M12 16.5V21"/>'),
    '⌨': svg('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M6.5 10.5h.8M10 10.5h.8M13.2 10.5h.8M16.5 10.5h.8M7.5 14h9"/>'),
    '🖱': svg('<rect x="8" y="3" width="8" height="18" rx="4"/><path d="M12 3v5M8 8h8"/>'),
    '💽': svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.8"/><circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none"/>'),
    '🎧': svg('<path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3.5" y="13.5" width="4" height="6.5" rx="1.8"/><rect x="16.5" y="13.5" width="4" height="6.5" rx="1.8"/>'),
    '📢': svg('<path d="M4 10v4l4 1 8 5V4L8 9z"/><path d="M18.5 9a4.5 4.5 0 0 1 0 6"/><path d="M8 15v4.5"/>'),
    '🔔‍': svg('<path d="M6 16v-5a6 6 0 0 1 12 0v5"/>'),
    '🛎': svg('<path d="M5 15a7 7 0 0 1 14 0z"/><path d="M3.5 18h17M12 8V5.5M10 5.5h4"/><circle cx="12" cy="4" r=".8" fill="currentColor" stroke="none"/>'),
    '🧹': svg('<path d="M14 3l-3 8 2.5 2.5L21 10z" transform="translate(-3 0)"/><path d="M10 13l-5.5 7M11.5 14.5L7 21M13 16l-3.5 5"/>'),
    '🧩': svg('<path d="M9 4h6v4a2 2 0 1 1 0 4v4h6v4h-6a2 2 0 1 0-4 0H7v-4a2 2 0 1 1 0-4V8H4V4z" transform="scale(.9) translate(1.3 1.3)"/>'),
    '🎫': svg('<path d="M4 7h16v4a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4z"/><path d="M13 7v2M13 11v2M13 15v2"/>'),
    '🎟': svg('<path d="M4 7h16v4a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4z"/><path d="M13 7v2M13 11v2M13 15v2"/>'),
    '🏺': svg('<path d="M9 3h6M10 3v2.5c-2.5 1-4 3.5-4 6.5 0 5 3 9 6 9s6-4 6-9c0-3-1.5-5.5-4-6.5V3"/><path d="M7 10.5h10"/>'),
    '🏪': svg('<path d="M4 9l1-4.5h14L20 9"/><path d="M4 9a2.3 2.3 0 0 0 4.6 0 2.3 2.3 0 0 0 4.7 0 2.3 2.3 0 0 0 4.7 0 2.3 2.3 0 0 0 4.6 0" transform="translate(-1.3 0)"/><path d="M5.5 11.5V20h13v-8.5"/><path d="M9 20v-5h6v5"/>'),
    '🏢': svg('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8.5 6.5h2M13.5 6.5h2M8.5 10h2M13.5 10h2M8.5 13.5h2M13.5 13.5h2"/><path d="M10.5 21v-3.5h3V21"/>'),
    '🏘': svg('<path d="M3 11L8 6l5 5"/><path d="M5 10v9h6v-9"/><path d="M11 13l5-4.5L21 13"/><path d="M13 12.5V19h6v-6.5"/>'),
    '🌸': svg('<circle cx="12" cy="7.5" r="2.3"/><circle cx="16.3" cy="10.6" r="2.3"/><circle cx="14.7" cy="15.7" r="2.3"/><circle cx="9.3" cy="15.7" r="2.3"/><circle cx="7.7" cy="10.6" r="2.3"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>'),
    '🍀': svg('<circle cx="9.5" cy="9.5" r="3"/><circle cx="14.5" cy="9.5" r="3"/><circle cx="9.5" cy="14" r="3"/><circle cx="14.5" cy="14" r="3"/><path d="M12 15.5c-.5 2-1.5 4-3.5 5.5"/>'),
    '🌱': svg('<path d="M12 21v-8"/><path d="M12 13c0-4 3-7 8-7 0 4-3 7-8 7z"/><path d="M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>'),
    '🌳': svg('<circle cx="12" cy="9" r="5.5"/><circle cx="7.5" cy="11.5" r="3"/><circle cx="16.5" cy="11.5" r="3"/><path d="M12 13v8M9.5 21h5"/>'),
    '🌾': svg('<path d="M12 21V6"/><path d="M12 6c-2-.5-3-2-3-4 2 .5 3 2 3 4zM12 6c2-.5 3-2 3-4-2 .5-3 2-3 4z"/><path d="M12 10c-2-.5-3-2-3-4 2 .5 3 2 3 4zM12 10c2-.5 3-2 3-4-2 .5-3 2-3 4z"/><path d="M12 14c-2-.5-3-2-3-4 2 .5 3 2 3 4zM12 14c2-.5 3-2 3-4-2 .5-3 2-3 4z"/>'),
    '🍂': svg('<path d="M6 18C6 9 12 4 20 4c0 8-5 14-12 14"/><path d="M6 18l-2 2M6 18c2-4 5-7 10-9"/>'),
    '❄': svg('<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/><path d="M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2"/>'),
    '☁': svg('<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17.3 9 4.2 4.2 0 0 1 17 18z"/>'),
    '🌤': svg('<circle cx="9" cy="8" r="3.2"/><path d="M9 2.5v1.5M3.5 8H5M4 3.5l1.2 1.2M14 3.5l-1.2 1.2"/><path d="M9 20a3.5 3.5 0 0 1-.4-7A4.6 4.6 0 0 1 17.5 12 3.6 3.6 0 0 1 17 20z"/>'),
    '🌧': svg('<path d="M7 13a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17.3 4 4.2 4.2 0 0 1 17 13z"/><path d="M8 16l-1 2.5M12.5 16l-1 2.5M17 16l-1 2.5"/>'),
    '🌦': svg('<circle cx="9" cy="7" r="3"/><path d="M9 2v1.2M4 7h1.2M4.5 3.5l1 1M13.5 3.5l-1 1"/><path d="M9.5 15a3.2 3.2 0 0 1-.4-6.4 4.3 4.3 0 0 1 8.2-.8 3.4 3.4 0 0 1-.4 7.2z"/><path d="M10 18l-.8 2M14 18l-.8 2M18 18l-.8 2"/>'),
    '⭐‍': svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
    '🌟': svg('<path d="M12 4l1.8 4.6L18.5 10l-4.7 1.4L12 16l-1.8-4.6L5.5 10l4.7-1.4z"/><path d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/><path d="M5.5 2.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/>'),
    '✨': svg('<path d="M12 4l1.5 4 4 1.5-4 1.5L12 15l-1.5-4-4-1.5 4-1.5z"/><path d="M18 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/><path d="M5.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
    '💫': svg('<path d="M12 4l1.5 4 4 1.5-4 1.5L12 15l-1.5-4-4-1.5 4-1.5z"/><path d="M17 16a4 4 0 1 0 3-6.5"/>'),
    '🌀': svg('<path d="M12 12c0-1.5 1.5-2 2.5-1s.5 2.8-1.2 3.7-3.6-.2-4.3-2.3.8-4.5 3.2-5S17 8.5 17.5 12s-2.5 6.3-6.5 6S4.5 14 5 9.5 9.5 3.5 14 4"/>'),
    '🌌': svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M4 15c4-5 8-7 16-7"/><circle cx="8" cy="8" r=".8" fill="currentColor" stroke="none"/><circle cx="15" cy="6.5" r=".6" fill="currentColor" stroke="none"/><circle cx="18" cy="11" r=".8" fill="currentColor" stroke="none"/>'),
    '🔴': svg('<circle cx="12" cy="12" r="8"/>'),
    '🟢': svg('<circle cx="12" cy="12" r="8"/>'),
    '🟡': svg('<circle cx="12" cy="12" r="8"/>'),
    '🟠': svg('<circle cx="12" cy="12" r="8"/>'),
    '🔵': svg('<circle cx="12" cy="12" r="8"/>'),
    '⚪': svg('<circle cx="12" cy="12" r="8"/>'),
    '⚫': svg('<circle cx="12" cy="12" r="8"/>'),
    '🛑': svg('<path d="M8 3.5h8L20.5 8v8L16 20.5H8L3.5 16V8z"/>'),
    '♻': svg('<path d="M8 6l3-3.5L14 6l-3 3.5z" transform="rotate(0 12 12)"/><path d="M4.5 16.5L2 12l3.5-3L8 12.5l-3.5 4zM19.5 16.5L16 12.5l3-3.5 2.5 3.5-2 4z"/><path d="M7 19h10M8.5 6.5H15M5 13l-1.5 6M19 13l1.5 6"/>'),
    '➕': svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    '➖': svg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
    '✕': svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    '✓': svg('<path d="M4.5 12.5l5 5L19.5 7"/>'),
    '✔': svg('<path d="M4.5 12.5l5 5L19.5 7"/>'),
    '✗': svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    '❓': svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 2.2-2.5 3.7"/><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"/>'),
    '❗': svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v6.5"/><circle cx="12" cy="16.8" r=".8" fill="currentColor" stroke="none"/>'),
    '⬆': svg('<path d="M12 20V5M6 11l6-6 6 6"/>'),
    '⬇': svg('<path d="M12 4v15M6 13l6 6 6-6"/>'),
    '➤': svg('<path d="M5 4l15 8-15 8z"/>'),
    '🔀': svg('<path d="M3 6h4l10 12h4"/><path d="M17 14.5l4 3.5-4 3.5M3 18h4l2.5-3M13.5 9L16 6h5"/><path d="M17 2.5l4 3.5-4 3.5"/>'),
    '🔖': svg('<path d="M7 3.5h10V21L12 16.5 7 21z"/>'),
    '📎': svg('<path d="M8 12l6.5-6.5a3.2 3.2 0 0 1 4.5 4.5L10 19a4.6 4.6 0 0 1-6.5-6.5L11 5"/>'),
    '📐': svg('<path d="M4 4v16h16z"/><path d="M4 12l8 8M8 16h3"/>'),
    '📏': svg('<rect x="3" y="9" width="18" height="6" rx="1.5"/><path d="M7 9v2.5M11 9v3.5M15 9v2.5M19 9v3.5" transform="translate(-1 0)"/>'),
    '🖊': svg('<path d="M5 19l1-3.5L15.5 6a1.8 1.8 0 0 1 2.5 2.5L8.5 18z"/><path d="M13.5 8l2.5 2.5"/>'),
    '✎': svg('<path d="M5 19l1-3.5L15.5 6a1.8 1.8 0 0 1 2.5 2.5L8.5 18z"/><path d="M13.5 8l2.5 2.5"/>'),
    '🖌': svg('<path d="M14 3l7 7-8.5 8.5c-2 2-4.5 2.5-6.5 2s-.5-4 1.5-6z"/><path d="M12.5 11.5l2 2"/>'),
    '🎨': svg('<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.5 0 2-.8 2-1.8 0-1.5-1.5-1.7-1.5-3 0-1.2 1-2.2 2.5-2.2h2a4.5 4.5 0 0 0 4.5-4.3C21.5 5.5 17 3.5 12 3.5z"/><circle cx="7.5" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10" r="1.1" fill="currentColor" stroke="none"/>'),
    '⚗': svg('<path d="M10 3h4M11 3v6l-4.5 9A2.4 2.4 0 0 0 8.6 21h6.8a2.4 2.4 0 0 0 2.1-3.5L13 9V3"/><path d="M8 14.5h8"/>'),
    '⚡': svg('<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>'),
    '💥': svg('<path d="M12 3l1.5 4 4-1.5-2 3.5 4 1.5-4 1.5 2 3.5-4-1.5-1.5 4-1.5-4-4 1.5 2-3.5-4-1.5 4-1.5-2-3.5 4 1.5z"/>'),
    '🌪': svg('<path d="M4 6h16M6 10h12M8 14h9M10 18h5M11.5 21h2"/>'),
    '🌈': svg('<path d="M4 18a8 8 0 0 1 16 0"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M10 18a2 2 0 0 1 4 0"/>'),
    '☀': svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19"/>'),
    '🌕': svg('<circle cx="12" cy="12" r="9"/><circle cx="9.5" cy="9.5" r="1.2"/><circle cx="14.5" cy="13" r="1.6"/><circle cx="10" cy="15" r=".9"/>'),
    '🌑': svg('<circle cx="12" cy="12" r="9"/>'),
    '🌓': svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" opacity=".25"/>'),
    '⭐︎': svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
    '☆': svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
    '★': svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
    '✦': svg('<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>'),
    '❖': svg('<path d="M12 3l5 9-5 9-5-9z"/>'),
    '⛩': svg('<path d="M2.5 6.5C7 8 17 8 21.5 6.5"/><path d="M4 9.5h16"/><path d="M6.5 9.5V21M17.5 9.5V21"/><path d="M6.5 13.5h11M9 13.5V17M15 13.5V17"/>'),
    '🗿': svg('<path d="M9 3h6l1.5 6L18 12l-1 9H7l-1-9 1.5-3z"/><circle cx="10" cy="9" r=".8" fill="currentColor" stroke="none"/><circle cx="14" cy="9" r=".8" fill="currentColor" stroke="none"/><path d="M10 14.5h4"/>'),
    '🎭': svg('<path d="M4 4c5 1 11 1 16 0v8c0 5-3.5 8.5-8 8.5S4 17 4 12z"/><circle cx="9" cy="10" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".9" fill="currentColor" stroke="none"/><path d="M8.5 14.5a5 5 0 0 0 7 0"/>'),
    '📿‍': svg('<circle cx="12" cy="12" r="8"/>'),
    '🕉': svg('<circle cx="12" cy="12" r="9"/><path d="M8 9c2-1.5 6-1.5 8 0M8 13c2 2 6 2 8 0M12 6v3M10 16.5c.8 1 3.2 1 4 0"/>'),
    '✡': svg('<path d="M12 3l7.5 13h-15z"/><path d="M12 21L4.5 8h15z"/>'),
    '☸': svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l5 5M13.4 13.4l5 5M18.4 5.6l-5 5M10.6 13.4l-5 5"/>'),
    '♈': svg('<path d="M4 6a4 4 0 0 1 8 0v13M12 6a4 4 0 0 1 8 0"/>'),
    '♉': svg('<circle cx="12" cy="15" r="6"/><path d="M7 11a5 5 0 0 1-2-6M17 11a5 5 0 0 0 2-6"/>'),
    '⛎': svg('<path d="M5 5c0 8 14 8 14 0M5 19c0-8 14-8 14 0"/>'),
    '🀅': svg('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8.5 9h7M12 7.5V16M9.5 16.5h5"/>'),
    '🃏': svg('<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M12 8l1 2.2 2.4.3-1.7 1.7.4 2.3L12 13.4l-2.1 1.1.4-2.3-1.7-1.7 2.4-.3z"/><path d="M9 17.5h6"/>'),
    '🎴': svg('<rect x="5" y="3.5" width="14" height="17" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17.5h8"/>'),
    '🧧‍': svg('<rect x="5" y="3" width="14" height="18" rx="2"/>'),
    '🀇': svg('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h8"/>'),
    '🎍': svg('<path d="M8 4v17M12 2.5V21M16 4v17"/><path d="M6.5 8.5L9.5 7M14.5 7l3 1.5M6.5 13l3-1.5M14.5 11.5l3 1.5"/><path d="M6 21h12"/>'),
    '🎋': svg('<path d="M12 3v18"/><path d="M12 6c-2.5 0-4.5-1-5.5-2.5M12 6c2.5 0 4.5-1 5.5-2.5M12 11c-2.5 0-4.5-1-5.5-2.5M12 11c2.5 0 4.5-1 5.5-2.5"/><path d="M8.5 14.5l-1.8 4M15.5 14l1.8 4"/>'),
    '🏵': svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5a3 3 0 0 1 0 5M12 20.5a3 3 0 0 1 0-5M3.5 12a3 3 0 0 1 5 0M20.5 12a3 3 0 0 1-5 0M6 6a3 3 0 0 1 4 3M18 18a3 3 0 0 1-4-3M18 6a3 3 0 0 0-4 3M6 18a3 3 0 0 0 4-3"/>'),
    '💮': svg('<circle cx="12" cy="12" r="2.5"/><path d="M12 4c1.5 2 1.5 4 0 5.5C10.5 8 10.5 6 12 4zM19 9.5c-.5 2.4-2 3.9-4 4 .5-2.3 1.6-3.6 4-4zM17 18c-2.3.8-4.3.2-5.5-1.5 2.1-1 3.8-.7 5.5 1.5zM7 18c1.7-2.2 3.4-2.5 5.5-1.5C11.3 18.2 9.3 18.8 7 18zM5 9.5c2.4.4 3.5 1.7 4 4-2-.1-3.5-1.6-4-4z"/>'),
    '🉐': svg('<circle cx="12" cy="12" r="9"/><path d="M8 8h8M8 12h8M8 16h8M12 8v8"/>'),
    '㊙': svg('<circle cx="12" cy="12" r="9"/><path d="M9 8c1.5-1 4.5-1 6 0M8 12h8M9.5 15.5c1.5 1 3.5 1 5 0"/>'),
    '🈲': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M7 7l10 10"/>'),
    '🈵': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h8"/>'),
    '🈳': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M10 13h4M8 16.5h8"/>'),
    '⭕': svg('<circle cx="12" cy="12" r="8.5"/>'),
    '💯': svg('<path d="M5 6.5v5M5 6.5L3.8 7.5M5 6.5l1.2 1"/><circle cx="11" cy="9" r="3"/><circle cx="17.5" cy="9" r="3"/><path d="M7 16l10-2" transform="translate(0 3)"/>'),
    '♾': svg('<path d="M8 15.5a3.5 3.5 0 1 1 0-7c3.5 0 4.5 7 8 7a3.5 3.5 0 1 0 0-7c-3.5 0-4.5 7-8 7z"/>'),
    '📓': svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18"/>'),
    '📔': svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18"/><path d="M12 8h4"/>'),
    '📒': svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M5 8h4M5 12h4M5 16h4"/>'),
    '📕': svg('<path d="M6 3h12v18H8a2 2 0 0 1-2-2z"/><path d="M9 7.5h6"/>'),
    '📗': svg('<path d="M6 3h12v18H8a2 2 0 0 1-2-2z"/><path d="M9 7.5h6"/>'),
    '📘': svg('<path d="M6 3h12v18H8a2 2 0 0 1-2-2z"/><path d="M9 7.5h6"/>'),
    '📙': svg('<path d="M6 3h12v18H8a2 2 0 0 1-2-2z"/><path d="M9 7.5h6"/>'),
    '🔏': svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M11 14h2v3h-2z"/>'),
    '🔐': svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="14.5" r="1.1"/><path d="M12 15.5v2"/>'),
    '🔓': svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.5-2"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>'),
    '🖋': svg('<path d="M5 19c2-1 3-2 3.5-4L17 6.5a1.8 1.8 0 0 1 2.5 2.5L11 17.5c-2 .5-3 1.5-4 3.5z" transform="translate(-1 -1)"/><path d="M15 8.5l2.5 2.5"/>'),
    '🖍': svg('<path d="M6 18L14 6l4 4-8 8z"/><path d="M6 18l-1.5 3.5L10 22z" transform="translate(0 -2)"/><path d="M14 6l1.5-1.5a1.5 1.5 0 0 1 2 0l1 1a1.5 1.5 0 0 1 0 2L17 9"/>'),
    '✒': svg('<path d="M5 19c2-1 3-2 3.5-4L17 6.5a1.8 1.8 0 0 1 2.5 2.5L11 17.5c-2 .5-3 1.5-4 3.5z" transform="translate(-1 -1)"/>'),
    '🖋‍': svg('<path d="M6 18L18 6"/>'),
    '🔎': svg('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/><circle cx="10.5" cy="10.5" r="2.5"/>'),
    '🕵': svg('<circle cx="12" cy="9" r="4"/><path d="M6 8.5a6.5 6.5 0 0 1 12 0"/><path d="M5 21c1.5-4 4-6 7-6s5.5 2 7 6"/>'),
    '💼': svg('<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2"/><path d="M3.5 12.5h17"/>'),
    '🗄': svg('<rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M4 9.5h16M4 15h16"/><path d="M10 6.5h4M10 12.5h4M10 18h4"/>'),
    '🗳': svg('<rect x="4" y="11" width="16" height="9" rx="1.5"/><path d="M9 11V5l6 2v4"/><path d="M10 15.5h4"/>'),
    '🏹': svg('<path d="M4 20L18 6"/><path d="M18 6l2-2M18 6l-1 3M18 6l-3 1"/><path d="M4 20c1-2.5 2.5-4 5-4.5"/>'),
    '⚔': svg('<path d="M5 19L17 5l2 2L7 21z"/><path d="M15 5l4 4M7 15l2 2"/><path d="M19 3l2 2-1.5 1.5L18 5z"/>'),
    '🗡': svg('<path d="M6 18L16 4l4 4L10 20z" transform="translate(0 -1)"/><path d="M8 14l2.5 2.5"/><path d="M4 20l2-1-1-1z"/>'),
    '🛠': svg('<path d="M14.5 6.5a4 4 0 0 1 5.3-3.7L17 5.5l1.5 1.5 2.7-2.8a4 4 0 0 1-5.2 5.3L8.5 17a2.1 2.1 0 0 1-3-3z"/><path d="M5 5l4 4" transform="translate(0 0)"/>'),
    '🔧': svg('<path d="M14.5 6.5a4.5 4.5 0 0 1 6-4.2L17.5 5.4l1.1 1.1 3.1-3a4.5 4.5 0 0 1-6.2 6L7 18a2.2 2.2 0 0 1-3.1-3.1z"/>'),
    '🔨': svg('<path d="M13 6l5 5-2 2-5-5z"/><path d="M11 8L4 15l2.5 2.5L13.5 10z" transform="translate(0 1)"/><path d="M13 6l2.5-2.5a2 2 0 0 1 3 0l1 1a2 2 0 0 1 0 3L17 10"/>'),
    '⚒': svg('<path d="M10 6l6 6M14 4l6 6" transform="translate(-1 0)"/><path d="M8 9L4 13l3 3 4-4z" transform="translate(0 2)"/>'),
    '🧰': svg('<rect x="3.5" y="8" width="17" height="11" rx="2"/><path d="M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2"/><path d="M3.5 12.5h17M10 12.5v2h4v-2"/>'),
    '🧲': svg('<path d="M6 4v7a6 6 0 0 0 12 0V4"/><path d="M6 4h4v4H6zM14 4h4v4h-4z"/>'),
    '⚙️': svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'),
    '🦠': svg('<circle cx="12" cy="12" r="5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M18.4 5.6l-2 2M7.6 16.4l-2 2"/><circle cx="10.5" cy="11" r=".8" fill="currentColor" stroke="none"/><circle cx="13.5" cy="13.5" r=".8" fill="currentColor" stroke="none"/>'),
    '🧫': svg('<circle cx="12" cy="12" r="8.5"/><circle cx="9.5" cy="10" r="1.4"/><circle cx="14.5" cy="13.5" r="1.8"/><circle cx="10" cy="15" r="1"/>'),
    '🧯': svg('<path d="M9 8h6v13H9z"/><path d="M10.5 8V5.5h3V8"/><path d="M12 5.5V3.5H8L6.5 5"/><path d="M9 12h6"/>'),
    '🚒': svg('<path d="M3 17V9h11v8"/><path d="M14 12h4l3 3v2h-7"/><circle cx="7" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/><path d="M5 9l4-4.5L17 8"/>'),
    '🚑': svg('<path d="M3 16V8h11v8"/><path d="M14 11h4l3 3v2h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/><path d="M8.5 10.5v4M6.5 12.5h4"/>'),
    '🚗': svg('<path d="M5 12l1.5-4.5h11L19 12"/><rect x="4" y="12" width="16" height="5" rx="1.5"/><circle cx="7.5" cy="18.5" r="1.6"/><circle cx="16.5" cy="18.5" r="1.6"/><circle cx="7.5" cy="14.5" r=".7" fill="currentColor" stroke="none"/><circle cx="16.5" cy="14.5" r=".7" fill="currentColor" stroke="none"/>'),
    '🚕': svg('<path d="M5 12l1.5-4.5h11L19 12"/><rect x="4" y="12" width="16" height="5" rx="1.5"/><circle cx="7.5" cy="18.5" r="1.6"/><circle cx="16.5" cy="18.5" r="1.6"/><path d="M10 7.5V5.5h4v2"/>'),
    '✈': svg('<path d="M10.5 13.5L3 11l2-2 7.5 1 5-5.5a1.8 1.8 0 0 1 2.5 2.5l-5.5 5 1 7.5-2 2z"/><path d="M10.5 13.5L7 21l-1.5-4.5z" transform="translate(2 -3)"/>'),
    '🚢': svg('<path d="M4 15h16l-2 5H6z"/><path d="M7 15V9h10v6"/><path d="M10 9V5.5h4V9M12 5.5V3.5"/>'),
    '🚲': svg('<circle cx="6" cy="16.5" r="3.5"/><circle cx="18" cy="16.5" r="3.5"/><path d="M6 16.5L10 9h5M10 9L8.5 6.5H11M15 9l3 7.5M12 16.5L15 9"/>'),
    '🛵': svg('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-6h4l2 6M13 11V8h3"/>'),
    '🏍': svg('<circle cx="6" cy="16.5" r="3.5"/><circle cx="18" cy="16.5" r="3.5"/><path d="M6 16.5l3.5-6H14l2 3 2 3M14 10.5V8h2.5"/>'),
    '🚌': svg('<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M4 10.5h16M9 5v5.5M15 5v5.5"/><circle cx="8" cy="18.5" r="1.5"/><circle cx="16" cy="18.5" r="1.5"/>'),
    '🚆': svg('<rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 10h12M9.5 14h.8M13.7 14h.8"/><path d="M8.5 16.5L7 20M15.5 16.5L17 20M9 20h6"/>'),
    '✈️': svg('<path d="M10.5 13.5L3 11l2-2 7.5 1 5-5.5a1.8 1.8 0 0 1 2.5 2.5l-5.5 5 1 7.5-2 2z"/>'),
    '🏠‍': svg('<path d="M3 10.5 12 3l9 7.5"/>'),
    '🏡': svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/><path d="M16 4.5V7l3 2.5V4.5z" transform="translate(-2 -1)"/>'),
    '🏫': svg('<rect x="4" y="8" width="16" height="12" rx="1"/><path d="M4 8l8-4.5L20 8"/><circle cx="12" cy="11" r="1.8"/><path d="M8 20v-4h2.5v4M13.5 20v-4H16v4"/>'),
    '🏨': svg('<rect x="4" y="4" width="16" height="17" rx="1.5"/><path d="M8 8h2.5M13.5 8H16M8 12h2.5M13.5 12H16"/><path d="M10 21v-4h4v4"/>'),
    '⛪': svg('<path d="M4 12l8-7 8 7"/><path d="M6 11v9h12v-9"/><path d="M12 6.5v4M10 8.5h4"/><path d="M10 20v-4h4v4"/>'),
    '🕌': svg('<path d="M12 3c2.5 2 4 4 4 6.5V20H8V9.5C8 7 9.5 5 12 3z"/><path d="M4 20V9l1.5-2L7 9v11M17 20V9l1.5-2L20 9v11M2.5 20h19"/>'),
    '🛕': svg('<path d="M12 3l6 7H6z"/><path d="M7 10h10l1.5 10h-13z"/><path d="M10.5 20v-4h3v4"/>'),
    '⛲': svg('<path d="M5 15h14v4H5z"/><path d="M12 15V8"/><path d="M12 8c-1.5-1-1.5-2.5 0-3.5 1.5 1 1.5 2.5 0 3.5z"/><path d="M8.5 12c-1.2-1-1.2-2.2 0-3M15.5 12c1.2-1 1.2-2.2 0-3"/><path d="M3.5 21h17"/>'),
    '🎠': svg('<path d="M4 8l8-4.5L20 8"/><path d="M5 8v.8c2 1.2 4 1.2 6 0V8M13 8v.8c2 1.2 4 1.2 6 0V8"/><path d="M12 3.5V8M8 20v-8M16 20v-8"/><path d="M6 20h12"/>'),
    '🎡': svg('<circle cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="1.2"/><path d="M12 3v3M12 16v3M4 11h3M17 11h3M6.3 5.3l2.2 2.2M15.5 15.5l2.2 2.2M17.7 5.3l-2.2 2.2M8.5 15.5l-2.2 2.2"/><path d="M8 21l4-7 4 7z" fill="none"/>'),
    '🎢': svg('<path d="M3 20V8a4 4 0 0 1 8 0v6a3.5 3.5 0 0 0 7 0V9a3 3 0 0 1 6 0v11"/><path d="M3 20h21"/>'),
    '🗼': svg('<path d="M9 3h6l1 8h-8z"/><path d="M8 11l-3 10M16 11l3 10M6.5 17h11M12 3V1.5"/>'),
    '🗽': svg('<circle cx="12" cy="6" r="2"/><path d="M9 21V9l3-1 3 1v12"/><path d="M9 11L5 8M15 10l3-4"/><path d="M17.5 5l.5-1.5M7 21h10"/>'),
    '🌉': svg('<path d="M3 17h18M5 17V8M19 17V8"/><path d="M5 8h14"/><path d="M5 8c2 3 4.5 4.5 7 4.5S17 11 19 8"/><path d="M8 17v-3.5M12 17v-4M16 17v-3.5"/>'),
    '🌁': svg('<path d="M4 18V7l4-2.5L12 7l4-2.5L20 7v11"/><path d="M3 14c3-1.5 6-1.5 9 0s6 1.5 9 0M3 17.5c3-1.5 6-1.5 9 0s6 1.5 9 0"/>'),
    '🏞': svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-6 4 4 3-3 6 5"/><circle cx="8" cy="8" r="1.4"/>'),
    '🖼️': svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4.5 3 3L15 12l5.5 5.5"/>'),
    '🌄': svg('<circle cx="9" cy="8" r="2.5"/><path d="M3 20l6-8 4 5 3-3.5L21 20z"/>'),
    '🌅': svg('<circle cx="12" cy="12" r="3.5"/><path d="M12 5.5v2M5.6 8.6l1.5 1.5M18.4 8.6l-1.5 1.5"/><path d="M3 17h18M6 20h12M9 15.5h6"/>'),
    '🌃': svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 20V12l4-2v10M9 20V8l5-2v14M16 20v-9l5-2v11"/><circle cx="17" cy="7" r="1.2"/>'),
    '🏙': svg('<rect x="4" y="8" width="6" height="13"/><rect x="11" y="4" width="6" height="17"/><rect x="18" y="10" width="4" height="11" transform="translate(-2 0)"/><path d="M6 11h2M6 14h2M13 7h2M13 10h2M13 13h2M16 13h2M16 16h2"/>'),
    '🌇': svg('<circle cx="12" cy="13" r="3"/><path d="M12 7v2M6 10l1.4 1.4M18 10l-1.4 1.4"/><path d="M3 20V12h4v8M17 20v-6h4v6M7 20v-4h10v4"/>'),
    '🌆': svg('<path d="M3 20V9h5v11M8 20V5h6v15M14 20v-9h7v9"/><circle cx="17.5" cy="6" r="1.6"/><path d="M10 8h1.5M10 11h1.5M16.5 14h1M16.5 17h1"/>'),
    '⛺': svg('<path d="M12 4L3 20h18z"/><path d="M12 11l-3.5 9h7z"/><path d="M3 20l-1 1.5M21 20l1 1.5" transform="translate(0 -1.5)"/>'),
    '🏕': svg('<path d="M12 5L4 19h16z"/><path d="M12 11l-3 8h6z"/><circle cx="18.5" cy="7" r="1.6"/><path d="M18.5 3.5v1M15.5 7h1M21 7h-.9"/>'),
    '🛖': svg('<path d="M4 11l8-6.5L20 11"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-4.5h4V20"/><path d="M12 4.5V2.5"/>'),
    '🏗': svg('<path d="M4 21V9l8-5v17"/><path d="M12 9h8M12 13h6M12 17h8"/><path d="M20 9v12M4 21h17"/>'),
    '🏭': svg('<path d="M4 21V10l5 3.5V10l5 3.5V6h3v15z"/><path d="M17 6V3h2v3"/><path d="M3 21h18"/>'),
    '🏦': svg('<path d="M3 9l9-5.5L21 9"/><path d="M4 9.5h16"/><path d="M6 9.5V18M10 9.5V18M14 9.5V18M18 9.5V18"/><path d="M3.5 21h17M5 18h14"/><path d="M11 5.5h2"/>'),
    '🏤': svg('<rect x="4" y="6" width="16" height="15" rx="1.5"/><path d="M4 6l8-3.5L20 6"/><path d="M12 10v4M10 12h4" transform="translate(0 1)"/><path d="M9 21v-3.5h6V21"/>'),
    '🏣': svg('<rect x="4" y="6" width="16" height="15" rx="1.5"/><path d="M4 6l8-3.5L20 6"/><path d="M11 9.5h2M10 11.5h4"/><path d="M9 21v-3.5h6V21"/>'),
    '💒': svg('<path d="M4 12l8-7 8 7"/><path d="M6 11v9h12v-9"/><path d="M12 9.5c-1-1.2-2.8-.5-2.8.8 0 1.2 1.6 2.2 2.8 3 1.2-.8 2.8-1.8 2.8-3 0-1.3-1.8-2-2.8-.8z"/><path d="M10 20v-3h4v3"/>'),
    '⛩️': svg('<path d="M2.5 6.5C7 8 17 8 21.5 6.5"/><path d="M4 9.5h16"/><path d="M6.5 9.5V21M17.5 9.5V21"/><path d="M6.5 13.5h11M9 13.5V17M15 13.5V17"/>'),
    '🕍': svg('<rect x="5" y="8" width="14" height="13"/><path d="M5 8l7-5 7 5"/><path d="M12 11l2.5 4.5h-5zM12 17.5L9.5 13h5z"/><path d="M3.5 21h17"/>'),
    '📿︎': svg('<circle cx="12" cy="12" r="8"/>'),
    '🛐': svg('<circle cx="12" cy="12" r="9"/><path d="M8 15.5a4 4 0 0 1 8 0M12 6.5v3M9.5 8L12 6l2.5 2"/>'),
    '☮': svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 12l-6 7M12 12l6 7"/>'),
    '☯️': svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>'),
    '⚛': svg('<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="9" ry="3.8"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)"/>'),
    '🆔': svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9.5v5M9.5 9.5v5M9.5 9.5c3-.8 3 5.8 0 5"/><path d="M14 9.5h4M14 12h4M14 14.5h2.5"/>'),
    '⚠️': svg('<path d="M12 3.5L22 20H2z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"/>'),
    '🚸': svg('<path d="M12 3.5L22 20H2z"/><circle cx="10" cy="11" r="1.2"/><path d="M10 12.5V17M10 14l3 1.5V18M13 12.8l1.5-1"/><circle cx="14" cy="10" r="1.1"/>'),
    '⛔': svg('<circle cx="12" cy="12" r="9"/><path d="M6.5 12h11"/>'),
    '🚫': svg('<circle cx="12" cy="12" r="9"/><path d="M5.8 5.8l12.4 12.4"/>'),
    '🚳': svg('<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="14.5" r="2.2"/><circle cx="15.5" cy="14.5" r="2.2"/><path d="M8.5 14.5L11 10h3M11 10l-1-1.6M14 10l1.5 4.5"/>'),
    '🚷': svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="8" r="1.6"/><path d="M12 10v4M12 12l-2.5 1.5M12 14l-2 4M12 14l2 4M12 12l2.5 1.5"/><path d="M5.5 5.5l13 13"/>'),
    '🚯': svg('<circle cx="12" cy="12" r="9"/><path d="M9 9l1 5h4l1-5M10 14l-1 4M14 14l1 4" transform="translate(0 -1)"/><path d="M5.5 5.5l13 13"/>'),
    '🚱': svg('<circle cx="12" cy="12" r="9"/><path d="M12 7s3.5 4 3.5 6.3a3.5 3.5 0 0 1-7 0C8.5 11 12 7 12 7z"/><path d="M5.5 5.5l13 13"/>'),
    '🔞': svg('<circle cx="12" cy="12" r="9"/><path d="M7.5 10v4M7.5 10L6.3 11M15 10a1.7 1.7 0 0 1 3.4 0c0 1.3-1.5 1.8-3.4 2.4V14h3.4" transform="translate(-1 0)"/><path d="M5.5 5.5l13 13"/>'),
    '📵': svg('<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4.5 4.5l15 15"/><circle cx="12" cy="17.5" r=".8" fill="currentColor" stroke="none"/>'),
    '🔇': svg('<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    '🔉': svg('<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="M16 9.5a4 4 0 0 1 0 5"/>'),
    '📳': svg('<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M5 9c-1 2-1 4 0 6M19 9c1 2 1 4 0 6"/><circle cx="12" cy="17.5" r=".8" fill="currentColor" stroke="none"/>'),
    '📴': svg('<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4.5 4.5l15 15"/>'),
    '🔕': svg('<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2.5h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/><path d="M4.5 4.5l15 15"/>'),
    '🔆': svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>'),
    '🔅': svg('<circle cx="12" cy="12" r="4"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4"/>'),
    '🆚': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 9l2 6 2-6M13.5 9h2.5a1.75 1.75 0 0 1 0 3.5H14l2.5 2.5"/>'),
    '🆙': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M12 15V9M9 11.5L12 8.5l3 3"/>'),
    '🆒': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M11 9.5a2.5 2.5 0 1 0 0 5M15.5 9.5a2.5 2.5 0 1 0 0 5"/>'),
    '🆕': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M8 15V9l5 6V9M16.5 9v6M16.5 9h2.5M16.5 12h2M16.5 15h2.5" transform="translate(-1.5 0)"/>'),
    '🆓': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 15V9h3M7 12h2.5M12 15V9h3M17 15v-2a1.5 1.5 0 0 1 3 0v2M17 15v-2h3v2"/>'),
    '🔠': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M8 15l2-6 2 6M8.8 13h2.4M15 15V9h2.5M15 12h2"/>'),
    '🔡': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 14.5l2-5 2 5M7.7 13h2.6M15 14.5v-5h2.5M15 12h2"/>'),
    '🔤': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M6.5 15l1.8-6 1.8 6M7.2 13h2.2M12 15V9M12 12h2.5a1.75 1.75 0 0 0 0-3.5H12M16.5 15V9h2.5"/>'),
    '🔣': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7.5 10a2 2 0 1 0 0 4M10.5 10a2 2 0 1 1 0 4M13.5 10l3 4M16.5 10l-3 4" transform="translate(.5 0)"/>'),
    '🈁': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M8 9.5v5M8 9.5h5M10.5 9.5L15 14.5M11.5 12.5L9.5 14.5"/>'),
    '🈂': svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M9 9.5h6M12 9.5v5.5M9.5 12.5h5"/>'),
    '🈷': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 8h6M9 8v8M9 12h6M15 8v8"/>'),
    '🈶': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8.5h8M9 11.5h6M9 11.5V17M9 14h6M15 11.5V17"/>'),
    '🈯': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8l4 3-4 3-4-3zM9.5 14.5V17"/>'),
    '🉑': svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 9.5h7M12 9.5v6M9.5 12.5h5"/>'),
    '🈸': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8.5h8M12 8.5V17M9 11.5h6M9.5 14.5h5"/>'),
    '🈴': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9c1.5-1.5 6.5-1.5 8 0M9.5 11.5h5M9.5 11.5V17h5v-5.5"/>'),
    '🈺': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 7.5v1.5M8 10.5h8M9.5 13h5M9.5 13v4h5v-4"/>'),
    '㊗': svg('<circle cx="12" cy="12" r="9"/><path d="M9 8.5h6M12 8.5V16M9.5 11.5c1.5-1 3.5-1 5 0"/>'),
    '🈚': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8.5h8M12 8.5v8M9 12h6M9.5 15.5h5"/>'),
    '🈗': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 8h6M9 8v4M15 8v4M8 15.5h8"/>'),
    '🈙': svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 8.5c1.5-1 4.5-1 6 0M9 12h6M9.5 15.5c1.5 1 3.5 1 5 0"/>'),
    '🈚‍': svg('<rect x="4" y="4" width="16" height="16" rx="2"/>'),
    '🔰': svg('<path d="M9 4h6l3 8-6 8-6-8z"/><path d="M12 4v4M9.5 16.5c1.5-1.5 3.5-1.5 5 0" transform="translate(0 -1)"/>'),
    '⛩︎': svg('<path d="M4 9.5h16"/><path d="M6.5 9.5V21M17.5 9.5V21"/>'),
    '🏮︎': svg('<ellipse cx="12" cy="12" rx="7" ry="8"/>'),
    '📿​': svg('<circle cx="12" cy="12" r="8"/>'),
  };

  // 归一化：去掉 emoji 后的 VS16/ZWJ 变体
  function norm(s) {
    return s.replace(/️/g, '').replace(/‍/g, '').trim();
  }
  // 建立归一化索引
  var LOOKUP = {};
  Object.keys(ICONS).forEach(function (k) { LOOKUP[norm(k)] = ICONS[k]; });

  var SKIP_TAGS = { OPTION: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, NOSCRIPT: 1 };
  var EMOJI_CLUSTER = /^[\p{Extended_Pictographic}\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D\s]{1,12}$/u;

  function isPureEmojiEl(el) {
    if (!el || el.nodeType !== 1) return false;
    if (SKIP_TAGS[el.tagName]) return false;
    if (el.dataset && el.dataset.mlIconDone) return false;
    if (el.closest && el.closest('[data-emoji-keep]')) return false;
    if (el.querySelector('svg,img,video,canvas,iframe')) return false;
    if (el.children.length > 3) return false; // 纯图标容器不应有大量子元素
    var t = (el.textContent || '').trim();
    if (!t || t.length > 12) return false;
    if (!EMOJI_CLUSTER.test(t)) return false;
    var key = norm(t);
    // 单 emoji 或同一 emoji 重复（如 ⭐⭐⭐ 保留给评分场景——不替换多簇）
    if (LOOKUP[key]) return key;
    return false;
  }

  function swapEl(el, key) {
    var span = document.createElement('span');
    span.className = 'ml-is';
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', key);
    span.innerHTML = LOOKUP[key];
    el.textContent = '';
    el.appendChild(span);
    if (el.dataset) el.dataset.mlIconDone = '1';
  }

  function injectStyle() {
    if (document.getElementById('mlIconSwapStyle')) return;
    var st = document.createElement('style');
    st.id = 'mlIconSwapStyle';
    st.textContent = '.ml-is{display:inline-flex;width:1em;height:1em;vertical-align:-0.12em;line-height:0}' +
      '.ml-is svg{width:100%;height:100%;display:block}';
    document.head.appendChild(st);
  }

  var swept = 0;
  function sweep(root) {
    var all = (root || document).querySelectorAll('span,div,i,em,b,a,button,li,td,th,h1,h2,h3,h4,h5,h6,p,label,summary,figcaption,dt,dd');
    all.forEach(function (el) {
      var key = isPureEmojiEl(el);
      if (key) { swapEl(el, key); swept++; }
    });
  }

  function boot() {
    injectStyle();
    sweep(document);
    // 动态内容：MutationObserver（防抖 300ms，跳过自身插入的 .ml-is）
    var timer = null;
    var obs = new MutationObserver(function (muts) {
      var need = false;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.addedNodes && m.addedNodes.length) {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType === 1 && !(n.classList && n.classList.contains('ml-is')) && !n.dataset.mlIconDone) { need = true; break; }
          }
        }
        if (need) break;
      }
      if (need) {
        clearTimeout(timer);
        timer = setTimeout(function () { sweep(document); }, 300);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.ML_ICON_SWEPT = function () { return swept; };
})();
