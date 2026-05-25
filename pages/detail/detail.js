const {
  getHomestayById,
  getSiteConfig
} = require("../../utils/content");

Page({
  data: {
    room: null,
    site: getSiteConfig()
  },

  onLoad(options) {
    const room = getHomestayById(options.id);
    if (!room) {
      wx.showToast({ title: "房间不存在", icon: "none" });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.setData({ room });
  },

  previewImage(event) {
    wx.previewImage({
      current: event.currentTarget.dataset.src,
      urls: this.data.room.images
    });
  },

  callHost() {
    wx.makePhoneCall({ phoneNumber: this.data.site.contact.phone });
  },

  goContact() {
    wx.navigateTo({ url: "/pages/contact/contact" });
  }
});
