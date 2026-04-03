import Pusher from 'pusher-js';
import axiosInstance from './axios';

const noopChannel = {
  bind: () => {},
  unbind: () => {},
};

/** Không mở WebSocket khi tắt hoặc thiếu key (tránh spam lỗi console khi không chạy Soketi). */
function createNoopPusher() {
  return {
    subscribe: () => noopChannel,
    unsubscribe: () => {},
    disconnect: () => {},
  };
}

const appKey = import.meta.env.VITE_SOKETI_APP_KEY;
const host = import.meta.env.VITE_SOKETI_HOST;
const disabled =
  import.meta.env.VITE_SOKETI_DISABLED === 'true' ||
  import.meta.env.VITE_SOKETI_DISABLED === '1';

/** Bật rõ ràng mới mở WebSocket (tránh spam lỗi khi chưa chạy Soketi). Docker Compose set VITE_SOKETI_ENABLED=true. */
const enabled =
  import.meta.env.VITE_SOKETI_ENABLED === 'true' ||
  import.meta.env.VITE_SOKETI_ENABLED === '1';

let pusher;
if (!enabled || !appKey || disabled || !host) {
  pusher = createNoopPusher();
} else {
  pusher = new Pusher(appKey, {
    wsHost: host,
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
}

export default pusher;
