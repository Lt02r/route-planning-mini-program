// utils/route.js
// Utility functions for route planning and distance calculations

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometers
 */
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculate total distance of a route (ordered list of markers)
 * @param {Array} markers - Array with latitude and longitude properties
 * @returns {number} Total distance in km
 */
function calcTotalDistance(markers) {
  if (!markers || markers.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < markers.length - 1; i++) {
    total += calcDistance(
      markers[i].latitude, markers[i].longitude,
      markers[i + 1].latitude, markers[i + 1].longitude
    );
  }
  return total;
}

/**
 * Nearest-neighbor greedy algorithm to generate optimized route
 * Starting from the first marker, always go to the nearest unvisited marker
 * @param {Array} markers - Array of markers with latitude and longitude
 * @returns {Array} Ordered array of markers
 */
function optimizeRoute(markers) {
  if (!markers || markers.length <= 2) return markers.slice();

  const unvisited = markers.slice();
  const route = [unvisited.shift()];

  while (unvisited.length > 0) {
    const last = route[route.length - 1];
    let minDist = Infinity;
    let nearestIdx = 0;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calcDistance(
        last.latitude, last.longitude,
        unvisited[i].latitude, unvisited[i].longitude
      );
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    route.push(unvisited.splice(nearestIdx, 1)[0]);
  }

  return route;
}

/**
 * Sort markers by priority (highest first), then by category
 * @param {Array} markers
 * @returns {Array} Sorted markers
 */
function sortByPriority(markers) {
  return markers.slice().sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 0;
    const pb = typeof b.priority === 'number' ? b.priority : 0;
    return pb - pa;
  });
}

/**
 * Generate an AI-style recommended route based on markers and available time
 * @param {Array} markers - All available markers
 * @param {number} hours - Available hours for the trip
 * @param {number} avgTimePerSpot - Average visit time per spot in hours (default 1.5)
 * @returns {Array} Recommended ordered list of markers
 */
function generateAIRoute(markers, hours, avgTimePerSpot) {
  if (!markers || markers.length === 0) return [];
  const timePerSpot = avgTimePerSpot || 1.5;
  // How many spots can we fit?
  const maxSpots = Math.max(1, Math.floor(hours / timePerSpot));

  // Sort by priority desc, take top maxSpots
  const prioritized = sortByPriority(markers).slice(0, maxSpots);

  // Optimize route order
  return optimizeRoute(prioritized);
}

/**
 * Format distance for display
 * @param {number} km
 * @returns {string}
 */
function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}米`;
  return `${km.toFixed(1)}公里`;
}

/**
 * Estimate travel time (walking/driving) in minutes
 * @param {number} km
 * @param {string} mode - 'walking' | 'driving'
 * @returns {number} Minutes
 */
function estimateTime(km, mode) {
  const speed = mode === 'driving' ? 40 : 5; // km/h
  return Math.round((km / speed) * 60);
}

module.exports = {
  calcDistance,
  calcTotalDistance,
  optimizeRoute,
  sortByPriority,
  generateAIRoute,
  formatDistance,
  estimateTime,
};
