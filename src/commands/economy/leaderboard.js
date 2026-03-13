const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { getLeaderboard, getNetWorth } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the richest members in the server.')
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Number of entries to display')
        .setMinValue(3)
        .setMaxValue(15)
    ),
  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') ?? 10;
    const profiles = await getLeaderboard(interaction.guild.id, limit);

    const description = profiles.length
      ? profiles
          .map(
            (profile, index) =>
              `**${index + 1}.** <@${profile.userId}> • ${formatCredits(getNetWorth(profile))} net worth (${formatCredits(profile.wallet)} wallet, ${formatCredits(profile.bank)} bank)`
          )
          .join('\n')
      : 'No economy data has been recorded yet.';

    await interaction.reply({
      embeds: [createInfoEmbed('Economy leaderboard', description)],
    });
  },
};