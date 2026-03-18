require('dotenv').config();
const emailJob = require('./src/jobs/emailJob');

async function testEmail() {
  console.log("Sending test email...");
  await emailJob.dispatchPasswordChangedEmail('trungsu23@gmail.com', { name: 'Test User 123' });
  console.log("If no errors, the mail was dispatched successfully.");
  process.exit(0);
}
testEmail();
