const {
  getHomeGallerySections,
  getHomestays,
  getSellingPoints,
  getShareConfig,
  getSiteConfig
} = require("../../utils/content");

Page({
  data: {
    site: getSiteConfig(),
    gallerySections: getHomeGallerySections(),
    sellingPoints: getSellingPoints(),
    rooms: []
  },

  onLoad() {
    this.setData({ rooms: getHomestays() });
  },

  onShareAppMessage() {
    const share = getShareConfig();
    return {
      title: share.title,
      path: share.path,
      imageUrl: share.imageUrl
    };
  },

  goContact() {
    wx.navigateTo({ url: "/pages/contact/contact" });
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` });
  }
});
