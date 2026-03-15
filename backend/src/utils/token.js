const crypto = require('crypto');

/**
 * Generate a cryptographically secure random token.
 *
 * Security model:
 *  - rawToken  → sent inside the email URL (secret, never stored in DB)
 *  - hashedToken → SHA-256 of rawToken, stored in DB
 *
 * If the DB is compromised an attacker cannot use the stored hash to
 * craft a valid reset/verify URL without knowing the original rawToken.
 *
 * @returns {{ rawToken: string, hashedToken: string }}
 */
const generateToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex'); // 64 hex chars
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

/**
 * Hash a rawToken received from the URL query string for DB lookup.
 * @param {string} rawToken
 * @returns {string} SHA-256 hash (hex)
 */
const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = { generateToken, hashToken };
