# 优惠券与支付流程打通 - 2026-06-21

## 目标
将已有优惠券系统与下单支付流程集成，解决「优惠券可领但下单时无法使用」的关键体验缺口。

## 完成内容

### 1. 后端 - 支付接口优惠券折扣计算
**文件**: `backend/routes/pay.js`
- `/pay/create` 接口新增 `coupon_code` 参数
- 接收到优惠码后，自动查询优惠券库验证有效性（状态、过期、限额、最低金额）
- 计算 discountAmount（fixed: 固定减免 / percent: 百分比折扣 + max_discount 上限）
- 订单记录新增 `original_amount`、`discount_amount`、`coupon_code`、`coupon_info` 字段
- 全额减免场景（finalAmount ≤ 0）: 订单自动标记 `paid`（payment_method=coupon_free），发送免单通知

### 2. 后端 - 订单创建接口优惠券字段
**文件**: `backend/routes/orders.js`
- `/orders` POST 接口新增接收 `coupon_code`、`coupon_id`、`discount_amount`、`original_amount`
- 订单记录保存优惠券完整信息

### 3. 小程序 - 甲方产品下单表单（client-detail）
**文件**: `miniprogram/pages/client-detail/client-detail.js` + `.wxml` + `.wxss`
- 下单表单新增优惠券码输入框 + 验证按钮
- 新增「选择我的优惠券」按钮 → 弹窗加载用户可用优惠券（`/coupons/my?openid=xxx&status=unused`）
- 优惠券选择弹窗（底部弹出），展示券面值、名称、条件、有效期
- 价格明细区：原价 → 优惠减免 → 实付金额
- `buyNow()` 传递 `coupon_code` 到 `/pay/create`
- `_handleMockPay()` 处理 `mode=free` 免单场景
- 验证结果实时展示（✅ 有效 / ❌ 无效）

### 4. 小程序 - 订单列表/详情展示优惠券信息
**文件**: `miniprogram/pages/orders/orders.wxml` + `.wxss`
- 订单卡片：有优惠时显示原价（删除线样式）
- 订单详情弹窗：新增原价、优惠减免、优惠券码行

### 5. README 更新
新增 ✅ 优惠券与支付流程打通条目

## 关键设计决策
- 优惠券折扣在 `/pay/create` 服务端计算（而非前端传折扣金额），防止客户端篡改
- 全额减免订单自动标记 paid，不走微信支付流程
- client-detail 和 product-detail 两条下单路径都支持优惠券（product-detail 已有，本次补齐 client-detail）

## 待后续推进
- 管理后台订单管理显示优惠券信息
- 优惠券领取后在下单页自动推荐匹配券
- 下单成功后自动标记用户优惠券为已使用（目前仅 increment used_count）
