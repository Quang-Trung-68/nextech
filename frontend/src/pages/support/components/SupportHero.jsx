import { Search } from 'lucide-react';

export default function SupportHero({ searchQuery, onSearch }) {
  return (
    <section className="w-full pt-20 pb-16 bg-gradient-to-b from-[#f5f5f7] to-white">
      <div className="flex flex-col items-center text-center px-4">
        {/* Badge */}
        <span className="inline-block mb-5 px-4 py-1.5 rounded-full bg-[#e8f0fe] text-[#0071e3] text-[16px] font-bold tracking-wide">
          Trung tâm hỗ trợ
        </span>

        {/* Heading */}
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold text-[#1d1d1f] leading-tight mb-4 min-w-3xl">
          Chúng tôi có thể giúp gì cho bạn?
        </h1>

        {/* Subtext */}
        <p className="text-[17px] text-[#6e6e73] mb-10 max-w-xl">
          Tìm câu trả lời nhanh chóng hoặc liên hệ đội ngũ hỗ trợ của chúng tôi
        </p>

        {/* Search bar */}
        <div className="w-full max-w-[560px] relative group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6e6e73] pointer-events-none transition-colors group-focus-within:text-[#0071e3]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm kiếm câu hỏi..."
            className="w-full h-[52px] pl-11 pr-5 rounded-[14px] border border-[#d2d2d7] bg-white text-base text-[#1d1d1f] shadow-sm outline-none placeholder:text-[#86868b] transition-all duration-200 focus:border-[#0071e3] focus:shadow-[0_0_0_4px_rgba(0,113,227,0.15)]"
          />
        </div>
      </div>
    </section>
  );
}
