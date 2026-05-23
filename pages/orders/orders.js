const { cancelOrder, listOrders } = require("../../utils/orders");

Page({
  data: {
    orders: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({ orders: listOrders() });
  },

  cancel(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "取消订单",
      content: "确认取消这笔预订吗？",
      success: (res) => {
        if (res.confirm) {
          cancelOrder(id);
          this.refresh();
        }
      }
    });
  },

  goHome() {
    wx.reLaunch({ url: "/pages/home/home" });
  },

  contact(event) {
    wx.showToast({
      title: `请联系管家确认 ${event.currentTarget.dataset.id}`,
      icon: "none"
    });
  }
});
