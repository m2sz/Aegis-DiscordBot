const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const Ticket = require('../models/Ticket');
const env = require('../config/env');
const { getGuildConfig, updateGuildConfig } = require('./guildConfigService');
const { createInfoEmbed, createSuccessEmbed } = require('../utils/embeds');
const { normalizeChannelName } = require('../utils/formatters');

async function ensureCategory(guild, configuredCategoryId, fallbackName) {
  if (configuredCategoryId) {
    const category = guild.channels.cache.get(configuredCategoryId);
    if (category) {
      return category;
    }
  }

  const existing = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name === fallbackName
  );

  if (existing) {
    return existing;
  }

  return guild.channels.create({
    name: fallbackName,
    type: ChannelType.GuildCategory,
    reason: 'Create ticket category',
  });
}

async function getOpenTicketByOwner(guildId, ownerId) {
  return Ticket.findOne({ guildId, ownerId, status: 'open' });
}

async function getTicketByChannel(channelId) {
  return Ticket.findOne({ channelId });
}

async function createTicketChannel(guild, user) {
  const guildConfig = await getGuildConfig(guild.id);
  const existingTicket = await getOpenTicketByOwner(guild.id, user.id);

  if (existingTicket) {
    return { existingTicket };
  }

  const category = await ensureCategory(
    guild,
    guildConfig.ticketCategoryId || env.defaultTicketCategoryId,
    env.defaultTicketCategoryName
  );

  if (guildConfig.ticketCategoryId !== category.id) {
    await updateGuildConfig(guild.id, { ticketCategoryId: category.id });
  }

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  for (const roleId of guildConfig.supportRoleIds) {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: normalizeChannelName(`ticket-${user.username}-${user.id.slice(-4)}`),
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites,
    topic: `Support ticket for ${user.tag} (${user.id})`,
    reason: `Create support ticket for ${user.tag}`,
  });

  const ticket = await Ticket.create({
    guildId: guild.id,
    channelId: channel.id,
    ownerId: user.id,
  });

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:claim')
      .setLabel('Claim')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket:close')
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${user} your ticket has been created. A team member will be with you shortly.`,
    embeds: [
      createInfoEmbed(
        'Support ticket opened',
        'Use the controls below to claim or close this ticket. Keep the conversation focused so the team can help efficiently.'
      ),
    ],
    components: [actionRow],
  });

  return { ticket, channel };
}

async function closeTicket(guild, channelId, closedById) {
  const ticket = await getTicketByChannel(channelId);

  if (!ticket || ticket.status === 'closed') {
    return null;
  }

  const guildConfig = await getGuildConfig(guild.id);
  const archiveCategory = await ensureCategory(
    guild,
    guildConfig.ticketArchiveChannelId || env.defaultTicketArchiveCategoryId,
    env.defaultTicketArchiveName
  );

  if (guildConfig.ticketArchiveChannelId !== archiveCategory.id) {
    await updateGuildConfig(guild.id, { ticketArchiveChannelId: archiveCategory.id });
  }

  const channel = guild.channels.cache.get(channelId);

  if (channel) {
    await channel.setParent(archiveCategory.id, { lockPermissions: false });
    await channel.permissionOverwrites.edit(ticket.ownerId, {
      ViewChannel: false,
      SendMessages: false,
    });
    await channel.setName(normalizeChannelName(`closed-${channel.name}`));
    await channel.send({
      embeds: [
        createSuccessEmbed('Ticket closed', `Closed by <@${closedById}>. This channel is now archived.`),
      ],
      components: [],
    });
  }

  ticket.status = 'closed';
  ticket.closedById = closedById;
  ticket.closedAt = new Date();
  await ticket.save();

  return ticket;
}

async function reopenTicket(guild, channelId, reopenedById) {
  const ticket = await getTicketByChannel(channelId);

  if (!ticket || ticket.status === 'open') {
    return null;
  }

  const guildConfig = await getGuildConfig(guild.id);
  const openCategory = await ensureCategory(
    guild,
    guildConfig.ticketCategoryId || env.defaultTicketCategoryId,
    env.defaultTicketCategoryName
  );

  if (guildConfig.ticketCategoryId !== openCategory.id) {
    await updateGuildConfig(guild.id, { ticketCategoryId: openCategory.id });
  }

  const channel = guild.channels.cache.get(channelId);

  if (channel) {
    await channel.setParent(openCategory.id, { lockPermissions: false });
    await channel.permissionOverwrites.edit(ticket.ownerId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
    });
    await channel.setName(channel.name.replace(/^closed-/, 'ticket-'));
    await channel.send({
      embeds: [
        createSuccessEmbed('Ticket reopened', `Reopened by <@${reopenedById}>. The owner can now reply again.`),
      ],
    });
  }

  ticket.status = 'open';
  ticket.closedById = null;
  ticket.closedAt = null;
  await ticket.save();

  return ticket;
}

async function addTicketParticipant(guild, channelId, userId) {
  const ticket = await getTicketByChannel(channelId);

  if (!ticket || ticket.status !== 'open') {
    return null;
  }

  const channel = guild.channels.cache.get(channelId);

  if (!channel) {
    return null;
  }

  await channel.permissionOverwrites.edit(userId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
  });

  if (!ticket.participantIds.includes(userId)) {
    ticket.participantIds.push(userId);
    await ticket.save();
  }

  return ticket;
}

async function removeTicketParticipant(guild, channelId, userId) {
  const ticket = await getTicketByChannel(channelId);

  if (!ticket || ticket.status !== 'open') {
    return null;
  }

  const channel = guild.channels.cache.get(channelId);

  if (!channel) {
    return null;
  }

  if (ticket.ownerId === userId) {
    throw new Error('You cannot remove the ticket owner.');
  }

  await channel.permissionOverwrites.edit(userId, {
    ViewChannel: false,
    SendMessages: false,
    ReadMessageHistory: false,
  });

  ticket.participantIds = ticket.participantIds.filter((participantId) => participantId !== userId);
  await ticket.save();

  return ticket;
}

async function claimTicket(channelId, moderatorId) {
  const ticket = await getTicketByChannel(channelId);

  if (!ticket) {
    return null;
  }

  ticket.claimedById = moderatorId;
  await ticket.save();
  return ticket;
}

async function createTicketPanel(targetChannel, supportRole) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:create')
      .setLabel('Open a Ticket')
      .setStyle(ButtonStyle.Primary)
  );

  const description = [
    'Open a private ticket for support, purchase requests, reports, or partnership questions.',
    'A dedicated channel will be created and only you plus the support team will have access.',
  ];

  if (supportRole) {
    description.push(`Assigned team role: ${supportRole}`);
  }

  return targetChannel.send({
    embeds: [createInfoEmbed('Support Center', description.join('\n\n'))],
    components: [row],
  });
}

module.exports = {
  getOpenTicketByOwner,
  getTicketByChannel,
  createTicketChannel,
  closeTicket,
  reopenTicket,
  claimTicket,
  addTicketParticipant,
  removeTicketParticipant,
  createTicketPanel,
};