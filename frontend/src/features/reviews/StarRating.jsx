import { useId } from 'react';

/**
 * StarRating — hiển thị sao tĩnh (read-only) theo giá trị rating.
 * Hỗ trợ sao nửa bằng cách dùng SVG clipPath.
 *
 * Props:
 *   rating  — number (0 – 5), có thể là số thực (VD: 4.3)
 *   size    — px size của mỗi sao (default 20)
 *   color   — màu fill sao (default #f59e0b amber-400)
 */
const StarRating = ({ rating = 0, size = 20, color = '#f59e0b' }) => {
  const idBase = useId().replace(/:/g, '');
  const stars = [1, 2, 3, 4, 5];

  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} trên 5 sao`}>
      {stars.map((star) => {
        // Tỉ lệ fill: 0 → 1 (0 = rỗng, 0.5 = nửa, 1 = đầy)
        const fill = Math.min(1, Math.max(0, rating - star + 1));
        const clipId = `star-clip-${star}-${idBase}`;

        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={24 * fill} height="24" />
              </clipPath>
            </defs>
            {/* Sao nền (rỗng) */}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#e5e7eb"
            />
            {/* Sao fill theo tỉ lệ */}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={color}
              clipPath={`url(#${clipId})`}
            />
          </svg>
        );
      })}
    </span>
  );
};

export default StarRating;
