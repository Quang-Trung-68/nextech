const slugify = require('slugify');

/**
 * Generate a URL-friendly slug from a title.
 * Appends a random 4-char hex suffix for uniqueness.
 * Vietnamese-safe (strips diacritics via locale: 'vi').
 *
 * @param {string} title
 * @returns {string}
 */
const generateSlug = (title) => {
  const base = slugify(title, { lower: true, locale: 'vi', strict: true });
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
};

/**
 * Strip all HTML tags from an HTML string.
 *
 * @param {string} html
 * @returns {string}
 */
const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Calculate estimated reading time in minutes.
 * Based on average adult reading speed of 200 wpm.
 * Minimum 1 minute.
 *
 * @param {string} htmlContent - Raw HTML content
 * @returns {number} Minutes to read
 */
const calculateReadTime = (htmlContent) => {
  const text = stripHtml(htmlContent);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

/**
 * Generate a plain-text excerpt from HTML content.
 * Returns up to maxLength characters, appending '...' if truncated.
 * Only used if the author doesn't supply an excerpt manually.
 *
 * @param {string} htmlContent
 * @param {number} maxLength
 * @returns {string}
 */
const generateExcerpt = (htmlContent, maxLength = 300) => {
  const text = stripHtml(htmlContent);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '...';
};

module.exports = { generateSlug, calculateReadTime, generateExcerpt };
