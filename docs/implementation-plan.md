# 民宿展示与预订小程序实施方案

## 目标

先做一个可提审、可运营、可扩展的民宿直订小程序，而不是复制 OTA 全功能。第一阶段目标是验证自有房源的展示、询价、预订提交和订单履约。

## 用户路径

1. 用户进入首页，按目的地、风格、日期、人数筛选房源。
2. 用户进入房源详情，查看图集、设施、亮点、入住须知和费用估算。
3. 用户填写联系人、手机号、预计到店时间和备注，提交预订。
4. 管家确认库存和价格，用户支付。
5. 用户在订单页查看状态，必要时取消或联系管家。

## MVP 功能范围

### C 端小程序

- 首页推荐与筛选
- 房源详情
- 预订确认
- 我的订单
- 客服/电话咨询
- 隐私协议弹窗与授权确认

### 管理端

- 房源上下架
- 房型、容量、设施、图集维护
- 价格日历与库存维护
- 订单确认、取消、退款
- 入住规则和售后规则配置

## 推荐数据模型

### homestays

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 房源 ID |
| `name` | string | 房源名称 |
| `city` | string | 城市 |
| `area` | string | 区域 |
| `address` | string | 详细地址 |
| `cover` | string | 封面图 |
| `images` | string[] | 图集 |
| `capacity` | number | 最大入住人数 |
| `basePrice` | number | 基础价 |
| `amenities` | string[] | 设施 |
| `policies` | string[] | 入住须知 |
| `status` | string | `draft` / `online` / `offline` |

### rate_calendars

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 日历 ID |
| `homestayId` | string | 房源 ID |
| `date` | string | 日期，格式 `YYYY-MM-DD` |
| `price` | number | 当日价格 |
| `stock` | number | 可售库存 |
| `minNights` | number | 最少入住晚数 |
| `closed` | boolean | 是否关房 |

### orders

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 订单 ID |
| `openid` | string | 微信用户标识 |
| `homestayId` | string | 房源 ID |
| `checkIn` | string | 入住日期 |
| `checkOut` | string | 离店日期 |
| `nights` | number | 晚数 |
| `guests` | number | 入住人数 |
| `contactName` | string | 联系人 |
| `phone` | string | 手机号 |
| `priceSnapshot` | object | 下单时价格快照 |
| `amount` | number | 应付金额，单位分 |
| `status` | string | `pending_confirm` / `pending_pay` / `paid` / `cancelled` / `refunding` / `completed` |
| `expireAt` | number | 支付超时时间 |

## 云函数/API

- `listHomestays`：查询在线房源，支持城市、日期、人数筛选。
- `getHomestayDetail`：读取房源详情和未来可订日历。
- `createOrder`：校验库存、锁定库存、写入订单价格快照。
- `createPayment`：服务端调用微信支付，返回小程序支付参数。
- `handlePayNotify`：支付回调验签，更新订单为已支付。
- `cancelOrder`：按规则取消订单并释放库存。
- `requestRefund`：发起退款并更新售后状态。

## 支付链路

1. 小程序提交预订到服务端。
2. 服务端校验库存和价格，创建订单。
3. 服务端调用微信支付接口创建支付单。
4. 小程序拿到服务端返回的支付参数后调用 `wx.requestPayment`。
5. 支付结果以服务端回调为准，小程序前端只做结果展示。

## 合规清单

- 使用真实经营主体，服务类目与住宿业务一致。
- 小程序后台配置用户隐私保护指引。
- 下单页展示取消、退款、押金、发票、入住核验规则。
- 收集手机号、入住人信息、定位、相册上传时，先完成隐私声明和授权。
- 图片、域名、支付商户号、客服能力、备案信息在提审前完成配置。

## 里程碑

### 第 1 周：MVP 原型

- 完成当前原生小程序页面。
- 明确房源字段、订单状态、取消规则。
- 使用 mock 数据验证核心交互。

### 第 2 周：云开发接入

- 云数据库集合和权限设计。
- 云函数读写房源、日历和订单。
- 管理端最小能力：房源维护、订单确认。

### 第 3 周：支付和库存

- 接入微信支付。
- 订单超时释放库存。
- 支付回调、取消、退款状态流转。

### 第 4 周：提审与试运营

- 配置合法域名、隐私协议、服务类目和备案。
- 补齐客服入口、规则文案、错误态。
- 选择 3 到 5 套真实房源灰度试运营。

## 参考资料

- [微信开放文档：wx.requestPayment](https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html)
- [微信开放文档：云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [微信开放文档：授权](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html)
- [微信开放文档：运营规范](https://developers.weixin.qq.com/miniprogram/product/)
