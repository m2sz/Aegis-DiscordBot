const { ChannelType } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');
const UserProfile = require('../models/UserProfile');
const { getGuildConfig, getNextCaseNumber } = require('./guildConfigService');
const { createInfoEmbed } = require('../utils/embeds');
const env = require('../config/env');

async function createModerationCase({ guildId, moderatorId, targetId, action, reason, metadata = {} }) {
  const caseNumber = await getNextCaseNumber(guildId);
  return ModerationCase.create({
    guildId,
    caseNumber,
    moderatorId,
    targetId,
    action,
    reason,
    metadata,
  });
}

async function incrementWarningCount(guildId, userId) {
  return UserProfile.findOneAndUpdate(
    { guildId, userId },
    { $inc: { warningsCount: 1 }, $setOnInsert: { guildId, userId } },
    { new: true, upsert: true }
  );
}

async function getCasesForUser(guildId, userId, limit = 10) {
  return ModerationCase.find({ guildId, targetId: userId }).sort({ createdAt: -1 }).limit(limit);
}

async function resolveOrCreateLogChannel(guild) {
  const guildConfig = await getGuildConfig(guild.id);
  const preferredChannelId = guildConfig.modLogChannelId || env.defaultLogChannelId;

  if (preferredChannelId) {
    const existingChannel = guild.channels.cache.get(preferredChannelId);
    if (existingChannel) {
      if (guildConfig.modLogChannelId !== existingChannel.id) {
        await guildConfig.updateOne({ modLogChannelId: existingChannel.id });
      }
      return existingChannel;
    }
  }

  const namedChannel = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildText && channel.name === env.defaultLogChannelName
  );

  if (namedChannel) {
    return namedChannel;
  }

  const channel = await guild.channels.create({
    name: env.defaultLogChannelName,
    type: ChannelType.GuildText,
    reason: 'Create moderation log channel',
  });

  await guildConfig.updateOne({ modLogChannelId: channel.id });

  return channel;
}

async function sendModerationLog(guild, moderationCase) {
  const channel = await resolveOrCreateLogChannel(guild);
  const embed = createInfoEmbed(
    `Case #${moderationCase.caseNumber} • ${moderationCase.action}`,
    [
      `**Target:** <@${moderationCase.targetId}>`,
      `**Moderator:** <@${moderationCase.moderatorId}>`,
      `**Reason:** ${moderationCase.reason}`,
    ].join('\n')
  );

  if (moderationCase.metadata?.duration) {
    embed.addFields({ name: 'Duration', value: moderationCase.metadata.duration, inline: true });
  }

  await channel.send({ embeds: [embed] });
}

module.exports = {
  createModerationCase,
  incrementWarningCount,
  getCasesForUser,
  resolveOrCreateLogChannel,
  sendModerationLog,
};