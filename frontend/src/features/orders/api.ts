import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, toApiError } from '@/lib/api-client';
import type { Paginated } from '@contracts/pagination';
import type { OrderDetail, OrderStatus, OrderSummary } from './types';

interface ApiResponse<T> {
  data: T;
}

export interface PlaceOrderPayload {
  items: { productId: string; amount: number }[];
  fulfillment: 'pickup' | 'delivery';
  deliveryMunicipalitySlug?: string;
  deliveryBarangaySlug?: string;
  deliveryLandmark?: string;
  notes?: string;
}

export const orderKeys = {
  all: ['orders'] as const,
  mine: () => [...orderKeys.all, 'mine'] as const,
  received: () => [...orderKeys.all, 'received'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useMyOrders(enabled: boolean) {
  return useQuery({
    queryKey: orderKeys.mine(),
    queryFn: async (): Promise<Paginated<OrderSummary>> => {
      try {
        const { data } = await apiClient.get<Paginated<OrderSummary>>('/orders');
        return data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    enabled,
  });
}

export function useReceivedOrders(enabled: boolean) {
  return useQuery({
    queryKey: orderKeys.received(),
    queryFn: async (): Promise<Paginated<OrderSummary>> => {
      try {
        const { data } = await apiClient.get<Paginated<OrderSummary>>('/orders/received');
        return data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    enabled,
    // A farm checks this to find new orders, so it may not be stale for long.
    staleTime: 30_000,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlaceOrderPayload): Promise<OrderDetail> => {
      try {
        const { data } = await apiClient.post<ApiResponse<OrderDetail>>('/orders', payload);
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      // Placing an order reduces stock, so the catalogue is now out of date.
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: OrderStatus }): Promise<OrderDetail> => {
      try {
        const { data } = await apiClient.patch<ApiResponse<OrderDetail>>(
          `/orders/${input.id}/status`,
          { status: input.status },
        );
        return data.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
