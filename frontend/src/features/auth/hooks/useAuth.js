import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../lib/axios';
import useAuthStore from '../../../stores/useAuthStore';

// ─── useLogin ────────────────────────────────────────────────────────────────
export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    meta: { suppressErrorToast: true }, // Form tự hiển thị alert đỏ, không cần global toast
    mutationFn: async (credentials) => {
      const { data } = await axiosInstance.post('/auth/login', credentials);
      // Backend trả { success: true, user }
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user);
      // Redirect về trang trước (nếu bị chặn bởi ProtectedRoute) hoặc về /
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    },
  });
}

// ─── useRegister ─────────────────────────────────────────────────────────────
export function useRegister() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    meta: { suppressErrorToast: true }, // Form tự hiển thị alert đỏ, không cần global toast
    mutationFn: async (userData) => {
      const { data } = await axiosInstance.post('/auth/register', userData);
      // Backend trả { success: true, user }
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user);
      navigate('/', { replace: true });
    },
  });
}

// ─── useLogout ───────────────────────────────────────────────────────────────
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await axiosInstance.post('/auth/logout');
    },
    onSettled: () => {
      // Luôn clear dù API thành công hay thất bại
      clearAuth();
      queryClient.clear(); // Xoá toàn bộ cache để tránh data leak giữa các tài khoản
      navigate('/login', { replace: true });
    },
  });
}
