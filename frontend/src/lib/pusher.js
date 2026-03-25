import Pusher from 'pusher-js';
import axiosInstance from './axios';

const pusher = new Pusher(import.meta.env.VITE_SOKETI_APP_KEY, {
  wsHost: import.meta.env.VITE_SOKETI_HOST,
  wsPort: Number(import.meta.env.VITE_SOKETI_PORT),
  forceTLS: import.meta.env.VITE_SOKETI_FORCE_TLS === 'true',
  disableStats: true,
  enabledTransports: ['ws', 'wss'],
  cluster: 'mt1',
  channelAuthorization: {
    customHandler: async ({ socketId, channelName }, callback) => {
      try {
        const response = await axiosInstance.post('/notifications/auth', {
          socket_id: socketId,
          channel_name: channelName,
        });
        callback(null, response.data);
      } catch (error) {
        callback(error, null);
      }
    },
  },
});

export default pusher;
