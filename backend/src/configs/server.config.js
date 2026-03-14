const dotenv = require('dotenv');
dotenv.config();

/**
 * Server / application-level configuration.
 */
const serverConfig = {
  port: process.env.PORT || 3000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
};

module.exports = serverConfig;
