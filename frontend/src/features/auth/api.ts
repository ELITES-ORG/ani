import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, toApiError } from '@/lib/api-client';
import type { Credentials, CurrentUser, RegistrationDetails } from './types';

interface ApiResponse<T> {
  data: T;
}

export const authKeys = {
  me: ['me'] as const,
};

/**
 * The signed-in account, or null.
 *
 * A 401 is the normal anonymous state, not an error, so it resolves to null
 * rather than throwing and putting every screen into an error branch.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async (): Promise<CurrentUser | null> => {
      try {
        const { data } = await apiClient.get<ApiResponse<CurrentUser>>('/me');
        return data.data;
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status === 401
        ) {
          return null;
        }
        throw toApiError(error);
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: Credentials): Promise<CurrentUser> => {
      try {
        const { data } = await apiClient.post<ApiResponse<CurrentUser>>('/auth/login', credentials);
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    onSuccess: (user) => queryClient.setQueryData(authKeys.me, user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (details: RegistrationDetails): Promise<CurrentUser> => {
      try {
        const { data } = await apiClient.post<ApiResponse<CurrentUser>>('/auth/register', details);
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    onSuccess: (user) => queryClient.setQueryData(authKeys.me, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      // Orders and vendor listings belong to the account that just left.
      void queryClient.invalidateQueries();
    },
  });
}
