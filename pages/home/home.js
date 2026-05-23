const { addDays, defaultStay, formatDate } = require("../../utils/date");
const { getCities, getHomestays, getTypes } = require("../../utils/homestays");

Page({
  data: {
    query: "",
    activeCity: "全部",
    activeType: "全部",
    cityTabs: [],
    typeTabs: [],
    checkIn: "",
    checkOut: "",
    guests: 2,
    homestays: [],
    filteredHomestays: []
  },

  onLoad() {
    const stay = defaultStay();
    const homestays = getHomestays();
    this.setData({
      cityTabs: getCities(),
      typeTabs: getTypes(),
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      homestays,
      filteredHomestays: homestays
    });
  },

  onSearchInput(event) {
    this.setData({ query: event.detail.value }, () => this.filterHomestays());
  },

  clearSearch() {
    this.setData({ query: "" }, () => this.filterHomestays());
  },

  changeCity(event) {
    this.setData({ activeCity: event.currentTarget.dataset.city }, () => this.filterHomestays());
  },

  changeType(event) {
    this.setData({ activeType: event.currentTarget.dataset.type }, () => this.filterHomestays());
  },

  onCheckInChange(event) {
    const checkIn = event.detail.value;
    const checkOut = this.data.checkOut <= checkIn ? formatDate(addDays(checkIn, 1)) : this.data.checkOut;
    this.setData({ checkIn, checkOut });
  },

  onCheckOutChange(event) {
    if (event.detail.value <= this.data.checkIn) {
      wx.showToast({ title: "离店日期需晚于入住日期", icon: "none" });
      this.setData({ checkOut: formatDate(addDays(this.data.checkIn, 1)) });
      return;
    }
    this.setData({ checkOut: event.detail.value });
  },

  decreaseGuests() {
    this.setData({ guests: Math.max(1, this.data.guests - 1) }, () => this.filterHomestays());
  },

  increaseGuests() {
    this.setData({ guests: Math.min(12, this.data.guests + 1) }, () => this.filterHomestays());
  },

  filterHomestays() {
    const keyword = this.data.query.trim().toLowerCase();
    const filteredHomestays = this.data.homestays.filter((item) => {
      const matchCity = this.data.activeCity === "全部" || item.city === this.data.activeCity;
      const matchType = this.data.activeType === "全部" || item.type === this.data.activeType;
      const matchKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.area.toLowerCase().includes(keyword) ||
        item.tags.join("").toLowerCase().includes(keyword);
      return matchCity && matchType && matchKeyword && item.capacity >= this.data.guests;
    });
    this.setData({ filteredHomestays });
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&checkIn=${this.data.checkIn}&checkOut=${this.data.checkOut}&guests=${this.data.guests}`
    });
  },

  goOrders() {
    wx.navigateTo({ url: "/pages/orders/orders" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  }
});
