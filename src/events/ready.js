const logger = require('../config/logger');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    logger.info(`Logged in as ${client.user.tag}`);
    client.user.setActivity('server operations');
  },
};