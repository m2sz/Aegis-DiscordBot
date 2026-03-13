const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createInfoEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { ensurePermissions } = require('../../utils/permissions');
const {
  disableShopItem,
  getShopItemsForGuild,
  upsertShopItem,
} = require('../../services/economyService');
const { formatCredits } = require('../../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop-manage')
    .setDescription('Manage this server shop items.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List all shop items, including disabled ones.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('upsert')
        .setDescription('Create or update a shop item.')
        .addStringOption((option) => option.setName('item_id').setDescription('Unique item id').setRequired(true))
        .addStringOption((option) => option.setName('name').setDescription('Display name').setRequired(true))
        .addIntegerOption((option) => option.setName('price').setDescription('Item price').setRequired(true).setMinValue(1))
        .addStringOption((option) =>
          option
            .setName('effect')
            .setDescription('Item effect type')
            .setRequired(true)
            .addChoices(
              { name: 'Crate Reward', value: 'crate' },
              { name: 'Reset Work Cooldown', value: 'reset_work' },
              { name: 'Bank Interest', value: 'bank_interest' }
            )
        )
        .addStringOption((option) => option.setName('rarity').setDescription('Rarity label'))
        .addStringOption((option) => option.setName('description').setDescription('Item description'))
        .addIntegerOption((option) => option.setName('effect_min').setDescription('Effect min value').setMinValue(0))
        .addIntegerOption((option) => option.setName('effect_max').setDescription('Effect max value').setMinValue(0))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('disable')
        .setDescription('Disable a shop item.')
        .addStringOption((option) => option.setName('item_id').setDescription('Item id to disable').setRequired(true))
    ),
  async execute(interaction) {
    if (!(await ensurePermissions(interaction, PermissionFlagsBits.ManageGuild, 'Manage Server'))) {
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const items = await getShopItemsForGuild(interaction.guild.id, true);

      const description = items.length
        ? items
            .map(
              (item) =>
                `**${item.name}** (${item.itemId}) • ${formatCredits(item.price)} • ${item.effect} • ${item.isEnabled ? 'enabled' : 'disabled'}`
            )
            .join('\n')
        : 'No shop items found for this server.';

      await interaction.reply({
        embeds: [createInfoEmbed('Shop items', description)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === 'disable') {
      const itemId = interaction.options.getString('item_id', true).toLowerCase();

      try {
        const item = await disableShopItem(interaction.guild.id, itemId);
        await interaction.reply({
          embeds: [createSuccessEmbed('Shop item disabled', `${item.name} (${item.itemId}) is now disabled.`)],
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        await interaction.reply({
          embeds: [createErrorEmbed('Disable failed', error.message)],
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    const effect = interaction.options.getString('effect', true);
    const effectMin = interaction.options.getInteger('effect_min');
    const effectMax = interaction.options.getInteger('effect_max');
    const effectData = {};

    if (effectMin !== null) {
      effectData.min = effectMin;
    }

    if (effectMax !== null) {
      effectData.max = effectMax;
    }

    try {
      const item = await upsertShopItem(interaction.guild.id, {
        itemId: interaction.options.getString('item_id', true),
        name: interaction.options.getString('name', true),
        price: interaction.options.getInteger('price', true),
        effect,
        rarity: interaction.options.getString('rarity') ?? 'Common',
        description: interaction.options.getString('description') ?? 'Custom server item.',
        effectData,
        isEnabled: true,
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Shop item saved',
            `${item.name} (${item.itemId}) is now available for ${formatCredits(item.price)}.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Save failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};