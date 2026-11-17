/** Mirrors APPOINTMENT_STATUSES in the backend model. */
export const STATUSES = Object.freeze(['Pending', 'Confirmed', 'Cancelled']);

export const STATUS_CLASS = Object.freeze({
  Pending: 'status-pending',
  Confirmed: 'status-confirmed',
  Cancelled: 'status-cancelled',
});

export function statusClass(status) {
  return STATUS_CLASS[status] || 'status-pending';
}
