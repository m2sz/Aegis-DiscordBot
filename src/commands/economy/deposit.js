const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { depositCredits } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Move credits from your wallet to your bank.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Amount to deposit')
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);

    try {
      const profile = await depositCredits(interaction.guild.id, interaction.user.id, amount);

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Deposit completed',
            `Deposited ${formatCredits(amount)}. Wallet: ${formatCredits(profile.wallet)} • Bank: ${formatCredits(profile.bank)}.`
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Deposit failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};