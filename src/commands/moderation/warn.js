const { MessageFlags, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureModerator } = require('../../utils/permissions');
const { createSuccessEmbed } = require('../../utils/embeds');
const {
  createModerationCase,
  incrementWarningCount,
  sendModerationLog,
} = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a member and store it in the moderation log.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to warn').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the warning').setRequired(true)
    ),
  async execute(interaction) {
    if (!(await ensureModerator(interaction, PermissionFlagsBits.ModerateMembers))) {
      return;
    }

    const member = interaction.options.getMember('member');
    const reason = interaction.options.getString('reason', true);

    if (!member) {
      await interaction.reply({ content: 'Member not found in this server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const moderationCase = await createModerationCase({
      guildId: interaction.guild.id,
      moderatorId: interaction.user.id,
      targetId: member.id,
      action: 'warn',
      reason,
    });

    const profile = await incrementWarningCount(interaction.guild.id, member.id);
    await sendModerationLog(interaction.guild, moderationCase);

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'Warning issued',
          `${member} has been warned. Case #${moderationCase.caseNumber}. Total warnings: ${profile.warningsCount}.`
        ),
      ],
    });
  },
};