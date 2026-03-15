import { useEffect } from 'react';

const APP_NAME = 'NexTech';

/**
 * Set document.title cho từng trang.
 *
 * Usage:
 *   usePageTitle('Sản phẩm')     → "Sản phẩm | NexTech"
 *   usePageTitle()               → "NexTech"          (dùng cho HomePage)
 *   usePageTitle('', true)       → "NexTech"          (tương đương)
 *
 * @param {string} pageTitle  - Tên trang (để trống để chỉ hiện APP_NAME)
 * @param {boolean} exact     - Nếu true, dùng pageTitle làm toàn bộ title (không thêm APP_NAME)
 */
const usePageTitle = (pageTitle = '', exact = false) => {
  useEffect(() => {
    if (exact) {
      document.title = pageTitle || APP_NAME;
    } else if (pageTitle) {
      document.title = `${pageTitle} | ${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }

    // Khôi phục về APP_NAME khi unmount (optional — tránh title sai nếu navigate nhanh)
    return () => {
      document.title = APP_NAME;
    };
  }, [pageTitle, exact]);
};

export { APP_NAME };
export default usePageTitle;
