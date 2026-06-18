import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';

export default function SaleCountdownBadge({ saleExpiresAt, isSaleActive }) {
  // Always call hook before any conditional returns (Rules of Hooks)
  const { days, hours, minutes, seconds, isExpired, totalMs } = useCountdown(
    isSaleActive && saleExpiresAt ? saleExpiresAt : null
  );

  if (!isSaleActive || !saleExpiresAt) return null;
  if (isExpired) return null;

  if (totalMs > 24 * 60 * 60 * 1000) {
    return (
      <span className="flex-1 justify-center inline-flex items-center rounded-full px-1 py-1 text-[13px] font-bold bg-orange-100 text-orange-700 border border-orange-300 text-center">
        Còn {days} ngày
      </span>
    );
  }

  return (
    <span className="flex-1 justify-center inline-flex items-center rounded-full px-1 py-1 text-[13px] font-bold bg-red-100 text-red-700 border border-red-300 text-center">
      <span className="font-mono">{hours}:{minutes}:{seconds}</span>
    </span>
  );
}
