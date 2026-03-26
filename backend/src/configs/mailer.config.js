/**
 * Nodemailer transport configuration.
 * Uses Gmail with an App Password (not your account password).
 *
 * To generate a Gmail App Password:
 *  1. Enable 2-Step Verification on your Google account
 *  2. Go to https://myaccount.google.com/apppasswords
 *  3. Generate a new app password for "Mail"
 */
const mailerConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
};

module.exports = mailerConfig;
