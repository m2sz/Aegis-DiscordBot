const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { getNetWorth, useInventoryItem } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('use-item')
    .setDescription('Use an item from your economy inventory.')
    .addStringOption((option) =>
      option
        .setName('item_id')
        .setDescription('Inventory item ID to use')
        .setRequired(true)
    ),
  async execute(interaction) {
    const itemId = interaction.options.getString('item_id', true).toLowerCase();

    try {
      const result = await useInventoryItem(interaction.guild.id, interaction.user.id, itemId);

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            `${result.item.name} used`,
            [
              result.effectDescription,
              `Wallet: ${formatCredits(result.profile.wallet)}`,
              `Bank: ${formatCredits(result.profile.bank)}`,
              `Net worth: ${formatCredits(getNetWorth(result.profile))}`,
            ].join('\n')
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Use failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};