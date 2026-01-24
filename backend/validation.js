// Validation helpers for backend
function isNonEmptyString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

function isValidSeverity(severity) {
  return ['low', 'medium', 'high'].includes(severity);
}

function isValidLatLng(lat, lng) {
  return typeof lat === 'number' && typeof lng === 'number' && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

module.exports = { isNonEmptyString, isValidSeverity, isValidLatLng };
