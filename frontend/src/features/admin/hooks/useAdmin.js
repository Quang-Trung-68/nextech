/**
 * useAdmin.js — TanStack Query hooks cho Admin Dashboard
 *
 * Pattern nhất quán với dự án:
 *  - Gọi axiosInstance trực tiếp (không qua api layer riêng)
 *  - axiosInstance.baseURL = VITE_API_URL = http://localhost:3000/api
 *    → Tất cả path bắt đầu bằng /admin/... (KHÔNG có tiền tố /api/)
 *  - Đặt trong src/features/admin/hooks/ (giống useAuth, useProduct...)
 *
 * Query Keys:
 *   ['admin', 'stats']
 *   ['admin', 'products', params]
 *   ['admin', 'orders', params]
 *   ['admin', 'users', params]
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admin'],
  stats: () => [...adminKeys.all, 'stats'],
  revenue: (year, month) => [...adminKeys.all, 'revenue', year, month],
  products: (params) => [...adminKeys.all, 'products', params],
  product: (id) => [...adminKeys.all, 'products', 'detail', id],
  productAttributes: (productId) => [...adminKeys.all, 'products', productId, 'attributes'],
  productVariants: (productId) => [...adminKeys.all, 'products', productId, 'variants'],
  orders: (params) => [...adminKeys.all, 'orders', params],
  orderDetail: (id) => [...adminKeys.all, 'orders', 'detail', id],
  users: (params) => [...adminKeys.all, 'users', params],
};

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats/overview?period=day|week|month
 */
export function useAdminStats(period = 'month') {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/stats/overview', {
        params: { period },
      });
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

/**
 * GET /api/admin/stats/revenue?year={year}&month={month}
 */
export function useAdminRevenue(year, month) {
  return useQuery({
    queryKey: adminKeys.revenue(year, month),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/stats/revenue', {
        params: { year, month },
      });
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/products?page&limit&search&category&sort
 */
export function useAdminProducts(params) {
  return useQuery({
    queryKey: adminKeys.products(params),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/products', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * GET /api/admin/products/:id — Chi tiết sản phẩm (admin)
 */
export function useAdminProduct(productId) {
  return useQuery({
    queryKey: adminKeys.product(productId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/products/${productId}`);
      return data.product ?? data;
    },
    enabled: !!productId,
  });
}

/**
 * POST /api/admin/products — Tạo sản phẩm (JSON body)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await axiosInstance.post('/admin/products', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

/**
 * PATCH /api/admin/products/:id — Cập nhật sản phẩm (JSON body)
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) => {
      const { data } = await axiosInstance.patch(`/admin/products/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

/**
 * DELETE /api/admin/products/:id
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.delete(`/admin/products/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

/**
 * GET /api/admin/products/:id/attributes
 */
export function useProductAttributes(productId) {
  return useQuery({
    queryKey: adminKeys.productAttributes(productId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/products/${productId}/attributes`);
      return data.data ?? data;
    },
    enabled: !!productId,
  });
}

/**
 * GET /api/admin/products/:id/variants
 */
export function useProductVariants(productId) {
  return useQuery({
    queryKey: adminKeys.productVariants(productId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/products/${productId}/variants`);
      return data.data ?? data;
    },
    enabled: !!productId,
  });
}

/**
 * PUT /api/admin/products/:id/attributes
 */
export function useUpsertAttributes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, body }) => {
      const { data } = await axiosInstance.put(`/admin/products/${productId}/attributes`, body);
      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.productAttributes(v.productId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

/**
 * PUT /api/admin/products/:id/variants
 */
export function useUpsertVariants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, body }) => {
      const { data } = await axiosInstance.put(`/admin/products/${productId}/variants`, body);
      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.productVariants(v.productId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

/**
 * PATCH /api/admin/products/:productId/variants/:variantId
 */
export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variantId, body }) => {
      const { data } = await axiosInstance.patch(
        `/admin/products/${productId}/variants/${variantId}`,
        body
      );
      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.productVariants(v.productId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

/**
 * DELETE /api/admin/products/:productId/variants/:variantId
 */
export function useDeleteVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variantId }) => {
      const { data } = await axiosInstance.delete(
        `/admin/products/${productId}/variants/${variantId}`
      );
      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.productVariants(v.productId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

/**
 * POST /api/admin/products/upload-images — Upload temporary images to Cloudinary
 */
export function useUploadTempImages() {
  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await axiosInstance.post('/admin/products/upload-images', formData, {
        timeout: 20000, // Tối đa 20s
      });

      return data;
    },
  });
}

/**
 * DELETE /api/admin/products/images/:publicId — Delete temporary image from Cloudinary
 */
export function useDeleteTempImage() {
  return useMutation({
    mutationFn: async (publicId) => {
      // Vì publicId có the chứa dấu sẹc "/" nên ta encode nó hoặc truyền qua data.
      // API backend route hiện tại đang nhận qua body hoặc params. 
      const { data } = await axiosInstance.delete(`/admin/products/images/${encodeURIComponent(publicId)}`);
      return data;
    },
  });
}

/**
 * POST /api/admin/products/:id/images — Upload ảnh (multipart/form-data)
 */
export function useUploadProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const { data } = await axiosInstance.post(
        `/admin/products/${id}/images`,
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

/**
 * DELETE /api/admin/products/:id/images — Xóa ảnh sản phẩm
 */
export function useDeleteProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, imageIds }) => {
      const { data } = await axiosInstance.delete(
        `/admin/products/${id}/images`,
        { data: { imageIds } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products({}) });
    },
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/orders?page&limit&status&search
 */
export function useAdminOrders(params) {
  return useQuery({
    queryKey: adminKeys.orders(params),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/orders', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * GET /api/admin/orders/:id
 */
export function useAdminOrderDetail(orderId) {
  return useQuery({
    queryKey: adminKeys.orderDetail(orderId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/orders/${orderId}`);
      // Response shape: { success: true, order: {...} }
      return data.order || data;
    },
    enabled: !!orderId,
  });
}

/**
 * PATCH /api/admin/orders/:id/status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason = '' }) => {
      const { data } = await axiosInstance.patch(
        `/admin/orders/${id}/status`,
        { status, reason }
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orders({}) });
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats({}) });
    },
  });
}

/**
 * PATCH /api/admin/orders/:id/status — Cancel an order (status: CANCELLED)
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.patch(`/admin/orders/${id}/status`, {
        status: 'CANCELLED',
        reason: 'Hủy bởi quản trị viên',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orders({}) });
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users?page&limit&search&role
 */
export function useAdminUsers(params) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/users', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * PATCH /api/admin/users/:id/toggle-status — Kích hoạt / Cấm user
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      const { data } = await axiosInstance.patch(
        `/admin/users/${id}/toggle-status`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users({}) });
    },
  });
}
