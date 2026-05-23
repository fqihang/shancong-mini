Page({
  data: {
    checklist: [
      {
        title: "主体与类目",
        desc: "使用企业或个体工商户主体，服务类目按住宿/旅游服务方向准备资质。"
      },
      {
        title: "真实房源",
        desc: "房源名称、图片、地址、价格、入住规则需要与实际经营一致。"
      },
      {
        title: "隐私合规",
        desc: "手机号、入住人信息、定位、客服消息等能力需在用户隐私保护指引中声明。"
      },
      {
        title: "支付闭环",
        desc: "服务端创建订单并生成微信支付参数，小程序端只调起 wx.requestPayment。"
      },
      {
        title: "售后规则",
        desc: "明确取消、退款、押金、发票、不可抗力和到店核验流程。"
      }
    ]
  },

  callService() {
    wx.makePhoneCall({ phoneNumber: getApp().globalData.servicePhone });
  }
});
