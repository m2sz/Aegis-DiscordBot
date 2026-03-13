const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureModerator } = require('../../utils/permissions');
const { createSuccessEmbed } = require('../../utils/embeds');
const { ensureModerationTarget } = require('../../utils/moderationChecks');
const { createModerationCase, sendModerationLog } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the ban').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_days')
        .setDescription('Delete recent message history (0-7 days)')
        .setMinValue(0)
        .setMaxValue(7)
    ),
  async execute(interaction) {
    if (!(await ensureModerator(interaction, PermissionFlagsBits.BanMembers))) {
      return;
    }

    const member = interaction.options.getMember('member');
    const reason = interaction.options.getString('reason', true);
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    if (!(await ensureModerationTarget(interaction, member, 'ban'))) {
      return;
    }

    await member.ban({ deleteMessageSeconds: deleteDays * 24 * 60 * 60, reason });

    const moderationCase = await createModerationCase({
      guildId: interaction.guild.id,
      moderatorId: interaction.user.id,
      targetId: member.id,
      action: 'ban',
      reason,
      metadata: {
        deleteDays,
      },
    });

    await sendModerationLog(interaction.guild, moderationCase);

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'Member banned',
          `${member.user.tag} has been banned. Case #${moderationCase.caseNumber}.`
        ),
      ],
    });
  },
};