const { AppError } = require('../errors/AppError');

/**
 * Allowed PostStatus transitions (admin-managed news; no community review flow).
 * @type {Record<string, string[]>}
 */
const ALLOWED_TRANSITIONS = {
  DRAFT: ['PUBLISHED', 'SCHEDULED', 'ARCHIVED'],
  SCHEDULED: ['PUBLISHED', 'ARCHIVED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

/**
 * @param {import('@prisma/client').PostStatus} current
 * @param {import('@prisma/client').PostStatus} next
 */
function assertTransitionAllowed(current, next) {
  if (current === next) return;
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw new AppError(
      `Invalid status transition: ${current} → ${next}`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

module.exports = { assertTransitionAllowed, ALLOWED_TRANSITIONS };
