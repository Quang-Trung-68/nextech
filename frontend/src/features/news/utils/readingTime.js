/**
 * Ước lượng thời gian đọc (phút) từ HTML — không đọc DB.
 * Tốc độ mặc định ~200 từ/phút (đọc tiếng Việt trung bình).
 */
export function estimateReadingMinutesFromHtml(html, wordsPerMinute = 200) {
  if (!html || typeof html !== 'string') return 1;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
