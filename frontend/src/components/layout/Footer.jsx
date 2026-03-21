import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Facebook, Instagram, Youtube, Music2, CheckCircle2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-[#f5f5f7] border-t border-black/10">
      {/* PHẦN A — Disclaimer Text */}
      <div className="py-6 border-b border-black/10">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 text-apple-secondary text-xs leading-relaxed">
          <p className="mb-2">
            1. Ưu đãi đổi mới (Thu cũ đổi mới) được cung cấp thông qua đối tác của NexTech. Thông số kỹ thuật có thể thay đổi mà không cần báo trước.
          </p>
          <p className="mb-2">
            2. Các tính năng và thông số kỹ thuật chính xác có thể thay đổi tùy thuộc vào mẫu sản phẩm và quốc gia phát hành.
          </p>
          <p className="mb-2">
            3. Dung lượng pin và thời gian sử dụng thực tế phụ thuộc vào cấu hình mạng, ứng dụng đang chạy và nhiều yếu tố khác.
          </p>
          <p className="mb-2">
            4. Một số tính năng thông minh yêu cầu kết nối internet, đăng nhập tài khoản NexTech và có thể phát sinh phí dịch vụ bên thứ ba.
          </p>
          <p>
            Bản thân các mẫu sản phẩm trên thực tế có thể khác so với các hình ảnh mô phỏng. Dịch vụ và bảo hành 24/7 áp dụng theo từng khu vực cụ thể.
          </p>
        </div>
      </div>

      {/* PHẦN B — Main Footer Links (5 cột) */}
      <div className="py-12">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Cột 1 */}
          <div>
            <h3 className="text-xs font-semibold text-apple-black mb-3">Mua sắm & Tìm hiểu</h3>
            <ul className="text-xs text-apple-secondary leading-7">
              <li><Link to="/products?category=smartphone" className="hover:text-apple-black transition-colors">Điện thoại</Link></li>
              <li><Link to="/products?category=laptop" className="hover:text-apple-black transition-colors">Laptop</Link></li>
              <li><Link to="/products?category=tablet" className="hover:text-apple-black transition-colors">Máy tính bảng</Link></li>
              <li><Link to="/products?category=accessory" className="hover:text-apple-black transition-colors">Phụ kiện</Link></li>
              <li><Link to="/products?sale=true" className="hover:text-apple-black transition-colors">Khuyến mãi</Link></li>
            </ul>
          </div>

          {/* Cột 2 */}
          <div>
            <h3 className="text-xs font-semibold text-apple-black mb-3">Hỗ trợ khách hàng</h3>
            <ul className="text-xs text-apple-secondary leading-7">
              <li><Link to="/support/buying-guide" className="hover:text-apple-black transition-colors">Hướng dẫn mua hàng</Link></li>
              <li><Link to="/support/return-policy" className="hover:text-apple-black transition-colors">Chính sách đổi trả</Link></li>
              <li><Link to="/support/warranty" className="hover:text-apple-black transition-colors">Chính sách bảo hành</Link></li>
              <li><Link to="/orders" className="hover:text-apple-black transition-colors">Tra cứu đơn hàng</Link></li>
              <li><Link to="/support/faq" className="hover:text-apple-black transition-colors">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          {/* Cột 3 */}
          <div>
            <h3 className="text-xs font-semibold text-apple-black mb-3">Tài khoản</h3>
            <ul className="text-xs text-apple-secondary leading-7">
              <li><Link to="/login" className="hover:text-apple-black transition-colors">Đăng nhập</Link></li>
              <li><Link to="/register" className="hover:text-apple-black transition-colors">Đăng ký</Link></li>
              <li><Link to="/orders" className="hover:text-apple-black transition-colors">Quản lý đơn hàng</Link></li>
              <li><Link to="/profile" className="hover:text-apple-black transition-colors">Thông tin cá nhân</Link></li>
              <li><Link to="/profile/addresses" className="hover:text-apple-black transition-colors">Địa chỉ giao hàng</Link></li>
            </ul>
          </div>

          {/* Cột 4 */}
          <div>
            <h3 className="text-xs font-semibold text-apple-black mb-3">Dành cho Doanh nghiệp</h3>
            <ul className="text-xs text-apple-secondary leading-7">
              <li><Link to="/business" className="hover:text-apple-black transition-colors">NexTech for Business</Link></li>
              <li><Link to="/business/bulk" className="hover:text-apple-black transition-colors">Mua số lượng lớn</Link></li>
              <li><Link to="/business/quote" className="hover:text-apple-black transition-colors">Báo giá doanh nghiệp</Link></li>
              <li><Link to="/business/support" className="hover:text-apple-black transition-colors">Hỗ trợ kỹ thuật</Link></li>
            </ul>
          </div>

          {/* Cột 5 */}
          <div>
            <h3 className="text-xs font-semibold text-apple-black mb-3">Giới thiệu NexTech</h3>
            <ul className="text-xs text-apple-secondary leading-7">
              <li><Link to="/about" className="hover:text-apple-black transition-colors">Về chúng tôi</Link></li>
              <li><Link to="/careers" className="hover:text-apple-black transition-colors">Tuyển dụng</Link></li>
              <li><Link to="/news" className="hover:text-apple-black transition-colors">Tin tức</Link></li>
              <li><Link to="/about/environment" className="hover:text-apple-black transition-colors">Môi trường</Link></li>
              <li><Link to="/contact" className="hover:text-apple-black transition-colors">Liên hệ</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* PHẦN C — Brand + Social + Payment */}
      <div className="py-8 border-t border-black/10">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Sub-block trái — Brand Info */}
          <div>
            <h2 className="text-lg font-bold text-apple-black mb-1">NexTech</h2>
            <div className="flex items-center gap-1.5 text-xs text-apple-secondary mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-apple-secondary">
              <Phone className="w-3.5 h-3.5" />
              <span>1800 6789 (8:00 – 22:00, kể cả T7, CN)</span>
            </div>
          </div>

          {/* Sub-block giữa — Social Icons */}
          <div className="flex flex-col items-start md:items-center">
            <p className="text-xs font-semibold text-apple-black mb-2">Kết nối với chúng tôi</p>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-apple-blue hover:text-white transition-all text-apple-black">
                <Facebook className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-apple-blue hover:text-white transition-all text-apple-black">
                <Instagram className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-apple-blue hover:text-white transition-all text-apple-black">
                <Youtube className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-apple-blue hover:text-white transition-all text-apple-black">
                <Music2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-block phải — Payment Methods */}
          <div className="flex flex-col items-start md:items-end">
            <p className="text-xs font-semibold text-apple-black mb-2">Phương thức thanh toán</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {['Visa', 'Mastercard', 'MoMo', 'ZaloPay', 'VNPay', 'COD'].map((method) => (
                <span key={method} className="text-[10px] font-semibold px-2 py-0.5 rounded border border-black/15 text-apple-dark bg-white/80">
                  {method}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* PHẦN D — Legal Bar */}
      <div className="py-4 border-t border-black/10">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          
          {/* Trái */}
          <div className="flex flex-col gap-1 text-xs text-apple-secondary">
            <span>Bản quyền © 2026 NexTech. Mọi quyền được bảo lưu.</span>
            <span>MST: 0123456789 | Sở KH&amp;ĐT TP.HCM cấp ngày 01/01/2020</span>
          </div>

          {/* Phải */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-apple-secondary">
              <Link to="/privacy-policy" className="hover:text-apple-black transition-colors block">Chính sách quyền riêng tư</Link>
              <span>|</span>
              <Link to="/terms-of-service" className="hover:text-apple-black transition-colors block">Điều khoản sử dụng</Link>
              <span>|</span>
              <Link to="/sales-and-refunds" className="hover:text-apple-black transition-colors block">Bán hàng và Hoàn tiền</Link>
              <span>|</span>
              <Link to="/sitemap" className="hover:text-apple-black transition-colors block">Sơ đồ trang web</Link>
            </div>
            <div className="flex items-center gap-1.5 border border-green-600/30 text-green-700 bg-green-50 rounded px-2 py-0.5 text-[10px] font-medium mt-1 md:mt-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã đăng ký Bộ Công Thương</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
