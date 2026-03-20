import React, { useEffect, useRef, useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ShieldCheck, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
const brands = [
  {
    name: 'iPhone',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
  },
  {
    name: 'Mac',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M20 18H4v-1h16v1zm0-13H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
      </svg>
    ),
  },
  {
    name: 'iPad',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M19 1H5C3.9 1 3 1.9 3 3v18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-7 19c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7-4H5V4h14v12z"/>
      </svg>
    ),
  },
  {
    name: 'Apple Watch',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M9 2l-.55 3h7.1L15 2H9zm0 17l.55 3h5.9L16 19H8zm8 0H7c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2zm-5-9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
    ),
  },
  {
    name: 'AirPods',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M4 10.5c0-2.49 1.67-4.65 4-5.32V4h2v1.18c2.33.67 4 2.83 4 5.32V16h-2v-2H6v2H4v-5.5zm2 1.5h4v-2H6v2zm9.5-5.38l1.41-1.41C18.14 6.46 19 8.14 19 10s-.86 3.54-2.09 4.79l-1.41-1.41C16.42 12.47 17 11.28 17 10c0-1.28-.58-2.47-1.5-3.38z"/>
      </svg>
    ),
  },
  {
    name: 'Apple TV',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v1H7v1h10v-1h-1v-1h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
      </svg>
    ),
  },
  {
    name: 'HomePod',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.61 1.41 4.88 3.5 6.13V20h7v-4.87C17.59 13.88 19 11.61 19 9c0-3.87-3.13-7-7-7zm1 14.85V18h-2v-1.15C9.2 16.29 7 12.83 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 3.83-2.2 7.29-4 5.85z"/>
      </svg>
    ),
  },
];

const brandsRow2 = [
  {
    name: 'MacBook Air',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M20 18H4v-1h16v1zm0-13H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z"/>
      </svg>
    ),
  },
  {
    name: 'MacBook Pro',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M20 18H4v-1h16v1zm0-13H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
      </svg>
    ),
  },
  {
    name: 'iPhone 17 Pro',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
  },
  {
    name: 'iPad Air',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M19 1H5C3.9 1 3 1.9 3 3v18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-7 19c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7-4H5V4h14v12z"/>
      </svg>
    ),
  },
  {
    name: 'Apple Intelligence',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.93V17h-2v-.07A8 8 0 0 1 4.07 9H5v2H4.26A6 6 0 0 0 11 16.93zm0-4.02A2 2 0 1 1 12 9a2 2 0 0 1 1 3.91z"/>
      </svg>
    ),
  },
  {
    name: 'Apple Care+',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/>
      </svg>
    ),
  },
  {
    name: 'iCloud',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
      </svg>
    ),
  },
];

const BrandItem = ({ brand }) => (
  <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-apple-gray/60 hover:bg-apple-gray transition-colors duration-200 cursor-default select-none">
    <span className="text-apple-black/80">{brand.icon}</span>
    <span className="text-apple-black font-semibold text-sm tracking-tight whitespace-nowrap">
      {brand.name}
    </span>
  </div>
);

const useCountUp = (target, duration = 2000, enabled = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutQuart — decelerate toward the end
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);

  return count;
};

const stats = [
  {
    value: 50000,
    suffix: '+',
    label: 'Khách hàng hài lòng',
  },
  {
    value: 8,
    suffix: '+',
    label: 'Năm kinh nghiệm phân phối chính hãng',
  },
  {
    value: 200,
    suffix: '+',
    label: 'Dòng sản phẩm đang kinh doanh',
  },
  {
    value: 4.9,
    suffix: '/5',
    label: 'Điểm đánh giá trung bình',
  },
];

const HomePage = () => {
  usePageTitle();

  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  const count0 = useCountUp(stats[0].value, 2000, statsVisible);
  const count1 = useCountUp(stats[1].value, 2200, statsVisible);
  const count2 = useCountUp(stats[2].value, 1800, statsVisible);
  const count3 = useCountUp(stats[3].value, 2400, statsVisible);

  const counts = [count0, count1, count2, count3];

  const getVisibleCount = () => {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const testimonials = [
    {
      id: 1,
      content: "iPhone 17 Pro chụp ảnh đêm cực kỳ ấn tượng, vượt xa kỳ vọng. Camera 48MP cho ra ảnh sắc nét, màu trung thực. Giao hàng đúng 2 tiếng như cam kết!",
      rating: 5,
      name: "Nguyễn Minh Tuấn",
      product: "iPhone 17 Pro — 256GB Titan Đen",
      avatar: "https://i.pravatar.cc/40?img=11",
    },
    {
      id: 2,
      content: "MacBook Air M4 chạy Figma và code song song mà quạt không hề quay. Pin dùng cả ngày làm việc, thực sự ấn tượng. Mua tại NexTech được tặng kèm túi chống sốc.",
      rating: 5,
      name: "Trần Phương Linh",
      product: "MacBook Air M4 — 16GB/512GB",
      avatar: "https://i.pravatar.cc/40?img=5",
    },
    {
      id: 3,
      content: "iPad Air M3 dùng vẽ minh họa cực mượt, Apple Pencil phản hồi gần như không độ trễ. Màn hình Liquid Retina hiển thị màu sắc rất chính xác cho designer.",
      rating: 5,
      name: "Lê Hữu Đức",
      product: "iPad Air M3 11-inch — 256GB",
      avatar: "https://i.pravatar.cc/40?img=15",
    },
    {
      id: 4,
      content: "Apple Watch Series 11 theo dõi giấc ngủ và nhịp tim chính xác hơn mình nghĩ. Đeo cả tuần chỉ cần sạc 2 lần. Nhân viên NexTech tư vấn rất nhiệt tình.",
      rating: 5,
      name: "Phạm Thị Hương",
      product: "Apple Watch Series 11 — GPS 45mm",
      avatar: "https://i.pravatar.cc/40?img=9",
    },
    {
      id: 5,
      content: "Lần đầu mua tại NexTech, ấn tượng với tốc độ giao hàng và đóng gói cẩn thận. iPhone 17 được dán màn hình miễn phí ngay tại cửa hàng. Chắc chắn quay lại!",
      rating: 5,
      name: "Hoàng Văn Nam",
      product: "iPhone 17 — 128GB Trắng",
      avatar: "https://i.pravatar.cc/40?img=3",
    },
    {
      id: 6,
      content: "Đổi từ Android sang iPhone 17 Pro, hỗ trợ chuyển dữ liệu rất nhanh. Hệ sinh thái Apple mượt hơn hẳn, camera quay 4K 120fps đỉnh thật sự.",
      rating: 5,
      name: "Vũ Thanh Mai",
      product: "iPhone 17 Pro — 512GB Titan Trắng",
      avatar: "https://i.pravatar.cc/40?img=20",
    },
    {
      id: 7,
      content: "MacBook Air M4 render video 4K nhanh gấp đôi máy cũ, mà không nóng chút nào. Máy mỏng đẹp, bàn phím gõ êm. Dịch vụ NexTech chuyên nghiệp từ đầu đến cuối.",
      rating: 5,
      name: "Đặng Quốc Bảo",
      product: "MacBook Air M4 — 24GB/1TB",
      avatar: "https://i.pravatar.cc/40?img=7",
    },
    {
      id: 8,
      content: "iPad Air M3 kết hợp Magic Keyboard thành laptop nhỏ gọn cực tiện. Dùng học online và làm việc văn phòng quá ổn. Giá tại NexTech cạnh tranh, thanh toán dễ dàng.",
      rating: 4,
      name: "Ngô Thị Bích Ngọc",
      product: "iPad Air M3 13-inch — WiFi + 5G",
      avatar: "https://i.pravatar.cc/40?img=25",
    },
    {
      id: 9,
      content: "Mua iPhone 17 Pro Max để chụp ảnh sản phẩm cho shop. Chất lượng ảnh vượt trội, tiết kiệm hẳn chi phí thuê photographer. Giao hàng nhanh, hàng seal chính hãng.",
      rating: 5,
      name: "Trịnh Công Dũng",
      product: "iPhone 17 Pro Max — 256GB Titan Tự Nhiên",
      avatar: "https://i.pravatar.cc/40?img=12",
    },
    {
      id: 10,
      content: "Apple Watch Series 11 phát hiện nhịp tim bất thường của mình và thông báo kịp thời. Thực sự là thiết bị đáng đầu tư cho sức khỏe. Cảm ơn NexTech đã tư vấn đúng model.",
      rating: 5,
      name: "Lý Minh Khoa",
      product: "Apple Watch Series 11 — GPS + Cellular",
      avatar: "https://i.pravatar.cc/40?img=17",
    },
    {
      id: 11,
      content: "Mua MacBook Air M4 cho con học đại học. Máy nhẹ, pin trâu, chạy mượt mọi ứng dụng học tập. NexTech hỗ trợ trả góp 0% rất thuận tiện, không cần thẻ tín dụng.",
      rating: 5,
      name: "Phan Thị Lan Anh",
      product: "MacBook Air M4 — 16GB/256GB Bạc",
      avatar: "https://i.pravatar.cc/40?img=32",
    },
    {
      id: 12,
      content: "iPhone 17 camera selfie cải tiến rõ rệt, chụp chân dung xóa phông đẹp tự nhiên. Dynamic Island tiện hơn mình nghĩ. Đặt online lúc 9h sáng, nhận hàng lúc 11h, quá nhanh!",
      rating: 5,
      name: "Bùi Thùy Dương",
      product: "iPhone 17 — 256GB Hồng",
      avatar: "https://i.pravatar.cc/40?img=44",
    },
  ];

  const duplicatedTestimonials = [...testimonials, ...testimonials];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const intervalRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', handleResize);
    handleResize(); // gọi ngay lần đầu
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentIndex <= 0) {
      setIsTransitioning(false);
      setCurrentIndex(testimonials.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIndex(testimonials.length - 1);
      }, 50);
      return;
    }
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(() => {
      goNext();
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [currentIndex, isPaused]);

  useEffect(() => {
    if (currentIndex >= testimonials.length) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 500); // bằng với transition duration
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect(); // chỉ trigger 1 lần
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-apple-gray">
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* ─── 1. HERO ─── full-bleed image, text overlay */}
      <section className="relative w-full min-h-[90vh] overflow-hidden">
        {/* Background image fills entire section */}
        <img
          src="https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=1400"
          alt="NexPhone 15 Pro"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient overlay — top dark for text, transparent toward bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />

        {/* Text content — positioned at top, overlaid on image */}
        <div className="relative z-10 flex flex-col items-center justify-start pt-28 px-4 text-center scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <p className="text-white/60 text-sm font-semibold uppercase tracking-[0.2em] mb-3">
            Ra mắt
          </p>
          <h1 className="text-white text-5xl md:text-[88px] font-bold tracking-tight md:-tracking-[0.04em] leading-tight mb-4">
            iPhone 17 Pro
          </h1>
          <p className="text-white/90 text-xl md:text-3xl font-medium tracking-wide mb-3">
            Titanium. A19 Pro. Camera 48MP.
          </p>
          <p className="text-white/60 text-lg mb-10">Từ 31.599.000đ</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/products?category=smartphone">
              <Button className="rounded-full bg-white text-apple-black hover:bg-white/90 px-8 py-6 text-base font-semibold">
                Mua ngay
              </Button>
            </Link>
            <Link
              to="/products?category=smartphone"
              className="group flex items-center text-white hover:text-white/80 text-lg font-medium transition-colors"
            >
              Tìm hiểu thêm
              <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PARTNERS ─── */}
      <section className="w-full bg-white py-14 overflow-hidden">
        {/* Label */}
        <p className="text-center text-apple-secondary text-sm font-semibold uppercase tracking-[0.2em] mb-10">
          Đối tác chính hãng
        </p>

        {/* Row 1 — chạy trái */}
        <div className="relative flex overflow-hidden mb-6">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-white to-transparent" />
          <div
            className="flex gap-12 whitespace-nowrap"
            style={{ animation: 'marquee-left 80s linear infinite' }}
          >
            {[...brands, ...brands].map((b, i) => (
              <BrandItem key={i} brand={b} />
            ))}
          </div>
        </div>

        {/* Row 2 — chạy phải */}
        <div className="relative flex overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-white to-transparent" />
          <div
            className="flex gap-12 whitespace-nowrap"
            style={{ animation: 'marquee-right 70s linear infinite' }}
          >
            {[...brandsRow2, ...brandsRow2].map((b, i) => (
              <BrandItem key={i} brand={b} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. PRODUCT GRID 2×2 ─── */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6 bg-white">

        {/* Card 1: NexPhone — dark */}
        <div className="group relative bg-apple-black h-[420px] md:h-[600px] flex flex-col items-center pt-12 overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
          <div className="z-10 text-center px-6">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Mới</p>
            <h3 className="text-white text-3xl md:text-5xl font-bold tracking-tight mb-2">iPhone 17</h3>
            <p className="text-white/80 text-base md:text-lg mb-3">120Hz. Chip A18. Pin cả ngày.</p>
            <p className="text-white/60 text-sm md:text-base mb-5">Từ 21.999.000đ</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/products?category=smartphone" className="px-5 py-2 rounded-full bg-apple-blue text-white text-sm font-semibold hover:bg-apple-blue/90 transition-colors">
                Mua
              </Link>
              <Link to="/products?category=smartphone" className="text-apple-blue hover:underline text-sm font-medium flex items-center">
                Tìm hiểu thêm <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="mt-auto w-[60%] h-[45%]">
            <img
              src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600"
              alt="NexPhone 15"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>

        {/* Card 2: NexBook — light */}
        <div className="group relative bg-apple-gray h-[420px] md:h-[600px] flex flex-col items-center pt-12 overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
          <div className="z-10 text-center px-6">
            <p className="text-apple-secondary text-xs font-semibold uppercase tracking-widest mb-2">Chip M4 thế hệ mới</p>
            <h3 className="text-apple-black text-3xl md:text-5xl font-bold tracking-tight mb-2">MacBook Air M4</h3>
            <p className="text-apple-dark text-base md:text-lg mb-3">Nhẹ 1.24kg. Pin 18 giờ. Xuất sắc.</p>
            <p className="text-apple-secondary text-sm md:text-base mb-5">Từ 24.499.000đ</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/products?category=laptop" className="px-5 py-2 rounded-full bg-apple-blue text-white text-sm font-semibold hover:bg-apple-blue/90 transition-colors">
                Mua
              </Link>
              <Link to="/products?category=laptop" className="text-apple-blue hover:underline text-sm font-medium flex items-center">
                Tìm hiểu thêm <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="mt-auto w-[80%] h-[40%]">
            <img
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800"
              alt="NexBook Pro"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 rounded-t-2xl shadow-xl"
            />
          </div>
        </div>

        {/* Card 3: NexPad — light */}
        <div className="group relative bg-apple-gray h-[420px] md:h-[600px] flex flex-col items-center pt-12 overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
          <div className="z-10 text-center px-6">
            <p className="text-apple-secondary text-xs font-semibold uppercase tracking-widest mb-2">Chip M3</p>
            <h3 className="text-apple-black text-3xl md:text-5xl font-bold tracking-tight mb-2">iPad Air M3</h3>
            <p className="text-apple-dark text-base md:text-lg mb-3">Mỏng 6.1mm. Mạnh như Pro.</p>
            <p className="text-apple-secondary text-sm md:text-base mb-5">Từ 16.990.000đ</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/products?category=tablet" className="px-5 py-2 rounded-full bg-apple-blue text-white text-sm font-semibold hover:bg-apple-blue/90 transition-colors">
                Mua
              </Link>
              <Link to="/products?category=tablet" className="text-apple-blue hover:underline text-sm font-medium flex items-center">
                Tìm hiểu thêm <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="mt-auto w-[70%] h-[45%]">
            <img
              src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800"
              alt="NexPad Air"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>

        {/* Card 4: NexWatch — dark */}
        <div className="group relative bg-apple-black h-[420px] md:h-[600px] flex flex-col items-center pt-12 overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
          <div className="z-10 text-center px-6">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Theo dõi Sức khỏe</p>
            <h3 className="text-white text-3xl md:text-5xl font-bold tracking-tight mb-2">Apple Watch Series 11</h3>
            <p className="text-white/80 text-base md:text-lg mb-3">Đo nhịp tim, oxy, nhiệt độ cổ tay.</p>
            <p className="text-white/60 text-sm md:text-base mb-5">Từ 7.290.000đ</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/products?category=accessory" className="px-5 py-2 rounded-full bg-apple-blue text-white text-sm font-semibold hover:bg-apple-blue/90 transition-colors">
                Mua
              </Link>
              <Link to="/products?category=accessory" className="text-apple-blue hover:underline text-sm font-medium flex items-center">
                Tìm hiểu thêm <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="mt-8 w-[50%] h-[40%]">
            <img
              src="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Apple Watch Series 11"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* ─── 3. FEATURE SECTION 1 — full-bleed image với text overlay (thay vì split layout) ─── */}
      <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-1000">
        <img
          src="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=1400"
          alt="MacBook Air M4 Performance"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Darker overlay on left side for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-20 max-w-[700px]">
          <h2 className="text-white text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Chip M4. Hiệu năng không giới hạn.
          </h2>
          <p className="text-white/75 text-lg md:text-xl font-medium leading-relaxed mb-8">
            MacBook Air M4 với CPU 10 nhân trên tiến trình 3nm — nhanh hơn 1.6 lần so với M1. Pin 18 giờ liên tục, trọng lượng chỉ 1.24kg. Chiếc MacBook mỏng nhẹ nhất từ trước đến nay.
          </p>
          <Link
            to="#"
            className="text-apple-blue hover:underline text-lg font-medium flex items-center group w-fit"
          >
            Khám phá MacBook Air M4
            <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ─── 4. FEATURE SECTION 2 — split layout (khác biệt với section 1) ─── */}
      <section className="w-full bg-white py-24 md:py-[120px] scroll-reveal opacity-0 translate-y-8 transition-all duration-1000">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-apple-blue text-sm font-semibold uppercase tracking-widest mb-4">Super Retina XDR · ProMotion</p>
            <h2 className="text-apple-black text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Màn hình 6.3". Sắc nét đến từng pixel.
            </h2>
            <p className="text-apple-secondary text-lg md:text-xl font-medium leading-relaxed mb-8">
              iPhone 17 Pro sở hữu màn hình Super Retina XDR 120Hz ProMotion — cuộn lướt mượt mà không độ trễ, độ sáng tối đa 2.000 nits, hiển thị rõ ngay dưới ánh nắng gay gắt.
            </p>
            <Link
              to="#"
              className="text-apple-blue hover:underline text-lg font-medium flex items-center group w-fit"
            >
              Khám phá iPhone 17 Pro
              <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&q=80&w=800"
              alt="Super Retina XDR Display"
              className="w-full max-w-[420px] rounded-2xl drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section
        ref={statsRef}
        className="w-full bg-apple-black py-20 md:py-24 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000"
      >
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-between text-center gap-2 md:px-8 py-4 md:py-0">
                <span className="text-5xl md:text-7xl font-bold text-white tracking-tight tabular-nums">
                  {i === 3 ? '4.9' : counts[i].toLocaleString('vi-VN')}{stat.suffix}
                </span>
                <span className="text-white/60 text-sm md:text-base font-medium leading-snug max-w-[140px]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS CAROUSEL ─── */}
      <section 
        className="w-full bg-white py-24 md:py-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-[1200px] mx-auto text-center px-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-apple-black tracking-tight mb-4">
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-apple-secondary text-lg mb-12">
            Hơn 10.000 khách hàng hài lòng trên toàn quốc
          </p>
        </div>

        <div className="max-w-[1200px] mx-auto relative px-4 text-left">
          <button 
            onClick={goPrev}
            className="absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-black/10 flex items-center justify-center hover:bg-apple-gray transition-colors cursor-pointer left-0 md:-left-5"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          
          <button 
            onClick={goNext}
            className="absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-black/10 flex items-center justify-center hover:bg-apple-gray transition-colors cursor-pointer right-0 md:-right-5"
          >
            <ChevronRight className="w-5 h-5 text-black" />
          </button>

          <div className="overflow-hidden mx-8 md:mx-12">
            <div
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none',
                display: 'flex',
              }}
            >
              {duplicatedTestimonials.map((t, i) => (
                <div
                  key={i}
                  style={{ minWidth: `${100 / visibleCount}%` }}
                  className="px-3"
                >
                  <div className="bg-apple-gray rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300 h-full">
                    <div className="flex items-start justify-between">
                      <span className="text-5xl text-apple-blue font-serif leading-none">"</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <span key={i} className="text-yellow-400 text-sm">★</span>
                        ))}
                      </div>
                    </div>

                    <p className="text-apple-dark text-sm leading-relaxed flex-1">{t.content}</p>

                    <div className="flex items-center gap-3 pt-2 border-t border-black/5">
                      <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-apple-black text-sm">{t.name}</p>
                        <p className="text-apple-secondary text-xs">{t.product}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(i);
                }}
                className={`transition-all ${
                  (currentIndex % testimonials.length) === i 
                    ? "w-2 h-2 rounded-full bg-apple-blue" 
                    : "w-2 h-2 rounded-full bg-black/20"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. WHY NEXTECH — icon rõ hơn, số liệu cụ thể ─── */}
      <section className="w-full bg-apple-gray py-24 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000">
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-apple-black tracking-tight mb-4">
            Vì sao nên chọn NexTech?
          </h2>
          <p className="text-apple-secondary text-lg mb-16">
            Cam kết mang đến trải nghiệm mua sắm tốt nhất.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            <div className="flex flex-col items-center">
              {/* Icon container với solid background thay vì /10 */}
              <div className="w-16 h-16 rounded-2xl bg-apple-blue flex items-center justify-center mb-6 shadow-lg shadow-apple-blue/30">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-apple-black mb-3">Bảo hành chính hãng</h3>
              <p className="text-apple-secondary text-base leading-relaxed">
                Bảo hành lên đến <span className="font-semibold text-apple-black">24 tháng</span>, hỗ trợ bởi hơn <span className="font-semibold text-apple-black">50 trung tâm NexCare</span> trên toàn quốc.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-apple-blue flex items-center justify-center mb-6 shadow-lg shadow-apple-blue/30">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-apple-black mb-3">Giao hàng siêu tốc</h3>
              <p className="text-apple-secondary text-base leading-relaxed">
                Nhận hàng trong <span className="font-semibold text-apple-black">2 giờ</span> nội thành. Miễn phí giao hàng cho đơn từ <span className="font-semibold text-apple-black">500.000đ</span>.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-apple-blue flex items-center justify-center mb-6 shadow-lg shadow-apple-blue/30">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-apple-black mb-3">Sản phẩm độc quyền</h3>
              <p className="text-apple-secondary text-base leading-relaxed">
                <span className="font-semibold text-apple-black">100% hàng thật</span>, kiểm định chất lượng nghiêm ngặt. Trải nghiệm thiết bị mới nhất sớm nhất Việt Nam.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;