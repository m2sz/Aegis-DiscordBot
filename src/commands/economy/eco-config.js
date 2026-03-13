const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createInfoEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { ensurePermissions } = require('../../utils/permissions');
const { getEconomySettings, updateEconomySettings } = require('../../services/guildConfigService');
const { formatCredits } = require('../../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eco-config')
    .setDescription('Manage per-server economy settings.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Show current economy settings for this server.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Update one or more economy settings.')
        .addIntegerOption((option) => option.setName('daily_amount').setDescription('Base /daily reward').setMinValue(0))
        .addIntegerOption((option) => option.setName('daily_cooldown_hours').setDescription('/daily cooldown in hours').setMinValue(1))
        .addIntegerOption((option) => option.setName('daily_streak_bonus').setDescription('Bonus per /daily streak level').setMinValue(0))
        .addIntegerOption((option) => option.setName('daily_random_bonus_max').setDescription('Max random bonus on /daily').setMinValue(0))
        .addIntegerOption((option) => option.setName('work_min').setDescription('Minimum /work payout').setMinValue(0))
        .addIntegerOption((option) => option.setName('work_max').setDescription('Maximum /work payout').setMinValue(0))
        .addIntegerOption((option) => option.setName('work_cooldown_minutes').setDescription('/work cooldown in minutes').setMinValue(1))
        .addIntegerOption((option) => option.setName('coinflip_min_bet').setDescription('Minimum /coinflip bet').setMinValue(0))
        .addIntegerOption((option) => option.setName('coinflip_max_bet').setDescription('Maximum /coinflip bet').setMinValue(1))
        .addIntegerOption((option) => option.setName('slots_min_bet').setDescription('Minimum /slots bet').setMinValue(0))
        .addIntegerOption((option) => option.setName('slots_max_bet').setDescription('Maximum /slots bet').setMinValue(1))
    ),
  async execute(interaction) {
    if (!(await ensurePermissions(interaction, PermissionFlagsBits.ManageGuild, 'Manage Server'))) {
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'show') {
      const settings = await getEconomySettings(interaction.guild.id);

      await interaction.reply({
        embeds: [
          createInfoEmbed(
            'Economy settings',
            [
              `Daily amount: ${formatCredits(settings.dailyAmount)}`,
              `Daily cooldown: ${settings.dailyCooldownHours} hour(s)`,
              `Daily streak bonus: ${formatCredits(settings.dailyStreakBonus)}`,
              `Daily random bonus max: ${formatCredits(settings.dailyRandomBonusMax)}`,
              `Work payout: ${formatCredits(settings.workMin)} to ${formatCredits(settings.workMax)}`,
              `Work cooldown: ${settings.workCooldownMinutes} minute(s)`,
              `Coinflip bet range: ${formatCredits(settings.coinflipMinBet)} to ${formatCredits(settings.coinflipMaxBet)}`,
              `Slots bet range: ${formatCredits(settings.slotsMinBet)} to ${formatCredits(settings.slotsMaxBet)}`,
            ].join('\n')
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const update = {
      dailyAmount: interaction.options.getInteger('daily_amount') ?? undefined,
      dailyCooldownHours: interaction.options.getInteger('daily_cooldown_hours') ?? undefined,
      dailyStreakBonus: interaction.options.getInteger('daily_streak_bonus') ?? undefined,
      dailyRandomBonusMax: interaction.options.getInteger('daily_random_bonus_max') ?? undefined,
      workMin: interaction.options.getInteger('work_min') ?? undefined,
      workMax: interaction.options.getInteger('work_max') ?? undefined,
      workCooldownMinutes: interaction.options.getInteger('work_cooldown_minutes') ?? undefined,
      coinflipMinBet: interaction.options.getInteger('coinflip_min_bet') ?? undefined,
      coinflipMaxBet: interaction.options.getInteger('coinflip_max_bet') ?? undefined,
      slotsMinBet: interaction.options.getInteger('slots_min_bet') ?? undefined,
      slotsMaxBet: interaction.options.getInteger('slots_max_bet') ?? undefined,
    };

    const hasAnyValue = Object.values(update).some((value) => value !== undefined);

    if (!hasAnyValue) {
      await interaction.reply({
        embeds: [createErrorEmbed('No changes provided', 'Provide at least one option to update.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const settings = await updateEconomySettings(interaction.guild.id, update);

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'Economy settings updated',
            [
              `Daily amount: ${formatCredits(settings.dailyAmount)}`,
              `Daily cooldown: ${settings.dailyCooldownHours} hour(s)`,
              `Work payout: ${formatCredits(settings.workMin)} to ${formatCredits(settings.workMax)}`,
              `Coinflip bet range: ${formatCredits(settings.coinflipMinBet)} to ${formatCredits(settings.coinflipMaxBet)}`,
              `Slots bet range: ${formatCredits(settings.slotsMinBet)} to ${formatCredits(settings.slotsMaxBet)}`,
            ].join('\n')
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Update failed', error.message)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};