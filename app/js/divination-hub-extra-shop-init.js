// shop-data.js 加载后再次初始化
if (typeof window.SHOP_DATA !== 'undefined') {
  setTimeout(function() { renderShopProducts(); }, 100);
}