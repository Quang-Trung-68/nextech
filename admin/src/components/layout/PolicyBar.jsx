import React from 'react';
import { RefreshCw, ShieldCheck, CreditCard, Truck, Lock, Headphones } from 'lucide-react';

const policies = [
  { icon: RefreshCw, title: 'Đổi trả 30 ngày', sub: 'Miễn phí, không cần lý do' },
  { icon: ShieldCheck, title: 'Bảo hành chính hãng', sub: 'Lên đến 24 tháng' },
  { icon: CreditCard, title: 'Trả góp 0%', sub: 'Đến 12 tháng, duyệt nhanh' },
  { icon: Truck, title: 'Miễn phí giao hàng', sub: 'Cho đơn từ 500.000đ' },
  { icon: Lock, title: 'Thanh toán bảo mật', sub: 'Chuẩn mã hóa SSL/TLS' },
  { icon: Headphones, title: 'Hỗ trợ 24/7', sub: 'Hotline: 1800 6789' }
];

const PolicyBar = () => {
  return (
    <div className="w-full bg-white border-t border-b border-black/8 py-12 md:py-20 lg:py-28">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
          {policies.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center gap-2 p-4 md:p-6">
                <div className="w-10 h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-apple-blue" />
                </div>
                <h3 className="text-sm font-semibold text-apple-black">{item.title}</h3>
                <p className="text-xs text-apple-secondary">{item.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PolicyBar;
