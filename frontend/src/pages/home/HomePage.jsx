import React, { useEffect, useRef, useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { ChevronLeft, ChevronRight, ShieldCheck, Clock, Award } from 'lucide-react';
import { HeroBannerSlider } from '@/features/home/components/HeroBannerSlider';
import { BrandCarousel } from '@/features/home/components/BrandCarousel';
import { CategoryProducts } from '@/features/home/components/CategoryProducts';
import { NewestByBrand } from '@/features/home/components/NewestByBrand';
import { BlogCarousel } from '@/features/home/components/BlogCarousel';

const useCountUp = (target, duration = 2000, enabled = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);

  return count;
};

const stats = [
  { value: 50000, suffix: '+', label: 'Khách hàng hài lòng' },
  { value: 8, suffix: '+', label: 'Năm kinh nghiệm phân phối chính hãng' },
  { value: 200, suffix: '+', label: 'Dòng sản phẩm đang kinh doanh' },
  { value: 4.9, suffix: '/5', label: 'Điểm đánh giá trung bình' },
];

const HomePage = () => {
  usePageTitle();

  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  const count0 = useCountUp(stats[0].value, 2000, statsVisible);
  const count1 = useCountUp(stats[1].value, 2200, statsVisible);
  const count2 = useCountUp(stats[2].value, 1800, statsVisible);

  const counts = [count0, count1, count2];

  const getVisibleCount = () => {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const testimonials = [
    {
      id: 1,
      content:
        'iPhone 17 Pro chụp ảnh đêm cực kỳ ấn tượng, vượt xa kỳ vọng. Camera 48MP cho ra ảnh sắc nét, màu trung thực. Giao hàng đúng 2 tiếng như cam kết!',
      rating: 5,
      name: 'Nguyễn Minh Tuấn',
      product: 'iPhone 17 Pro — 256GB Titan Đen',
      avatar: 'https://i.pravatar.cc/40?img=11',
    },
    {
      id: 2,
      content:
        'MacBook Air M4 chạy Figma và code song song mà quạt không hề quay. Pin dùng cả ngày làm việc, thực sự ấn tượng. Mua tại NexTech được tặng kèm túi chống sốc.',
      rating: 5,
      name: 'Trần Phương Linh',
      product: 'MacBook Air M4 — 16GB/512GB',
      avatar: 'https://i.pravatar.cc/40?img=5',
    },
    {
      id: 3,
      content:
        'iPad Air M3 dùng vẽ minh họa cực mượt, Apple Pencil phản hồi gần như không độ trễ. Màn hình Liquid Retina hiển thị màu sắc rất chính xác cho designer.',
      rating: 5,
      name: 'Lê Hữu Đức',
      product: 'iPad Air M3 11-inch — 256GB',
      avatar: 'https://i.pravatar.cc/40?img=15',
    },
    {
      id: 4,
      content:
        'Apple Watch Series 11 theo dõi giấc ngủ và nhịp tim chính xác hơn mình nghĩ. Đeo cả tuần chỉ cần sạc 2 lần. Nhân viên NexTech tư vấn rất nhiệt tình.',
      rating: 5,
      name: 'Phạm Thị Hương',
      product: 'Apple Watch Series 11 — GPS 45mm',
      avatar: 'https://i.pravatar.cc/40?img=9',
    },
    {
      id: 5,
      content:
        'Lần đầu mua tại NexTech, ấn tượng với tốc độ giao hàng và đóng gói cẩn thận. iPhone 17 được dán màn hình miễn phí ngay tại cửa hàng. Chắc chắn quay lại!',
      rating: 5,
      name: 'Hoàng Văn Nam',
      product: 'iPhone 17 — 128GB Trắng',
      avatar: 'https://i.pravatar.cc/40?img=3',
    },
    {
      id: 6,
      content:
        'Đổi từ Android sang iPhone 17, hỗ trợ chuyển dữ liệu rất nhanh. Hệ sinh thái Apple mượt hơn hẳn, camera quay 4K 120fps đỉnh thật sự.',
      rating: 5,
      name: 'Vũ Thanh Mai',
      product: 'iPhone 17 Pro — 512GB Titan Trắng',
      avatar: 'https://i.pravatar.cc/40?img=20',
    },
    {
      id: 7,
      content:
        'MacBook Air M4 render video 4K nhanh gấp đôi máy cũ, mà không nóng chút nào. Máy mỏng đẹp, bàn phím gõ êm. Dịch vụ NexTech chuyên nghiệp từ đầu đến cuối.',
      rating: 5,
      name: 'Đặng Quốc Bảo',
      product: 'MacBook Air M4 — 24GB/1TB',
      avatar: 'https://i.pravatar.cc/40?img=7',
    },
    {
      id: 8,
      content:
        'iPad Air M3 kết hợp Magic Keyboard thành laptop nhỏ gọn cực tiện. Dùng học online và làm việc văn phòng quá ổn. Giá tại NexTech cạnh tranh, thanh toán dễ dàng.',
      rating: 4,
      name: 'Ngô Thị Bích Ngọc',
      product: 'iPad Air M3 13-inch — WiFi + 5G',
      avatar: 'https://i.pravatar.cc/40?img=25',
    },
    {
      id: 9,
      content:
        'Mua iPhone 17 Pro Max để chụp ảnh sản phẩm cho shop. Chất lượng ảnh vượt trội, tiết kiệm hẳn chi phí thuê photographer. Giao hàng nhanh, hàng seal chính hãng.',
      rating: 5,
      name: 'Trịnh Công Dũng',
      product: 'iPhone 17 Pro Max — 256GB Titan Tự Nhiên',
      avatar: 'https://i.pravatar.cc/40?img=12',
    },
    {
      id: 10,
      content:
        'Apple Watch Series 11 phát hiện nhịp tim bất thường của mình và thông báo kịp thời. Thực sự là thiết bị đáng đầu tư cho sức khỏe. Cảm ơn NexTech đã tư vấn đúng model.',
      rating: 5,
      name: 'Lý Minh Khoa',
      product: 'Apple Watch Series 11 — GPS + Cellular',
      avatar: 'https://i.pravatar.cc/40?img=17',
    },
    {
      id: 11,
      content:
        'Mua MacBook Air M4 cho con học đại học. Máy nhẹ, pin trâu, chạy mượt mọi ứng dụng học tập. NexTech hỗ trợ trả góp 0% rất thuận tiện, không cần thẻ tín dụng.',
      rating: 5,
      name: 'Phan Thị Lan Anh',
      product: 'MacBook Air M4 — 16GB/256GB Bạc',
      avatar: 'https://i.pravatar.cc/40?img=32',
    },
    {
      id: 12,
      content:
        'iPhone 17 camera selfie cải tiến rõ rệt, chụp chân dung xóa phông đẹp tự nhiên. Dynamic Island tiện hơn mình nghĩ. Đặt online lúc 9h sáng, nhận hàng lúc 11h, quá nhanh!',
      rating: 5,
      name: 'Bùi Thùy Dương',
      product: 'iPhone 17 — 256GB Hồng',
      avatar: 'https://i.pravatar.cc/40?img=44',
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
    handleResize();
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
      }, 500);
      return () => clearTimeout(timeout);
    }
    return undefined;
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
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-apple-gray">
      <HeroBannerSlider />
      <BrandCarousel />
      <CategoryProducts />
      <NewestByBrand />

      <section
        ref={statsRef}
        className="w-full bg-apple-black py-12 md:py-20 lg:py-28 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000"
      >
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-between gap-2 p-4 text-center md:p-6 lg:px-8">
                <span className="text-4xl font-bold tabular-nums tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
                  {i === 3 ? '4.9' : counts[i].toLocaleString('vi-VN')}
                  {stat.suffix}
                </span>
                <span className="max-w-[140px] text-xs font-medium leading-snug text-white/60 md:text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BlogCarousel />

      <section
        className="w-full scroll-reveal bg-white py-12 opacity-0 translate-y-8 transition-all duration-1000 md:py-20 lg:py-28"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="mx-auto mb-10 max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-apple-black md:text-3xl lg:text-4xl">
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="mb-12 text-sm text-apple-secondary md:text-base">Hơn 10.000 khách hàng hài lòng trên toàn quốc</p>
        </div>

        <div className="relative mx-auto max-w-screen-xl px-4 text-left">
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white shadow-md transition-colors hover:bg-apple-gray md:left-4 lg:-left-5"
          >
            <ChevronLeft className="h-5 w-5 text-black" />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white shadow-md transition-colors hover:bg-apple-gray md:right-4 lg:-right-5"
          >
            <ChevronRight className="h-5 w-5 text-black" />
          </button>

          <div className="mx-8 overflow-hidden md:mx-16 lg:mx-12">
            <div
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none',
                display: 'flex',
              }}
            >
              {duplicatedTestimonials.map((t, i) => (
                <div key={i} style={{ minWidth: `${100 / visibleCount}%` }} className="px-2 lg:px-3">
                  <div className="flex h-full flex-col gap-4 rounded-2xl bg-apple-gray p-4 transition-shadow duration-300 hover:shadow-lg md:p-6">
                    <div className="flex items-start justify-between">
                      <span className="font-serif text-3xl leading-none text-apple-blue lg:text-5xl">&quot;</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <span key={j} className="text-sm text-yellow-400">
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="flex-1 text-sm leading-relaxed text-apple-dark">{t.content}</p>

                    <div className="flex items-center gap-3 border-t border-black/5 pt-2">
                      <img src={t.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-apple-black">{t.name}</p>
                        <p className="text-xs text-apple-secondary">{t.product}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(i);
                }}
                className={`transition-all ${
                  currentIndex % testimonials.length === i ? 'h-2 w-2 rounded-full bg-apple-blue' : 'h-2 w-2 rounded-full bg-black/20'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="w-full scroll-reveal bg-apple-gray py-12 opacity-0 translate-y-8 transition-all duration-1000 md:py-20 lg:py-28">
        <div className="mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-apple-black md:text-3xl lg:text-4xl">
            Vì sao nên chọn NexTech?
          </h2>
          <p className="mb-10 text-sm text-apple-secondary md:mb-16 md:text-base">Cam kết mang đến trải nghiệm mua sắm tốt nhất.</p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-apple-blue shadow-lg shadow-apple-blue/30">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-apple-black md:text-xl">Bảo hành chính hãng</h3>
              <p className="text-sm leading-relaxed text-apple-secondary md:text-base">
                Bảo hành lên đến <span className="font-semibold text-apple-black">24 tháng</span>, hỗ trợ bởi hơn{' '}
                <span className="font-semibold text-apple-black">50 trung tâm NexCare</span> trên toàn quốc.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-apple-blue shadow-lg shadow-apple-blue/30">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-apple-black md:text-xl">Giao hàng siêu tốc</h3>
              <p className="text-sm leading-relaxed text-apple-secondary md:text-base">
                Nhận hàng trong <span className="font-semibold text-apple-black">2 giờ</span> nội thành. Miễn phí giao hàng cho đơn từ{' '}
                <span className="font-semibold text-apple-black">500.000đ</span>.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-apple-blue shadow-lg shadow-apple-blue/30">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-apple-black md:text-xl">Sản phẩm độc quyền</h3>
              <p className="text-sm leading-relaxed text-apple-secondary md:text-base">
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
