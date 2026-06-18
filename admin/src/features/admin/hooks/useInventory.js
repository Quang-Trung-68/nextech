/**
 * TanStack Query hooks — Inventory (suppliers, stock-imports, serials)
 * Base URL: VITE_API_URL/api → paths /admin/suppliers, /admin/stock-imports, /admin/serials
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export const inventoryKeys = {
  all: ['admin', 'inventory'],
  suppliers: (params) => [...inventoryKeys.all, 'suppliers', params],
  stockImports: (params) => [...inventoryKeys.all, 'stock-imports', params],
  stockImport: (id) => [...inventoryKeys.all, 'stock-import', id],
  serials: (params) => [...inventoryKeys.all, 'serials', params],
  lowStock: () => [...inventoryKeys.all, 'low-stock'],
  productSerials: (productId) => [...inventoryKeys.all, 'product-serials', productId],
};

export function useSuppliers(params = {}) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(params),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/suppliers', { params });
      return data;
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => axiosInstance.post('/admin/suppliers', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) =>
      axiosInstance.patch(`/admin/suppliers/${id}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

export function useStockImports(params = {}) {
  return useQuery({
    queryKey: inventoryKeys.stockImports(params),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/stock-imports', { params });
      return data;
    },
  });
}

export function useStockImport(id) {
  return useQuery({
    queryKey: inventoryKeys.stockImport(id),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/stock-imports/${id}`);
      return data.stockImport ?? data;
    },
    enabled: !!id,
  });
}

export function useCreateStockImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => axiosInstance.post('/admin/stock-imports', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useSerials(params = {}) {
  return useQuery({
    queryKey: inventoryKeys.serials(params),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/serials', { params });
      return data;
    },
  });
}

export function useLookupSerial(q) {
  return useQuery({
    queryKey: [...inventoryKeys.all, 'lookup', q],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/serials/lookup', { params: { q } });
      return data.serial ?? data;
    },
    enabled: !!q && String(q).length >= 3,
  });
}

export function useLowStockReport() {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/serials/low-stock');
      return data;
    },
  });
}

export function useAdminProductSerials(productId) {
  return useQuery({
    queryKey: inventoryKeys.productSerials(productId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/products/${productId}/serials`);
      return data;
    },
    enabled: !!productId,
  });
}
