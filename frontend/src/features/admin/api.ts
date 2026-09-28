import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, toApiError } from '@/lib/api-client';
import type { Paginated } from '@contracts/pagination';
import type { PendingAccount, PendingFarm, ReviewPayload, ReviewResult } from './types';

interface ApiResponse<T> {
  data: T;
}

export const adminKeys = {
  all: ['admin'] as const,
  accounts: () => [...adminKeys.all, 'accounts'] as const,
  farms: () => [...adminKeys.all, 'farms'] as const,
};

/** Accounts waiting for review, oldest first. Fetch only for an admin. */
export function usePendingAccounts(enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.accounts(),
    queryFn: async (): Promise<Paginated<PendingAccount>> => {
      try {
        const { data } = await apiClient.get<Paginated<PendingAccount>>('/admin/accounts');
        return data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    enabled,
  });
}

/** Farms waiting for review, oldest first. Fetch only for an admin. */
export function usePendingFarms(enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.farms(),
    queryFn: async (): Promise<Paginated<PendingFarm>> => {
      try {
        const { data } = await apiClient.get<Paginated<PendingFarm>>('/admin/farms');
        return data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    enabled,
  });
}

interface ReviewVariables {
  id: string;
  review: ReviewPayload;
}

export function useReviewAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, review }: ReviewVariables): Promise<ReviewResult> => {
      try {
        const { data } = await apiClient.patch<ApiResponse<ReviewResult>>(
          `/admin/accounts/${id}/review`,
          review,
        );
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    // Settled, not success: a 409 means another admin got there first, and
    // the list should drop that card either way. Returned, so the mutation
    // stays pending until the list has refetched and the card is gone. Both
    // queues: a farm card shows its owner's account status.
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useReviewFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, review }: ReviewVariables): Promise<ReviewResult> => {
      try {
        const { data } = await apiClient.patch<ApiResponse<ReviewResult>>(
          `/admin/farms/${id}/review`,
          review,
        );
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.farms() }),
  });
}
