const { addDays, defaultStay, diffDays, formatDate } = require("../../utils/date");
const { getHomestayById } = require("../../utils/homestays");
const { createOrder } = require("../../utils/orders");

Page({
  data: {
    room: null,
    checkIn: "",
    checkOut: "",
    guests: 2,
    nights: 1,
    roomTotal: 0,
    serviceFee: 0,
    payable: 0,
    contactName: "",
    phone: "",
    arrivalOptions: ["12:00-15:00", "15:00-18:00", "18:00-21:00", "21:00 后"],
    arrivalIndex: 1,
    arrivalTime: "15:00-18:00",
    remark: ""
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

  onFieldInput(event) {
    this.setData({ [event.currentTarget.dataset.field]: event.detail.value });
  },

  onArrivalChange(event) {
    const arrivalIndex = Number(event.detail.value);
    this.setData({
      arrivalIndex,
      arrivalTime: this.data.arrivalOptions[arrivalIndex]
    });
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

  submitBooking() {
    const phoneOk = /^1\d{10}$/.test(this.data.phone);
    if (!this.data.contactName.trim()) {
      wx.showToast({ title: "请填写联系人", icon: "none" });
      return;
    }
    if (!phoneOk) {
      wx.showToast({ title: "请填写 11 位手机号", icon: "none" });
      return;
    }

    const order = createOrder({
      roomId: this.data.room.id,
      roomName: this.data.room.name,
      roomCover: this.data.room.cover,
      city: this.data.room.city,
      area: this.data.room.area,
      checkIn: this.data.checkIn,
      checkOut: this.data.checkOut,
      nights: this.data.nights,
      guests: this.data.guests,
      contactName: this.data.contactName.trim(),
      phone: this.data.phone,
      arrivalTime: this.data.arrivalTime,
      remark: this.data.remark.trim(),
      payable: this.data.payable
    });

    wx.showModal({
      title: "预订已提交",
      content: `订单 ${order.id} 已进入待确认状态。接入微信支付后可在这里发起支付。`,
      showCancel: false,
      success: () => {
        wx.redirectTo({ url: "/pages/orders/orders" });
      }
    });
  }
});
