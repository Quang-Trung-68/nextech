# Đề xuất mở rộng trang chủ (Bước 3 — chờ confirm)

Các mục sau **chưa được triển khai**. Ước lượng độ phức tạp và lý do ngắn gọn:

| Đề xuất | Lý do | Độ phức tạp |
|--------|--------|-------------|
| Flash Sale countdown widget | Hiển thị khi có flash sale active trong DB; tăng chuyển đổi | Trung bình |
| Section “Sản phẩm bán chạy” | Thay hoặc bổ sung testimonials giả bằng dữ liệu `saleSoldCount` / bestseller | Trung bình |
| “Xem gần đây” (localStorage) | Cá nhân hóa không cần backend | Thấp |
| Nút Back-to-top (sau ~300px scroll) | UX, không phụ thuộc API | Thấp |
| SEO meta (title/description/OG) cho `/` | `react-helmet-async` hoặc mở rộng `usePageTitle` | Thấp–TB |
| Thanh progress khi chuyển trang | Cần tích hợp router + UX | Trung bình |

**Xác nhận từng mục trước khi implement.**
