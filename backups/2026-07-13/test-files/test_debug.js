const GUA_ORDER_HOUTIAN = ['坎','艮','震','巽','离','坤','兑','乾'];
const GUA_TO_DIR_BAGUA = {
  '坎':'北','艮':'东北','震':'东','巽':'东南','离':'南','坤':'西南','兑':'西','乾':'西北'
};
function _getGuasFromThis(gua) {
  var idx = GUA_ORDER_HOUTIAN.indexOf(gua);
  if (idx < 0) return GUA_ORDER_HOUTIAN.slice();
  var result = [];
  for (var i = 0; i < 8; i++) {
    result.push(GUA_ORDER_HOUTIAN[(idx + i) % 8]);
  }
  return result;
}
console.log('乾起:', _getGuasFromThis('乾'));
console.log('离起:', _getGuasFromThis('离'));
