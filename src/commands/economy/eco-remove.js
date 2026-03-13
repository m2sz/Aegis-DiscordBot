const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { ensurePermissions } = require('../../utils/permissions');
const { removeMoney } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eco-remove')
    .setDescription('Admin command: remove credits from a member wallet.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to debit').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Amount to remove')
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction) {
    if (!(await ensurePermissions(interaction, PermissionFlagsBits.ManageGuild, 'Manage Server'))) {
      return;
    }

    const user = interaction.options.getUser('member', true);
    const amount = interaction.options.getInteger('amount', true);

    try {
      const profile = await removeMoney(interaction.guild.id, user.id, amount);
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Credits removed',
            `${formatCredits(amount)} removed from ${user}. New wallet: ${formatCredits(profile.wallet)}.`
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Operation failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};