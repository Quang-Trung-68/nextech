const cron = require('node-cron');
const postService = require('../services/post.service');

// Chạy mỗi 1 phút — đăng bài SCHEDULED khi đến giờ
cron.schedule('* * * * *', async () => {
  try {
    const n = await postService.publishDueScheduledPosts();
    if (n > 0) {
      console.log(`[PublishScheduledJob] Published ${n} scheduled post(s).`);
    }
  } catch (err) {
    console.error('[PublishScheduledJob] Error:', err);
  }
});

module.exports = {};
