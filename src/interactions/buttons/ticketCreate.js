const { MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { createTicketChannel } = require('../../services/ticketService');

module.exports = {
  customId: 'ticket:create',
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const result = await createTicketChannel(interaction.guild, interaction.user);

    if (result.existingTicket) {
      await interaction.editReply({
        embeds: [
          createErrorEmbed(
            'Ticket already open',
            `You already have an active ticket: <#${result.existingTicket.channelId}>.`
          ),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        createSuccessEmbed(
          'Ticket created',
          `Your private support channel is ready: ${result.channel}.`
        ),
      ],
    });
  },
};