const {
  getLeadLinks,
  getMiniProgramLinks,
  getSiteConfig
} = require("../../utils/content");

Page({
  data: {
    site: getSiteConfig(),
    leadLinks: getLeadLinks(),
    miniProgramLinks: getMiniProgramLinks()
  },

  callHost() {
    const phoneNumber = this.data.site.contact.phone;
    if (!phoneNumber) {
      wx.showToast({ title: "电话未配置", icon: "none" });
      return;
    }
    wx.makePhoneCall({ phoneNumber });
  },

  copyWechat() {
    this.copyText(this.data.site.contact.wechatId, "微信号已复制");
  },

  copyAddress() {
    this.copyText(this.data.site.address, "地址已复制");
  },

  copyLeadLink(event) {
    const link = this.findItem(this.data.leadLinks, event.currentTarget.dataset.id);
    if (!link) {
      wx.showToast({ title: "入口未配置", icon: "none" });
      return;
    }
    this.copyText(link.value, "链接已复制");
  },

  openMiniProgram(event) {
    const link = this.findItem(this.data.miniProgramLinks, event.currentTarget.dataset.id);
    if (!link || !link.appId) {
      wx.showToast({ title: "小程序未配置", icon: "none" });
      return;
    }

    wx.navigateToMiniProgram({
      appId: link.appId,
      path: link.path || "",
      fail: () => {
        wx.showToast({ title: "暂时无法跳转", icon: "none" });
      }
    });
  },

  findItem(items, id) {
    return items.find((item) => item.id === id);
  },

  copyText(value, successTitle) {
    if (!value) {
      wx.showToast({ title: "内容未配置", icon: "none" });
      return;
    }
    wx.setClipboardData({
      data: value,
      success: () => wx.showToast({ title: successTitle, icon: "success" })
    });
  }
});
