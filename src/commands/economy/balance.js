const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { getNetWorth, getOrCreateProfile } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Show your current economy profile.')
    .addUserOption((option) =>
      option.setName('member').setDescription('Optional member to inspect')
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('member') ?? interaction.user;
    const profile = await getOrCreateProfile(interaction.guild.id, user.id);

    await interaction.reply({
      embeds: [
        createInfoEmbed(
          `${user.username}'s balance`,
          [
            `**Wallet:** ${formatCredits(profile.wallet)}`,
            `**Bank:** ${formatCredits(profile.bank)}`,
            `**Net worth:** ${formatCredits(getNetWorth(profile))}`,
            `**Total earned:** ${formatCredits(profile.totalEarned)}`,
            `**Total spent:** ${formatCredits(profile.totalSpent)}`,
            `**Daily streak:** ${profile.dailyStreak} day(s)`,
            `**Warnings tracked:** ${profile.warningsCount}`,
          ].join('\n')
        ),
      ],
      ...(user.id !== interaction.user.id ? { flags: MessageFlags.Ephemeral } : {}),
    });
  },
};