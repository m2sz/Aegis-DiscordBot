const { ChannelType, MessageFlags, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed } = require('../../utils/embeds');
const { updateGuildConfig } = require('../../services/guildConfigService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-settings')
    .setDescription('Configure ticket categories and support role.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName('open_category')
        .setDescription('Category used for open tickets')
        .addChannelTypes(ChannelType.GuildCategory)
    )
    .addChannelOption((option) =>
      option
        .setName('archive_category')
        .setDescription('Category used for closed tickets')
        .addChannelTypes(ChannelType.GuildCategory)
    )
    .addRoleOption((option) =>
      option.setName('support_role').setDescription('Role allowed to manage tickets')
    ),
  async execute(interaction) {
    const openCategory = interaction.options.getChannel('open_category');
    const archiveCategory = interaction.options.getChannel('archive_category');
    const supportRole = interaction.options.getRole('support_role');
    const update = {};

    if (openCategory) {
      update.ticketCategoryId = openCategory.id;
    }

    if (archiveCategory) {
      update.ticketArchiveChannelId = archiveCategory.id;
    }

    if (supportRole) {
      update.supportRoleIds = [supportRole.id];
    }

    await updateGuildConfig(interaction.guild.id, update);

    await interaction.reply({
      embeds: [createSuccessEmbed('Ticket settings updated', 'Ticket configuration saved successfully.')],
      flags: MessageFlags.Ephemeral,
    });
  },
};