const crypto = require('crypto');

/**
 * Generates a random, secure hex string to be used as a password reset token.
 * @returns {string} The raw token (to be sent via email).
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hashes a token for secure database storage.
 * @param {string} token - The raw token.
 * @returns {string} The hashed token (sha256).
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = { generateResetToken, hashToken };
