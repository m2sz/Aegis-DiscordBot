const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { getTicketByChannel, removeTicketParticipant } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-remove')
    .setDescription('Remove a member from the current ticket channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to remove from this ticket').setRequired(true)
    ),
  async execute(interaction) {
    const member = interaction.options.getUser('member', true);
    const ticket = await getTicketByChannel(interaction.channel.id);

    if (!ticket || ticket.status !== 'open') {
      await interaction.reply({
        embeds: [createErrorEmbed('Invalid channel', 'This command can only be used in an open ticket.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await removeTicketParticipant(interaction.guild, interaction.channel.id, member.id);

      await interaction.reply({
        embeds: [createSuccessEmbed('Participant removed', `${member} has been removed from this ticket.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Cannot remove participant', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};