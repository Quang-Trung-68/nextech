import { SearchX } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { faqData } from '../data/faqData';

const tabs = [
  { key: 'order', label: 'Đơn hàng' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'product', label: 'Sản phẩm' },
  { key: 'account', label: 'Tài khoản' },
];

function FAQAccordion({ items }) {
  return (
    <Accordion multiple className="divide-y divide-[#d2d2d7] border border-[#d2d2d7] rounded-2xl overflow-hidden bg-white">
      {items.map((item, idx) => (
        <AccordionItem key={idx} value={String(idx)}>
          <AccordionTrigger className="px-5 py-4 text-[15px] font-medium text-[#1d1d1f] hover:no-underline hover:bg-[#f5f5f7] transition-colors rounded-none">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="px-5 text-[14px] text-[#6e6e73] leading-relaxed">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function SupportFAQ({ searchQuery, activeTab, onTabChange }) {
  // Search mode: flatten all FAQs and filter
  if (searchQuery?.trim()) {
    const query = searchQuery.trim().toLowerCase();
    const allItems = Object.values(faqData).flat();
    const results = allItems.filter(
      (item) =>
        item.q.toLowerCase().includes(query) ||
        item.a.toLowerCase().includes(query)
    );

    return (
      <section id="faq" className="w-full py-16 bg-[#f5f5f7]">
        <div className="mx-auto w-full max-w-[800px] px-4 sm:px-6">
          <h2 className="text-[28px] font-bold text-[#1d1d1f] mb-2">
            Kết quả tìm kiếm
          </h2>
          <p className="text-[#6e6e73] mb-8">
            Tìm thấy{' '}
            <span className="font-medium text-[#1d1d1f]">{results.length}</span>{' '}
            kết quả cho &ldquo;{searchQuery}&rdquo;
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SearchX size={40} className="text-[#d2d2d7] mb-4" />
              <p className="text-[16px] font-medium text-[#1d1d1f] mb-1">
                Không tìm thấy kết quả
              </p>
              <p className="text-[14px] text-[#6e6e73]">
                Thử từ khóa khác hoặc liên hệ đội ngũ hỗ trợ bên dưới.
              </p>
            </div>
          ) : (
            <FAQAccordion items={results} />
          )}
        </div>
      </section>
    );
  }

  // Normal tab mode
  return (
    <section id="faq" className="w-full py-16 bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-[800px] px-4 sm:px-6">
        <h2 className="text-[28px] font-bold text-[#1d1d1f] mb-2">
          Câu hỏi thường gặp
        </h2>
        <p className="text-[#6e6e73] mb-8">
          Chọn chủ đề bên dưới để tìm câu trả lời nhanh
        </p>

        {/* Custom Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-5 min-h-[44px] rounded-full text-[14px] font-medium transition-all duration-200 inline-flex items-center justify-center ${
                activeTab === tab.key
                  ? 'bg-apple-blue text-white shadow-sm border-transparent'
                  : 'bg-white text-apple-dark border border-[#d2d2d7] hover:border-apple-blue hover:text-apple-blue'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <FAQAccordion items={faqData[activeTab] || []} />
      </div>
    </section>
  );
}
