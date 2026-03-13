const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');
const { formatCredits } = require('../../utils/formatters');
const { getShopItems } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Show the current economy shop catalog.'),
  async execute(interaction) {
    const items = await getShopItems(interaction.guild.id);

    if (!items.length) {
      await interaction.reply({
        embeds: [createInfoEmbed('Economy Shop', 'No active items are configured for this server.')],
      });
      return;
    }

    const description = items
      .map(
        (item) =>
          `**${item.name}** (${item.itemId})\nPrice: ${formatCredits(item.price)} • Rarity: ${item.rarity}\n${item.description}`
      )
      .join('\n\n');

    await interaction.reply({
      embeds: [createInfoEmbed('Economy Shop', description)],
    });
  },
};