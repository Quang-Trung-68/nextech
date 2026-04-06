const cron = require('node-cron');
const { runLowOrderAlertCheck } = require('../services/lowOrderAlert.service');

const TZ = 'Asia/Ho_Chi_Minh';

// Mỗi giờ đúng phút 0 (VN): đếm đơn trong giờ trước
cron.schedule(
  '0 * * * *',
  async () => {
    try {
      await runLowOrderAlertCheck('HOURLY');
    } catch (err) {
      console.error('[LowOrderAlertJob] HOURLY:', err);
    }
  },
  { timezone: TZ },
);

// Mỗi ngày 00:05 VN: đếm đơn cả ngày hôm qua
cron.schedule(
  '5 0 * * *',
  async () => {
    try {
      await runLowOrderAlertCheck('DAILY');
    } catch (err) {
      console.error('[LowOrderAlertJob] DAILY:', err);
    }
  },
  { timezone: TZ },
);

// Ngày 1 hàng tháng 00:05 VN: đếm đơn cả tháng trước
cron.schedule(
  '5 0 1 * *',
  async () => {
    try {
      await runLowOrderAlertCheck('MONTHLY');
    } catch (err) {
      console.error('[LowOrderAlertJob] MONTHLY:', err);
    }
  },
  { timezone: TZ },
);

module.exports = {};
