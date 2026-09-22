/**
 * Formatter Utilities for Tripora Frontend
 */

/**
 * Formats a raw database ID / UUID into a customer-friendly, short alphanumeric Booking Reference Code.
 * Example: "2d1e0ce2-b6bd-473f-9f15-e262040f6190" -> "TRP-2D1E0C"
 * @param {string} id - Raw database identifier or UUID.
 * @returns {string} Customer-friendly booking reference code.
 */
export function formatBookingRef(id) {
  if (!id) return "TRP-000000";
  const cleanId = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `TRP-${cleanId.slice(0, 6)}`;
}

