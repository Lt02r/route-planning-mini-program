// pages/marker-edit/marker-edit.js
const storage = require('../../utils/storage');
const app = getApp();

Page({
  data: {
    isEdit: false,
    markerId: null,
    form: {
      name: '',
      category: '景点',
      priority: 0,
      latitude: null,
      longitude: null,
      address: '',
      note: '',
    },
    categories: ['景点', '餐饮', '住宿', '购物', '交通', '其他'],
    priorityLabels: ['普通', '重要', '必去'],
    priorityColors: ['#909399', '#E6A23C', '#F56C6C'],
    hasLocation: false,
    submitting: false,
  },

  onLoad(options) {
    const { id, latitude, longitude } = options;
    if (id) {
      // Edit mode
      const marker = storage.getMarkerById(id);
      if (marker) {
        this.setData({
          isEdit: true,
          markerId: id,
          form: {
            name: marker.name,
            category: marker.category || '景点',
            priority: marker.priority || 0,
            latitude: marker.latitude,
            longitude: marker.longitude,
            address: marker.address || '',
            note: marker.note || '',
          },
          hasLocation: true,
        });
        wx.setNavigationBarTitle({ title: '编辑标点' });
      }
    } else if (latitude && longitude) {
      // Pre-filled from map long-press
      this.setData({
        form: {
          ...this.data.form,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        hasLocation: true,
      });
    }
  },

  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value });
  },

  onCategoryChange(e) {
    this.setData({ 'form.category': e.currentTarget.dataset.category });
  },

  onPriorityChange(priority) {
    this.setData({ 'form.priority': priority });
  },

  onPriorityTap(e) {
    const priority = e.currentTarget.dataset.priority;
    this.setData({ 'form.priority': priority });
  },

  onAddressInput(e) {
    this.setData({ 'form.address': e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ 'form.note': e.detail.value });
  },

  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.latitude': res.latitude,
          'form.longitude': res.longitude,
          'form.address': res.address || res.name || '',
          hasLocation: true,
        });
        if (res.name && !this.data.form.name) {
          this.setData({ 'form.name': res.name });
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选取位置失败', icon: 'none' });
        }
      },
    });
  },

  onSubmit() {
    const { form, isEdit, markerId } = this.data;

    // Validate
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入标点名称', icon: 'none' });
      return;
    }
    if (!form.latitude || !form.longitude) {
      wx.showToast({ title: '请选择标点位置', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const markerData = {
      name: form.name.trim(),
      category: form.category,
      priority: form.priority,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      address: form.address.trim(),
      note: form.note.trim(),
    };

    if (isEdit) {
      storage.updateMarker(markerId, markerData);
      wx.showToast({ title: '保存成功', icon: 'success' });
    } else {
      storage.addMarker(markerData);
      wx.showToast({ title: '添加成功', icon: 'success' });
    }

    setTimeout(() => {
      wx.navigateBack();
    }, 800);
  },

  onCancel() {
    wx.navigateBack();
  },
});
