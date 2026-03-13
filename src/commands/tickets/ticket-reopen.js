const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { reopenTicket } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-reopen')
    .setDescription('Reopen a previously closed ticket channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const result = await reopenTicket(interaction.guild, interaction.channel.id, interaction.user.id);

    if (!result) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            'Reopen failed',
            'This command can only be used in a closed ticket channel.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [createSuccessEmbed('Ticket reopened', 'The ticket has been moved back to the active queue.')],
    });
  },
};