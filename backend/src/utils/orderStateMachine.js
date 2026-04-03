const { AppError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

/**
 * Allowed order status transitions (admin + automated flows).
 * CANCELLED: from PENDING or CONFIRMED only (enforced separately in service).
 */
const ALLOWED_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  // PACKING chỉ qua assign-serial, không PATCH status trực tiếp
  CONFIRMED: ['CANCELLED'],
  PACKING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

/** Admin có thể huỷ từ các trạng thái này (kèm hoàn kho / serial). */
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING'];

/**
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
function canTransition(currentStatus, nextStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(nextStatus);
}

/**
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @throws {AppError}
 */
function validateTransition(currentStatus, nextStatus) {
  if (nextStatus === 'CANCELLED') {
    if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
      throw new AppError(
        `Cannot cancel order in ${currentStatus} status`,
        400,
        ERROR_CODES.ORDER.ORDER_CANNOT_BE_CANCELLED
      );
    }
    return;
  }
  if (!canTransition(currentStatus, nextStatus)) {
    throw new AppError(
      `Invalid transition: ${currentStatus} → ${nextStatus}`,
      400,
      ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION
    );
  }
}

module.exports = {
  ALLOWED_TRANSITIONS,
  CANCELLABLE_STATUSES,
  canTransition,
  validateTransition,
};
