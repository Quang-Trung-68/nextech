import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Flame, Zap } from 'lucide-react';
import { homeFlashSaleProductsQueryOptions } from '../home.queries';
import { ProductCard } from '@/features/product/components/ProductCard';
import { useCountdown } from '@/hooks/useCountdown';

function FlashSaleCountdown({ expiresAt }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(expiresAt);

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 font-bold text-red-600 bg-red-50/80 px-4 py-2 rounded-2xl border border-red-100">
        <Zap className="h-4 w-4 text-red-600 animate-pulse" />
        <span>Đã kết thúc</span>
      </div>
    );
  }

  const d = parseInt(days, 10) || 0;

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[13px] font-semibold text-apple-secondary hidden sm:inline uppercase tracking-wider">
        Kết thúc sau:
      </span>
      <div className="flex items-center gap-1.5 font-mono">
        {d > 0 && (
          <>
            <div className="flex flex-col items-center">
              <div className="bg-apple-black text-white text-base md:text-lg px-2.5 py-1.5 rounded-xl font-bold min-w-[34px] text-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-white/10">
                {days}
              </div>
              <span className="text-[10px] text-apple-secondary font-sans font-semibold mt-1">ngày</span>
            </div>
            <span className="text-apple-black font-extrabold text-lg -mt-4">:</span>
          </>
        )}
        <div className="flex flex-col items-center">
          <div className="bg-apple-black text-white text-base md:text-lg px-2.5 py-1.5 rounded-xl font-bold min-w-[34px] text-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-white/10">
            {hours}
          </div>
          <span className="text-[10px] text-apple-secondary font-sans font-semibold mt-1">giờ</span>
        </div>
        <span className="text-apple-black font-extrabold text-lg -mt-4">:</span>
        <div className="flex flex-col items-center">
          <div className="bg-apple-black text-white text-base md:text-lg px-2.5 py-1.5 rounded-xl font-bold min-w-[34px] text-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-white/10">
            {minutes}
          </div>
          <span className="text-[10px] text-apple-secondary font-sans font-semibold mt-1">phút</span>
        </div>
        <span className="text-apple-black font-extrabold text-lg -mt-4">:</span>
        <div className="flex flex-col items-center">
          <div className="bg-[#FF3B30] text-white text-base md:text-lg px-2.5 py-1.5 rounded-xl font-bold min-w-[34px] text-center shadow-[0_4px_12px_rgba(255,59,48,0.25)] border border-white/10 animate-pulse">
            {seconds}
          </div>
          <span className="text-[10px] text-red-500 font-sans font-semibold mt-1">giây</span>
        </div>
      </div>
    </div>
  );
}

export function FlashSale() {
  const { data: products = [], isLoading } = useQuery(homeFlashSaleProductsQueryOptions(6));

  if (isLoading) {
    return (
      <section className="w-full bg-apple-gray py-12">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="h-12 w-48 bg-gray-200 rounded-2xl animate-pulse mb-8" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Gracefully render nothing if no active sales
  }

  // Find the soonest sale expiry time among products
  const soonestExpiry = products.reduce((soonest, p) => {
    if (!p.saleExpiresAt) return soonest;
    const currentExpiry = new Date(p.saleExpiresAt).getTime();
    if (!soonest || currentExpiry < soonest) {
      return currentExpiry;
    }
    return soonest;
  }, null);

  return (
    <section className="w-full bg-apple-gray py-12 md:py-16 overflow-hidden">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Banner Header Container */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white/60 backdrop-blur-xl p-5 md:p-6 rounded-[2.5rem] border border-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9500] shadow-lg shadow-red-500/20 text-white animate-bounce">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-apple-black md:text-2xl uppercase">
                  Flash Sale
                </h2>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              </div>
              <p className="text-xs font-semibold text-apple-secondary uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <Sparkles className="h-3 w-3 text-amber-500" /> Giá cực sốc - Số lượng cực hạn
              </p>
            </div>
          </div>

          {soonestExpiry && <FlashSaleCountdown expiresAt={soonestExpiry} />}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {products.map((product) => {
            const saleStock = product.saleStock || 0;
            const saleSoldCount = product.saleSoldCount || 0;
            const percentSold = saleStock > 0 ? Math.min(100, Math.round((saleSoldCount / saleStock) * 100)) : 0;
            const remaining = Math.max(0, saleStock - saleSoldCount);

            return (
              <div key={product.id} className="flex flex-col h-full gap-3 group">
                <div className="flex-1">
                  <ProductCard product={product} />
                </div>
                {/* Custom Live Progress Indicator */}
                <div className="px-2 pb-2">
                  <div className="relative h-4 w-full rounded-full bg-red-100 overflow-hidden shadow-inner border border-red-50/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#FF9500] to-[#FF3B30] transition-all duration-500 relative"
                      style={{ width: `${percentSold || 5}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-red-900 tracking-wide uppercase select-none">
                      {remaining === 0 ? (
                        'Đã cháy hàng 🔥'
                      ) : percentSold >= 80 ? (
                        `Sắp hết - Chỉ còn ${remaining} ⏰`
                      ) : (
                        `Đã bán ${percentSold}%`
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
