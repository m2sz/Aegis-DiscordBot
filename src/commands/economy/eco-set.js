const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { ensurePermissions } = require('../../utils/permissions');
const { setMoney } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eco-set')
    .setDescription('Admin command: set the exact wallet value of a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option.setName('member').setDescription('Member to update').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('New wallet value')
        .setRequired(true)
        .setMinValue(0)
    ),
  async execute(interaction) {
    if (!(await ensurePermissions(interaction, PermissionFlagsBits.ManageGuild, 'Manage Server'))) {
      return;
    }

    const user = interaction.options.getUser('member', true);
    const amount = interaction.options.getInteger('amount', true);

    try {
      const profile = await setMoney(interaction.guild.id, user.id, amount);
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Wallet updated',
            `${user} wallet is now set to ${formatCredits(profile.wallet)}.`
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