const ms = require('ms');
const { MessageFlags, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureModerator } = require('../../utils/permissions');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { ensureModerationTarget } = require('../../utils/moderationChecks');
const { createModerationCase, sendModerationLog } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Temporarily timeout a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to timeout').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('Timeout duration, for example 15m, 2h, or 1d')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the timeout').setRequired(true)
    ),
  async execute(interaction) {
    if (!(await ensureModerator(interaction, PermissionFlagsBits.ModerateMembers))) {
      return;
    }

    const member = interaction.options.getMember('member');
    const durationInput = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason', true);
    const durationMs = ms(durationInput);

    if (!member || !durationMs || durationMs < 5_000 || durationMs > 2_419_200_000) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            'Invalid timeout',
            'Provide a valid member and a duration between 5 seconds and 28 days.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await ensureModerationTarget(interaction, member, 'timeout'))) {
      return;
    }

    await member.timeout(durationMs, reason);

    const moderationCase = await createModerationCase({
      guildId: interaction.guild.id,
      moderatorId: interaction.user.id,
      targetId: member.id,
      action: 'timeout',
      reason,
      metadata: {
        duration: durationInput,
      },
    });

    await sendModerationLog(interaction.guild, moderationCase);

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          'Timeout applied',
          `${member} has been timed out for ${durationInput}. Case #${moderationCase.caseNumber}.`
        ),
      ],
    });
  },
};