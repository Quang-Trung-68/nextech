import React, { useEffect } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Clock, Award } from 'lucide-react';
import { Button } from '../../components/ui/button';

const HomePage = () => {
  usePageTitle(); // → "NexTech"

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="w-full bg-apple-gray">
      {/* 1. Hero Section */}
      <section className="relative w-full min-h-[90vh] bg-apple-black flex flex-col items-center justify-start pt-24 overflow-hidden">
        <div className="z-10 text-center px-4 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <h2 className="text-white text-5xl md:text-[88px] font-bold tracking-tight md:-tracking-[0.04em] leading-tight mb-4">
            NexPhone 15 Pro
          </h2>
          <p className="text-white/90 text-xl md:text-3xl font-medium tracking-wide mb-8">
            Titanium. Siêu bền. Siêu nhẹ.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/products/nexphone-15-pro">
              <Button className="rounded-full bg-white text-apple-black hover:bg-white/90 px-8 py-6 text-base font-semibold transition-all">
                Mua
              </Button>
            </Link>
            <Link to="/products/nexphone-15-pro-detail" className="group flex items-center text-apple-blue hover:underline text-lg font-medium">
              Tìm hiểu thêm <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        
        {/* Hero Image Mockup */}
        <div className="absolute bottom-0 w-full max-w-[1200px] h-[50vh] md:h-[60vh] flex justify-center items-end scroll-reveal opacity-0 translate-y-8 transition-all duration-1000 delay-300">
          <img 
            src="https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=1200" 
            alt="NexPhone 15 Pro" 
            className="object-cover object-top w-[80%] md:w-[60%] h-full rounded-t-[2.5rem] md:rounded-t-[4rem] shadow-2xl"
          />
        </div>
      </section>

      {/* 2. Product Grid 2x2 */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6 bg-white shrink">
        {/* Card 1: NexPhone */}
        <div className="group relative bg-apple-black h-[600px] flex flex-col items-center pt-16 overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
          <div className="z-10 text-center px-6">
            <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-2">Mới</p>
            <h3 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-2">NexPhone 15</h3>
            <p className="text-white/80 text-lg mb-4">Mới tuyệt đẹp. Rất đáng yêu.</p>
            <p className="text-white/60 text-base mb-6">Từ 22.999.000đ</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/products/nexphone-15" className="px-5 py-2 rounded-full bg-apple-blue text-white text-sm font-semibold hover:bg-apple-blue/90">Mua</Link>
              <Link to="#" className="text-apple-blue hover:underline text-sm font-medium flex items-center">
                Tìm hiểu thêm <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="mt-auto w-[60%] h-[50%]">
             <img src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600" alt="NexPhone" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>

        {/* Card 2: NexBook */}
        <div className="group relative bg-apple-gray h-[600px] flex flex-col items-center pt-16 overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
          <div className="z-10 text-center px-6">
            <p className="text-apple-secondary text-sm font-semibold uppercase tracking-widest mb-2">Sức mạnh Pro</p>
            <h3 className="text-apple-black text-4xl md:text-5xl font-bold tracking-tight mb-2">NexBook Pro</h3>
            <p className="text-apple-dark text-lg mb-4">Trí tuệ nhân tạo. Sáng tạo tối đa.</p>
            <p className="text-apple-secondary text-base mb-6">Từ 39.999.000đ</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/products/nexbook-pro" className="px-5 py-2 rounded-full bg-apple-blue text-white text-sm font-semibold hover:bg-apple-blue/90">Mua</Link>
              <Link to="#" className="text-apple-blue hover:underline text-sm font-medium flex items-center">
                Tìm hiểu thêm <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="relative mt-auto w-[80%] h-[40%] flex justify-center">
             <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800" alt="NexBook" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 rounded-t-2xl shadow-xl" />
          </div>
        </div>

        {/* Card 3: NexPad */}
        <div className="group relative bg-apple-gray h-[600px] flex flex-col items-center pt-16 overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
          <div className="z-10 text-center px-6">
            <p className="text-apple-secondary text-sm font-semibold uppercase tracking-widest mb-2">Đa năng</p>
            <h3 className="text-apple-black text-4xl md:text-5xl font-bold tracking-tight mb-2">NexPad Air</h3>
            <p className="text-apple-dark text-lg mb-4">Mỏng nhẹ. Mạnh mẽ ấn tượng.</p>
            <p className="text-apple-secondary text-base mb-6">Từ 16.999.000đ</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/products/nexpad-air" className="px-5 py-2 rounded-full bg-apple-blue text-white text-sm font-semibold hover:bg-apple-blue/90">Mua</Link>
              <Link to="#" className="text-apple-blue hover:underline text-sm font-medium flex items-center">
                Tìm hiểu thêm <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="relative mt-auto w-[70%] h-[45%] flex justify-center">
             <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800" alt="NexPad" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>

        {/* Card 4: NexWatch */}
        <div className="group relative bg-apple-black h-[600px] flex flex-col items-center pt-16 overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
          <div className="z-10 text-center px-6">
            <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-2">Theo dõi Sức khỏe</p>
            <h3 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-2">NexWatch Series 9</h3>
            <p className="text-white/80 text-lg mb-4">Thông minh hơn. Sáng hơn.</p>
            <p className="text-white/60 text-base mb-6">Từ 9.999.000đ</p>
            <div className="flex items-center justify-center gap-6">
              <Link to="/products/nexwatch-9" className="px-5 py-2 rounded-full bg-apple-blue text-white text-sm font-semibold hover:bg-apple-blue/90">Mua</Link>
              <Link to="#" className="text-apple-blue hover:underline text-sm font-medium flex items-center">
                Tìm hiểu thêm <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="relative mt-8 w-[50%] h-[40%] flex justify-center">
             <img src="https://images.unsplash.com/photo-1434493789847-2f02b9c78f8c?auto=format&fit=crop&q=80&w=600" alt="NexWatch" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>
      </section>

      {/* 4. Feature Section 1 (Black bg) */}
      <section className="w-full bg-apple-black py-24 md:py-[120px] scroll-reveal opacity-0 translate-y-8 transition-all duration-1000">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 flex justify-center">
            <img src="https://images.unsplash.com/photo-1531297484001-[macbook]" alt="Performance" 
                 onError={(e) => { e.target.src="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800"}} 
                 className="w-full max-w-[500px] rounded-xl shadow-2xl" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-white text-5xl md:text-6xl font-bold tracking-tight mb-6">Sức mạnh định hình tương lai.</h2>
            <p className="text-white/70 text-xl font-medium leading-relaxed mb-8">
              Sở hữu chip NexSilicon M3 hoàn toàn mới, NexBook mang đến hiệu năng đồ họa cực đỉnh và thời lượng pin không tưởng. Hoàn hảo cho tác vụ nặng nhất.
            </p>
            <Link to="#" className="text-apple-blue hover:underline text-lg font-medium flex items-center group">
              Khám phá chip M3 <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Feature Section 2 (White bg) */}
      <section className="w-full bg-white py-24 md:py-[120px] scroll-reveal opacity-0 translate-y-8 transition-all duration-1000">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-apple-black text-5xl md:text-6xl font-bold tracking-tight mb-6">Mượt mà trong từng lần chạm.</h2>
            <p className="text-apple-secondary text-xl font-medium leading-relaxed mb-8">
              Màn hình Super Retina XDR với tần số quét 120Hz mang đến trải nghiệm cuộn lướt không độ trễ. Thiết kế viền siêu mỏng đột phá để bạn tận hưởng không gian hiển thị bất tận.
            </p>
            <Link to="#" className="text-apple-blue hover:underline text-lg font-medium flex items-center group">
              Xem thêm về màn hình <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="flex justify-center">
            <img src="https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&q=80&w=800" alt="Display" className="w-full max-w-[400px] drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* 6. Why NexTech */}
      <section className="w-full bg-apple-gray py-24 scroll-reveal opacity-0 translate-y-8 transition-all duration-1000">
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-apple-black tracking-tight mb-16">Vì sao nên chọn NexTech?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-apple-blue/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-apple-blue" />
              </div>
              <h3 className="text-xl font-bold text-apple-black mb-3">Bảo hành chính hãng</h3>
              <p className="text-apple-secondary text-base leading-relaxed">
                Được hỗ trợ bảo hành lên đến 24 tháng bởi đội ngũ chuyên gia NexCare có mặt toàn quốc.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-apple-blue/10 flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-apple-blue" />
              </div>
              <h3 className="text-xl font-bold text-apple-black mb-3">Giao hàng 2 giờ</h3>
              <p className="text-apple-secondary text-base leading-relaxed">
                Nhanh chóng nhận sản phẩm với dịch vụ giao hàng thông minh, miễn phí trong nội thành.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-apple-blue/10 flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-apple-blue" />
              </div>
              <h3 className="text-xl font-bold text-apple-black mb-3">Sản phẩm độc quyền</h3>
              <p className="text-apple-secondary text-base leading-relaxed">
                Cam kết 100% hàng thật, trải nghiệm các thiết bị công nghệ mới nhất sớm nhất.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
