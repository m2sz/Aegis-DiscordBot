const { MessageFlags, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ensureModerator } = require('../../utils/permissions');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages in the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
  async execute(interaction) {
    if (!(await ensureModerator(interaction, PermissionFlagsBits.ManageMessages))) {
      return;
    }

    const amount = interaction.options.getInteger('amount', true);
    const deletedMessages = await interaction.channel.bulkDelete(amount, true);

    if (!deletedMessages.size) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            'Nothing deleted',
            'Discord can only bulk delete messages newer than 14 days.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        createSuccessEmbed('Channel cleaned', `Deleted ${deletedMessages.size} messages from this channel.`),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};