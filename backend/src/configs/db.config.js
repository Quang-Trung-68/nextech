const dotenv = require('dotenv');
dotenv.config();

/**
 * Database configuration.
 */
const dbConfig = {
  databaseUrl: process.env.DATABASE_URL,
};

module.exports = dbConfig;
