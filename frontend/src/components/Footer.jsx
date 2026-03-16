import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-apple-gray py-10 text-xs text-apple-secondary font-sans">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        {/* Footnote specific logic here */}
        <div className="border-b border-[#d2d2d7] pb-4 mb-8 text-[11px] leading-relaxed">
          <p className="mb-2">
            1. Ưu đãi đổi mới (Thu cũ đổi mới) được cung cấp thông qua đối tác của NexTech. Thông số kỹ thuật có thể thay đổi mà không cần báo trước.
          </p>
          <p>
            Bản thân các mẫu sản phẩm trên thực tế có thể khác so với các hình ảnh mô phỏng. Dịch vụ và bảo hành 24/7 áp dụng theo từng khu vực cụ thể.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-apple-dark mb-3">Mua sắm & Tìm hiểu</h3>
            <ul className="space-y-2.5">
              <li><Link to="/mac" className="hover:underline">Mac</Link></li>
              <li><Link to="/ipad" className="hover:underline">iPad</Link></li>
              <li><Link to="/iphone" className="hover:underline">iPhone</Link></li>
              <li><Link to="/watch" className="hover:underline">Watch</Link></li>
              <li><Link to="/accessories" className="hover:underline">Phụ kiện</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-apple-dark mb-3">Dịch vụ</h3>
            <ul className="space-y-2.5">
              <li><Link to="#" className="hover:underline">Nex Music</Link></li>
              <li><Link to="#" className="hover:underline">Nex TV+</Link></li>
              <li><Link to="#" className="hover:underline">Nex Cloud</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-apple-dark mb-3">Tài khoản</h3>
            <ul className="space-y-2.5">
              <li><Link to="/account" className="hover:underline">Quản lý ID</Link></li>
              <li><Link to="/profile/orders" className="hover:underline">Đơn hàng</Link></li>
              <li><Link to="#" className="hover:underline">iCloud.com</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-apple-dark mb-3">Dành cho Doanh nghiệp</h3>
            <ul className="space-y-2.5">
              <li><Link to="#" className="hover:underline">NexTech cho Doanh nghiệp</Link></li>
              <li><Link to="#" className="hover:underline">Mua sắm Doanh nghiệp</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-apple-dark mb-3">Giới thiệu NexTech</h3>
            <ul className="space-y-2.5">
              <li><Link to="#" className="hover:underline">Tuyển dụng</Link></li>
              <li><Link to="#" className="hover:underline">Môi trường</Link></li>
              <li><Link to="#" className="hover:underline">Đạo đức doanh nghiệp</Link></li>
              <li><Link to="#" className="hover:underline">Liên hệ NexTech</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-4 flex flex-col md:flex-row justify-between items-center text-[11px]">
          <p className="mb-4 md:mb-0">Bản quyền © 2026 NexTech. Mọi quyền được bảo lưu.</p>
          <div className="flex flex-wrap space-x-2 md:space-x-4">
            <Link to="#" className="hover:underline">Chính sách quyền riêng tư</Link>
            <span className="border-l border-[#d2d2d7]"></span>
            <Link to="#" className="hover:underline ml-2 md:ml-4">Điều khoản sử dụng</Link>
            <span className="border-l border-[#d2d2d7]"></span>
            <Link to="#" className="hover:underline ml-2 md:ml-4">Bán hàng và Hoàn tiền</Link>
            <span className="border-l border-[#d2d2d7]"></span>
            <Link to="#" className="hover:underline ml-2 md:ml-4">Sơ đồ trang web</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
