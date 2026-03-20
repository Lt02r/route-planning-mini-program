// utils/storage.js
// Utility functions for managing marker data in local storage

const STORAGE_KEY = 'markers';
let _idCounter = 0;

/**
 * Get all markers from storage
 * @returns {Array} Array of marker objects
 */
function getAllMarkers() {
  return wx.getStorageSync(STORAGE_KEY) || [];
}

/**
 * Save all markers to storage
 * @param {Array} markers
 */
function saveAllMarkers(markers) {
  wx.setStorageSync(STORAGE_KEY, markers);
}

/**
 * Add a new marker
 * @param {Object} marker - Marker data
 * @returns {Object} The saved marker with generated id
 */
function addMarker(marker) {
  const markers = getAllMarkers();
  const newMarker = {
    ...marker,
    id: Date.now().toString() + '_' + (++_idCounter),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  markers.push(newMarker);
  saveAllMarkers(markers);
  return newMarker;
}

/**
 * Update an existing marker
 * @param {string} id - Marker id
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated marker or null if not found
 */
function updateMarker(id, updates) {
  const markers = getAllMarkers();
  const idx = markers.findIndex(m => m.id === id);
  if (idx === -1) return null;
  markers[idx] = {
    ...markers[idx],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  saveAllMarkers(markers);
  return markers[idx];
}

/**
 * Delete a marker by id
 * @param {string} id
 * @returns {boolean} True if deleted
 */
function deleteMarker(id) {
  const markers = getAllMarkers();
  const filtered = markers.filter(m => m.id !== id);
  if (filtered.length === markers.length) return false;
  saveAllMarkers(filtered);
  return true;
}

/**
 * Get a single marker by id
 * @param {string} id
 * @returns {Object|null}
 */
function getMarkerById(id) {
  const markers = getAllMarkers();
  return markers.find(m => m.id === id) || null;
}

/**
 * Get markers filtered by category
 * @param {string} category - Category name or 'all'
 * @returns {Array}
 */
function getMarkersByCategory(category) {
  const markers = getAllMarkers();
  if (!category || category === 'all') return markers;
  return markers.filter(m => m.category === category);
}

module.exports = {
  getAllMarkers,
  saveAllMarkers,
  addMarker,
  updateMarker,
  deleteMarker,
  getMarkerById,
  getMarkersByCategory,
};
