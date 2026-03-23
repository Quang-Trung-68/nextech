import React from 'react';

export default function SaleStockBadge({ saleStock, saleRemaining, isSaleActive }) {
  if (!isSaleActive || saleStock == null) return null;

  if (saleRemaining <= 0) {
    return (
      <span className="flex-1 justify-center inline-flex items-center rounded-full px-2 py-1 text-[13px] font-bold bg-gray-100 text-gray-500 border border-gray-300 line-through text-center">
        Đã hết suất
      </span>
    );
  }

  if (saleRemaining <= saleStock * 0.3) {
    return (
      <span className="flex-1 justify-center inline-flex items-center rounded-full px-2 py-1 text-[13px] font-bold bg-red-50 text-red-600 border border-red-300 text-center">
        Chỉ còn {saleRemaining} suất!
      </span>
    );
  }

  return (
    <span className="flex-1 justify-center inline-flex items-center rounded-full px-2 py-1 text-[13px] font-bold bg-green-50 text-green-700 border border-green-200 text-center">
      Còn {saleRemaining} suất
    </span>
  );
}
