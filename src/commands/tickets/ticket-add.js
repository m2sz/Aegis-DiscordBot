const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { addTicketParticipant, getTicketByChannel } = require('../../services/ticketService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-add')
    .setDescription('Add a member to the current ticket channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to add to this ticket').setRequired(true)
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

    await addTicketParticipant(interaction.guild, interaction.channel.id, member.id);

    await interaction.reply({
      embeds: [createSuccessEmbed('Participant added', `${member} now has access to this ticket.`)],
    });
  },
};