import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from '@/lib/toast';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Toast thông báo lỗi global cho các hàm GET (queries) nếu có lỗi
      if(error?.response?.status !== 401) {
        toast.error(`Lỗi tải dữ liệu: ${error?.response?.data?.message || error.message || 'Có lỗi xảy ra!'}`);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Bỏ qua nếu mutation tự handle lỗi (ví dụ: auth forms hiển thị alert đỏ riêng)
      if (mutation.options.meta?.suppressErrorToast) return;
      // Toast thông báo lỗi global cho các hàm mutation còn lại
      if (error?.response?.status !== 401) {
        toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra!');
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dữ liệu cache có hiệu lực 5 phút
      retry: (failureCount, error) => {
        // KHÔNG retry lại với các lỗi HTTP 4xx (như 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity...)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Cho phép thử lại tối đa 3 lần cho các lỗi do network hay server error (5xx)
        return failureCount < 3;
      },
    },
  },
});

export default queryClient;
