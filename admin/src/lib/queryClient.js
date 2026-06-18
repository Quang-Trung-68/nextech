import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import i18n from '@/i18n/i18n';

const getTranslatedError = (error) => {
  const code = error?.response?.data?.code;
  if (code) {
    const translated = i18n.t(`errors:${code}`);
    if (translated !== `errors:${code}`) return translated;
  }
  return error?.response?.data?.message || i18n.t('errors:DEFAULT');
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Toast thông báo lỗi global cho các hàm GET (queries) nếu có lỗi
      if(error?.response?.status !== 401) {
        toast.error(`${i18n.t('common:status.error')}: ${getTranslatedError(error)}`);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Bỏ qua nếu mutation tự handle lỗi (ví dụ: auth forms hiển thị alert đỏ riêng)
      if (mutation.options.meta?.suppressErrorToast) return;
      // Toast thông báo lỗi global cho các hàm mutation còn lại
      if (error?.response?.status !== 401) {
        toast.error(getTranslatedError(error));
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
