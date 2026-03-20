// app.js
App({
  onLaunch() {
    // Initialize storage if first launch
    const markers = wx.getStorageSync('markers');
    if (!markers) {
      wx.setStorageSync('markers', []);
    }
  },

  globalData: {
    userInfo: null,
    markers: [],
    categories: ['景点', '餐饮', '住宿', '购物', '交通', '其他'],
    priorityLabels: ['普通', '重要', '必去'],
    priorityColors: ['#909399', '#E6A23C', '#F56C6C'],
  },
});
