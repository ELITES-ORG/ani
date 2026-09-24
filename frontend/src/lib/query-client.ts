import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from './api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Generous staleness on purpose: most people here are on metered prepaid
      // data, and refetching the same catalogue page costs them money.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * A 401 on any request means the session is gone.
 *
 * Clear the cached user so screens that already watched `/me` flip to their
 * signed-out state. Do not redirect — being thrown to a sign-in page mid-task
 * is more alarming than the screen simply saying you are signed out.
 *
 * Wired here rather than in `api-client.ts` so the import stays one-way and
 * the cache update is synchronous (no lazy import race with the error UI).
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401) {
      queryClient.setQueryData(['me'], null);
    }
    return Promise.reject(error);
  },
);
