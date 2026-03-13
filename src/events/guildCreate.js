const { getGuildConfig } = require('../services/guildConfigService');

module.exports = {
  name: 'guildCreate',
  async execute(client, guild) {
    await getGuildConfig(guild.id);
  },
};