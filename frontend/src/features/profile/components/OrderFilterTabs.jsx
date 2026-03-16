const STATUS_FILTERS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xử lý', value: 'PENDING' },
  { label: 'Đang xử lý', value: 'PROCESSING' },
  { label: 'Đang giao', value: 'SHIPPED' },
  { label: 'Đã giao', value: 'DELIVERED' },
  { label: 'Đã huỷ', value: 'CANCELLED' },
];

const OrderFilterTabs = ({ activeStatus, onChange }) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STATUS_FILTERS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
            activeStatus === value
              ? 'bg-apple-blue text-white border-apple-blue shadow-sm'
              : 'bg-white text-apple-dark border-[#d2d2d7] hover:border-apple-blue hover:text-apple-blue'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default OrderFilterTabs;
