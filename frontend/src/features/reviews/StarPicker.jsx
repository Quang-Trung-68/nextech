import { useState } from 'react';

/**
 * StarPicker — 5 ngôi sao click được để chọn rating.
 *
 * Props:
 *   value     — number (giá trị hiện tại 1–5, 0 = chưa chọn)
 *   onChange  — (rating: number) => void
 *   disabled  — boolean
 */
const StarPicker = ({ value = 0, onChange, disabled = false }) => {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Chọn số sao">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} sao`}
          disabled={disabled}
          className="p-0.5 transition-transform duration-100 hover:scale-110 focus:outline-none disabled:pointer-events-none"
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => !disabled && setHovered(0)}
          onClick={() => !disabled && onChange(star)}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={star <= active ? '#f59e0b' : '#e5e7eb'}
              stroke={star <= active ? '#d97706' : '#d1d5db'}
              strokeWidth="0.5"
              strokeLinejoin="round"
              style={{ transition: 'fill 0.12s ease, stroke 0.12s ease' }}
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default StarPicker;
