import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../lib/axios';
import useAuthStore from '../../../stores/useAuthStore';
import { toast } from '../../../lib/toast';

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

// ─── useSendVerificationEmail ─────────────────────────────────────────────────
export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post('/auth/send-verification-email');
      return data;
    },
    onSuccess: () => {
      toast.success('Email xác thực đã được gửi! Vui lòng kiểm tra hộp thư.');
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message || 'Không thể gửi email xác thực. Thử lại sau.';
      toast.error(message);
    },
  });
}

// ─── useVerifyEmail ───────────────────────────────────────────────────────────
export function useVerifyEmail() {
  const updateEmailVerified = useAuthStore((s) => s.updateEmailVerified);

  return useMutation({
    mutationFn: async (token) => {
      const { data } = await axiosInstance.get(`/auth/verify-email?token=${token}`);
      return data;
    },
    onSuccess: () => {
      // Cập nhật Zustand store tại chỗ — không cần re-fetch /me
      updateEmailVerified(true);
    },
  });
}

// ─── useChangePassword ────────────────────────────────────────────────────────
export function useChangePassword() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: async (payload) => {
      // payload: { newPassword, confirmPassword }
      const { data } = await axiosInstance.patch('/auth/change-password', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Mật khẩu đã thay đổi thành công. Vui lòng đăng nhập lại.');
      // Backend đã revoke toàn bộ RefreshToken — logout client-side
      clearAuth();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}

// ─── useForgotPassword ────────────────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: async ({ email }) => {
      const { data } = await axiosInstance.post('/auth/forgot-password', { email });
      return data;
    },
    // onSuccess is handled in the page component (show static message)
  });
}

// ─── useResetPassword ─────────────────────────────────────────────────────────
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: async (payload) => {
      // payload: { token, newPassword, confirmPassword }
      const { data } = await axiosInstance.post('/auth/reset-password', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Mật khẩu đã được đặt lại thành công!');
      navigate('/login', { replace: true });
    },
  });
}
