const { MessageFlags, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed } = require('../../utils/embeds');
const { updateGuildConfig } = require('../../services/guildConfigService');
const { createTicketPanel } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Publish the ticket creation panel in the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addRoleOption((option) =>
      option.setName('support_role').setDescription('Role that should handle tickets')
    ),
  async execute(interaction) {
    const supportRole = interaction.options.getRole('support_role');

    const panelMessage = await createTicketPanel(interaction.channel, supportRole);
    await updateGuildConfig(interaction.guild.id, {
      ticketPanelChannelId: interaction.channel.id,
      ...(supportRole ? { supportRoleIds: [supportRole.id] } : {}),
    });

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'Ticket panel deployed',
          `Ticket panel published in ${interaction.channel}. Message ID: ${panelMessage.id}.`
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};