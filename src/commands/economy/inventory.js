const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');
const { getInventory } = require('../../services/economyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Display your owned economy items.'),
  async execute(interaction) {
    const result = await getInventory(interaction.guild.id, interaction.user.id);

    if (!result.inventory.length) {
      await interaction.reply({
        embeds: [createInfoEmbed('Inventory', 'Your inventory is empty. Use /shop and /buy to get started.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const description = result.inventory
      .map((item) => `**${item.name}** (${item.id}) • Qty: ${item.quantity}\n${item.description}`)
      .join('\n\n');

    await interaction.reply({
      embeds: [createInfoEmbed(`${interaction.user.username}'s Inventory`, description)],
      flags: MessageFlags.Ephemeral,
    });
  },
};