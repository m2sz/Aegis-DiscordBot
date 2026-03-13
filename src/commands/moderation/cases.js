const { MessageFlags, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureModerator } = require('../../utils/permissions');
const { createInfoEmbed } = require('../../utils/embeds');
const { getCasesForUser } = require('../../services/moderationService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('Show recent moderation cases for a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to inspect').setRequired(true)
    ),
  async execute(interaction) {
    if (!(await ensureModerator(interaction, PermissionFlagsBits.ModerateMembers))) {
      return;
    }

    const member = interaction.options.getUser('member', true);
    const cases = await getCasesForUser(interaction.guild.id, member.id);

    const description = cases.length
      ? cases
          .map(
            (entry) =>
              `**#${entry.caseNumber}** • ${entry.action.toUpperCase()} • ${entry.reason} • <t:${Math.floor(entry.createdAt.getTime() / 1000)}:R>`
          )
          .join('\n')
      : 'No cases found for this member.';

    await interaction.reply({
      embeds: [createInfoEmbed(`Moderation cases for ${member.tag}`, description)],
      flags: MessageFlags.Ephemeral,
    });
  },
};