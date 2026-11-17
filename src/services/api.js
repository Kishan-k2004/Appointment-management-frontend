import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawBaseUrl) {
  console.warn('[api] VITE_API_BASE_URL is not set. Copy .env.example to .env and set the backend URL.');
}

/** Backend origin without a trailing slash; every endpoint lives under /api. */
export const API_BASE_URL = `${(rawBaseUrl || '').replace(/\/+$/, '')}/api`;

/**
 * Normalised error thrown by every API call.
 * The backend's error shape is { success: false, message, errors: [{ field, message }] }.
 */
export class ApiRequestError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, cause } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.cause = cause;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  // Render's free tier can take ~50s to wake from sleep.
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

function toApiError(error) {
  if (axios.isCancel(error)) return error;

  if (error.response) {
    const { status, data } = error.response;
    const fieldErrors = {};
    for (const item of data?.errors || []) {
      if (item?.field && !fieldErrors[item.field]) fieldErrors[item.field] = item.message;
    }
    return new ApiRequestError(data?.message || `Request failed with status ${status}`, {
      status,
      fieldErrors,
      cause: error,
    });
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiRequestError('The server took too long to respond. Please try again.', { cause: error });
  }

  return new ApiRequestError('Unable to reach the server. Check your connection or the API URL.', { cause: error });
}

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error))
);

export function isCancelledRequest(error) {
  return axios.isCancel(error);
}

export default api;
