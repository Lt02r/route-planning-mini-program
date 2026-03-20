// pages/marker-list/marker-list.js
const storage = require('../../utils/storage');
const app = getApp();

Page({
  data: {
    allMarkers: [],
    filteredMarkers: [],
    categories: ['全部', '景点', '餐饮', '住宿', '购物', '交通', '其他'],
    activeCategory: '全部',
    searchText: '',
    sortBy: 'priority', // 'priority' | 'name' | 'createdAt'
    sortOptions: [
      { label: '按优先级', value: 'priority' },
      { label: '按名称', value: 'name' },
      { label: '按时间', value: 'createdAt' },
    ],
    sortIndex: 0,
    priorityLabels: ['普通', '重要', '必去'],
    showSortMenu: false,
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
    this.applyFilter();
  },

  applyFilter() {
    const { allMarkers, activeCategory, searchText, sortBy } = this.data;
    let filtered = allMarkers;

    // Filter by category
    if (activeCategory !== '全部') {
      filtered = filtered.filter(m => m.category === activeCategory);
    }

    // Filter by search text
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.address || '').toLowerCase().includes(q) ||
        (m.note || '').toLowerCase().includes(q)
      );
    }

    // Sort
    filtered = filtered.slice().sort((a, b) => {
      if (sortBy === 'priority') {
        const pa = typeof a.priority === 'number' ? a.priority : 0;
        const pb = typeof b.priority === 'number' ? b.priority : 0;
        return pb - pa;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    this.setData({ filteredMarkers: filtered });
  },

  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
    this.applyFilter();
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
    this.applyFilter();
  },

  onSearchClear() {
    this.setData({ searchText: '' });
    this.applyFilter();
  },

  onSortChange(e) {
    const idx = e.detail.value;
    const sortBy = this.data.sortOptions[idx].value;
    this.setData({ sortIndex: idx, sortBy });
    this.applyFilter();
  },

  onMarkerTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/marker-edit/marker-edit?id=${id}`,
    });
  },

  onDeleteMarker(e) {
    const id = e.currentTarget.dataset.id;
    const marker = this.data.allMarkers.find(m => m.id === id);
    if (!marker) return;

    wx.showModal({
      title: '确认删除',
      content: `确定删除标点"${marker.name}"吗？`,
      confirmColor: '#F56C6C',
      success: (res) => {
        if (res.confirm) {
          storage.deleteMarker(id);
          this.loadMarkers();
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      },
    });
  },

  onAddMarker() {
    wx.navigateTo({ url: '/pages/marker-edit/marker-edit' });
  },

  onViewOnMap(e) {
    const id = e.currentTarget.dataset.id;
    const marker = this.data.allMarkers.find(m => m.id === id);
    if (!marker) return;
    // Switch to map tab and center on marker
    wx.switchTab({ url: '/pages/index/index' });
  },
});
