import { RotateCcw, Shield, Truck } from 'lucide-react';

const policies = [
  {
    icon: RotateCcw,
    title: 'Đổi trả dễ dàng',
    highlight: '30 ngày',
    description:
      'Hoàn trả sản phẩm trong 30 ngày nếu không hài lòng, không cần giải thích.',
  },
  {
    icon: Shield,
    title: 'Bảo hành chính hãng',
    highlight: '12–24 tháng',
    description:
      'Bảo hành từ nhà sản xuất, hỗ trợ tận nơi hoặc gửi bưu điện.',
  },
  {
    icon: Truck,
    title: 'Giao hàng toàn quốc',
    highlight: 'Miễn phí từ 500K',
    description:
      'Giao hàng nhanh toàn quốc, miễn phí cho đơn từ 500,000₫.',
  },
];

export default function SupportPolicies() {
  return (
    <section id="policies" className="w-full py-16 bg-white">
      <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-[28px] font-bold text-[#1d1d1f] text-center mb-10">
          Chính sách của chúng tôi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {policies.map(({ icon: Icon, title, highlight, description }) => (
            <div
              key={title}
              className="group flex flex-col border border-[#d2d2d7] rounded-[20px] p-8 transition-all duration-200 hover:border-[#0071e3] hover:shadow-[0_4px_20px_rgba(0,113,227,0.1)] cursor-default"
            >
              {/* Icon */}
              <div className="mb-5">
                <Icon size={36} className="text-[#0071e3]" />
              </div>

              {/* Highlight */}
              <span className="block text-[32px] font-bold text-[#0071e3] leading-none mb-2">
                {highlight}
              </span>

              {/* Title */}
              <h3 className="text-[18px] font-semibold text-[#1d1d1f] mb-2">
                {title}
              </h3>

              {/* Description */}
              <p className="text-[14px] text-[#6e6e73] leading-relaxed flex-1">
                {description}
              </p>

              {/* Link */}
              <a
                href="#faq"
                className="mt-5 inline-flex items-center text-[15px] font-medium text-[#0071e3] hover:underline min-h-[44px]"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Xem chi tiết →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
