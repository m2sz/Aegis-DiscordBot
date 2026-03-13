const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { playSlots } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Spin the slot machine with a wallet bet.')
    .addIntegerOption((option) =>
      option
        .setName('bet')
        .setDescription('Amount to bet')
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction) {
    const bet = interaction.options.getInteger('bet', true);

    try {
      const result = await playSlots(interaction.guild.id, interaction.user.id, bet);
      const rollDisplay = result.rolls.join(' | ');
      const outcome = result.profit >= 0
        ? `+${formatCredits(result.profit)}`
        : `-${formatCredits(Math.abs(result.profit))}`;

      await interaction.reply({
        embeds: [
          createInfoEmbed(
            'Slots result',
            [
              `Roll: **${rollDisplay}**`,
              `Multiplier: x${result.multiplier}`,
              `Result: ${outcome}`,
              `Wallet now: ${formatCredits(result.profile.wallet)}`,
            ].join('\n')
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Slots failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};