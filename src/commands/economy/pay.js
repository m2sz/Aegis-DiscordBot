const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { transferCredits } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfer credits to another member.')
    .addUserOption((option) =>
      option.setName('member').setDescription('Recipient of the transfer').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of credits to send')
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction) {
    const recipient = interaction.options.getUser('member', true);
    const amount = interaction.options.getInteger('amount', true);

    try {
      const { sender } = await transferCredits(
        interaction.guild.id,
        interaction.user.id,
        recipient.id,
        amount
      );

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Transfer completed',
            `Sent ${formatCredits(amount)} to ${recipient}. Remaining balance: ${formatCredits(sender.wallet)}.`
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Transfer failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};