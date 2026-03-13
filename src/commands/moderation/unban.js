const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureModerator } = require('../../utils/permissions');
const { createSuccessEmbed } = require('../../utils/embeds');
const { createModerationCase, sendModerationLog } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their Discord user ID.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option.setName('user_id').setDescription('User ID to unban').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the unban').setRequired(true)
    ),
  async execute(interaction) {
    if (!(await ensureModerator(interaction, PermissionFlagsBits.BanMembers))) {
      return;
    }

    const userId = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason', true);

    await interaction.guild.members.unban(userId, reason);

    const moderationCase = await createModerationCase({
      guildId: interaction.guild.id,
      moderatorId: interaction.user.id,
      targetId: userId,
      action: 'unban',
      reason,
    });

    await sendModerationLog(interaction.guild, moderationCase);

    await interaction.reply({
      embeds: [
        createSuccessEmbed('User unbanned', `User ${userId} has been unbanned. Case #${moderationCase.caseNumber}.`),
      ],
    });
  },
};