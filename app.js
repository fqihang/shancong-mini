App({
  globalData: {
    brandName: "山野栖居",
    servicePhone: "13800138000"
  },

  onLaunch() {
    const orders = wx.getStorageSync("homestay_orders");
    if (!Array.isArray(orders)) {
      wx.setStorageSync("homestay_orders", []);
    }
  }
});
