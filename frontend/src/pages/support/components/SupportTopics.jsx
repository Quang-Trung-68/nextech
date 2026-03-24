import { RotateCcw, CreditCard, Truck, Shield, UserCircle, MessageCircle } from 'lucide-react';

const topics = [
  { icon: RotateCcw, label: 'Đổi trả hàng', target: 'faq', tab: 'order' },
  { icon: CreditCard, label: 'Thanh toán', target: 'faq', tab: 'payment' },
  { icon: Truck, label: 'Vận chuyển', target: 'faq', tab: 'product' },
  { icon: Shield, label: 'Bảo hành', target: 'faq', tab: 'product' },
  { icon: UserCircle, label: 'Tài khoản', target: 'faq', tab: 'account' },
  { icon: MessageCircle, label: 'Liên hệ', target: 'contact', tab: null },
];

export default function SupportTopics({ onTabChange }) {
  const handleClick = (topic) => {
    const el = document.getElementById(topic.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    if (topic.tab && onTabChange) {
      onTabChange(topic.tab);
    }
  };

  return (
    <section className="w-full py-12 bg-white">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] font-semibold text-[#1d1d1f] text-center mb-8">
          Chủ đề phổ biến
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topics.map(({ icon: Icon, label, ...rest }) => (
            <button
              key={label}
              onClick={() => handleClick({ icon: Icon, label, ...rest })}
              className="flex flex-col items-center justify-center bg-[#f5f5f7] rounded-2xl px-4 py-6 cursor-pointer transition-all duration-200 ease-out hover:bg-[#e8e8ed] hover:scale-[1.03] active:scale-[0.98] group"
            >
              <Icon
                size={28}
                className="text-[#0071e3] mb-3 transition-transform duration-200 group-hover:scale-110"
              />
              <span className="text-[14px] font-medium text-[#1d1d1f] text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
