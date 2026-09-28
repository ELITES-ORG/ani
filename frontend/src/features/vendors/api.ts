import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, toApiError } from '@/lib/api-client';
import { authKeys } from '@/features/auth/api';
import type {
  Barangay,
  Municipality,
  OwnFarm,
  RegisterVendorPayload,
  VendorDetail,
} from './types';

interface ApiResponse<T> {
  data: T;
}

export const vendorKeys = {
  all: ['vendors'] as const,
  municipalities: () => ['taxonomy', 'municipalities'] as const,
  barangays: (slug: string) => ['taxonomy', 'barangays', slug] as const,
  mine: () => [...vendorKeys.all, 'mine'] as const,
};

/** Reference data: eight municipalities that will not change. */
export function useMunicipalities() {
  return useQuery({
    queryKey: vendorKeys.municipalities(),
    queryFn: async (): Promise<Municipality[]> => {
      try {
        const { data } = await apiClient.get<ApiResponse<Municipality[]>>(
          '/taxonomy/municipalities',
        );
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    staleTime: Infinity,
  });
}

export function useBarangays(municipalitySlug: string | undefined) {
  return useQuery({
    queryKey: vendorKeys.barangays(municipalitySlug ?? ''),
    queryFn: async (): Promise<Barangay[]> => {
      try {
        const { data } = await apiClient.get<ApiResponse<Barangay[]>>(
          `/taxonomy/municipalities/${municipalitySlug}/barangays`,
        );
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    enabled: Boolean(municipalitySlug),
    staleTime: Infinity,
  });
}

export function useRegisterVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RegisterVendorPayload): Promise<VendorDetail> => {
      try {
        const { data } = await apiClient.post<ApiResponse<VendorDetail>>(
          '/vendors/register',
          payload,
        );
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    // The account now has a farm, so /me answers differently.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: authKeys.me }),
  });
}

/** The caller's own farm, to prefill fixing it. Fetch only when there is one to fix. */
export function useMyFarm(enabled: boolean) {
  return useQuery({
    queryKey: vendorKeys.mine(),
    queryFn: async (): Promise<OwnFarm> => {
      try {
        const { data } = await apiClient.get<ApiResponse<OwnFarm>>('/vendors/mine');
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    enabled,
  });
}

/** Fix a farm while it is being checked, or resubmit it after a rejection. */
export function useUpdateMyFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RegisterVendorPayload): Promise<OwnFarm> => {
      try {
        const { data } = await apiClient.patch<ApiResponse<OwnFarm>>('/vendors/mine', payload);
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    onSuccess: (farm) => {
      queryClient.setQueryData(vendorKeys.mine(), farm);
      // Returned, so the Sell screen it leads to already shows the farm as
      // being checked, not the rejection it came from.
      return queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}
