// pages/ai-route/ai-route.js
const storage = require('../../utils/storage');
const routeUtils = require('../../utils/route');

Page({
  data: {
    allMarkers: [],
    // AI settings
    availableHours: 8,
    avgTimePerSpot: 1.5,
    travelMode: 'driving',
    preferCategories: [], // empty = all
    categories: ['景点', '餐饮', '住宿', '购物', '交通', '其他'],
    travelModes: [
      { label: '🚗 驾车', value: 'driving' },
      { label: '🚶 步行', value: 'walking' },
    ],
    // Result
    aiRoute: [],
    totalDistance: 0,
    totalDistanceText: '',
    generating: false,
    showResult: false,
    // Map
    latitude: 39.9042,
    longitude: 116.4074,
    scale: 11,
    mapMarkers: [],
    mapPolylines: [],
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
  },

  onHoursChange(e) {
    this.setData({ availableHours: parseFloat(e.detail.value) });
  },

  onAvgTimeChange(e) {
    this.setData({ avgTimePerSpot: parseFloat(e.detail.value) });
  },

  onTravelModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ travelMode: mode });
  },

  onCategoryToggle(e) {
    const cat = e.currentTarget.dataset.category;
    let preferCategories = this.data.preferCategories.slice();
    const idx = preferCategories.indexOf(cat);
    if (idx === -1) {
      preferCategories.push(cat);
    } else {
      preferCategories.splice(idx, 1);
    }
    this.setData({ preferCategories });
  },

  onGenerate() {
    const { allMarkers, availableHours, avgTimePerSpot, travelMode, preferCategories } = this.data;

    if (allMarkers.length === 0) {
      wx.showToast({ title: '请先添加标点', icon: 'none' });
      return;
    }

    this.setData({ generating: true });

    // Simulate AI processing delay
    setTimeout(() => {
      let candidates = allMarkers;

      // Filter by preferred categories if any selected
      if (preferCategories.length > 0) {
        const filtered = allMarkers.filter(m => preferCategories.includes(m.category));
        if (filtered.length > 0) candidates = filtered;
      }

      const aiRoute = routeUtils.generateAIRoute(candidates, availableHours, avgTimePerSpot);
      const totalDistance = routeUtils.calcTotalDistance(aiRoute);
      const totalDistanceText = routeUtils.formatDistance(totalDistance);

      this.setData({
        aiRoute,
        totalDistance,
        totalDistanceText,
        generating: false,
        showResult: true,
      });

      this.updateMap(aiRoute);
    }, 1200);
  },

  updateMap(routeMarkers) {
    if (!routeMarkers || routeMarkers.length === 0) return;

    const mapMarkers = routeMarkers.map((m, index) => ({
      id: index,
      latitude: m.latitude,
      longitude: m.longitude,
      title: m.name,
      label: {
        content: `${index + 1}. ${m.name}`,
        color: '#fff',
        fontSize: 11,
        bgColor: '#722ED1',
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
      color: '#722ED1',
      width: 4,
      arrowLine: true,
      dottedLine: false,
    }] : [];

    const center = routeMarkers[0];
    this.setData({
      mapMarkers,
      mapPolylines,
      latitude: center.latitude,
      longitude: center.longitude,
    });
  },

  onApplyRoute() {
    wx.switchTab({ url: '/pages/route-plan/route-plan' });
    wx.showToast({ title: '已切换到路线页', icon: 'success' });
  },

  getSpotsCount() {
    const { availableHours, avgTimePerSpot } = this.data;
    return Math.max(1, Math.floor(availableHours / avgTimePerSpot));
  },
});
