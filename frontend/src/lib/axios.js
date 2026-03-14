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

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Tự động đính kèm accessToken từ Zustand
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi 401 & Silent Refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Bắt lỗi 401 (Unauthorized) và đảm bảo chưa từng retry request này
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // Nếu đang trong quá trình refresh token từ 1 request khác -> Đẩy vào queue
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            // Khi refresh xong mới retry lại request trong queue bằng token mới
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      // Đánh dấu request này đã retry
      originalRequest._retry = true;
      // Bật cờ thông báo đang refresh
      isRefreshing = true;

      try {
        // Dùng axios gốc để gọi refresh API nhằm tránh vòng lặp vô tận (nếu dùng axiosInstance)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true } // Gửi kèm refresh token trong HttpOnly Cookie
        );

        const newAccessToken = data.accessToken;
        
        // Cập nhật token mới vào Zustand (memory)
        useAuthStore.getState().updateToken(newAccessToken);

        // Xử lý các request bị lỗi 401 khác trong queue
        processQueue(null, newAccessToken);

        // Retry lại request hiện tại với token mới
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Nếu refresh thất bại (VD: refreshToken hết hạn) -> Xóa queue, clear auth và redirect
        processQueue(refreshError, null);
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
