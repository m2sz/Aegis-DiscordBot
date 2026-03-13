const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const requiredVariables = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'MONGODB_URI'];

for (const variableName of requiredVariables) {
  if (!process.env[variableName]) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
}

const numericDailyAmount = Number.parseInt(process.env.ECONOMY_DAILY_AMOUNT ?? '250', 10);
const numericCooldownHours = Number.parseInt(process.env.ECONOMY_DAILY_COOLDOWN_HOURS ?? '24', 10);
const numericDailyBonusPerStreak = Number.parseInt(process.env.ECONOMY_DAILY_STREAK_BONUS ?? '40', 10);
const numericDailyRandomBonus = Number.parseInt(process.env.ECONOMY_DAILY_RANDOM_BONUS_MAX ?? '120', 10);
const numericWorkMin = Number.parseInt(process.env.ECONOMY_WORK_MIN ?? '120', 10);
const numericWorkMax = Number.parseInt(process.env.ECONOMY_WORK_MAX ?? '340', 10);
const numericWorkCooldownMinutes = Number.parseInt(process.env.ECONOMY_WORK_COOLDOWN_MINUTES ?? '90', 10);

module.exports = {
  discordToken: process.env.DISCORD_TOKEN,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordGuildId: process.env.DISCORD_GUILD_ID,
  mongodbUri: process.env.MONGODB_URI,
  defaultTicketCategoryId: process.env.DEFAULT_TICKET_CATEGORY_ID ?? null,
  defaultTicketArchiveCategoryId: process.env.DEFAULT_TICKET_ARCHIVE_CATEGORY_ID ?? null,
  defaultLogChannelId: process.env.DEFAULT_LOG_CHANNEL_ID ?? null,
  defaultTicketCategoryName: process.env.DEFAULT_TICKET_CATEGORY_NAME ?? 'Support Tickets',
  defaultTicketArchiveName: process.env.DEFAULT_TICKET_ARCHIVE_NAME ?? 'Ticket Archive',
  defaultLogChannelName: process.env.DEFAULT_LOG_CHANNEL_NAME ?? 'mod-logs',
  economyDailyAmount: Number.isNaN(numericDailyAmount) ? 250 : numericDailyAmount,
  economyDailyCooldownHours: Number.isNaN(numericCooldownHours) ? 24 : numericCooldownHours,
  economyDailyStreakBonus: Number.isNaN(numericDailyBonusPerStreak) ? 40 : numericDailyBonusPerStreak,
  economyDailyRandomBonusMax: Number.isNaN(numericDailyRandomBonus) ? 120 : numericDailyRandomBonus,
  economyWorkMin: Number.isNaN(numericWorkMin) ? 120 : numericWorkMin,
  economyWorkMax: Number.isNaN(numericWorkMax) ? 340 : numericWorkMax,
  economyWorkCooldownMinutes: Number.isNaN(numericWorkCooldownMinutes) ? 90 : numericWorkCooldownMinutes,
};