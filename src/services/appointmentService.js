import api from './api';
import { STATUSES } from '@/constants/status';

/**
 * Thin wrappers around the backend endpoints. Every success response has the
 * shape { success, message, data, pagination?, meta? }; we return the parts the
 * UI needs and keep `message` for toasts.
 */

/** Drops empty values so the backend validators don't see blank params. */
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * GET /api/appointments
 * @param {object} params status, search, date (YYYY-MM-DD), startDate, endDate, page, limit, sortOrder
 */
export async function listAppointments(params = {}, { signal } = {}) {
  const query = cleanParams(params);
  // A date-only `date` is interpreted by the backend in the timezone given by
  // tzOffset (minutes, Date#getTimezoneOffset convention). Use the offset that
  // applies on that specific day so DST is handled.
  if (query.date) {
    const [y, m, d] = query.date.split('-').map(Number);
    query.tzOffset = new Date(y, m - 1, d).getTimezoneOffset();
  }
  const { data } = await api.get('/appointments', { params: query, signal });
  return { items: data.data, pagination: data.pagination };
}

/** GET /api/appointments/calendar — every appointment in the range, no pagination. */
export async function getCalendarAppointments({ startDate, endDate, status }, { signal } = {}) {
  const { data } = await api.get('/appointments/calendar', {
    params: cleanParams({ startDate, endDate, status }),
    signal,
  });
  return { items: data.data, meta: data.meta };
}

/** GET /api/appointments/:id */
export async function getAppointment(id) {
  const { data } = await api.get(`/appointments/${id}`);
  return data.data;
}

/** POST /api/appointments — body: { customerName, service, dateTime (ISO), status? } */
export async function createAppointment(payload) {
  const { data } = await api.post('/appointments', payload);
  return { appointment: data.data, message: data.message };
}

/** PUT /api/appointments/:id — any subset of the editable fields. */
export async function updateAppointment(id, payload) {
  const { data } = await api.put(`/appointments/${id}`, payload);
  return { appointment: data.data, message: data.message };
}

/** PATCH /api/appointments/:id/status — body: { status } */
export async function updateAppointmentStatus(id, status) {
  const { data } = await api.patch(`/appointments/${id}/status`, { status });
  return { appointment: data.data, message: data.message };
}

/** DELETE /api/appointments/:id */
export async function deleteAppointment(id) {
  const { data } = await api.delete(`/appointments/${id}`);
  return { id: data.data?.id ?? id, message: data.message };
}

/**
 * Dashboard counts. The backend has no stats endpoint, so we ask the list
 * endpoint for one record per status and read `pagination.total`.
 */
export async function getAppointmentStats({ signal } = {}) {
  const totalFor = (status) =>
    api
      .get('/appointments', { params: cleanParams({ status, limit: 1 }), signal })
      .then(({ data }) => data.pagination.total);

  const [total, ...byStatus] = await Promise.all([totalFor(), ...STATUSES.map(totalFor)]);
  return {
    total,
    ...Object.fromEntries(STATUSES.map((s, i) => [s, byStatus[i]])),
  };
}
