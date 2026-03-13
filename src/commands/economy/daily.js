const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits, formatRelativeTime } = require('../../utils/formatters');
const { claimDaily } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily economy reward.'),
  async execute(interaction) {
    const result = await claimDaily(interaction.guild.id, interaction.user.id);

    if (!result.success) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            'Daily reward unavailable',
            `You already claimed your reward. Next claim ${formatRelativeTime(result.nextClaimAt)}.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'Daily reward claimed',
          [
            `Reward received: ${formatCredits(result.amount)}`,
            `Base income: ${formatCredits(result.baseAmount)}`,
            `Streak bonus: ${formatCredits(result.streakBonus)}`,
            `Market bonus: ${formatCredits(result.randomBonus)}`,
            `Current streak: ${result.streak} day(s)`,
            `Wallet after claim: ${formatCredits(result.profile.wallet)}`,
          ].join('\n')
        ),
      ],
    });
  },
};