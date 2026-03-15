import axios from 'axios';
import useAuthStore from '../stores/useAuthStore';

// Cấu hình Axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Bắt buộc để gửi kèm cookie (refreshToken)
});

// isRefreshing: Cờ đánh dấu xem có một request refresh token nào đang diễn ra không
let isRefreshing = false;
// failedQueue: Hàng đợi lưu các request bị lỗi 401 khi isRefreshing = true
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response Interceptor: Xử lý lỗi 401 & Silent Refresh + 403 EMAIL_NOT_VERIFIED
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── 403 EMAIL_NOT_VERIFIED ─────────────────────────────────────────────────
    // Không logout, chỉ redirect về trang thông báo xác thực email.
    // Bỏ qua nếu request đang đến endpoint xác thực để tránh vòng lặp.
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'EMAIL_NOT_VERIFIED'
    ) {
      const url = originalRequest?.url ?? '';
      const isVerificationEndpoint =
        url.includes('/auth/send-verification-email') ||
        url.includes('/auth/verify-email');

      if (!isVerificationEndpoint) {
        window.location.href = '/verify-email-notice';
      }
      return Promise.reject(error);
    }

    // ── 401 Silent Refresh ─────────────────────────────────────────────────────
    // Bắt lỗi 401 (Unauthorized) và đảm bảo chưa từng retry request này
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // Không tự động refresh token nếu request gốc là login, register, hoặc refresh
      if (
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }
      
      // Nếu đang trong quá trình refresh token từ 1 request khác -> Đẩy vào queue
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Khi refresh xong mới retry lại request trong queue (cookie mới sẽ tự động được gửi)
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Đánh dấu request này đã retry
      originalRequest._retry = true;
      // Bật cờ thông báo đang refresh
      isRefreshing = true;

      try {
        // Dùng axios gốc để gọi refresh API nhằm tránh vòng lặp vô tận (nếu dùng axiosInstance)
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true } // Gửi kèm refresh token trong HttpOnly Cookie
        );

        // Xử lý các request bị lỗi 401 khác trong queue
        processQueue(null);

        // Retry lại request hiện tại (trình duyệt sẽ tự gắn HttpOnly Cookie access_token mới)
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Nếu refresh thất bại (VD: refreshToken hết hạn) -> Xóa queue, clear auth và redirect
        processQueue(refreshError);
        useAuthStore.getState().clearAuth();
        
        window.location.href = '/login'; // Chuyển hướng người dùng về trang login
        
        return Promise.reject(refreshError);
      } finally {
        // Tắt cờ refresh sau khi xong xuôi
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
