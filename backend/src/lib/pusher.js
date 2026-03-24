const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.SOKETI_APP_ID,
  key: process.env.SOKETI_APP_KEY,
  secret: process.env.SOKETI_APP_SECRET,
  host: process.env.SOKETI_HOST,
  port: process.env.SOKETI_PORT,
  useTLS: process.env.PUSHER_USE_TLS === 'true',
  cluster: 'mt1', // Bắt buộc cho phiên bản Pusher hiện tại dù xài local
});

module.exports = pusher;
