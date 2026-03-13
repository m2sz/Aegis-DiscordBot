const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { ensurePermissions } = require('../../utils/permissions');
const { addMoney } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eco-add')
    .setDescription('Admin command: add credits to a member wallet.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to credit').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Amount to add')
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
      const profile = await addMoney(interaction.guild.id, user.id, amount);
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Credits added',
            `${formatCredits(amount)} added to ${user}. New wallet: ${formatCredits(profile.wallet)}.`
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