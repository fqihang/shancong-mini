const { addDays, defaultStay, diffDays, formatDate } = require("../../utils/date");
const { getHomestayById } = require("../../utils/homestays");

Page({
  data: {
    room: null,
    checkIn: "",
    checkOut: "",
    guests: 2,
    nights: 1,
    roomTotal: 0,
    serviceFee: 0,
    payable: 0
  },

  onLoad(options) {
    const stay = defaultStay();
    const room = getHomestayById(options.id);
    if (!room) {
      wx.showToast({ title: "房源不存在", icon: "none" });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.setData({
      room,
      checkIn: options.checkIn || stay.checkIn,
      checkOut: options.checkOut || stay.checkOut,
      guests: Number(options.guests || 2)
    }, () => this.updateQuote());
  },

  onCheckInChange(event) {
    const checkIn = event.detail.value;
    const checkOut = this.data.checkOut <= checkIn ? formatDate(addDays(checkIn, 1)) : this.data.checkOut;
    this.setData({ checkIn, checkOut }, () => this.updateQuote());
  },

  onCheckOutChange(event) {
    if (event.detail.value <= this.data.checkIn) {
      wx.showToast({ title: "离店日期需晚于入住日期", icon: "none" });
      this.setData({ checkOut: formatDate(addDays(this.data.checkIn, 1)) }, () => this.updateQuote());
      return;
    }
    this.setData({ checkOut: event.detail.value }, () => this.updateQuote());
  },

  decreaseGuests() {
    this.setData({ guests: Math.max(1, this.data.guests - 1) }, () => this.updateQuote());
  },

  increaseGuests() {
    this.setData({ guests: Math.min(this.data.room.capacity, this.data.guests + 1) }, () => this.updateQuote());
  },

  updateQuote() {
    const nights = diffDays(this.data.checkIn, this.data.checkOut);
    const roomTotal = this.data.room.price * nights;
    const serviceFee = Math.round(roomTotal * 0.08);
    this.setData({
      nights,
      roomTotal,
      serviceFee,
      payable: roomTotal + serviceFee
    });
  },

  previewImage(event) {
    wx.previewImage({
      current: event.currentTarget.dataset.src,
      urls: this.data.room.images
    });
  },

  callHost() {
    wx.makePhoneCall({ phoneNumber: this.data.room.host.phone });
  },

  goBooking() {
    const { room, checkIn, checkOut, guests } = this.data;
    wx.navigateTo({
      url: `/pages/booking/booking?id=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    });
  }
});
