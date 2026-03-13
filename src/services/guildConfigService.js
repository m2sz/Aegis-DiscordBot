const GuildConfig = require('../models/GuildConfig');
const env = require('../config/env');

const DEFAULT_ECONOMY_SETTINGS = {
  dailyAmount: env.economyDailyAmount,
  dailyCooldownHours: env.economyDailyCooldownHours,
  dailyStreakBonus: env.economyDailyStreakBonus,
  dailyRandomBonusMax: env.economyDailyRandomBonusMax,
  workMin: env.economyWorkMin,
  workMax: env.economyWorkMax,
  workCooldownMinutes: env.economyWorkCooldownMinutes,
  coinflipMinBet: 10,
  coinflipMaxBet: 50000,
  slotsMinBet: 10,
  slotsMaxBet: 50000,
};

function sanitizeEconomySettings(settings) {
  const sanitized = {};

  for (const [key, value] of Object.entries(settings)) {
    const parsed = Number.parseInt(String(value), 10);

    if (Number.isNaN(parsed)) {
      continue;
    }

    if (parsed < 0) {
      continue;
    }

    sanitized[key] = parsed;
  }

  if (sanitized.workMin !== undefined || sanitized.workMax !== undefined) {
    const workMin = sanitized.workMin ?? settings.workMin ?? undefined;
    const workMax = sanitized.workMax ?? settings.workMax ?? undefined;

    if (
      workMin !== undefined &&
      workMax !== undefined &&
      Number(workMin) > Number(workMax)
    ) {
      throw new Error('workMin cannot be greater than workMax.');
    }
  }

  if (sanitized.coinflipMinBet !== undefined || sanitized.coinflipMaxBet !== undefined) {
    const minBet = sanitized.coinflipMinBet ?? settings.coinflipMinBet ?? undefined;
    const maxBet = sanitized.coinflipMaxBet ?? settings.coinflipMaxBet ?? undefined;

    if (minBet !== undefined && maxBet !== undefined && Number(minBet) > Number(maxBet)) {
      throw new Error('coinflipMinBet cannot be greater than coinflipMaxBet.');
    }
  }

  if (sanitized.slotsMinBet !== undefined || sanitized.slotsMaxBet !== undefined) {
    const minBet = sanitized.slotsMinBet ?? settings.slotsMinBet ?? undefined;
    const maxBet = sanitized.slotsMaxBet ?? settings.slotsMaxBet ?? undefined;

    if (minBet !== undefined && maxBet !== undefined && Number(minBet) > Number(maxBet)) {
      throw new Error('slotsMinBet cannot be greater than slotsMaxBet.');
    }
  }

  return sanitized;
}

function mergeEconomySettings(economy = {}) {
  return {
    ...DEFAULT_ECONOMY_SETTINGS,
    ...economy,
  };
}

async function getGuildConfig(guildId) {
  return GuildConfig.findOneAndUpdate(
    { guildId },
    {
      $setOnInsert: {
        guildId,
        economy: DEFAULT_ECONOMY_SETTINGS,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );
}

async function getEconomySettings(guildId) {
  const config = await getGuildConfig(guildId);
  return mergeEconomySettings(config.economy ?? {});
}

async function updateEconomySettings(guildId, settings) {
  const current = await getGuildConfig(guildId);
  const base = mergeEconomySettings(current.economy ?? {});
  const sanitized = sanitizeEconomySettings(settings);
  const merged = {
    ...base,
    ...sanitized,
  };

  if (merged.workMin > merged.workMax) {
    throw new Error('workMin cannot be greater than workMax.');
  }

  if (merged.coinflipMinBet > merged.coinflipMaxBet) {
    throw new Error('coinflipMinBet cannot be greater than coinflipMaxBet.');
  }

  if (merged.slotsMinBet > merged.slotsMaxBet) {
    throw new Error('slotsMinBet cannot be greater than slotsMaxBet.');
  }

  await updateGuildConfig(guildId, { economy: merged });
  return merged;
}

async function updateGuildConfig(guildId, update) {
  return GuildConfig.findOneAndUpdate({ guildId }, update, { new: true, upsert: true });
}

async function getNextCaseNumber(guildId) {
  const config = await GuildConfig.findOneAndUpdate(
    { guildId },
    { $inc: { 'counters.moderationCase': 1 } },
    { new: true, upsert: true }
  );

  return config.counters.moderationCase;
}

module.exports = {
  DEFAULT_ECONOMY_SETTINGS,
  getGuildConfig,
  getEconomySettings,
  updateGuildConfig,
  updateEconomySettings,
  getNextCaseNumber,
};