const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate a JWT access token for the given user.
 * @param {Object} user - The user object from the database.
 * @returns {string} - Signed JWT token.
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

module.exports = { generateAccessToken };
