const dotenv = require('dotenv');
dotenv.config();

/**
 * Authentication / JWT configuration.
 */
const authConfig = {
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h',

  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  cookieSecret: process.env.COOKIE_SECRET,
};

module.exports = authConfig;
