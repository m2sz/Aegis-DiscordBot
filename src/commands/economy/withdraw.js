const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { withdrawCredits } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Move credits from your bank back to your wallet.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Amount to withdraw')
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);

    try {
      const profile = await withdrawCredits(interaction.guild.id, interaction.user.id, amount);

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Withdrawal completed',
            `Withdrew ${formatCredits(amount)}. Wallet: ${formatCredits(profile.wallet)} • Bank: ${formatCredits(profile.bank)}.`
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Withdrawal failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};