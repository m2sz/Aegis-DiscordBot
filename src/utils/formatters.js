function formatCredits(amount) {
  return `${new Intl.NumberFormat('en-US').format(amount)} credits`;
}

function formatRelativeTime(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

function normalizeChannelName(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 90);
}

module.exports = {
  formatCredits,
  formatRelativeTime,
  normalizeChannelName,
};