import Pusher from 'pusher-js';

const pusher = new Pusher(import.meta.env.VITE_SOKETI_APP_KEY, {
  wsHost: import.meta.env.VITE_SOKETI_HOST,
  wsPort: Number(import.meta.env.VITE_SOKETI_PORT),
  forceTLS: import.meta.env.VITE_SOKETI_FORCE_TLS === 'true',
  disableStats: true,
  enabledTransports: ['ws', 'wss'],
  cluster: 'mt1', // Bắt buộc phải có từ bản Pusher.js 7.x trở lên dù dùng host tùy chỉnh
  authEndpoint: '/api/notifications/auth',
  auth: {
    headers: {}, // Cookie HttpOnly tự gửi — không cần set Authorization header
  },
});

export default pusher;
