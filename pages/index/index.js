// pages/index/index.js
const storage = require('../../utils/storage');
const app = getApp();

Page({
  data: {
    latitude: 39.9042,
    longitude: 116.4074,
    scale: 13,
    markers: [],
    allMarkers: [],
    mapMarkers: [],
    categories: ['全部', '景点', '餐饮', '住宿', '购物', '交通', '其他'],
    activeCategory: '全部',
    selectedMarkerId: null,
    showMarkerDetail: false,
    selectedMarker: null,
    categoryColors: {
      '景点': '#1677FF',
      '餐饮': '#E6760A',
      '住宿': '#19BE6B',
      '购物': '#9B59B6',
      '交通': '#E74C3C',
      '其他': '#909399',
    },
    priorityLabels: ['普通', '重要', '必去'],
  },

  onLoad() {
    this.loadMarkers();
  },

  onShow() {
    this.loadMarkers();
  },

  loadMarkers() {
    const allMarkers = storage.getAllMarkers();
    this.setData({ allMarkers });
    this.filterMarkers();
  },

  filterMarkers() {
    const { allMarkers, activeCategory } = this.data;
    const filtered = activeCategory === '全部'
      ? allMarkers
      : allMarkers.filter(m => m.category === activeCategory);

    const mapMarkers = filtered.map((m, index) => ({
      id: index,
      markerId: m.id,
      latitude: m.latitude,
      longitude: m.longitude,
      title: m.name,
      iconPath: this.getMarkerIcon(m.category, m.priority),
      width: 32,
      height: 44,
      label: {
        content: m.name,
        color: '#fff',
        fontSize: 10,
        bgColor: this.data.categoryColors[m.category] || '#1677FF',
        borderRadius: 4,
        padding: 3,
        anchorX: 0,
        anchorY: -10,
      },
      callout: {
        content: `${m.name}\n${m.category}`,
        color: '#333',
        fontSize: 12,
        borderRadius: 6,
        bgColor: '#fff',
        padding: 8,
        display: 'BYCLICK',
      },
    }));

    this.setData({ markers: filtered, mapMarkers });
  },

  getMarkerIcon(category, priority) {
    // Use built-in default marker (iconPath can be customized with real assets)
    const colors = {
      '景点': '/assets/icons/pin-blue.png',
      '餐饮': '/assets/icons/pin-orange.png',
      '住宿': '/assets/icons/pin-green.png',
      '购物': '/assets/icons/pin-purple.png',
      '交通': '/assets/icons/pin-red.png',
      '其他': '/assets/icons/pin-gray.png',
    };
    return colors[category] || colors['其他'];
  },

  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
    this.filterMarkers();
  },

  onMarkerTap(e) {
    const { markerId } = e.detail;
    // markerId here is the index in mapMarkers
    const mapMarkers = this.data.mapMarkers;
    const tapped = mapMarkers.find(m => m.id === markerId);
    if (!tapped) return;

    const marker = this.data.allMarkers.find(m => m.id === tapped.markerId);
    if (marker) {
      this.setData({
        selectedMarker: marker,
        showMarkerDetail: true,
      });
    }
  },

  onMapTap(e) {
    const { latitude, longitude } = e.detail;
    // Long press to add marker - navigate to add page
    // Regular tap just hides detail
    this.setData({ showMarkerDetail: false });
  },

  onMapLongPress(e) {
    const { latitude, longitude } = e.detail;
    wx.navigateTo({
      url: `/pages/marker-edit/marker-edit?latitude=${latitude}&longitude=${longitude}`,
    });
  },

  onAddMarker() {
    wx.navigateTo({ url: '/pages/marker-edit/marker-edit' });
  },

  onEditMarker() {
    const { selectedMarker } = this.data;
    if (!selectedMarker) return;
    this.setData({ showMarkerDetail: false });
    wx.navigateTo({
      url: `/pages/marker-edit/marker-edit?id=${selectedMarker.id}`,
    });
  },

  onDeleteMarker() {
    const { selectedMarker } = this.data;
    if (!selectedMarker) return;
    wx.showModal({
      title: '确认删除',
      content: `确定删除标点"${selectedMarker.name}"吗？`,
      confirmColor: '#F56C6C',
      success: (res) => {
        if (res.confirm) {
          storage.deleteMarker(selectedMarker.id);
          this.setData({ showMarkerDetail: false, selectedMarker: null });
          this.loadMarkers();
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      },
    });
  },

  onCloseDetail() {
    this.setData({ showMarkerDetail: false });
  },

  onLocate() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        });
      },
      fail: () => {
        wx.showToast({ title: '定位失败', icon: 'none' });
      },
    });
  },

  onMarkerListTap() {
    wx.switchTab({ url: '/pages/marker-list/marker-list' });
  },
});
