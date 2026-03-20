// utils/__tests__/storage.test.js
// Unit tests for storage utility functions
// Uses a mock for the WeChat wx API

// Mock wx global before requiring storage.js
let _store = {};
global.wx = {
  getStorageSync: jest.fn((key) => {
    const val = _store[key];
    return val !== undefined ? val : null;
  }),
  setStorageSync: jest.fn((key, value) => {
    _store[key] = value;
  }),
};

const {
  getAllMarkers,
  saveAllMarkers,
  addMarker,
  updateMarker,
  deleteMarker,
  getMarkerById,
  getMarkersByCategory,
} = require('../storage');

beforeEach(() => {
  // Reset mock storage and call counts before each test
  _store = {};
  jest.clearAllMocks();
});

describe('getAllMarkers', () => {
  test('returns empty array when no markers stored', () => {
    expect(getAllMarkers()).toEqual([]);
  });

  test('returns stored markers', () => {
    const markers = [{ id: '1', name: '天安门', latitude: 39.9, longitude: 116.4, category: '景点' }];
    _store['markers'] = markers;
    expect(getAllMarkers()).toEqual(markers);
  });
});

describe('saveAllMarkers', () => {
  test('saves markers to storage', () => {
    const markers = [{ id: '1', name: '外滩' }];
    saveAllMarkers(markers);
    expect(wx.setStorageSync).toHaveBeenCalledWith('markers', markers);
  });

  test('overwrites existing markers', () => {
    _store['markers'] = [{ id: '1', name: '旧标点' }];
    const newMarkers = [{ id: '2', name: '新标点' }];
    saveAllMarkers(newMarkers);
    expect(getAllMarkers()).toEqual(newMarkers);
  });
});

describe('addMarker', () => {
  test('adds a marker and returns it with generated id and timestamps', () => {
    const input = { name: '故宫', latitude: 39.916, longitude: 116.397, category: '景点', priority: 2 };
    const saved = addMarker(input);
    expect(saved.id).toBeDefined();
    expect(saved.name).toBe('故宫');
    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });

  test('persists the new marker in storage', () => {
    addMarker({ name: '故宫', latitude: 39.916, longitude: 116.397, category: '景点', priority: 2 });
    const stored = getAllMarkers();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('故宫');
  });

  test('adds multiple markers without overwriting', () => {
    addMarker({ name: '故宫', latitude: 39.916, longitude: 116.397, category: '景点', priority: 2 });
    addMarker({ name: '长城', latitude: 40.432, longitude: 116.570, category: '景点', priority: 1 });
    expect(getAllMarkers()).toHaveLength(2);
  });

  test('generated ids are unique', () => {
    const m1 = addMarker({ name: 'A', latitude: 0, longitude: 0, category: '其他', priority: 0 });
    const m2 = addMarker({ name: 'B', latitude: 0, longitude: 0, category: '其他', priority: 0 });
    expect(m1.id).not.toBe(m2.id);
  });
});

describe('updateMarker', () => {
  test('updates an existing marker and returns the updated version', () => {
    const m = addMarker({ name: '故宫', latitude: 39.916, longitude: 116.397, category: '景点', priority: 1 });
    const updated = updateMarker(m.id, { name: '故宫博物院', priority: 2 });
    expect(updated.name).toBe('故宫博物院');
    expect(updated.priority).toBe(2);
    expect(updated.id).toBe(m.id);
  });

  test('preserves updatedAt as a valid ISO date', () => {
    const m = addMarker({ name: '故宫', latitude: 39.916, longitude: 116.397, category: '景点', priority: 1 });
    const updated = updateMarker(m.id, { name: '故宫博物院' });
    expect(new Date(updated.updatedAt).toISOString()).toBe(updated.updatedAt);
  });

  test('returns null for non-existent id', () => {
    expect(updateMarker('nonexistent-id', { name: 'test' })).toBeNull();
  });

  test('does not affect other markers', () => {
    const m1 = addMarker({ name: 'A', latitude: 0, longitude: 0, category: '其他', priority: 0 });
    const m2 = addMarker({ name: 'B', latitude: 1, longitude: 1, category: '其他', priority: 0 });
    updateMarker(m1.id, { name: 'A-updated' });
    expect(getMarkerById(m2.id).name).toBe('B');
  });
});

describe('deleteMarker', () => {
  test('deletes a marker and returns true', () => {
    const m = addMarker({ name: '故宫', latitude: 39.916, longitude: 116.397, category: '景点', priority: 2 });
    const result = deleteMarker(m.id);
    expect(result).toBe(true);
    expect(getAllMarkers()).toHaveLength(0);
  });

  test('returns false for non-existent id', () => {
    expect(deleteMarker('nonexistent-id')).toBe(false);
  });

  test('does not affect other markers when deleting one', () => {
    const m1 = addMarker({ name: 'A', latitude: 0, longitude: 0, category: '其他', priority: 0 });
    const m2 = addMarker({ name: 'B', latitude: 1, longitude: 1, category: '其他', priority: 0 });
    deleteMarker(m1.id);
    const remaining = getAllMarkers();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(m2.id);
  });
});

describe('getMarkerById', () => {
  test('returns the correct marker by id', () => {
    const m = addMarker({ name: '故宫', latitude: 39.916, longitude: 116.397, category: '景点', priority: 2 });
    expect(getMarkerById(m.id)).toMatchObject({ name: '故宫' });
  });

  test('returns null for non-existent id', () => {
    expect(getMarkerById('nonexistent-id')).toBeNull();
  });
});

describe('getMarkersByCategory', () => {
  beforeEach(() => {
    addMarker({ name: '天安门', latitude: 39.9, longitude: 116.4, category: '景点', priority: 2 });
    addMarker({ name: '全聚德', latitude: 39.9, longitude: 116.4, category: '餐饮', priority: 1 });
    addMarker({ name: '故宫', latitude: 39.9, longitude: 116.4, category: '景点', priority: 1 });
    addMarker({ name: '北京饭店', latitude: 39.9, longitude: 116.4, category: '住宿', priority: 0 });
  });

  test('returns all markers when category is "all"', () => {
    expect(getMarkersByCategory('all')).toHaveLength(4);
  });

  test('returns all markers when category is empty string', () => {
    expect(getMarkersByCategory('')).toHaveLength(4);
  });

  test('returns all markers when category is null', () => {
    expect(getMarkersByCategory(null)).toHaveLength(4);
  });

  test('filters markers by category correctly', () => {
    const spots = getMarkersByCategory('景点');
    expect(spots).toHaveLength(2);
    spots.forEach(m => expect(m.category).toBe('景点'));
  });

  test('returns empty array for category with no matches', () => {
    expect(getMarkersByCategory('购物')).toHaveLength(0);
  });
});
