const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { closeTicket, getTicketByChannel } = require('../../services/ticketService');

module.exports = {
  customId: 'ticket:close',
  async execute(interaction) {
    const ticket = await getTicketByChannel(interaction.channel.id);

    if (!ticket) {
      await interaction.reply({
        embeds: [createErrorEmbed('Ticket not found', 'This button can only be used inside a ticket channel.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const canClose =
      interaction.user.id === ticket.ownerId ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

    if (!canClose) {
      await interaction.reply({
        embeds: [
          createErrorEmbed('Permission denied', 'Only the ticket owner or staff can close this ticket.'),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await closeTicket(interaction.guild, interaction.channel.id, interaction.user.id);

    await interaction.reply({
      embeds: [createSuccessEmbed('Ticket archived', 'This ticket has been closed and moved to the archive.')],
      flags: MessageFlags.Ephemeral,
    });
  },
};