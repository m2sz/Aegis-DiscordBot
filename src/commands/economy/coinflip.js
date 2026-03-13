const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { playCoinflip } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Bet credits on a coin flip.')
    .addIntegerOption((option) =>
      option
        .setName('bet')
        .setDescription('Amount to bet')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption((option) =>
      option
        .setName('side')
        .setDescription('Choose heads or tails')
        .setRequired(true)
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        )
    ),
  async execute(interaction) {
    const bet = interaction.options.getInteger('bet', true);
    const side = interaction.options.getString('side', true);

    try {
      const result = await playCoinflip(interaction.guild.id, interaction.user.id, bet, side);
      const title = result.isWin ? 'Coinflip won' : 'Coinflip lost';
      const outcome = result.isWin ? `+${formatCredits(result.profit)}` : `-${formatCredits(Math.abs(result.profit))}`;

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            title,
            [
              `You picked **${result.selectedSide}**, coin landed on **${result.rolledSide}**.`,
              `Result: ${outcome}`,
              `Wallet now: ${formatCredits(result.profile.wallet)}`,
            ].join('\n')
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Coinflip failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};