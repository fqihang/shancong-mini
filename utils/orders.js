const STORAGE_KEY = "homestay_orders";

function safeRead() {
  const value = wx.getStorageSync(STORAGE_KEY);
  return Array.isArray(value) ? value : [];
}

function safeWrite(orders) {
  wx.setStorageSync(STORAGE_KEY, orders);
}

function listOrders() {
  return safeRead().sort((a, b) => b.createdAt - a.createdAt);
}

function createOrder(payload) {
  const orders = safeRead();
  const order = Object.assign({}, payload, {
    id: "OD" + Date.now(),
    status: "待确认",
    createdAt: Date.now()
  });
  orders.unshift(order);
  safeWrite(orders);
  return order;
}

function cancelOrder(id) {
  const orders = safeRead().map((order) => {
    if (order.id === id && order.status !== "已取消") {
      return Object.assign({}, order, { status: "已取消" });
    }
    return order;
  });
  safeWrite(orders);
  return orders;
}

module.exports = {
  cancelOrder,
  createOrder,
  listOrders
};
