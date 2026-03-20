// pages/route-plan/route-plan.js
const storage = require('../../utils/storage');
const routeUtils = require('../../utils/route');

Page({
  data: {
    allMarkers: [],
    selectedIds: [],
    routeMarkers: [],
    optimized: false,
    totalDistance: 0,
    totalDistanceText: '',
    totalTimeText: '',
    travelMode: 'driving', // 'driving' | 'walking'
    latitude: 39.9042,
    longitude: 116.4074,
    scale: 12,
    mapPolylines: [],
    mapMarkers: [],
    priorityLabels: ['普通', '重要', '必去'],
    showRoute: false,
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
  },

  onToggleMarker(e) {
    const id = e.currentTarget.dataset.id;
    let selectedIds = this.data.selectedIds.slice();
    const idx = selectedIds.indexOf(id);
    if (idx === -1) {
      selectedIds.push(id);
    } else {
      selectedIds.splice(idx, 1);
    }
    this.setData({ selectedIds, showRoute: false, optimized: false });
  },

  onSelectAll() {
    const selectedIds = this.data.allMarkers.map(m => m.id);
    this.setData({ selectedIds, showRoute: false, optimized: false });
  },

  onClearSelection() {
    this.setData({ selectedIds: [], showRoute: false, optimized: false, routeMarkers: [] });
    this.updateMap([]);
  },

  onTravelModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ travelMode: mode });
    if (this.data.showRoute) {
      this._updateRouteTexts(this.data.totalDistance, mode);
    }
  },

  _updateRouteTexts(totalDistance, travelMode) {
    const totalDistanceText = routeUtils.formatDistance(totalDistance);
    const mins = routeUtils.estimateTime(totalDistance, travelMode);
    let totalTimeText;
    if (mins < 60) {
      totalTimeText = `约${mins}分钟`;
    } else {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      totalTimeText = m > 0 ? `约${h}小时${m}分钟` : `约${h}小时`;
    }
    this.setData({ totalDistanceText, totalTimeText });
  },

  onPlanRoute() {
    const { selectedIds, allMarkers, travelMode } = this.data;
    if (selectedIds.length < 2) {
      wx.showToast({ title: '请至少选择2个标点', icon: 'none' });
      return;
    }

    const selected = selectedIds
      .map(id => allMarkers.find(m => m.id === id))
      .filter(Boolean);

    const routeMarkers = selected;
    const totalDistance = routeUtils.calcTotalDistance(routeMarkers);
    this.setData({
      routeMarkers,
      totalDistance,
      optimized: false,
      showRoute: true,
    });
    this._updateRouteTexts(totalDistance, travelMode);

    this.updateMap(routeMarkers);
    this.scrollToRoute();
  },

  onOptimizeRoute() {
    const { selectedIds, allMarkers, travelMode } = this.data;
    if (selectedIds.length < 2) {
      wx.showToast({ title: '请至少选择2个标点', icon: 'none' });
      return;
    }

    const selected = selectedIds
      .map(id => allMarkers.find(m => m.id === id))
      .filter(Boolean);

    const optimized = routeUtils.optimizeRoute(selected);
    const totalDistance = routeUtils.calcTotalDistance(optimized);
    this.setData({
      routeMarkers: optimized,
      totalDistance,
      optimized: true,
      showRoute: true,
    });
    this._updateRouteTexts(totalDistance, travelMode);

    this.updateMap(optimized);
    this.scrollToRoute();
    wx.showToast({ title: '路线已优化', icon: 'success' });
  },

  updateMap(routeMarkers) {
    if (!routeMarkers || routeMarkers.length === 0) {
      this.setData({ mapMarkers: [], mapPolylines: [] });
      return;
    }

    const mapMarkers = routeMarkers.map((m, index) => ({
      id: index,
      latitude: m.latitude,
      longitude: m.longitude,
      title: m.name,
      label: {
        content: `${index + 1}. ${m.name}`,
        color: '#fff',
        fontSize: 11,
        bgColor: '#1677FF',
        borderRadius: 4,
        padding: 4,
        anchorX: 0,
        anchorY: -12,
      },
    }));

    const polylinePoints = routeMarkers.map(m => ({
      latitude: m.latitude,
      longitude: m.longitude,
    }));

    const mapPolylines = routeMarkers.length >= 2 ? [{
      points: polylinePoints,
      color: '#1677FF',
      width: 4,
      arrowLine: true,
    }] : [];

    // Center map on first marker
    const center = routeMarkers[0];
    this.setData({
      mapMarkers,
      mapPolylines,
      latitude: center.latitude,
      longitude: center.longitude,
    });
  },

  scrollToRoute() {
    wx.pageScrollTo({ selector: '#route-result', duration: 300 });
  },

  formatDistance(km) {
    return routeUtils.formatDistance(km);
  },

  formatTime(km, mode) {
    const mins = routeUtils.estimateTime(km, mode);
    if (mins < 60) return `约${mins}分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `约${h}小时${m}分钟` : `约${h}小时`;
  },
});
