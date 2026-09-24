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
 * An error from the API, carrying the machine-readable code alongside the
 * message.
 *
 * The code matters: a screen that wants to put "that username is taken" on
 * the username field has to recognise the failure, and matching on the
 * user-facing sentence means a copy edit silently breaks the behaviour.
 * `CONNECTION` and `TIMEOUT` are ours; everything else comes from the API
 * (see docs/reference/api.md).
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | undefined;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Normalises anything the UI might catch into an ApiError with a message
 * worth showing someone.
 *
 * Connections in Biliran drop and time out routinely, so those two cases get
 * their own wording instead of falling through to a generic failure.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError('That took too long. Check your connection and try again.', 'TIMEOUT');
    }
    if (!error.response) {
      return new ApiError('Cannot reach the server. Check your connection.', 'CONNECTION');
    }
    const body = error.response.data as ApiErrorBody | undefined;
    return new ApiError(
      body?.error?.message ?? `Request failed with status ${error.response.status}`,
      body?.error?.code ?? 'UNKNOWN',
      error.response.status,
    );
  }
  if (error instanceof ApiError) return error;
  return new ApiError(
    error instanceof Error ? error.message : 'Something unexpected went wrong',
    'UNKNOWN',
  );
}
