import { useQuery } from '@tanstack/react-query';
import { apiClient, toApiError } from '@/lib/api-client';
import type { Paginated } from '@contracts/pagination';
import type { ProductCard, ProductCategory, ProductDetail } from './types';

interface ApiResponse<T> {
  data: T;
}

export interface BrowseFilters {
  category?: ProductCategory;
  municipality?: string;
  search?: string;
  page?: number;
}

export const productKeys = {
  all: ['products'] as const,
  list: (filters: BrowseFilters) => [...productKeys.all, 'list', filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  mine: () => [...productKeys.all, 'mine'] as const,
};

async function fetchProducts(filters: BrowseFilters): Promise<Paginated<ProductCard>> {
  try {
    const { data } = await apiClient.get<Paginated<ProductCard>>('/products', {
      params: filters,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

async function fetchProduct(id: string): Promise<ProductDetail> {
  try {
    const { data } = await apiClient.get<ApiResponse<ProductDetail>>(`/products/${id}`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export function useProducts(filters: BrowseFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => fetchProduct(id as string),
    enabled: Boolean(id),
  });
}

export function useMyProducts(enabled: boolean) {
  return useQuery({
    queryKey: productKeys.mine(),
    queryFn: async (): Promise<Paginated<ProductCard>> => {
      try {
        const { data } = await apiClient.get<Paginated<ProductCard>>('/products/mine');
        return data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    enabled,
  });
}
