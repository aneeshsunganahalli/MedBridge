const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
  return `${day} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDateTime(dateStr, timeStr) {
  return `${formatDate(dateStr)} · ${formatTime(timeStr)}`;
}

export function getDayName(dayOfWeek, full = false) {
  return full ? DAY_NAMES_FULL[dayOfWeek] : DAY_NAMES[dayOfWeek];
}

export function formatRelativeTime(dateTimeStr) {
  const target = new Date(dateTimeStr);
  const now = new Date();
  const diff = target - now;
  const absDiff = Math.abs(diff);

  if (absDiff < 60 * 1000) return 'Just now';
  if (absDiff < 60 * 60 * 1000) {
    const mins = Math.round(absDiff / (60 * 1000));
    return diff > 0 ? `In ${mins} min` : `${mins} min ago`;
  }
  if (absDiff < 24 * 60 * 60 * 1000) {
    const hrs = Math.round(absDiff / (60 * 60 * 1000));
    return diff > 0 ? `In ${hrs} hr` : `${hrs} hr ago`;
  }

  // Check if tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (target.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${formatTime(target.toTimeString())}`;
  }

  const days = Math.round(absDiff / (24 * 60 * 60 * 1000));
  if (days <= 7) {
    return diff > 0 ? `In ${days} days` : `${days} days ago`;
  }

  return formatDate(target.toISOString().split('T')[0]);
}
