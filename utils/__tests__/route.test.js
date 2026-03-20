// utils/__tests__/route.test.js
// Unit tests for route planning utility functions

const {
  calcDistance,
  calcTotalDistance,
  optimizeRoute,
  sortByPriority,
  generateAIRoute,
  formatDistance,
  estimateTime,
} = require('../route');

// Sample marker data for tests
const beijing = { id: '1', name: '天安门', latitude: 39.9042, longitude: 116.4074, priority: 2 };
const shanghai = { id: '2', name: '外滩', latitude: 31.2304, longitude: 121.4737, priority: 1 };
const guangzhou = { id: '3', name: '广州塔', latitude: 23.1073, longitude: 113.3245, priority: 0 };
const shenzhen = { id: '4', name: '世界之窗', latitude: 22.5339, longitude: 113.9737, priority: 1 };

describe('calcDistance', () => {
  test('returns 0 for identical coordinates', () => {
    expect(calcDistance(39.9042, 116.4074, 39.9042, 116.4074)).toBe(0);
  });

  test('calculates distance between Beijing and Shanghai (~1067 km)', () => {
    const dist = calcDistance(39.9042, 116.4074, 31.2304, 121.4737);
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1200);
  });

  test('is symmetric (A→B == B→A)', () => {
    const d1 = calcDistance(39.9042, 116.4074, 31.2304, 121.4737);
    const d2 = calcDistance(31.2304, 121.4737, 39.9042, 116.4074);
    expect(d1).toBeCloseTo(d2, 5);
  });

  test('calculates short distance accurately (same city, ~1 km range)', () => {
    // Two points ~1 km apart in Beijing
    const dist = calcDistance(39.9042, 116.4074, 39.9132, 116.4074);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(2);
  });
});

describe('calcTotalDistance', () => {
  test('returns 0 for empty array', () => {
    expect(calcTotalDistance([])).toBe(0);
  });

  test('returns 0 for null', () => {
    expect(calcTotalDistance(null)).toBe(0);
  });

  test('returns 0 for single marker', () => {
    expect(calcTotalDistance([beijing])).toBe(0);
  });

  test('returns sum of segment distances for multiple markers', () => {
    const total = calcTotalDistance([beijing, shanghai, guangzhou]);
    const seg1 = calcDistance(beijing.latitude, beijing.longitude, shanghai.latitude, shanghai.longitude);
    const seg2 = calcDistance(shanghai.latitude, shanghai.longitude, guangzhou.latitude, guangzhou.longitude);
    expect(total).toBeCloseTo(seg1 + seg2, 5);
  });

  test('is always non-negative', () => {
    const total = calcTotalDistance([beijing, shanghai, guangzhou, shenzhen]);
    expect(total).toBeGreaterThan(0);
  });
});

describe('optimizeRoute', () => {
  test('returns copy of original for empty array', () => {
    expect(optimizeRoute([])).toEqual([]);
  });

  test('returns copy for single marker', () => {
    const result = optimizeRoute([beijing]);
    expect(result).toEqual([beijing]);
    expect(result).not.toBe([beijing]); // different reference
  });

  test('returns copy for two markers', () => {
    const result = optimizeRoute([beijing, shanghai]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(beijing);
    expect(result[1]).toEqual(shanghai);
  });

  test('preserves all markers in optimized route', () => {
    const markers = [beijing, shanghai, guangzhou, shenzhen];
    const result = optimizeRoute(markers);
    expect(result).toHaveLength(markers.length);
    markers.forEach(m => {
      expect(result).toContainEqual(m);
    });
  });

  test('starts with the first marker', () => {
    const markers = [beijing, shanghai, guangzhou, shenzhen];
    const result = optimizeRoute(markers);
    expect(result[0]).toEqual(beijing);
  });

  test('produces a route no longer than the original order', () => {
    // Nearest-neighbor should not be worse than the original on typical city data
    const markers = [guangzhou, beijing, shenzhen, shanghai]; // deliberately sub-optimal order
    const optimized = optimizeRoute(markers);
    const originalDist = calcTotalDistance(markers);
    const optimizedDist = calcTotalDistance(optimized);
    // Nearest-neighbor result should be <= original for this dataset
    expect(optimizedDist).toBeLessThanOrEqual(originalDist + 0.001);
  });

  test('does not mutate the input array', () => {
    const markers = [beijing, shanghai, guangzhou];
    const copy = markers.slice();
    optimizeRoute(markers);
    expect(markers).toEqual(copy);
  });
});

describe('sortByPriority', () => {
  test('returns empty array for empty input', () => {
    expect(sortByPriority([])).toEqual([]);
  });

  test('sorts markers by priority descending', () => {
    const markers = [guangzhou, shenzhen, beijing]; // priorities: 0, 1, 2
    const sorted = sortByPriority(markers);
    expect(sorted[0].priority).toBe(2);
    expect(sorted[1].priority).toBe(1);
    expect(sorted[2].priority).toBe(0);
  });

  test('does not mutate the input array', () => {
    const markers = [guangzhou, shenzhen, beijing];
    const copy = markers.slice();
    sortByPriority(markers);
    expect(markers).toEqual(copy);
  });

  test('treats missing priority as 0', () => {
    const noPriority = { id: '5', name: '未知', latitude: 0, longitude: 0 };
    const sorted = sortByPriority([beijing, noPriority]);
    expect(sorted[0]).toEqual(beijing); // priority 2 first
  });
});

describe('generateAIRoute', () => {
  const markers = [beijing, shanghai, guangzhou, shenzhen];

  test('returns empty array for empty input', () => {
    expect(generateAIRoute([], 8, 1.5)).toEqual([]);
  });

  test('returns empty array for null input', () => {
    expect(generateAIRoute(null, 8, 1.5)).toEqual([]);
  });

  test('limits spots by available time', () => {
    // 3 hours / 1.5 hours per spot = 2 spots
    const result = generateAIRoute(markers, 3, 1.5);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  test('includes at least 1 spot', () => {
    // Even with very little time, at least 1 spot should be returned
    const result = generateAIRoute(markers, 0.5, 2);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('returns spots sorted by priority for selection', () => {
    // With enough time for all, all markers should be in the result
    const result = generateAIRoute(markers, 24, 1);
    expect(result.length).toBe(markers.length);
  });

  test('selects higher-priority markers first when time is limited', () => {
    // Only 1 spot, must-visit (priority 2) should be included
    const result = generateAIRoute(markers, 1, 1);
    expect(result.length).toBe(1);
    expect(result[0].priority).toBe(2); // beijing with priority 2
  });
});

describe('formatDistance', () => {
  test('formats distances under 1 km in meters', () => {
    expect(formatDistance(0.5)).toBe('500米');
    expect(formatDistance(0.1)).toBe('100米');
    expect(formatDistance(0.999)).toBe('999米');
  });

  test('formats distances >= 1 km in kilometers', () => {
    expect(formatDistance(1.0)).toBe('1.0公里');
    expect(formatDistance(5.678)).toBe('5.7公里');
    expect(formatDistance(100)).toBe('100.0公里');
  });

  test('rounds meter values correctly', () => {
    expect(formatDistance(0.1234)).toBe('123米');
  });
});

describe('estimateTime', () => {
  test('estimates driving time correctly (40 km/h)', () => {
    // 40 km at 40 km/h = 60 minutes
    expect(estimateTime(40, 'driving')).toBe(60);
  });

  test('estimates walking time correctly (5 km/h)', () => {
    // 5 km at 5 km/h = 60 minutes
    expect(estimateTime(5, 'walking')).toBe(60);
  });

  test('returns 0 minutes for 0 km', () => {
    expect(estimateTime(0, 'driving')).toBe(0);
    expect(estimateTime(0, 'walking')).toBe(0);
  });

  test('walking is always slower than driving for the same distance', () => {
    const walkTime = estimateTime(10, 'walking');
    const driveTime = estimateTime(10, 'driving');
    expect(walkTime).toBeGreaterThan(driveTime);
  });

  test('defaults to walking speed for unknown mode', () => {
    // Anything other than 'driving' uses walking speed (5 km/h)
    expect(estimateTime(5, 'unknown')).toBe(estimateTime(5, 'walking'));
  });
});
