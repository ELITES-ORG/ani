import axios, { AxiosError } from 'axios';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * A blank VITE_API_BASE_URL means "use the default", not "use an empty base".
 *
 * `?? ` does not catch it: an unset-but-present variable arrives as "", which
 * is not nullish, and every request would then be sent to /products instead of
 * /api/v1/products. .env.example ships the key with no value, so this is the
 * normal case rather than an edge one.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 15_000,
  // Sessions are cookie-based, so credentials go from the start. Adding this
  // later produces a confusing "works in dev, 401s in prod".
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Normalises anything the UI might catch into a plain Error with a message
 * worth showing someone.
 *
 * Connections in Biliran drop and time out routinely, so those two cases get
 * their own wording instead of falling through to a generic failure.
 */
export function toApiError(error: unknown): Error {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return new Error('That took too long. Check your connection and try again.');
    }
    if (!error.response) {
      return new Error('Cannot reach the server. Check your connection.');
    }
    const body = error.response.data as ApiErrorBody | undefined;
    return new Error(body?.error?.message ?? `Request failed with status ${error.response.status}`);
  }
  return error instanceof Error ? error : new Error('Something unexpected went wrong');
}
