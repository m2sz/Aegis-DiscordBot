const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { claimTicket, getTicketByChannel } = require('../../services/ticketService');

module.exports = {
  customId: 'ticket:claim',
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        embeds: [createErrorEmbed('Permission denied', 'Only staff members can claim tickets.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const ticket = await getTicketByChannel(interaction.channel.id);

    if (!ticket) {
      await interaction.reply({
        embeds: [createErrorEmbed('Ticket not found', 'This button can only be used inside a ticket channel.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await claimTicket(interaction.channel.id, interaction.user.id);

    await interaction.reply({
      embeds: [createSuccessEmbed('Ticket claimed', `${interaction.user} is now handling this ticket.`)],
    });
  },
};