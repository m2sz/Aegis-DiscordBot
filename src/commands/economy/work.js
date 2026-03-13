const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits, formatRelativeTime } = require('../../utils/formatters');
const { runWork } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Take on a server-side job and earn a custom payout.'),
  async execute(interaction) {
    const result = await runWork(interaction.guild.id, interaction.user.id);

    if (!result.success) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            'Shift unavailable',
            `Your next shift opens ${formatRelativeTime(result.nextWorkAt)}.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'Shift completed',
          [
            `You ${result.activity}.`,
            `Payout: ${formatCredits(result.amount)}`,
            `Wallet after payout: ${formatCredits(result.profile.wallet)}`,
          ].join('\n')
        ),
      ],
    });
  },
};