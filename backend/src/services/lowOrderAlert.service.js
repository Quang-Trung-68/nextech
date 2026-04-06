const prisma = require('../utils/prisma');
const notificationService = require('./notification.service');

const VN_TZ = 'Asia/Ho_Chi_Minh';

function pad(n) {
  return String(n).padStart(2, '0');
}

/** @returns {{ year: number, month: number, day: number, hour: number, minute: number, second: number }} */
function getVNParts(d = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const map = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return {
    year: +map.year,
    month: +map.month,
    day: +map.day,
    hour: +map.hour,
    minute: +map.minute,
    second: +map.second,
  };
}

/** Mốc thời gian theo múi giờ VN (+07:00, không DST) */
function vnInstant(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+07:00`,
  );
}

/** Kỳ giờ trước [start, end) — chạy job đúng đầu giờ (vd 15:00 thì đếm 14:00–15:00) */
function previousHourRangeVN(anchor) {
  const p = getVNParts(anchor);
  const end = vnInstant(p.year, p.month, p.day, p.hour);
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  return { start, end };
}

/** Cả ngày hôm qua theo lịch VN [00:00 hôm qua, 00:00 hôm nay) — job chạy ~00:05 */
function yesterdayRangeVN(anchor) {
  const p = getVNParts(anchor);
  const end = vnInstant(p.year, p.month, p.day, 0, 0, 0);
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Tháng trước theo lịch VN [đầu tháng trước, đầu tháng này) — job chạy ngày 1 ~00:05 */
function previousMonthRangeVN(anchor) {
  const p = getVNParts(anchor);
  const thisMonthStart = vnInstant(p.year, p.month, 1, 0, 0, 0);
  let py = p.year;
  let pm = p.month - 1;
  if (pm < 1) {
    pm = 12;
    py -= 1;
  }
  const prevMonthStart = vnInstant(py, pm, 1, 0, 0, 0);
  return { start: prevMonthStart, end: thisMonthStart };
}

function periodKeyForWindow(interval, start) {
  const p = getVNParts(start);
  if (interval === 'HOURLY') {
    return `H|${p.year}-${pad(p.month)}-${pad(p.day)}|${pad(p.hour)}`;
  }
  if (interval === 'DAILY') {
    return `D|${p.year}-${pad(p.month)}-${pad(p.day)}`;
  }
  if (interval === 'MONTHLY') {
    return `M|${p.year}-${pad(p.month)}`;
  }
  return null;
}

function describeWindow(interval, start, end) {
  const opts = { timeZone: VN_TZ, dateStyle: 'short', timeStyle: 'short' };
  const a = start.toLocaleString('vi-VN', opts);
  const b = end.toLocaleString('vi-VN', opts);
  if (interval === 'HOURLY') return `kỳ 1 giờ ${a} → ${b}`;
  if (interval === 'DAILY') return `cả ngày ${start.toLocaleDateString('vi-VN', { timeZone: VN_TZ })}`;
  const ps = getVNParts(start);
  return `cả tháng ${pad(ps.month)}/${ps.year}`;
}

/**
 * Đếm đơn hợp lệ (không tính đơn đã hủy) trong [start, end).
 */
async function countOrdersInRange(start, end) {
  return prisma.order.count({
    where: {
      createdAt: { gte: start, lt: end },
      status: { notIn: ['CANCELLED'] },
    },
  });
}

/**
 * @param {'HOURLY'|'DAILY'|'MONTHLY'} tickInterval — cron nào gọi (chỉ xử lý nếu trùng cấu hình shop)
 */
async function runLowOrderAlertCheck(tickInterval) {
  const settings = await prisma.shopSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (!settings?.lowOrderAlertEnabled) return;
  if (settings.lowOrderAlertInterval !== tickInterval) return;

  const threshold = settings.lowOrderAlertThreshold ?? 0;
  const anchor = new Date();

  let start;
  let end;
  if (tickInterval === 'HOURLY') {
    ({ start, end } = previousHourRangeVN(anchor));
  } else if (tickInterval === 'DAILY') {
    ({ start, end } = yesterdayRangeVN(anchor));
  } else {
    ({ start, end } = previousMonthRangeVN(anchor));
  }

  const periodKey = periodKeyForWindow(tickInterval, start);
  if (!periodKey) return;

  if (settings.lowOrderAlertLastPeriodKey === periodKey) {
    return;
  }

  const count = await countOrdersInRange(start, end);
  if (count >= threshold) {
    return;
  }

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  if (!admins.length) return;

  const windowLabel = describeWindow(tickInterval, start, end);
  const title = 'Cảnh báo đơn hàng thấp';
  const message = `Số đơn trong ${windowLabel} là ${count}, thấp hơn ngưỡng ${threshold} (theo cài đặt).`;

  for (const admin of admins) {
    try {
      await notificationService.createAndSend(admin.id, 'low_order_volume', title, message, {
        interval: tickInterval,
        periodKey,
        count,
        threshold,
        rangeStart: start.toISOString(),
        rangeEnd: end.toISOString(),
      });
    } catch (err) {
      console.error('[LowOrderAlert] notification error:', err);
    }
  }

  await prisma.shopSettings.update({
    where: { id: 'singleton' },
    data: { lowOrderAlertLastPeriodKey: periodKey },
  });

  console.log(
    `[LowOrderAlert] Sent for ${tickInterval} period ${periodKey}: count=${count} < threshold=${threshold}`,
  );
}

module.exports = {
  runLowOrderAlertCheck,
  // export helpers for potential tests
  getVNParts,
  previousHourRangeVN,
  yesterdayRangeVN,
  previousMonthRangeVN,
};
