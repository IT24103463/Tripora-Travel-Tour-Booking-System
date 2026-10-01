const STORAGE_PREFIX = 'tripora_booking_history_';
const HISTORY_UPDATED_EVENT = 'tripora:booking-history-updated';

export const getBookingHistoryOwner = (user) => String(
  user?.id || user?.userId || user?.email || 'guest',
);

export const getBookingHistoryStorageKey = (owner) => `${STORAGE_PREFIX}${owner || 'guest'}`;

export const readBookingHistory = (owner) => {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(getBookingHistoryStorageKey(owner));
    const records = value ? JSON.parse(value) : [];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
};

export const saveBookingHistory = (owner, booking) => {
  if (typeof window === 'undefined' || !booking?.id) return;
  const records = readBookingHistory(owner);
  const updated = [booking, ...records.filter((record) => record.id !== booking.id)];
  try {
    window.localStorage.setItem(getBookingHistoryStorageKey(owner), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(HISTORY_UPDATED_EVENT, { detail: { owner: String(owner || 'guest') } }));
  } catch (error) {
    console.warn('Unable to save the booking history locally:', error);
  }
};

export const computeBookingStatus = (startDateStr, endDateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Ongoing';
  end.setHours(0, 0, 0, 0);
  return today > end ? 'Finished' : 'Ongoing';
};
