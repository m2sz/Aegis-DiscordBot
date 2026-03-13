const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { buyShopItem } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from the economy shop.')
    .addStringOption((option) =>
      option
        .setName('item_id')
        .setDescription('Shop item ID (example: mystery_crate)')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('quantity')
        .setDescription('Number of items to purchase')
        .setMinValue(1)
        .setMaxValue(25)
    ),
  async execute(interaction) {
    const itemId = interaction.options.getString('item_id', true).toLowerCase();
    const quantity = interaction.options.getInteger('quantity') ?? 1;

    try {
      const result = await buyShopItem(interaction.guild.id, interaction.user.id, itemId, quantity);

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Purchase confirmed',
            [
              `Bought: ${result.item.name} x${result.quantity}`,
              `Spent: ${formatCredits(result.totalCost)}`,
              `Wallet after purchase: ${formatCredits(result.profile.wallet)}`,
            ].join('\n')
          ),
        ],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Purchase failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};