import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { shouldRetry } from './query-client';
import { ApiError } from './api-client';

function axiosErrorWithStatus(status: number): AxiosError {
  const error = new AxiosError('failed');
  error.response = {
    status,
    statusText: '',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('shouldRetry', () => {
  it('does not retry a 401 — the session is gone, asking again will not bring it back', () => {
    expect(shouldRetry(0, axiosErrorWithStatus(401))).toBe(false);
  });

  it.each([400, 403, 404, 409, 422, 429])('does not retry a %i', (status) => {
    expect(shouldRetry(0, axiosErrorWithStatus(status))).toBe(false);
  });

  it('retries a 5xx, which a second attempt can actually fix', () => {
    expect(shouldRetry(0, axiosErrorWithStatus(500))).toBe(true);
    expect(shouldRetry(1, axiosErrorWithStatus(503))).toBe(true);
  });

  it('retries a dropped connection, which is routine here', () => {
    expect(shouldRetry(0, new AxiosError('Network Error'))).toBe(true);
  });

  it('gives up after two retries', () => {
    expect(shouldRetry(2, axiosErrorWithStatus(500))).toBe(false);
  });

  it('reads the status off a normalised ApiError too', () => {
    expect(shouldRetry(0, new ApiError('taken', 'CONFLICT', 409))).toBe(false);
    expect(shouldRetry(0, new ApiError('boom', 'INTERNAL_SERVER_ERROR', 500))).toBe(true);
  });

  it('retries an unknown failure rather than swallowing it', () => {
    expect(shouldRetry(0, new Error('who knows'))).toBe(true);
  });
});
