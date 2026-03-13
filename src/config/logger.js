function timestamp() {
  return new Date().toISOString();
}

function write(level, message, meta) {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
  console.log(`[${timestamp()}] [${level}] ${message}${suffix}`);
}

module.exports = {
  info(message, meta) {
    write('INFO', message, meta);
  },
  warn(message, meta) {
    write('WARN', message, meta);
  },
  error(message, meta) {
    write('ERROR', message, meta);
  },
};